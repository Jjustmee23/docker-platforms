import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Server, 
  Activity,
  Cpu,
  Memory,
  Network,
  ExternalLink,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../services/api';
import ContainerCard from '../../components/ContainerCard/ContainerCard';
import AddContainerModal from '../../components/Modals/AddContainerModal';
import ScaleContainerModal from '../../components/Modals/ScaleContainerModal';
import StatsCard from '../../components/StatsCard/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

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

interface SystemStats {
  totalContainers: number;
  runningContainers: number;
  stoppedContainers: number;
  totalCpuUsage: number;
  totalMemoryUsage: number;
  totalNetworkUsage: number;
}

const Dashboard: React.FC = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalContainers: 0,
    runningContainers: 0,
    stoppedContainers: 0,
    totalCpuUsage: 0,
    totalMemoryUsage: 0,
    totalNetworkUsage: 0
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);

  const socket = useSocket();

  // Fetch containers data
  const { data: containersData, refetch } = useQuery(
    'containers',
    async () => {
      const response = await api.get('/containers');
      return response.data;
    },
    {
      refetchInterval: 10000, // Refetch every 10 seconds
      onSuccess: (data) => {
        setContainers(data);
        calculateSystemStats(data);
        setLoading(false);
      },
      onError: (error) => {
        console.error('Error fetching containers:', error);
        toast.error('Failed to fetch containers');
        setLoading(false);
      }
    }
  );

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('containers-monitoring', (data: { containers: Container[] }) => {
      setContainers(data.containers);
      calculateSystemStats(data.containers);
    });

    socket.on('container-started', ({ containerId }) => {
      toast.success(`Container ${containerId} started successfully`);
      refetch();
    });

    socket.on('container-stopped', ({ containerId }) => {
      toast.success(`Container ${containerId} stopped successfully`);
      refetch();
    });

    socket.on('container-restarted', ({ containerId }) => {
      toast.success(`Container ${containerId} restarted successfully`);
      refetch();
    });

    socket.on('container-removed', ({ containerId }) => {
      toast.success(`Container ${containerId} removed successfully`);
      refetch();
    });

    socket.on('container-scaled', ({ containerName, replicas }) => {
      toast.success(`Container ${containerName} scaled to ${replicas} instances`);
      refetch();
    });

    return () => {
      socket.off('containers-monitoring');
      socket.off('container-started');
      socket.off('container-stopped');
      socket.off('container-restarted');
      socket.off('container-removed');
      socket.off('container-scaled');
    };
  }, [socket, refetch]);

  // Calculate system statistics
  const calculateSystemStats = (containerList: Container[]) => {
    const stats = {
      totalContainers: containerList.length,
      runningContainers: containerList.filter(c => c.status === 'running').length,
      stoppedContainers: containerList.filter(c => c.status !== 'running').length,
      totalCpuUsage: containerList.reduce((sum, c) => sum + (c.cpu?.usage || 0), 0),
      totalMemoryUsage: containerList.reduce((sum, c) => sum + (c.memory?.usage || 0), 0),
      totalNetworkUsage: containerList.reduce((sum, c) => {
        const network = c.network?.eth0;
        return sum + (network?.rx_bytes || 0) + (network?.tx_bytes || 0);
      }, 0)
    };
    setSystemStats(stats);
  };

  // Container actions
  const handleContainerAction = async (containerId: string, action: string) => {
    try {
      await api.post(`/containers/${containerId}/${action}`);
      toast.success(`Container ${action} initiated`);
    } catch (error) {
      console.error(`Error ${action}ing container:`, error);
      toast.error(`Failed to ${action} container`);
    }
  };

  const handleScaleContainer = (container: Container) => {
    setSelectedContainer(container);
    setShowScaleModal(true);
  };

  const handleScaleSubmit = async (replicas: number) => {
    if (!selectedContainer) return;

    try {
      await api.post(`/containers/${selectedContainer.id}/scale`, { replicas });
      toast.success(`Container scaled to ${replicas} instances`);
      setShowScaleModal(false);
      setSelectedContainer(null);
    } catch (error) {
      console.error('Error scaling container:', error);
      toast.error('Failed to scale container');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Docker Management Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor and manage your Docker containers in real-time
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Containers"
          value={systemStats.totalContainers}
          icon={<Server className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Running"
          value={systemStats.runningContainers}
          icon={<Activity className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="CPU Usage"
          value={`${systemStats.totalCpuUsage.toFixed(1)}%`}
          icon={<Cpu className="w-6 h-6" />}
          color="orange"
        />
        <StatsCard
          title="Memory Usage"
          value={`${(systemStats.totalMemoryUsage / 1024 / 1024 / 1024).toFixed(1)} GB`}
          icon={<Memory className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Container
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Containers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {containers.map((container, index) => (
          <motion.div
            key={container.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ContainerCard
              container={container}
              onStart={() => handleContainerAction(container.id, 'start')}
              onStop={() => handleContainerAction(container.id, 'stop')}
              onRestart={() => handleContainerAction(container.id, 'restart')}
              onRemove={() => handleContainerAction(container.id, 'remove')}
              onScale={() => handleScaleContainer(container)}
            />
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {containers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No containers found
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first Docker container
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Container
          </button>
        </motion.div>
      )}

      {/* Modals */}
      <AddContainerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          refetch();
        }}
      />

      <ScaleContainerModal
        isOpen={showScaleModal}
        onClose={() => {
          setShowScaleModal(false);
          setSelectedContainer(null);
        }}
        onSubmit={handleScaleSubmit}
        container={selectedContainer}
      />
    </div>
  );
};

export default Dashboard; 