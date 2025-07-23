import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Containers from './pages/Containers/Containers';
import Servers from './pages/Servers/Servers';
import GitHub from './pages/GitHub/GitHub';
import Monitoring from './pages/Monitoring/Monitoring';
import Domains from './pages/Domains/Domains';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Styles
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="containers" element={<Containers />} />
                  <Route path="servers" element={<Servers />} />
                  <Route path="github" element={<GitHub />} />
                  <Route path="monitoring" element={<Monitoring />} />
                  <Route path="domains" element={<Domains />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 