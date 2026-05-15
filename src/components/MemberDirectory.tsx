import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  LayoutGrid, 
  List, 
  MoreVertical, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Edit3,
  Trash2,
  Filter,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, UserRole, VoiceSection } from '../types';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { format, differenceInSeconds, addDays, parseISO } from 'date-fns';

const ROLE_RANK = {
  'Admin': 0,
  'Executive': 1,
  'Music Director': 2,
  'Member': 3
};

const VOICE_RANK = {
  'Soprano': 0,
  'Alto': 1,
  'Ténor': 2,
  'Basse': 3
};

export default function MemberDirectory() {
  const { isAdmin, isExecutive } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterVoice, setFilterVoice] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*');

      if (data) {
        setMembers(data.map(m => ({
          uid: m.uid,
          fullName: m.full_name,
          role: m.role,
          gender: m.gender,
          voiceSection: m.voice_section,
          status: m.status,
          onboardingDate: m.onboarding_date,
          oldMember: m.old_member,
          pendingApproval: m.pending_approval,
          avatarUrl: m.avatar_url
        } as Member)));
      }
      setLoading(false);
    };

    fetchMembers();

    // Subscribe to all changes in members table
    const channel = supabase
      .channel('public:members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, payload => {
        fetchMembers(); // Re-fetch to keep it simple or update state manually
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.fullName.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'All' || m.role === filterRole;
    const matchesVoice = filterVoice === 'All' || m.voiceSection === filterVoice;
    return matchesSearch && matchesRole && matchesVoice;
  });

  const officialMembers = filteredMembers.filter(m => m.status === 'Active' && !m.pendingApproval);
  const trainees = filteredMembers.filter(m => m.status === 'Recrue Stagiaire' || m.pendingApproval);

  const sortedOfficial = [...officialMembers].sort((a, b) => {
    if (ROLE_RANK[a.role as keyof typeof ROLE_RANK] !== ROLE_RANK[b.role as keyof typeof ROLE_RANK]) {
      return ROLE_RANK[a.role as keyof typeof ROLE_RANK] - ROLE_RANK[b.role as keyof typeof ROLE_RANK];
    }
    const aVoice = a.voiceSection ? VOICE_RANK[a.voiceSection as keyof typeof VOICE_RANK] : 99;
    const bVoice = b.voiceSection ? VOICE_RANK[b.voiceSection as keyof typeof VOICE_RANK] : 99;
    return aVoice - bVoice;
  });

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading directory...</div>;

  const handleApprove = async (uid: string) => {
    if (!confirm("Are you sure you want to approve this member?")) return;
    try {
      await supabase
        .from('members')
        .update({
          status: 'Active',
          pending_approval: false
        })
        .eq('uid', uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `members/${uid}`);
    }
  };

  const handleDecline = async (uid: string) => {
    const memberToDecline = members.find(m => m.uid === uid);
    if (!confirm(`Are you sure you want to decline and remove ${memberToDecline?.fullName || 'this user'}? This will force them to start the registration process over.`)) return;
    try {
      await supabase
        .from('members')
        .delete()
        .eq('uid', uid);
      alert("Registration declined and record removed.");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `members/${uid}`);
    }
  };

  const handleUpdate = async (uid: string, data: any) => {
    try {
      // Map camelCase to snake_case for Supabase
      const mappedData: any = {};
      if (data.fullName !== undefined) mappedData.full_name = data.fullName;
      if (data.voiceSection !== undefined) mappedData.voice_section = data.voiceSection;
      if (data.role !== undefined) mappedData.role = data.role;
      if (data.status !== undefined) mappedData.status = data.status;
      if (data.onboardingDate !== undefined) mappedData.onboarding_date = data.onboardingDate;

      await supabase
        .from('members')
        .update(mappedData)
        .eq('uid', uid);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `members/${uid}`);
    }
  };

  const handleExtendProbation = async (uid: string, days: number) => {
    const member = members.find(m => m.uid === uid);
    if (!member) return;
    
    const currentOnboarding = typeof member.onboardingDate === 'string' ? parseISO(member.onboardingDate) : new Date();
    const newOnboarding = addDays(currentOnboarding, days);
    
    try {
      await supabase
        .from('members')
        .update({
          onboarding_date: newOnboarding.toISOString()
        })
        .eq('uid', uid);
      alert(`Probation extended by ${days} days.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `members/${uid}`);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Directory</h1>
          <p className="text-gray-400 font-sans mt-2">Manage and browse all ministry members.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name..."
              className="pl-12 pr-6 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm outline-none focus:border-black transition-all w-64 font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Trainees Section */}
      {trainees.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h2 className="text-xs uppercase font-bold tracking-[0.2em] text-gray-400">Recruits in Probation ({trainees.length})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {trainees.map(m => (
              <TraineeCard 
                key={m.uid} 
                member={m} 
                isAdmin={isAdmin || isExecutive} 
                onApprove={handleApprove}
                onDecline={handleDecline}
                onUpdate={handleUpdate}
                onExtend={handleExtendProbation}
              />
            ))}
          </div>
        </section>
      )}

      {/* Official Members Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-xs uppercase font-bold tracking-[0.2em] text-gray-400">Official Members ({sortedOfficial.length})</h2>
          </div>
          <div className="flex gap-4">
            <FilterSelect 
              value={filterRole} 
              options={['All', 'Admin', 'Executive', 'Music Director', 'Member']} 
              onChange={setFilterRole} 
            />
            <FilterSelect 
              value={filterVoice} 
              options={['All', 'Soprano', 'Alto', 'Ténor', 'Basse']} 
              onChange={setFilterVoice} 
            />
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence>
              {sortedOfficial.map(m => (
                <MemberCard 
                  key={m.uid} 
                  member={m} 
                  isAdmin={isAdmin} 
                  onDecline={handleDecline}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-bottom border-gray-50 border-b">
                  <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-gray-400">Member</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-gray-400">Role</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-gray-400">Section</th>
                  <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-gray-400">Joined</th>
                  {isAdmin && <th className="p-6 text-[10px] uppercase font-bold tracking-widest text-gray-400">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedOfficial.map(m => (
                  <MemberRow 
                    key={m.uid} 
                    member={m} 
                    isAdmin={isAdmin} 
                    onDecline={handleDecline}
                    onUpdate={handleUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function TraineeCard({ 
  member, 
  isAdmin, 
  onApprove, 
  onDecline, 
  onUpdate,
  onExtend
}: { 
  member: Member, 
  isAdmin: boolean,
  onApprove: (uid: string) => void,
  onDecline: (uid: string) => void,
  onUpdate: (uid: string, data: any) => void,
  onExtend: (uid: string, days: number) => void
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...member });

  useEffect(() => {
    const timer = setInterval(() => {
      const joinDate = typeof member.onboardingDate === 'string' ? parseISO(member.onboardingDate) : new Date();
      const targetDate = addDays(joinDate, 90);
      const now = new Date();
      const seconds = differenceInSeconds(targetDate, now);

      if (seconds <= 0) {
        setTimeLeft('Under Review');
      } else {
        const d = Math.floor(seconds / (24 * 3600));
        const h = Math.floor((seconds % (24 * 3600)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        setTimeLeft(`${d}D, ${h}H, ${m}M, ${s}S remaining`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [member.onboardingDate]);

  const handleInternalUpdate = async () => {
    await onUpdate(member.uid, {
      fullName: formData.fullName,
      voiceSection: formData.voiceSection,
      role: formData.role,
      status: formData.status
    });
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-md hover:shadow-xl transition-all relative group"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden relative group/avatar">
          {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="text-gray-300" />}
          {isAdmin && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Edit3 size={16} />
            </button>
          )}
        </div>
        <div>
          {isEditing ? (
            <input 
              className="font-bold tracking-tight italic bg-gray-50 border border-gray-100 rounded px-2 w-full text-sm"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
          ) : (
            <h3 className="font-bold tracking-tight italic">{member.fullName}</h3>
          )}
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{member.voiceSection || 'No Section'}</p>
        </div>
      </div>

      <div className="space-y-4">
        {isEditing ? (
          <div className="space-y-3">
             <select 
              className="w-full text-[10px] uppercase font-bold p-2 bg-gray-50 rounded-xl"
              value={formData.voiceSection}
              onChange={e => setFormData({...formData, voiceSection: e.target.value as VoiceSection})}
            >
              <option value="Soprano">Soprano</option>
              <option value="Alto">Alto</option>
              <option value="Ténor">Ténor</option>
              <option value="Basse">Basse</option>
            </select>
            <select 
              className="w-full text-[10px] uppercase font-bold p-2 bg-gray-50 rounded-xl"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
            >
              <option value="Member">Member</option>
              <option value="Music Director">Music Director</option>
              <option value="Executive">Executive</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={handleInternalUpdate}
                className="bg-black text-white p-2 rounded-xl text-[10px] font-bold uppercase"
              >
                Save
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="bg-gray-100 text-gray-500 p-2 rounded-xl text-[10px] font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
              <p className="text-[9px] uppercase font-bold tracking-widest text-orange-600 mb-1">Probation Counter</p>
              <p className="font-mono text-xs font-bold text-orange-900">{timeLeft}</p>
            </div>

            {isAdmin && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => onApprove(member.uid)}
                    className="flex-1 bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 group/btn"
                  >
                    <CheckCircle2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-widest">Approve</span>
                  </button>
                  <button 
                    onClick={() => onDecline(member.uid)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
                  <button 
                    onClick={() => onExtend(member.uid, 30)}
                    className="p-2 bg-gray-100 text-[9px] uppercase font-bold tracking-widest text-gray-500 rounded-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm"
                  >
                    +30 Days
                  </button>
                  <button 
                    onClick={() => onExtend(member.uid, 60)}
                    className="p-2 bg-gray-100 text-[9px] uppercase font-bold tracking-widest text-gray-500 rounded-lg hover:bg-brand-blue hover:text-white transition-all shadow-sm"
                  >
                    +60 Days
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function MemberCard({ 
  member, 
  isAdmin, 
  onDecline 
}: { 
  member: Member, 
  isAdmin: boolean,
  onDecline: (uid: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...member });

  const handleUpdate = async () => {
    try {
      await supabase
        .from('members')
        .update({
          full_name: formData.fullName,
          role: formData.role,
          voice_section: formData.voiceSection
        })
        .eq('uid', member.uid);
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `members/${member.uid}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all ${isAdmin ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-100 mb-6 relative overflow-hidden group">
          {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-6 text-gray-200" />}
          {isAdmin && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <Edit3 className="text-white" size={24} onClick={() => setIsEditing(true)} />
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="w-full space-y-4">
            <input 
              className="w-full text-sm p-3 border rounded-xl"
              value={formData.fullName}
              onChange={e => setFormData({...formData, fullName: e.target.value})}
            />
            <select 
              className="w-full text-sm p-3 border rounded-xl"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
            >
              <option value="Admin">Admin</option>
              <option value="Executive">Executive</option>
              <option value="Music Director">Music Director</option>
              <option value="Member">Member</option>
            </select>
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="flex-1 bg-black text-white p-2 rounded-xl text-xs font-bold">Save</button>
              <button onClick={() => setIsEditing(false)} className="bg-gray-100 p-2 rounded-xl text-xs font-bold">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-bold tracking-tight italic mb-1">{member.fullName}</h3>
            <div className="flex flex-col gap-1">
              <span className={`text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-full ${member.role === 'Admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                {member.role}
              </span>
              <p className="text-[11px] font-mono font-bold text-gray-400 mt-2 uppercase tracking-widest">{member.voiceSection}</p>
            </div>
          </>
        )}
      </div>

      {isAdmin && !isEditing && (
        <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] uppercase font-bold text-gray-300">ID: {member.uid.slice(0, 8)}</span>
          <Trash2 size={16} className="text-red-400 hover:text-red-600" onClick={() => onDecline(member.uid)} />
        </div>
      )}
    </motion.div>
  );
}

function MemberRow({ 
  member, 
  isAdmin, 
  onDecline,
  onUpdate
}: { 
  member: Member, 
  isAdmin: boolean,
  onDecline: (uid: string) => void,
  onUpdate: (uid: string, data: any) => void
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ ...member });

  const handleUpdate = async () => {
    await onUpdate(member.uid, {
      fullName: formData.fullName,
      role: formData.role,
      voiceSection: formData.voiceSection
    });
    setIsEditing(false);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
            {member.avatarUrl ? <img src={member.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={20} className="w-full h-full p-2.5 text-gray-300" />}
          </div>
          <div>
            {isEditing ? (
              <input 
                className="font-bold text-sm bg-white border border-gray-100 rounded px-2"
                value={formData.fullName}
                onChange={e => setFormData({...formData, fullName: e.target.value})}
              />
            ) : (
              <p className="font-bold text-sm italic">{member.fullName}</p>
            )}
            <p className="text-[10px] text-gray-400 font-mono">{member.uid.slice(0, 8)}</p>
          </div>
        </div>
      </td>
      <td className="p-6">
        {isEditing ? (
          <select 
            className="text-[10px] uppercase font-bold p-1 bg-white border rounded"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
          >
            <option value="Admin">Admin</option>
            <option value="Executive">Executive</option>
            <option value="Music Director">Music Director</option>
            <option value="Member">Member</option>
          </select>
        ) : (
          <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${member.role === 'Admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
            {member.role}
          </span>
        )}
      </td>
      <td className="p-6">
        {isEditing ? (
          <select 
            className="text-[10px] uppercase font-bold p-1 bg-white border rounded"
            value={formData.voiceSection}
            onChange={e => setFormData({...formData, voiceSection: e.target.value as VoiceSection})}
          >
            <option value="Soprano">Soprano</option>
            <option value="Alto">Alto</option>
            <option value="Ténor">Ténor</option>
            <option value="Basse">Basse</option>
          </select>
        ) : (
          <p className="text-sm font-bold opacity-60 italic">{member.voiceSection}</p>
        )}
      </td>
      <td className="p-6">
        <p className="text-sm text-gray-400 font-sans">
          {format(typeof member.onboardingDate === 'string' ? parseISO(member.onboardingDate) : new Date(), 'MMM yy')}
        </p>
      </td>
      {isAdmin && (
        <td className="p-6">
          <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
              <>
                <button onClick={handleUpdate} className="text-xs font-bold text-green-600">Save</button>
                <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-gray-400">Cancel</button>
              </>
            ) : (
              <>
                <Edit3 size={16} className="text-gray-400 hover:text-black cursor-pointer" onClick={() => setIsEditing(true)} />
                <Trash2 size={16} className="text-red-300 hover:text-red-600 cursor-pointer" onClick={() => onDecline(member.uid)} />
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}

function FilterSelect({ value, options, onChange }: { value: string, options: string[], onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select 
        className="appearance-none bg-white border border-gray-100 py-3 pl-6 pr-12 rounded-2xl shadow-sm font-sans font-bold text-xs uppercase tracking-widest focus:border-black outline-none transition-all cursor-pointer"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt === 'All' ? 'Filter' : opt}</option>)}
      </select>
      <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
    </div>
  );
}
