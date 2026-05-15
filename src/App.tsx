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
import LandingPage from './components/LandingPage';

import { ShieldCheck, LogOut, Clock, ShieldAlert } from 'lucide-react';
import { supabase } from './lib/supabase';

function PendingApproval() {
  const { member } = useAuth();
  return (
    <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100 text-center space-y-10 animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-lg shadow-orange-100">
          <Clock size={48} className="animate-pulse" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif font-black tracking-tighter text-black italic leading-tight">
            Account Pending <br/> Confirmation
          </h1>
          <p className="text-gray-500 font-sans leading-relaxed text-lg">
            Welcome, <span className="font-bold text-black">{member?.fullName}</span>. Your registration for SAPCYM is currently being reviewed by the Executive Committee. 
          </p>
        </div>
        <div className="p-8 bg-orange-50 border border-orange-100 rounded-[2rem] space-y-3">
          <div className="flex items-center justify-center gap-2 text-orange-700 font-bold text-xs uppercase tracking-widest">
            <ShieldAlert size={16} />
            Waiting for Admin Action
          </div>
          <p className="text-xs text-orange-600/70 font-medium leading-relaxed">
            Please check back soon. Once an administrator approves your account, you will have complete access to all member features, directory, and music library.
          </p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="w-full py-5 bg-gray-100 text-gray-500 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-3 border border-gray-100"
        >
          <LogOut size={16} />
          Sign Out & Check Later
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, member, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen grid place-items-center bg-[#F5F5F3]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-black/10 border-t-black rounded-full animate-spin" />
          <div className="text-center space-y-1">
            <p className="font-serif italic text-2xl font-bold text-black">Saint Paul Catholic Young Movement</p>
            <p className="font-mono text-[10px] uppercase font-bold tracking-[0.3em] text-black/40">Initializing SAPCYM Portal</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  if (!member) {
    return <Onboarding />;
  }

  if (member.pendingApproval && !isAdmin) {
    return <PendingApproval />;
  }

  return (
    <Router>
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#F5F5F3]">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-12 overflow-y-auto max-h-screen custom-scrollbar">
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
