import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  CodeBracketIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { githubAPI } from '../services/api';
import toast from 'react-hot-toast';

const GitHub = () => {
  const queryClient = useQueryClient();
  const [githubToken, setGithubToken] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('main');
  const [showToken, setShowToken] = useState(false);
  const [deploymentConfig, setDeploymentConfig] = useState({
    environment: 'production',
    dockerfile_path: './Dockerfile',
    port: 3000,
    domain: ''
  });

  // Fetch repositories when token is provided
  const { data: repositories = [], isLoading: reposLoading, error: reposError } = useQuery(
    ['github-repos', githubToken],
    () => githubAPI.getRepos(githubToken),
    {
      enabled: !!githubToken,
      retry: 2,
      onError: (error) => {
        toast.error('Failed to fetch repositories. Please check your GitHub token.');
      }
    }
  );

  // Fetch branches for selected repository
  const { data: branches = [], isLoading: branchesLoading } = useQuery(
    ['github-branches', selectedRepo, githubToken],
    () => {
      if (!selectedRepo) return [];
      const [owner, repo] = selectedRepo.split('/');
      return githubAPI.getBranches(owner, repo, githubToken);
    },
    {
      enabled: !!selectedRepo && !!githubToken,
      retry: 2
    }
  );

  // Deploy mutation
  const deployMutation = useMutation(
    (deploymentData) => githubAPI.deploy(deploymentData, githubToken),
    {
      onSuccess: () => {
        toast.success('Deployment started successfully!');
        setSelectedRepo(null);
        setSelectedBranch('main');
        setDeploymentConfig({
          environment: 'production',
          dockerfile_path: './Dockerfile',
          port: 3000,
          domain: ''
        });
        queryClient.invalidateQueries('deployments');
      },
      onError: (error) => {
        toast.error(`Deployment failed: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  const handleDeploy = async () => {
    if (!selectedRepo || !githubToken) {
      toast.error('Please select a repository and provide a GitHub token');
      return;
    }

    const [owner, repo] = selectedRepo.split('/');
    const deploymentData = {
      repository: selectedRepo,
      branch: selectedBranch,
      ...deploymentConfig
    };

    try {
      await deployMutation.mutateAsync(deploymentData);
    } catch (error) {
      console.error('Deployment error:', error);
    }
  };

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo);
    setSelectedBranch('main');
    // Auto-generate domain name
    const repoName = repo.split('/')[1];
    setDeploymentConfig(prev => ({
      ...prev,
      domain: `${repoName}.yourdomain.com`
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GitHub Integration</h1>
        <p className="text-gray-600">Deploy applications directly from your GitHub repositories</p>
      </div>

      {/* GitHub Token Input */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">GitHub Authentication</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="github-token" className="block text-sm font-medium text-gray-700">
              GitHub Personal Access Token
            </label>
            <div className="mt-1 relative">
              <input
                type={showToken ? 'text' : 'password'}
                id="github-token"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showToken ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Create a token at{' '}
              <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                GitHub Settings
              </a>
              {' '}with repo scope
            </p>
          </div>
        </div>
      </div>

      {/* Repository Selection */}
      {githubToken && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Repository</h3>
          
          {reposLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reposError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CodeBracketIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading repositories
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {reposError.message}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => handleRepoSelect(repo.full_name)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedRepo === repo.full_name
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{repo.name}</h4>
                      <p className="text-sm text-gray-500">{repo.full_name}</p>
                      <p className="text-sm text-gray-400 mt-1">{repo.description || 'No description'}</p>
                    </div>
                    <div className="ml-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        repo.private ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {repo.private ? 'Private' : 'Public'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <CodeBracketIcon className="h-4 w-4 mr-1" />
                    {repo.language || 'Unknown'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deployment Configuration */}
      {selectedRepo && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Deployment Configuration</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Repository
              </label>
              <input
                type="text"
                value={selectedRepo}
                disabled
                className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {branchesLoading ? (
                  <option>Loading branches...</option>
                ) : (
                  branches.map((branch) => (
                    <option key={branch.name} value={branch.name}>
                      {branch.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <select
                value={deploymentConfig.environment}
                onChange={(e) => setDeploymentConfig(prev => ({ ...prev, environment: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={deploymentConfig.port}
                onChange={(e) => setDeploymentConfig(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="3000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dockerfile Path
              </label>
              <input
                type="text"
                value={deploymentConfig.dockerfile_path}
                onChange={(e) => setDeploymentConfig(prev => ({ ...prev, dockerfile_path: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="./Dockerfile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain (Optional)
              </label>
              <input
                type="text"
                value={deploymentConfig.domain}
                onChange={(e) => setDeploymentConfig(prev => ({ ...prev, domain: e.target.value }))}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="app.yourdomain.com"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleDeploy}
              disabled={deployMutation.isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {deployMutation.isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deploying...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Deploy Application
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recent Deployments */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Deployments</h3>
        <div className="text-center py-8 text-gray-500">
          <CodeBracketIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2">No deployments yet</p>
          <p className="text-sm">Deploy your first application to see it here</p>
        </div>
      </div>
    </div>
  );
};

export default GitHub; 