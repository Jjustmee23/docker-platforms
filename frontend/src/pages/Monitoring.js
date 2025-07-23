import React from 'react';
import { 
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockMetrics = [
  { time: '00:00', cpu: 12, memory: 45, network: 2.1 },
  { time: '04:00', cpu: 18, memory: 52, network: 3.2 },
  { time: '08:00', cpu: 25, memory: 68, network: 5.8 },
  { time: '12:00', cpu: 32, memory: 75, network: 8.4 },
  { time: '16:00', cpu: 28, memory: 71, network: 6.9 },
  { time: '20:00', cpu: 22, memory: 58, network: 4.2 },
  { time: '24:00', cpu: 15, memory: 48, network: 2.8 }
];

const mockAlerts = [
  {
    id: 1,
    type: 'warning',
    message: 'High CPU usage detected on web-app container',
    timestamp: '2024-01-15T11:30:00Z',
    resolved: false
  },
  {
    id: 2,
    type: 'error',
    message: 'Database container stopped unexpectedly',
    timestamp: '2024-01-15T10:15:00Z',
    resolved: true
  },
  {
    id: 3,
    type: 'info',
    message: 'SSL certificate expires in 30 days',
    timestamp: '2024-01-15T09:00:00Z',
    resolved: false
  }
];

const Monitoring = () => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <ExclamationTriangleIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
        <p className="text-gray-600">System metrics and performance monitoring</p>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">CPU Usage</p>
              <p className="text-2xl font-semibold text-gray-900">23.7%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CircleStackIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Memory Usage</p>
              <p className="text-2xl font-semibold text-gray-900">68.2%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Containers</p>
              <p className="text-2xl font-semibold text-gray-900">3/4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">CPU & Memory Usage (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} name="CPU %" />
              <Line type="monotone" dataKey="memory" stroke="#8b5cf6" strokeWidth={2} name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Network Traffic (24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="network" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Network MB/s" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h3>
        <div className="space-y-3">
          {mockAlerts.map((alert) => (
            <div key={alert.id} className={`flex items-start p-4 border rounded-lg ${getAlertColor(alert.type)}`}>
              <div className="flex-shrink-0">
                {getAlertIcon(alert.type)}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-900">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="ml-3">
                {alert.resolved ? (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    Resolved
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Monitoring; 