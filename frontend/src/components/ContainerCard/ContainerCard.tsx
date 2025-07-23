import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  Settings,
  ExternalLink,
  Cpu,
  Memory,
  Network,
  Clock,
  HardDrive
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Container {
  id: string;
  name: string;
  image: string;
  status: string;
  created: string;
  ports: any[];
  cpu: {
    usage: number;
    system_usage: number;
    online_cpus: number;
  };
  memory: {
    usage: number;
    limit: number;
    percent: number;
  };
  network: any;
}

interface ContainerCardProps {
  container: Container;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRemove: () => void;
  onScale: () => void;
}

const ContainerCard: React.FC<ContainerCardProps> = ({
  container,
  onStart,
  onStop,
  onRestart,
  onRemove,
  onScale
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPorts = (ports: any[]) => {
    if (!ports || ports.length === 0) return 'No ports exposed';
    return ports.map(port => `${port.PublicPort}:${port.PrivatePort}`).join(', ');
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 truncate" title={container.name}>
            {container.name}
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(container.status)}`} />
            <span className="text-sm text-gray-600">{getStatusText(container.status)}</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 truncate" title={container.image}>
          {container.image}
        </p>
      </div>

      {/* Resource Usage */}
      <div className="p-4 space-y-3">
        {/* CPU Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">CPU</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(container.cpu?.usage || 0, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {container.cpu?.usage?.toFixed(1) || 0}%
            </span>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Memory className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">Memory</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(container.memory?.percent || 0, 100)}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {formatBytes(container.memory?.usage || 0)}
            </span>
          </div>
        </div>

        {/* Network Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">Network</span>
          </div>
          <span className="text-sm font-medium text-gray-900">
            {formatBytes((container.network?.eth0?.rx_bytes || 0) + (container.network?.eth0?.tx_bytes || 0))}
          </span>
        </div>

        {/* Created Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">Created</span>
          </div>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(container.created), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {container.status !== 'running' ? (
              <button
                onClick={onStart}
                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                title="Start container"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onStop}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Stop container"
              >
                <Square className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={onRestart}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Restart container"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={onScale}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
              title="Scale container"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Remove container"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Details Toggle */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 border-t border-gray-200"
        >
          <div className="pt-4 space-y-3">
            {/* Ports */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Ports</h4>
              <p className="text-sm text-gray-600">{formatPorts(container.ports)}</p>
            </div>

            {/* Container ID */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Container ID</h4>
              <p className="text-sm text-gray-600 font-mono">{container.id.substring(0, 12)}</p>
            </div>

            {/* Network Details */}
            {container.network && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Network</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {Object.entries(container.network).map(([interface, data]: [string, any]) => (
                    <div key={interface}>
                      <span className="font-medium">{interface}:</span> {data.IPAddress || 'N/A'}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="pt-2">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(`http://localhost:${container.ports?.[0]?.PublicPort}`, '_blank')}
                  disabled={!container.ports || container.ports.length === 0}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open</span>
                </button>
                
                <button
                  onClick={() => window.open(`/containers/${container.id}/logs`, '_blank')}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  <HardDrive className="w-3 h-3" />
                  <span>Logs</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ContainerCard; 