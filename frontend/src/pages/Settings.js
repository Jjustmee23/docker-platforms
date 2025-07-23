import React, { useState } from 'react';
import { 
  Cog6ToothIcon,
  KeyIcon,
  GlobeAltIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      slack: false,
      webhook: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5
    },
    docker: {
      registry: 'docker.io',
      autoUpdate: true,
      backupRetention: 7
    }
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Configure your Docker platform preferences</p>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center mb-6">
          <BellIcon className="h-6 w-6 text-gray-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive alerts via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications.email}
                onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Slack Notifications</p>
              <p className="text-sm text-gray-500">Send alerts to Slack channel</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications.slack}
                onChange={(e) => handleSettingChange('notifications', 'slack', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <div className="flex items-center mb-6">
          <ShieldCheckIcon className="h-6 w-6 text-gray-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Security</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.security.twoFactor}
                onChange={(e) => handleSettingChange('security', 'twoFactor', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              className="input-field w-32"
              value={settings.security.sessionTimeout}
              onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
              min="5"
              max="1440"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Maximum Login Attempts
            </label>
            <input
              type="number"
              className="input-field w-32"
              value={settings.security.maxLoginAttempts}
              onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
              min="3"
              max="10"
            />
          </div>
        </div>
      </div>

      {/* Docker Configuration */}
      <div className="card">
        <div className="flex items-center mb-6">
          <Cog6ToothIcon className="h-6 w-6 text-gray-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">Docker Configuration</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Docker Registry
            </label>
            <input
              type="text"
              className="input-field"
              value={settings.docker.registry}
              onChange={(e) => handleSettingChange('docker', 'registry', e.target.value)}
              placeholder="docker.io"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Auto Update Containers</p>
              <p className="text-sm text-gray-500">Automatically update containers when new images are available</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.docker.autoUpdate}
                onChange={(e) => handleSettingChange('docker', 'autoUpdate', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Backup Retention (days)
            </label>
            <input
              type="number"
              className="input-field w-32"
              value={settings.docker.backupRetention}
              onChange={(e) => handleSettingChange('docker', 'backupRetention', parseInt(e.target.value))}
              min="1"
              max="365"
            />
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="flex items-center mb-6">
          <KeyIcon className="h-6 w-6 text-gray-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">API Keys</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              GitHub Token
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter your GitHub personal access token"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Docker Hub Token
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter your Docker Hub access token"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default Settings; 