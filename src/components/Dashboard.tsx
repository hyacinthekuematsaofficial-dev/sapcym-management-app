import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Music, 
  Megaphone,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Announcement, Member } from '../types';
import { format } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { member, isAdmin, isExecutive, isMusicDirector } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, probationary: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recent Announcements
    const annPath = 'announcements';
    const annQuery = query(collection(db, annPath), orderBy('timestamp', 'desc'), limit(5));
    const unsubAnn = onSnapshot(annQuery, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    }, (err) => handleFirestoreError(err, OperationType.GET, annPath));

    // Stats
    const memberPath = 'members';
    const unsubMembers = onSnapshot(collection(db, memberPath), (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data() as Member);
      setStats({
        total: members.length,
        active: members.filter(m => m.status === 'Active').length,
        probationary: members.filter(m => m.status === 'Recrue Stagiaire').length
      });
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, memberPath));

    return () => {
      unsubAnn();
      unsubMembers();
    };
  }, []);

  const chartData = [
    { name: 'Active', value: stats.active, color: '#000' },
    { name: 'Probationary', value: stats.probationary, color: '#9ca3af' },
  ];

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading metrics...</div>;

  return (
    <div className="space-y-12">
      {/* Header section with greeting */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-6xl font-bold tracking-tighter font-sans leading-none"
          >
            Hello, {member?.fullName.split(' ')[0]}.
          </motion.h1>
          <p className="text-gray-400 mt-4 text-xl font-sans">
            Here's what's happening in <span className="text-black font-bold">SAPCYM</span> today.
          </p>
        </div>
        
        <div className="flex gap-4">
          {isMusicDirector && (
            <Link to="/songs" className="bg-black text-white px-6 py-4 rounded-2xl flex items-center gap-3 hover:scale-105 transition-transform">
              <Plus size={20} />
              <span className="font-bold text-sm uppercase tracking-widest">Share Music</span>
            </Link>
          )}
          {isExecutive && (
            <Link to="/announcements" className="border border-black px-6 py-4 rounded-2xl flex items-center gap-3 hover:bg-black hover:text-white transition-all">
              <Plus size={20} />
              <span className="font-bold text-sm uppercase tracking-widest">Add Announcement</span>
            </Link>
          )}
        </div>
      </section>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <MetricCard icon={<Users size={24} />} label="Total Members" value={stats.total} color="bg-gray-100" />
          <MetricCard icon={<UserCheck size={24} />} label="Active" value={stats.active} color="bg-black text-white" />
          <MetricCard icon={<UserPlus size={24} />} label="Probation" value={stats.probationary} color="bg-gray-50 border border-gray-100" />
          
          <div className="sm:col-span-3 h-80 bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-gray-400 mb-8">Membership Distribution</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData} layout="vertical" barSize={32}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} fontSize={12} fontWeight="bold" />
                <Tooltip 
                  cursor={{ fill: '#f8f8f8' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-gray-400">Latest Bulletins</h3>
            <Link to="/announcements" className="text-black hover:translate-x-1 transition-transform">
              <ArrowRight size={20} />
            </Link>
          </div>
          
          <div className="space-y-6 flex-1">
            {announcements.length > 0 ? announcements.map((ann) => (
              <div key={ann.id} className="group cursor-pointer">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1 italic">
                  {format(ann.timestamp?.toDate() || new Date(), 'MMM dd, yyyy')}
                </p>
                <h4 className="font-bold group-hover:underline italic leading-tight">{ann.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1 font-sans">{ann.content}</p>
              </div>
            )) : (
              <p className="text-gray-400 text-sm italic">No recent updates.</p>
            )}
          </div>
          
          {announcements.length > 0 && (
            <Link to="/announcements" className="mt-8 pt-6 border-t border-gray-50 text-center font-bold text-xs uppercase tracking-widest hover:text-gray-600">
              View All Bulletins
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: any, label: string, value: number, color?: string }) {
  return (
    <div className={`${color || 'bg-white'} rounded-[2.5rem] p-8 border border-gray-100 shadow-sm flex flex-col gap-4 group`}>
      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/10">
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-60 mb-1">{label}</p>
        <p className="text-4xl font-mono tracking-tighter font-bold">{value}</p>
      </div>
    </div>
  );
}
