import React, { useState } from 'react';
import { 
  PlayIcon, 
  StopIcon, 
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Mock data
const mockContainers = [
  {
    id: '1',
    name: 'web-app',
    image: 'nginx:latest',
    status: 'running',
    cpu_usage: 15.2,
    memory_usage: 256,
    memory_limit: 512,
    port: 8080,
    domain: 'app.example.com',
    created_at: '2024-01-15T10:30:00Z',
    repository: 'github.com/user/web-app',
    branch: 'main'
  },
  {
    id: '2',
    name: 'database',
    image: 'postgres:15',
    status: 'running',
    cpu_usage: 8.5,
    memory_usage: 512,
    memory_limit: 1024,
    port: 5432,
    domain: null,
    created_at: '2024-01-15T10:25:00Z',
    repository: null,
    branch: null
  },
  {
    id: '3',
    name: 'redis-cache',
    image: 'redis:7-alpine',
    status: 'stopped',
    cpu_usage: 0,
    memory_usage: 0,
    memory_limit: 256,
    port: 6379,
    domain: null,
    created_at: '2024-01-15T10:20:00Z',
    repository: null,
    branch: null
  },
  {
    id: '4',
    name: 'api-service',
    image: 'node:18-alpine',
    status: 'running',
    cpu_usage: 22.1,
    memory_usage: 384,
    memory_limit: 768,
    port: 3000,
    domain: 'api.example.com',
    created_at: '2024-01-15T09:45:00Z',
    repository: 'github.com/user/api-service',
    branch: 'develop'
  }
];

const statusColors = {
  running: 'bg-green-100 text-green-800',
  stopped: 'bg-red-100 text-red-800',
  paused: 'bg-yellow-100 text-yellow-800',
  restarting: 'bg-blue-100 text-blue-800'
};

const Containers = () => {
  const [containers, setContainers] = useState(mockContainers);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContainers, setSelectedContainers] = useState([]);

  const filteredContainers = containers.filter(container => {
    const matchesSearch = container.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         container.image.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || container.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleContainerAction = async (containerId, action) => {
    try {
      toast.success(`Container ${action} initiated`);
      
      setContainers(prev => prev.map(container => {
        if (container.id === containerId) {
          if (action === 'start') {
            return { ...container, status: 'running' };
          } else if (action === 'stop') {
            return { ...container, status: 'stopped', cpu_usage: 0, memory_usage: 0 };
          }
        }
        return container;
      }));
    } catch (error) {
      toast.error(`Failed to ${action} container`);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedContainers.length === 0) {
      toast.error('Please select containers first');
      return;
    }
    
    toast.success(`Bulk ${action} initiated for ${selectedContainers.length} containers`);
    setSelectedContainers([]);
  };

  const toggleContainerSelection = (containerId) => {
    setSelectedContainers(prev => 
      prev.includes(containerId) 
        ? prev.filter(id => id !== containerId)
        : [...prev, containerId]
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'stopped':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'paused':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Containers</h1>
          <p className="text-gray-600">Manage your Docker containers</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          New Container
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search containers..."
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="paused">Paused</option>
            </select>
            <button className="btn-secondary flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContainers.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedContainers.length} container(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('start')}
                className="btn-primary text-sm"
              >
                Start All
              </button>
              <button
                onClick={() => handleBulkAction('stop')}
                className="btn-secondary text-sm"
              >
                Stop All
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="btn-danger text-sm"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Containers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedContainers(filteredContainers.map(c => c.id));
                      } else {
                        setSelectedContainers([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resources
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Port
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContainers.map((container) => (
                <tr key={container.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={selectedContainers.includes(container.id)}
                      onChange={() => toggleContainerSelection(container.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600">
                            {container.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{container.name}</div>
                        <div className="text-sm text-gray-500">{container.image}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(container.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${statusColors[container.status]}`}>
                        {container.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>CPU: {container.cpu_usage}%</div>
                    <div>Memory: {container.memory_usage}MB</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {container.port}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {container.domain ? (
                      <span className="text-primary-600">{container.domain}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {container.repository ? (
                      <div>
                        <div className="text-primary-600">{container.repository}</div>
                        <div className="text-gray-500">Branch: {container.branch}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleContainerAction(container.id, 'view')}
                        className="text-gray-400 hover:text-gray-600"
                        title="View logs"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleContainerAction(container.id, 'edit')}
                        className="text-gray-400 hover:text-gray-600"
                        title="Edit container"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {container.status === 'running' ? (
                        <button
                          onClick={() => handleContainerAction(container.id, 'stop')}
                          className="text-gray-400 hover:text-red-600"
                          title="Stop container"
                        >
                          <StopIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleContainerAction(container.id, 'start')}
                          className="text-gray-400 hover:text-green-600"
                          title="Start container"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleContainerAction(container.id, 'restart')}
                        className="text-gray-400 hover:text-blue-600"
                        title="Restart container"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleContainerAction(container.id, 'delete')}
                        className="text-gray-400 hover:text-red-600"
                        title="Delete container"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Containers; 