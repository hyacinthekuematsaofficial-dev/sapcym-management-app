import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Music, 
  Megaphone,
  ArrowRight,
  Plus,
  LayoutDashboard,
  Clock,
  MapPin,
  ShieldAlert,
  CalendarCheck
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, limit, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { Announcement, Member } from '../types';
import { format, addDays, nextWednesday, nextSaturday, isSameDay, setHours, setMinutes, isBefore, differenceInSeconds } from 'date-fns';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { Link } from 'react-router-dom';

function getNextPractice() {
  const now = new Date();
  
  const wed = setMinutes(setHours(nextWednesday(now), 17), 0);
  const sat = setMinutes(setHours(nextSaturday(now), 16), 0);
  
  // Also check if today is Wed or Sat and practice hasn't happened yet
  let todayWed = setMinutes(setHours(new Date(), 17), 0);
  let todaySat = setMinutes(setHours(new Date(), 16), 0);
  
  const candidates = [];
  if (now.getDay() === 3 && isBefore(now, todayWed)) candidates.push(todayWed);
  if (now.getDay() === 6 && isBefore(now, todaySat)) candidates.push(todaySat);
  candidates.push(wed, sat);
  
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0];
}

export default function Dashboard() {
  const { member, isAdmin, isExecutive, isMusicDirector } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, probationary: 0 });
  const [loading, setLoading] = useState(true);
  const [probationTime, setProbationTime] = useState('');
  const nextPractice = getNextPractice();

  useEffect(() => {
    // Probation Counter
    let timer: NodeJS.Timeout;
    if (member?.pendingApproval) {
      timer = setInterval(() => {
        const joinDate = member.onboardingDate?.toDate() || new Date();
        const targetDate = addDays(joinDate, 90);
        const seconds = differenceInSeconds(targetDate, new Date());
        
        if (seconds <= 0) {
          setProbationTime('Reviewing Membership Status...');
        } else {
          const d = Math.floor(seconds / (24 * 3600));
          const h = Math.floor((seconds % (24 * 3600)) / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          setProbationTime(`${d} Days, ${h}h ${m}m remaining`);
        }
      }, 1000);
    }
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
      if (timer) clearInterval(timer);
    };
  }, [member?.uid]);

  if (loading) return (
    <div className="p-16 flex flex-col items-center justify-center gap-4 text-brand-blue/20">
      <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
      <p className="font-serif italic text-2xl font-bold">Syncing with heavens...</p>
    </div>
  );

  return (
    <div className="space-y-16 max-w-7xl animate-in fade-in duration-700">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 py-8 relative">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-blue/5 rounded-full text-brand-blue text-[10px] uppercase font-black tracking-widest border border-brand-blue/10">
            <LayoutDashboard size={14} />
            Ministry Overview
          </div>
          <h1 className="text-5xl lg:text-7xl xl:text-8xl font-serif font-black tracking-tighter text-brand-blue leading-[0.85]">
            Welcome home, <br />
            <span className="italic opacity-30">{member?.gender === 'Female' ? 'Sister' : 'Brother'} {member?.fullName.split(' ')[0]}.</span>
          </h1>
          <p className="text-base lg:text-lg text-brand-blue/40 max-w-xl font-sans font-medium">
             Serving the Saint Peter and Paul Anglophone Parish situated at Simbock. Today is {format(new Date(), 'EEEE, MMMM dd')}.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="p-6 lg:p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center min-w-[140px] group hover:border-brand-blue/20 transition-all">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue/20 mb-3">Status</p>
            <p className={`font-serif font-bold text-xl lg:text-2xl tracking-tight transition-colors ${member?.status === 'Active' ? 'text-green-600' : 'text-orange-500'}`}>
              {member?.status}
            </p>
          </div>
          <div className="p-6 lg:p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center min-w-[140px] group hover:border-brand-blue/20 transition-all">
             <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue/20 mb-3">Role</p>
             <p className="font-serif font-bold text-xl lg:text-2xl text-brand-blue tracking-tight">{isAdmin ? 'Admin' : member?.role}</p>
          </div>
        </div>
      </header>

      {/* Probation Banner */}
      {member?.pendingApproval && (
        <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-orange-900 italic tracking-tight">Probationary Period</h2>
              <p className="text-orange-700/60 font-sans text-sm font-medium">Your account is pending executive validation.</p>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur px-8 py-5 rounded-3xl border border-orange-100 flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 mb-1">Time Remaining</p>
            <p className="font-mono text-lg font-bold text-orange-900 tracking-tighter">{probationTime}</p>
          </div>
        </div>
      )}

      {/* Practice Alert */}
      <div className="bg-white border-4 border-brand-blue/10 rounded-[3.5rem] p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-12 opacity-[0.03] group-hover:scale-110 transition-transform">
          <CalendarCheck size={200} />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 text-center md:text-left">
          <div className="w-20 h-20 rounded-[2.5rem] bg-brand-blue text-white flex items-center justify-center shadow-2xl shadow-brand-blue/20">
            <Clock size={32} />
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-blue/30">Next Choir Practice</p>
            <h3 className="text-3xl lg:text-4xl font-serif font-bold text-brand-blue italic tracking-tighter leading-none">
              {format(nextPractice, 'EEEE, MMMM dd')} <span className="opacity-30">@ {format(nextPractice, 'HH:mm')}</span>
            </h3>
            <div className="flex items-center justify-center md:justify-start gap-2 text-brand-blue/50 text-sm font-medium">
              <MapPin size={16} />
              Behind the church at Simbock
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="px-6 py-3 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-brand-blue/40 text-center mb-1">Countdown</p>
            <p className="font-mono text-sm font-bold text-brand-blue">
              In {Math.round(differenceInSeconds(nextPractice, new Date()) / 3600)} Hours
            </p>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-brand-blue text-white rounded-[3.5rem] p-12 overflow-hidden relative group min-h-[500px]">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <Megaphone size={200} />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-serif font-bold italic tracking-tight">Recent Announcements</h2>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold uppercase tracking-widest">
                  Live Feed
                </div>
              </div>
              
              <div className="space-y-6">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:bg-white/10 transition-all">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                      {ann.timestamp ? format(ann.timestamp.toDate(), 'MMM dd, HH:mm') : 'Recently'}
                    </p>
                    <h3 className="text-xl font-bold tracking-tight mb-2">{ann.title}</h3>
                    <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">{ann.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="h-40 flex items-center justify-center text-white/20 italic">
                    No recent updates in the feed.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Stats */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-gray-100 rounded-[3.5rem] p-10 space-y-10 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold text-brand-blue italic tracking-tight">Community</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue/20">Growth Metrics</p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="p-6 bg-gray-50 rounded-3xl space-y-2 group hover:bg-brand-blue/5 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue/30">Total Brothers</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-serif font-bold text-brand-blue">{stats.total}</p>
                  <Users className="text-brand-blue/10 group-hover:text-brand-blue/20 transition-colors" size={32} />
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl space-y-2 group hover:bg-brand-blue/5 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue/30">Active Members</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-serif font-bold text-green-600">{stats.active}</p>
                  <div className="w-12 h-1 bg-green-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl space-y-2 group hover:bg-brand-blue/5 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-blue/30">New Recruits</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-serif font-bold text-orange-500">{stats.probationary}</p>
                  <p className="text-xs font-bold text-orange-400">Probationary</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 space-y-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-blue text-white rounded-xl">
                  <Music size={20} />
                </div>
                <h4 className="font-serif font-bold text-xl text-brand-blue">Direct Actions</h4>
             </div>
             <div className="space-y-3">
                <Link to="/attendance" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-brand-blue/30 transition-all font-bold text-xs uppercase tracking-widest text-brand-blue group">
                   Log Attendance <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/chat" className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-brand-blue/30 transition-all font-bold text-xs uppercase tracking-widest text-brand-blue group">
                   Open Chat <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
