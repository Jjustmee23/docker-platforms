import React, { useState } from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const mockDeployments = [
  {
    id: '1',
    container_name: 'web-app',
    repository: 'github.com/user/web-app',
    commit_sha: 'abc123',
    commit_message: 'Update homepage design',
    status: 'completed',
    started_at: '2024-01-15T10:30:00Z',
    completed_at: '2024-01-15T10:32:00Z',
    duration: '2m 15s'
  },
  {
    id: '2',
    container_name: 'api-service',
    repository: 'github.com/user/api-service',
    commit_sha: 'def456',
    commit_message: 'Fix authentication bug',
    status: 'failed',
    started_at: '2024-01-15T09:15:00Z',
    completed_at: '2024-01-15T09:18:00Z',
    duration: '3m 42s'
  },
  {
    id: '3',
    container_name: 'database',
    repository: null,
    commit_sha: null,
    commit_message: 'Manual deployment',
    status: 'running',
    started_at: '2024-01-15T11:00:00Z',
    completed_at: null,
    duration: null
  }
];

const statusConfig = {
  completed: {
    icon: CheckCircleIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  failed: {
    icon: XCircleIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800'
  },
  running: {
    icon: ClockIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800'
  },
  pending: {
    icon: ExclamationTriangleIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  }
};

const Deployments = () => {
  const [deployments, setDeployments] = useState(mockDeployments);

  const getStatusIcon = (status) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    return <Icon className={`h-5 w-5 ${config.color}`} />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
        <p className="text-gray-600">Track your container deployments and updates</p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deployments.map((deployment) => {
                const statusConfig = {
                  completed: {
                    icon: CheckCircleIcon,
                    color: 'text-green-600',
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-800'
                  },
                  failed: {
                    icon: XCircleIcon,
                    color: 'text-red-600',
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-800'
                  },
                  running: {
                    icon: ClockIcon,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-800'
                  },
                  pending: {
                    icon: ExclamationTriangleIcon,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-800'
                  }
                };

                const config = statusConfig[deployment.status];
                const Icon = config.icon;

                return (
                  <tr key={deployment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{deployment.container_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {deployment.repository || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {deployment.commit_sha ? (
                          <div>
                            <div className="font-mono text-xs">{deployment.commit_sha.substring(0, 8)}</div>
                            <div className="text-xs text-gray-500">{deployment.commit_message}</div>
                          </div>
                        ) : (
                          '-'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${config.bgColor} ${config.textColor}`}>
                          {deployment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {deployment.duration || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(deployment.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button className="text-gray-400 hover:text-gray-600" title="View logs">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600" title="Redeploy">
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Deployments; 