import React, { useState } from 'react';
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
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

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
    <span className="font-bold tracking-tight font-sans text-sm">{label}</span>
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
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menu = (
    <div className="flex flex-col h-full">
      <div className="mb-12 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shrink-0">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Saint_Paul_by_El_Greco_%28Prado%29.jpg/800px-Saint_Paul_by_El_Greco_%28Prado%29.jpg" 
            alt="Saint Paul" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-xl font-serif font-black tracking-tighter leading-[0.85] text-black">Saint Paul Catholic <br/> Young Movement</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-1">SAPCYM Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
        <SidebarItem to="/" icon={<LayoutDashboard size={22} />} label="Dashboard" />
        
        {!member?.pendingApproval && (
          <>
            <SidebarItem to="/members" icon={<Users size={22} />} label="Directory" />
            <SidebarItem to="/songs" icon={<Music size={22} />} label="Music Library" />
            <SidebarItem to="/attendance" icon={<CalendarCheck size={22} />} label="Attendance" />
            <SidebarItem to="/chat" icon={<MessageSquare size={22} />} label="Advanced Chat" />
          </>
        )}

        {member?.pendingApproval && (
          <>
            <SidebarItem to="/songs" icon={<Music size={22} />} label="Music Library" />
            <div className="px-6 py-4 bg-orange-50/50 rounded-2xl border border-orange-100/50">
               <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest leading-tight">Visitor Access</p>
               <p className="text-[9px] text-orange-400 font-medium">Limited features until approved.</p>
            </div>
          </>
        )}
        
        {isExecutive && !member?.pendingApproval && (
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

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-black text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-80 h-screen bg-white border-r border-gray-100 flex-col p-6 sticky top-0 shrink-0">
        {menu}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-50 p-6 shadow-2xl lg:hidden flex flex-col"
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black"
              >
                <X size={24} />
              </button>
              {menu}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
