import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Music, 
  CalendarCheck, 
  MessageSquare, 
  Vault, 
  Megaphone, 
  Image as ImageIcon, 
  BookOpen,
  LogOut,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, badge }) => (
  <NavLink 
    to={to}
    className={({ isActive }) => `
      flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative
      ${isActive ? 'bg-black text-white shadow-lg translate-x-2' : 'hover:bg-gray-100 text-gray-500 hover:text-black'}
    `}
  >
    <span className="shrink-0">{icon}</span>
    <span className="font-medium tracking-tight font-sans">{label}</span>
    {badge && (
      <span className="ml-auto bg-black text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
        {badge}
      </span>
    )}
  </NavLink>
);

export default function Sidebar() {
  const { member, isExecutive, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  return (
    <div className="w-80 h-screen bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0">
      <div className="mb-12 px-2 flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter leading-none">SAPCYM</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">Management Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
        <SidebarItem to="/" icon={<LayoutDashboard size={22} />} label="Dashboard" />
        <SidebarItem to="/members" icon={<Users size={22} />} label="Directory" />
        <SidebarItem to="/songs" icon={<Music size={22} />} label="Music Library" />
        <SidebarItem to="/attendance" icon={<CalendarCheck size={22} />} label="Attendance" />
        <SidebarItem to="/chat" icon={<MessageSquare size={22} />} label="Advanced Chat" />
        
        {isExecutive && (
          <>
            <div className="pt-4 pb-2 px-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Administration</span>
            </div>
            <SidebarItem to="/vault" icon={<Vault size={22} />} label="Financial Vault" />
          </>
        )}
        
        <div className="pt-4 pb-2 px-6">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">General</span>
        </div>
        <SidebarItem to="/announcements" icon={<Megaphone size={22} />} label="Announcements" />
        <SidebarItem to="/gallery" icon={<ImageIcon size={22} />} label="Photo Gallery" />
        <SidebarItem to="/regulations" icon={<BookOpen size={22} />} label="Regulations" />
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-50 flex flex-col gap-4">
        {member && (
          <div className="flex items-center gap-4 px-4 py-3 border border-gray-50 rounded-3xl bg-gray-50/50">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0">
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <UserIcon size={20} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate leading-none mb-1">{member.fullName}</p>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {isAdmin ? 'Admin' : member.status}
              </p>
            </div>
          </div>
        )}
        
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all font-medium font-sans"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
