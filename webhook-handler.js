#!/usr/bin/env node

const http = require('http');
const crypto = require('crypto');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'your-webhook-secret';
const DEPLOY_SCRIPT = '/opt/docker-platform/deploy.sh';
const LOG_FILE = '/opt/docker-platform/webhook.log';

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage);
    fs.appendFileSync(LOG_FILE, logMessage);
}

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');
    
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

// Execute deployment
function deploy() {
    return new Promise((resolve, reject) => {
        log('Starting deployment...');
        
        exec(DEPLOY_SCRIPT, { cwd: '/opt/docker-platform' }, (error, stdout, stderr) => {
            if (error) {
                log(`Deployment failed: ${error.message}`);
                reject(error);
                return;
            }
            
            log(`Deployment successful: ${stdout}`);
            if (stderr) {
                log(`Deployment stderr: ${stderr}`);
            }
            resolve(stdout);
        });
    });
}

// Create HTTP server
const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method not allowed');
        return;
    }

    if (req.url !== '/webhook') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
    }

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            // Verify webhook signature
            const signature = req.headers['x-hub-signature-256'];
            if (!signature || !verifySignature(body, signature)) {
                log('Invalid webhook signature');
                res.writeHead(401, { 'Content-Type': 'text/plain' });
                res.end('Unauthorized');
                return;
            }

            // Parse webhook payload
            const payload = JSON.parse(body);
            
            // Check if it's a push to main branch
            if (payload.ref === 'refs/heads/main' || payload.ref === 'refs/heads/master') {
                log(`Received push to ${payload.ref} from ${payload.repository.full_name}`);
                
                // Trigger deployment
                try {
                    await deploy();
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('Deployment triggered successfully');
                } catch (error) {
                    log(`Deployment error: ${error.message}`);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Deployment failed');
                }
            } else {
                log(`Ignoring push to ${payload.ref}`);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('Ignored (not main branch)');
            }
        } catch (error) {
            log(`Error processing webhook: ${error.message}`);
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Bad request');
        }
    });
});

// Start server
const PORT = process.env.WEBHOOK_PORT || 3001;
server.listen(PORT, () => {
    log(`Webhook server listening on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    log('Shutting down webhook server...');
    server.close(() => {
        log('Webhook server stopped');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    log('Shutting down webhook server...');
    server.close(() => {
        log('Webhook server stopped');
        process.exit(0);
    });
}); 