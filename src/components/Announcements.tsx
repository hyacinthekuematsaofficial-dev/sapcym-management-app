import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Calendar, 
  User as UserIcon,
  X,
  Loader2,
  FileText
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Announcement } from '../types';
import { format } from 'date-fns';

export default function Announcements() {
  const { isExecutive, isAdmin, member } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    await deleteDoc(doc(db, 'announcements', id));
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading bulletins...</div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Announcements</h1>
          <p className="text-gray-400 font-sans mt-2">Official updates and news from the ministry leadership.</p>
        </div>

        {isExecutive && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-lg"
          >
            <Plus size={20} />
            Post Update
          </button>
        )}
      </header>

      <div className="space-y-8">
        <AnimatePresence>
          {announcements.map((ann, index) => (
            <motion.div 
              key={ann.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative group overflow-hidden"
            >
              <div className="absolute right-0 top-0 w-32 h-32 bg-gray-50 rounded-bl-[5rem] -mr-8 -mt-8 flex items-center justify-center p-8 group-hover:scale-110 transition-transform">
                <Megaphone size={32} className="text-gray-200" />
              </div>

              <div className="flex flex-col md:flex-row gap-10">
                <div className="md:w-48 shrink-0">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-4">
                    <Calendar size={14} />
                    {format(ann.timestamp?.toDate() || new Date(), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-200">
                      <UserIcon size={14} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Author</p>
                      <p className="text-[11px] font-bold italic truncate">{ann.authorName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="text-3xl font-bold tracking-tighter italic">{ann.title}</h3>
                  <div className="prose prose-sm max-w-none text-gray-600 font-sans leading-relaxed">
                    {ann.content.split('\n').map((para, i) => <p key={i} className="mb-4">{para}</p>)}
                  </div>
                  
                  {isExecutive && (
                    <div className="pt-6 border-t border-gray-50 flex justify-end">
                      <button 
                        onClick={() => handleDelete(ann.id)}
                        className="flex items-center gap-2 text-red-300 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest"
                      >
                        <Trash2 size={16} />
                        Delete Announcement
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <AnnouncementModal onClose={() => setIsModalOpen(false)} authorName={member?.fullName || ''} />
      )}
    </div>
  );
}

function AnnouncementModal({ onClose, authorName }: { onClose: () => void, authorName: string }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        authorName,
        timestamp: serverTimestamp()
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="p-12 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tighter italic">Post Announcement</h2>
            <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Title</label>
              <input 
                autoFocus
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans font-bold italic"
                placeholder="Announcement Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Content</label>
              <textarea 
                rows={6}
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans resize-none"
                placeholder="Write your message here..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Megaphone size={20} />}
            {isSubmitting ? 'Posting...' : 'Publish Announcement'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
