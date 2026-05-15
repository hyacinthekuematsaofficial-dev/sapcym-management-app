import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Download, 
  FileJson, 
  FileText,
  ChevronLeft,
  ChevronRight,
  History,
  CheckSquare,
  Search,
  User as UserIcon,
  Loader2
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { Member, AttendanceRecord } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, parseISO } from 'date-fns';
import { jsPDF } from 'jspdf';

export default function AttendanceSystem() {
  const { isMusicDirector, isAdmin, member: currentMember } = useAuth();
  const [mode, setMode] = useState<'marking' | 'history'>('marking');
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: membersData } = await supabase
      .from('members')
      .select('*')
      .eq('status', 'Active');
    
    if (membersData) {
      setMembers(membersData.map(m => ({
        uid: m.uid,
        fullName: m.full_name,
        voiceSection: m.voice_section,
        avatarUrl: m.avatar_url,
        status: m.status
      } as Member)));
    }

    const { data: historyData } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });

    if (historyData) {
      setHistory(historyData.map(h => ({
        id: h.id,
        date: h.date,
        memberId: h.member_id,
        status: h.status,
        sessionType: h.session_type,
        markedBy: h.marked_by
      } as AttendanceRecord)));
    }
    setLoading(false);
  };

  const handleMark = (uid: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({ ...prev, [uid]: status }));
  };

  const saveAttendance = async () => {
    if (Object.keys(attendance).length === 0) return;
    setIsSaving(true);
    try {
      const today = new Date();
      const isPracticeDay = today.getDay() === 3 || today.getDay() === 6;
      const sessionType = isPracticeDay ? "Choir Practice" : "General Session";

      const records = Object.entries(attendance).map(([uid, status]) => {
        const recordId = `${format(today, 'yyyy-MM-dd')}_${uid}`;
        return {
          id: recordId,
          date: today.toISOString(),
          member_id: uid,
          status,
          session_type: sessionType,
          marked_by: currentMember?.uid
        };
      });

      const { error } = await supabase
        .from('attendance')
        .upsert(records);

      if (error) throw error;

      alert(`Attendance for ${sessionType} saved successfully!`);
      fetchData();
      generatePDF(today);
    } catch (e) {
      console.error(e);
      alert("Error saving attendance.");
    } finally {
      setIsSaving(false);
    }
  };

  const generateCSV = () => {
    let csv = "Date,Member Name,Status,Marked By\n";
    history.forEach(h => {
      const m = members.find(mem => mem.uid === h.memberId);
      const dateStr = typeof h.date === 'string' ? format(parseISO(h.date), 'yyyy-MM-dd') : format(h.date, 'yyyy-MM-dd');
      csv += `${dateStr},${m?.fullName || 'Unknown'},${h.status},${h.markedBy}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    a.click();
  };

  const generatePDF = (date: Date) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Attendance Report - ${format(date, 'MMMM dd, yyyy')}`, 20, 20);
    doc.setFontSize(12);
    doc.text(`Total Present: ${Object.values(attendance).filter(s => s === 'present').length}`, 20, 30);
    
    let y = 40;
    members.forEach((m, i) => {
      const status = attendance[m.uid] || 'absent';
      doc.text(`${i + 1}. ${m.fullName} [${m.voiceSection}] - ${status.toUpperCase()}`, 20, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`Attendance_${format(date, 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading records...</div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Attendance</h1>
          <p className="text-gray-400 font-sans mt-2">Track participation and analyze engagement trends.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex">
            <button 
              onClick={() => setMode('marking')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${mode === 'marking' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
            >
              <CheckSquare size={16} />
              Marking
            </button>
            <button 
              onClick={() => setMode('history')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${mode === 'history' ? 'bg-black text-white' : 'text-gray-400 hover:text-black'}`}
            >
              <History size={16} />
              History
            </button>
          </div>

          <button 
            onClick={generateCSV}
            className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-100 hover:border-black transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      {mode === 'marking' ? (
        <section className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold tracking-tighter italic">
              {(new Date().getDay() === 3 || new Date().getDay() === 6) ? "Choir Practice" : "Attendance Session"}: {format(new Date(), 'EEEE, do MMM')}
            </h2>
            {(isMusicDirector || isAdmin) && (
              <button 
                onClick={saveAttendance}
                disabled={isSaving}
                className="bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-3 active:scale-95 transition-all shadow-lg disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                {isSaving ? 'Saving...' : 'Finalize Attendance'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {members.sort((a,b) => (a.voiceSection || '').localeCompare(b.voiceSection || '')).map(m => (
              <div key={m.uid} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={18} className="text-gray-300" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm tracking-tight italic">{m.fullName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{m.voiceSection}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleMark(m.uid, 'present')}
                    className={`p-3 rounded-xl transition-all ${attendance[m.uid] === 'present' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-300 hover:text-green-500 hover:border-green-500 border border-gray-100'}`}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleMark(m.uid, 'absent')}
                    className={`p-3 rounded-xl transition-all ${attendance[m.uid] === 'absent' ? 'bg-red-500 text-white shadow-lg' : 'bg-white text-gray-300 hover:text-red-500 hover:border-red-500 border border-gray-100'}`}
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <HistoryView history={history} members={members} />
      )}
    </div>
  );
}

function HistoryView({ history, members }: { history: AttendanceRecord[], members: Member[] }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getDayAttendance = (day: Date, memberId: string) => {
    return history.find(h => {
      const hDate = typeof h.date === 'string' ? parseISO(h.date) : h.date;
      return isSameDay(hDate, day) && h.memberId === memberId;
    });
  };

  const getMemberPresenceStats = (memberId: string) => {
    const memberHistory = history.filter(h => h.memberId === memberId);
    if (memberHistory.length === 0) return 0;
    const present = memberHistory.filter(h => h.status === 'present').length;
    return Math.round((present / memberHistory.length) * 100);
  };

  return (
    <section className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold tracking-tighter italic">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronLeft size={20} /></button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-white rounded-lg transition-all"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-gray-100 sticky left-0 bg-white z-10 text-[10px] uppercase font-bold tracking-widest text-gray-400 min-w-[200px]">Member</th>
              <th className="p-4 border-b border-gray-100 text-[10px] uppercase font-bold tracking-widest text-gray-400 min-w-[80px]">Score</th>
              {days.map(d => (
                <th key={d.toString()} className="p-4 border-b border-gray-100 text-[10px] font-mono font-bold text-gray-400">
                  {format(d, 'dd')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.uid} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 border-b border-gray-50 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                      {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={14} className="m-2 text-gray-300" />}
                    </div>
                    <span className="text-sm font-bold italic truncate">{m.fullName.split(' ')[0]} {m.fullName.split(' ')[1]?.charAt(0)}.</span>
                  </div>
                </td>
                <td className="p-4 border-b border-gray-50 text-center">
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${getMemberPresenceStats(m.uid) > 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {getMemberPresenceStats(m.uid)}%
                  </span>
                </td>
                {days.map(d => {
                  const att = getDayAttendance(d, m.uid);
                  return (
                    <td key={d.toString()} className="p-4 border-b border-gray-50 text-center">
                      {att ? (
                        <div className={`w-2 h-2 mx-auto rounded-full ${att.status === 'present' ? 'bg-green-500' : 'bg-red-500'}`} />
                      ) : (
                        <div className="w-1 h-1 mx-auto rounded-full bg-gray-200" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
