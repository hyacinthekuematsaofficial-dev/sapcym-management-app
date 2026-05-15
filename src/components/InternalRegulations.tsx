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
import { supabase } from '../lib/supabase';
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
  const [pdfUrl, setPdfUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedPdfUrl, setEditedPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [displayMode, setDisplayMode] = useState<'text' | 'pdf'>('text');

  useEffect(() => {
    const fetchRegulations = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'regulations')
        .single();

      if (data) {
        setContent(data.content || DEFAULT_CONTENT);
        setPdfUrl(data.pdf_url || '');
        if (data.pdf_url) setDisplayMode('pdf');
      } else {
        setContent(DEFAULT_CONTENT);
        setPdfUrl('');
      }
      setLoading(false);
    };

    fetchRegulations();

    // Subscribe to changes
    const channel = supabase
      .channel('public:settings:key=eq.regulations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings', filter: 'key=eq.regulations' }, payload => {
        if (payload.new) {
          const data = payload.new as any;
          setContent(data.content || DEFAULT_CONTENT);
          setPdfUrl(data.pdf_url || '');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF document.");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `official_document_${Date.now()}.${fileExt}`;
    const filePath = `settings/${fileName}`;

    const { data, error } = await supabase.storage
      .from('choir_files')
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Make sure 'choir_files' bucket exists.");
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('choir_files')
      .getPublicUrl(filePath);

    setEditedPdfUrl(publicUrl);
    setIsUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'regulations',
          content: editedContent,
          pdf_url: editedPdfUrl,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("Error saving regulations.");
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setEditedContent(content);
    setEditedPdfUrl(pdfUrl);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">PDF Document (Bucket Upload)</label>
                <div className="relative">
                  <input 
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  <div className={`p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-4 transition-all ${isUploading ? 'border-brand-blue' : ''}`}>
                    {isUploading ? (
                      <Loader2 className="animate-spin text-brand-blue" size={20} />
                    ) : (
                      <FileText className="text-gray-400" size={20} />
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500">
                        {isUploading ? `Uploading...` : 'Choose PDF Document'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">PDF URL Manually</label>
                <input 
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans text-sm"
                  value={editedPdfUrl}
                  onChange={e => setEditedPdfUrl(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Regulation Text (Paste Markdown)</label>
              <textarea 
                className="w-full h-[500px] p-8 bg-gray-50 border border-gray-100 rounded-3xl outline-none focus:border-black font-mono text-sm leading-relaxed"
                value={editedContent}
                onChange={e => setEditedContent(e.target.value)}
              />
            </div>

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
          <div className="space-y-12 relative z-10 font-sans">
            <div className="flex border-b border-gray-100 mb-8">
              <button 
                onClick={() => setDisplayMode('pdf')}
                className={`flex-1 py-4 text-xs uppercase font-bold tracking-widest transition-all border-b-2 ${displayMode === 'pdf' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
                disabled={!pdfUrl}
              >
                PDF Document
              </button>
              <button 
                onClick={() => setDisplayMode('text')}
                className={`flex-1 py-4 text-xs uppercase font-bold tracking-widest transition-all border-b-2 ${displayMode === 'text' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
              >
                Text Version
              </button>
            </div>

            {displayMode === 'pdf' && pdfUrl ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-8 bg-black text-white rounded-[2rem] hover:scale-[1.01] transition-all group"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-2xl">
                      <FileText size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Official Document</p>
                      <h3 className="text-xl font-bold tracking-tight">Open Full PDF Edition</h3>
                    </div>
                  </div>
                  <Edit3 className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <div className="aspect-[4/5] bg-gray-50 rounded-[2rem] border border-gray-100 p-4 overflow-hidden">
                  <iframe 
                    src={`${pdfUrl}#view=FitH`} 
                    className="w-full h-full rounded-2xl"
                    title="PDF Viewer"
                  />
                </div>
              </div>
            ) : (
              <div className="prose prose-neutral max-w-none animate-in fade-in duration-500">
                <div className="markdown-body">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </div>
            )}
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
