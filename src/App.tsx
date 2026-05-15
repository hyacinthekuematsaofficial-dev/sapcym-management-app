import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MemberDirectory from './components/MemberDirectory';
import SongLibrary from './components/SongLibrary';
import AttendanceSystem from './components/AttendanceSystem';
import AdvancedChat from './components/AdvancedChat';
import FinancialVault from './components/FinancialVault';
import Announcements from './components/Announcements';
import PhotoGallery from './components/PhotoGallery';
import InternalRegulations from './components/InternalRegulations';
import Onboarding from './components/Onboarding';

function AppContent() {
  const { user, member, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen grid place-items-center bg-[#E4E3E0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase font-bold tracking-widest text-gray-500">Initializing Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Onboarding />;
  }

  if (!member) {
    return <Onboarding />;
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-[#F5F5F3]">
        <Sidebar />
        <main className="flex-1 p-12 overflow-y-auto max-h-screen custom-scrollbar">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/members" element={<MemberDirectory />} />
            <Route path="/songs" element={<SongLibrary />} />
            <Route path="/attendance" element={<AttendanceSystem />} />
            <Route path="/chat" element={<AdvancedChat />} />
            <Route path="/vault" element={<FinancialVault />} />
            <Route path="/announcements" element={<Announcements />} />
            <Route path="/gallery" element={<PhotoGallery />} />
            <Route path="/regulations" element={<InternalRegulations />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
