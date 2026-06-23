import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './pages/Dashboard';
import SocialMediaGenerator from './pages/SocialMediaGenerator';
import SocialMediaAccounts from './pages/SocialMediaAccounts';
import SocialMediaHistory from './pages/SocialMediaHistory';
import SocialMediaCampaigns from './pages/SocialMediaCampaigns';
import PostCreator from './pages/PostCreator';
import AiSettings from './pages/AiSettings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex min-h-screen bg-darkbg font-sans text-slate-800">
    <Sidebar />
    <div className="flex-1 ml-64 flex flex-col min-w-0">
      <TopBar />
      <main className="flex-1 mt-20 p-8 overflow-x-hidden overflow-y-auto">
        {children}
      </main>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid rgba(0, 0, 0, 0.07)',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
        }} 
      />
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/post-creator" element={<PostCreator />} />
                    <Route path="/generator" element={<SocialMediaGenerator />} />
                    <Route path="/accounts" element={<SocialMediaAccounts />} />
                    <Route path="/history" element={<SocialMediaHistory />} />
                    <Route path="/campaigns" element={<SocialMediaCampaigns />} />
                    <Route path="/ai-settings" element={<AiSettings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};


export default App;
