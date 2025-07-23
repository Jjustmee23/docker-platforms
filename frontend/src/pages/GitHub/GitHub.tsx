import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { 
  Github, 
  Download, 
  Play, 
  Settings, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  Code,
  Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import RepositoryCard from '../../components/RepositoryCard/RepositoryCard';
import DeployModal from '../../components/Modals/DeployModal';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  language: string;
  updated_at: string;
  has_dockerfile: boolean;
  has_docker_compose: boolean;
}

interface DeployedContainer {
  id: string;
  name: string;
  repository: string;
  branch: string;
  status: string;
  port: number;
  domain: string;
  auto_update: boolean;
  created_at: string;
}

const GitHub: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [deployedContainers, setDeployedContainers] = useState<DeployedContainer[]>([]);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();

  // Fetch GitHub repositories
  const { data: reposData, refetch: refetchRepos } = useQuery(
    'github-repositories',
    async () => {
      const response = await api.get('/github/repositories');
      return response.data;
    },
    {
      onSuccess: (data) => {
        setRepositories(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Error fetching repositories:', error);
        toast.error('Failed to fetch GitHub repositories');
        setLoading(false);
      }
    }
  );

  // Fetch deployed containers
  const { data: containersData, refetch: refetchContainers } = useQuery(
    'deployed-containers',
    async () => {
      const response = await api.get('/containers/deployed');
      return response.data;
    },
    {
      onSuccess: (data) => {
        setDeployedContainers(data);
      },
      onError: (error) => {
        console.error('Error fetching deployed containers:', error);
      }
    }
  );

  // Deploy repository mutation
  const deployMutation = useMutation(
    async (deployData: { repoName: string; options: any }) => {
      const response = await api.post('/github/deploy', deployData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success(`Repository ${data.containerName} deployed successfully`);
        setShowDeployModal(false);
        setSelectedRepo(null);
        refetchContainers();
        queryClient.invalidateQueries('containers');
      },
      onError: (error) => {
        console.error('Error deploying repository:', error);
        toast.error('Failed to deploy repository');
      }
    }
  );

  // Refresh repositories
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchRepos();
      toast.success('Repositories refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh repositories');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle deploy repository
  const handleDeploy = (repository: Repository) => {
    setSelectedRepo(repository);
    setShowDeployModal(true);
  };

  // Handle deploy submit
  const handleDeploySubmit = async (options: any) => {
    if (!selectedRepo) return;

    deployMutation.mutate({
      repoName: selectedRepo.full_name,
      options
    });
  };

  // Check if repository is deployed
  const isRepositoryDeployed = (repoName: string) => {
    return deployedContainers.some(container => container.repository === repoName);
  };

  // Get deployed container info
  const getDeployedContainer = (repoName: string) => {
    return deployedContainers.find(container => container.repository === repoName);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              GitHub Integration
            </h1>
            <p className="text-gray-600">
              Deploy and manage your GitHub repositories as Docker containers
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Github className="w-8 h-8 text-gray-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Repositories</p>
              <p className="text-2xl font-bold text-gray-900">{repositories.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Play className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Deployed</p>
              <p className="text-2xl font-bold text-gray-900">
                {deployedContainers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Docker Ready</p>
              <p className="text-2xl font-bold text-gray-900">
                {repositories.filter(repo => repo.has_dockerfile || repo.has_docker_compose).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Globe className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Domains</p>
              <p className="text-2xl font-bold text-gray-900">
                {deployedContainers.filter(container => container.domain).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Repositories Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Repositories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repositories.map((repo, index) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <RepositoryCard
                repository={repo}
                isDeployed={isRepositoryDeployed(repo.full_name)}
                deployedContainer={getDeployedContainer(repo.full_name)}
                onDeploy={() => handleDeploy(repo)}
              />
            </motion.div>
          ))}
        </div>

        {repositories.length === 0 && (
          <div className="text-center py-12">
            <Github className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No repositories found
            </h3>
            <p className="text-gray-600">
              Make sure your GitHub token has access to your repositories
            </p>
          </div>
        )}
      </div>

      {/* Deployed Containers */}
      {deployedContainers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Deployed Containers</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auto Update
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {deployedContainers.map((container) => (
                    <tr key={container.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {container.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {container.repository}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <GitBranch className="w-4 h-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">{container.branch}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          container.status === 'running' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {container.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {container.domain ? (
                          <a
                            href={`http://${container.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            <Globe className="w-4 h-4 mr-1" />
                            {container.domain}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">No domain</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {container.auto_update ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => window.open(`/containers/${container.id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => window.open(`/containers/${container.id}/logs`, '_blank')}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Logs
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Modal */}
      <DeployModal
        isOpen={showDeployModal}
        onClose={() => {
          setShowDeployModal(false);
          setSelectedRepo(null);
        }}
        onSubmit={handleDeploySubmit}
        repository={selectedRepo}
        loading={deployMutation.isLoading}
      />
    </div>
  );
};

export default GitHub; 