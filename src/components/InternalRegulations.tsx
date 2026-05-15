import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Edit3, 
  Save, 
  X,
  ShieldAlert,
  Loader2,
  FileText
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';

const DEFAULT_CONTENT = `
# SAPCYM Internal Regulations

## 1. General Conduct
Members are expected to maintain a spirit of prayer and dedication during all activities.

## 2. Rehearsal Attendance
Punctuality is mandatory. Any absence must be communicated 24 hours in advance.

## 3. Liturgical Service
Proper liturgical attire is required when serving at the altar.

## 4. Music Resources
Sheet music and recordings are for ministry use only.
`;

export default function InternalRegulations() {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'regulations'), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data().content);
      } else {
        setContent(DEFAULT_CONTENT);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'regulations'), {
        content: editedContent,
        updatedAt: new Date()
      });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading regulations...</div>;

  return (
    <div className="space-y-12 max-w-4xl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter italic flex items-center gap-4">
            <BookOpen className="text-black" size={40} />
            Regulations
          </h1>
          <p className="text-gray-400 font-sans mt-2">The official code of conduct and operational guidelines.</p>
        </div>

        {isAdmin && !isEditing && (
          <button 
            onClick={startEditing}
            className="flex items-center gap-3 px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-black hover:text-white transition-all font-bold text-xs uppercase tracking-widest"
          >
            <Edit3 size={16} />
            Edit Guidelines
          </button>
        )}
      </header>

      <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <BookOpen size={200} />
        </div>

        {isEditing ? (
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-2 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-orange-800 text-xs font-bold uppercase tracking-widest">
              <ShieldAlert size={14} />
              Markdown Editor Mode
            </div>
            <textarea 
              autoFocus
              className="w-full h-[600px] p-8 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:border-black font-mono text-sm leading-relaxed"
              value={editedContent}
              onChange={e => setEditedContent(e.target.value)}
            />
            <div className="flex gap-4">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-black text-white py-5 rounded-2xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
              >
                {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {saving ? 'Saving...' : 'Publish Framework'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="px-10 bg-gray-100 text-black py-5 rounded-2xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all"
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
          <div className="prose prose-neutral max-w-none relative z-10 font-sans">
            <div className="markdown-body">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {!isEditing && (
        <div className="p-8 bg-black/5 rounded-3xl border border-black/5 flex items-center gap-6">
          <div className="p-4 bg-black text-white rounded-2xl">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-sm font-bold italic">Member Responsibility</p>
            <p className="text-xs text-gray-500 font-sans">By continuing to use this portal, you agree to comply with the above regulations.</p>
          </div>
        </div>
      )}
    </div>
  );
}
