import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Search, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  Play, 
  Pause, 
  Volume2, 
  Download,
  Filter,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { db, storage } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { Song } from '../types';
import { format } from 'date-fns';

export default function SongLibrary() {
  const { isMusicDirector, isAdmin, user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState('');
  const [filterKey, setFilterKey] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'songs'), orderBy('uploadDate', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setSongs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Song)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredSongs = songs.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
                         (s.composer?.toLowerCase().includes(search.toLowerCase()));
    const matchesKey = filterKey === 'All' || s.musicalKey === filterKey;
    return matchesSearch && matchesKey;
  });

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading library...</div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Music Library</h1>
          <p className="text-gray-400 font-sans mt-2">Access scores, lyrics, and recordings for rehearsals.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black" />
            <input 
              type="text" 
              placeholder="Search title or composer..."
              className="pl-12 pr-6 py-4 rounded-2xl bg-white border border-gray-100 shadow-sm outline-none focus:border-black w-64 font-sans"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <KeyFilter value={filterKey} onChange={setFilterKey} />

          {isMusicDirector && (
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-lg"
            >
              <Plus size={20} />
              Add Song
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredSongs.map(song => (
            <SongCard key={song.id} song={song} canManage={isMusicDirector || isAdmin} />
          ))}
        </AnimatePresence>
      </div>

      {isUploadModalOpen && (
        <UploadModal onClose={() => setIsUploadModalOpen(false)} uid={user?.uid || ''} />
      )}
    </div>
  );
}

