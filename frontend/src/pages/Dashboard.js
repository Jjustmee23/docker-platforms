import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  PlayIcon, 
  StopIcon, 
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  ServerIcon,
  CpuChipIcon,
  CircleStackIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { containersAPI, monitoringAPI } from '../services/api';
import toast from 'react-hot-toast';

const statusColors = {
  running: 'bg-green-100 text-green-800',
  stopped: 'bg-red-100 text-red-800',
  paused: 'bg-yellow-100 text-yellow-800',
  restarting: 'bg-blue-100 text-blue-800'
};

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [selectedContainer, setSelectedContainer] = useState(null);

  // Fetch containers
  const { data: containers = [], isLoading: containersLoading, error: containersError } = useQuery(
    'containers',
    containersAPI.getAll,
    {
      refetchInterval: 5000, // Refresh every 5 seconds
      retry: 3,
    }
  );

  // Fetch monitoring stats
  const { data: stats = {}, isLoading: statsLoading } = useQuery(
    'monitoring-stats',
    monitoringAPI.getStats,
    {
      refetchInterval: 10000, // Refresh every 10 seconds
      retry: 3,
    }
  );

  // Container actions mutations
  const startContainer = useMutation(
    (containerId) => containersAPI.start(containerId),
    {
      onSuccess: () => {
        toast.success('Container started successfully');
        queryClient.invalidateQueries('containers');
      },
      onError: (error) => {
        toast.error(`Failed to start container: ${error.response?.data?.error || error.message}`);
      },
    }
  );

  const stopContainer = useMutation(
    (containerId) => containersAPI.stop(containerId),
    {
      onSuccess: () => {
        toast.success('Container stopped successfully');
        queryClient.invalidateQueries('containers');
      },
      onError: (error) => {
        toast.error(`Failed to stop container: ${error.response?.data?.error || error.message}`);
      },
    }
  );

  const restartContainer = useMutation(
    (containerId) => containersAPI.restart(containerId),
    {
      onSuccess: () => {
        toast.success('Container restarted successfully');
        queryClient.invalidateQueries('containers');
      },
      onError: (error) => {
        toast.error(`Failed to restart container: ${error.response?.data?.error || error.message}`);
      },
    }
  );

  const deleteContainer = useMutation(
    (containerId) => containersAPI.delete(containerId),
    {
      onSuccess: () => {
        toast.success('Container deleted successfully');
        queryClient.invalidateQueries('containers');
      },
      onError: (error) => {
        toast.error(`Failed to delete container: ${error.response?.data?.error || error.message}`);
      },
    }
  );

  const handleContainerAction = async (containerId, action) => {
    try {
      switch (action) {
        case 'start':
          await startContainer.mutateAsync(containerId);
          break;
        case 'stop':
          await stopContainer.mutateAsync(containerId);
          break;
        case 'restart':
          await restartContainer.mutateAsync(containerId);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this container?')) {
            await deleteContainer.mutateAsync(containerId);
          }
          break;
        default:
          toast.error('Unknown action');
      }
    } catch (error) {
      console.error('Container action error:', error);
    }
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

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (containersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (containersError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <ServerIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading containers
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {containersError.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Monitor and manage your Docker containers</p>
        </div>
        <button
          onClick={() => window.location.href = '/containers'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Container
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ServerIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Containers</dt>
                  <dd className="text-lg font-medium text-gray-900">{containers.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Running</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {containers.filter(c => c.status === 'running').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CpuChipIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">CPU Usage</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total_cpu_usage ? `${stats.total_cpu_usage.toFixed(1)}%` : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CircleStackIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Memory Usage</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total_memory_usage ? formatBytes(stats.total_memory_usage * 1024 * 1024) : 'N/A'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Containers Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Active Containers</h3>
          {containers.length === 0 ? (
            <div className="text-center py-12">
              <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No containers</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first container.</p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/containers'}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Container
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Container
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CPU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Memory
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Port
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {containers.map((container) => (
                    <tr key={container.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <ServerIcon className="h-6 w-6 text-gray-400" />
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
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[container.status] || 'bg-gray-100 text-gray-800'}`}>
                            {container.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {container.cpu_usage ? `${container.cpu_usage.toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {container.memory_usage ? formatBytes(container.memory_usage * 1024 * 1024) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {container.port || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(container.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {container.status === 'stopped' && (
                            <button
                              onClick={() => handleContainerAction(container.id, 'start')}
                              className="text-green-600 hover:text-green-900"
                              title="Start"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </button>
                          )}
                          {container.status === 'running' && (
                            <>
                              <button
                                onClick={() => handleContainerAction(container.id, 'stop')}
                                className="text-red-600 hover:text-red-900"
                                title="Stop"
                              >
                                <StopIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleContainerAction(container.id, 'restart')}
                                className="text-blue-600 hover:text-blue-900"
                                title="Restart"
                              >
                                <ArrowPathIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleContainerAction(container.id, 'delete')}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 