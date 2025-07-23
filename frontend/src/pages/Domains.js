import React, { useState } from 'react';
import { 
  GlobeAltIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const mockDomains = [
  {
    id: 1,
    name: 'app.example.com',
    container_name: 'web-app',
    ssl_enabled: true,
    ssl_expires: '2024-12-15T00:00:00Z',
    status: 'active',
    proxy_config: {
      port: 8080,
      protocol: 'http'
    }
  },
  {
    id: 2,
    name: 'api.example.com',
    container_name: 'api-service',
    ssl_enabled: true,
    ssl_expires: '2024-11-20T00:00:00Z',
    status: 'active',
    proxy_config: {
      port: 3000,
      protocol: 'http'
    }
  },
  {
    id: 3,
    name: 'admin.example.com',
    container_name: 'admin-panel',
    ssl_enabled: false,
    ssl_expires: null,
    status: 'pending',
    proxy_config: {
      port: 8081,
      protocol: 'http'
    }
  }
];

const Domains = () => {
  const [domains, setDomains] = useState(mockDomains);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Domains</h1>
          <p className="text-gray-600">Manage your domain names and SSL certificates</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Add Domain
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domain
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Container
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SSL Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proxy Config
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {domains.map((domain) => (
                <tr key={domain.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{domain.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {domain.container_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {domain.ssl_enabled ? (
                        <>
                          <ShieldCheckIcon className="h-5 w-5 text-green-600 mr-2" />
                          <div>
                            <div className="text-sm text-green-600">Active</div>
                            <div className="text-xs text-gray-500">
                              Expires: {new Date(domain.ssl_expires).toLocaleDateString()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                          <div className="text-sm text-yellow-600">Not configured</div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(domain.status)}`}>
                      {domain.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Port: {domain.proxy_config.port}</div>
                      <div>Protocol: {domain.proxy_config.protocol}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-gray-600" title="Edit domain">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" title="Delete domain">
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

export default Domains; 