function SongCard({ song, canManage }: { song: Song, canManage: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this song? All related files will be removed.")) return;
    try {
      // Delete files from storage if they exist
      if (song.scoreUrl) await deleteObject(ref(storage, song.scoreUrl)).catch(console.error);
      if (song.lyricsUrl) await deleteObject(ref(storage, song.lyricsUrl)).catch(console.error);
      if (song.audioUrl) await deleteObject(ref(storage, song.audioUrl)).catch(console.error);
      
      await deleteDoc(doc(db, 'songs', song.id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col h-full group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-gray-50 rounded-2xl">
          <Music size={24} className="text-black" />
        </div>
        <div className="flex gap-2">
          {song.musicalKey && (
            <span className="text-[10px] font-mono font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase">
              {song.musicalKey}
            </span>
          )}
          {canManage && (
            <button onClick={handleDelete} className="p-2 text-red-300 hover:text-red-500 transition-colors">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-2xl font-bold tracking-tighter italic leading-none mb-2">{song.title}</h3>
        <p className="text-gray-400 font-sans font-medium">{song.composer || 'Unknown Composer'}</p>
        <p className="text-[10px] text-gray-300 uppercase font-bold tracking-[0.2em] mt-4">
          Uploaded on {format(song.uploadDate?.toDate() || new Date(), 'MMMM dd, yyyy')}
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {/* Media Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {song.scoreUrl && (
            <a 
              href={song.scoreUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-black hover:text-white transition-all group/btn"
            >
              <FileText size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Score</span>
            </a>
          )}
          {song.lyricsUrl && (
            <a 
              href={song.lyricsUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-black hover:text-white transition-all group/btn"
            >
              <ImageIcon size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Lyrics</span>
            </a>
          )}
        </div>

        {/* Audio Player */}
        {song.audioUrl && (
          <div className="bg-black rounded-3xl p-4 text-white">
            <audio 
              ref={audioRef} 
              src={song.audioUrl} 
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest opacity-60">Recording</span>
                  <Mic size={12} className="opacity-40" />
                </div>
                <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UploadModal({ onClose, uid }: { onClose: () => void, uid: string }) {
  const [title, setTitle] = useState('');
  const [composer, setComposer] = useState('');
  const [musicalKey, setMusicalKey] = useState('');
  const [files, setFiles] = useState<{ score: File | null, lyrics: File | null, audio: File | null }>({
    score: null,
    lyrics: null,
    audio: null
  });
  const [progress, setProgress] = useState<{ score: number, lyrics: number, audio: number }>({
    score: 0,
    lyrics: 0,
    audio: 0
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!title) return alert("Title is required");
    setIsUploading(true);

    try {
      const urls: any = {};
      const songId = Math.random().toString(36).substring(7);

      for (const [type, file] of Object.entries(files)) {
        if (file) {
          const extension = file.name.split('.').pop();
          const storageRef = ref(storage, `choir_files/songs/${songId}/${type}.${extension}`);
          const uploadTask = uploadBytesResumable(storageRef, file);

          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
              (snap) => {
                const p = (snap.bytesTransferred / snap.totalBytes) * 100;
                setProgress(prev => ({ ...prev, [type]: p }));
              },
              reject,
              () => {
                getDownloadURL(uploadTask.snapshot.ref).then(url => {
                  urls[`${type}Url`] = url;
                  resolve(null);
                });
              }
            );
          });
        }
      }

      await addDoc(collection(db, 'songs'), {
        title,
        composer,
        musicalKey,
        uploadDate: serverTimestamp(),
        uploadedBy: uid,
        ...urls
      });

      onClose();
    } catch (e) {
      console.error(e);
      alert("Error uploading files");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        <div className="p-12 space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tighter">Add New Song</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Song Title</label>
                <input 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Magnificat"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Composer</label>
                <input 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans"
                  value={composer}
                  onChange={e => setComposer(e.target.value)}
                  placeholder="e.g. C. Gounod"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Musical Key</label>
                <input 
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans"
                  value={musicalKey}
                  onChange={e => setMusicalKey(e.target.value)}
                  placeholder="e.g. G Major"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Files (Triple-Media)</label>
              
              <UploadSlot 
                label="Score (PDF)" 
                icon={<FileText size={18} />} 
                accept=".pdf"
                file={files.score}
                progress={progress.score}
                onChange={f => setFiles({...files, score: f})}
              />
              <UploadSlot 
                label="Lyrics (Image)" 
                icon={<ImageIcon size={18} />} 
                accept="image/*"
                file={files.lyrics}
                progress={progress.lyrics}
                onChange={f => setFiles({...files, lyrics: f})}
              />
              <UploadSlot 
                label="Audio Recording" 
                icon={<Mic size={18} />} 
                accept="audio/*"
                file={files.audio}
                progress={progress.audio}
                onChange={f => setFiles({...files, audio: f})}
              />
            </div>
          </div>

          <button 
            onClick={handleUpload}
            disabled={isUploading}
            className={`w-full bg-black text-white py-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isUploading ? 'opacity-50' : 'hover:scale-[1.02]'}`}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
            {isUploading ? 'Uploading Music...' : 'Publish to Library'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function UploadSlot({ label, icon, accept, file, progress, onChange }: { 
  label: string, icon: any, accept: string, file: File | null, progress: number, onChange: (f: File | null) => void 
}) {
  return (
    <div className="relative">
      <input 
        type="file" 
        accept={accept}
        className="absolute inset-0 opacity-0 cursor-pointer z-10"
        onChange={e => onChange(e.target.files?.[0] || null)}
      />
      <div className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${file ? 'border-black bg-black/5' : 'border-gray-100 bg-gray-50'}`}>
        <div className={`${file ? 'text-black' : 'text-gray-300'}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1 truncate">
            {file ? file.name : label}
          </p>
          {file && progress > 0 && progress < 100 && (
            <div className="h-1 w-full bg-gray-200 rounded-full mt-2">
              <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KeyFilter({ value, onChange }: { value: string, onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select 
        className="appearance-none bg-white border border-gray-100 py-4 pl-6 pr-12 rounded-2xl shadow-sm font-sans font-bold text-xs uppercase tracking-widest focus:border-black outline-none cursor-pointer"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="All">Filter Key</option>
        {['C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'F Major', 'Bb Major', 'Eb Major', 'Ab Major'].map(k => (
          <option key={k} value={k}>{k}</option>
        ))}
      </select>
      <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
    </div>
  );
}
