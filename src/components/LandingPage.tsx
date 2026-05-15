import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Music, 
  ArrowRight, 
  Image as ImageIcon, 
  Bell, 
  ChevronRight,
  ShieldCheck,
  Users
} from 'lucide-react';
import { db, signInWithGoogle } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Announcement, GalleryPhoto } from '../types';
import { format } from 'date-fns';

export default function LandingPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  useEffect(() => {
    const annQuery = query(collection(db, 'announcements'), orderBy('timestamp', 'desc'), limit(3));
    const unsubAnn = onSnapshot(annQuery, (snap) => {
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
    });

    const photoQuery = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(4));
    const unsubPhoto = onSnapshot(photoQuery, (snap) => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryPhoto)));
    });

    return () => { unsubAnn(); unsubPhoto(); };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans selection:bg-brand-blue selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue rounded-xl flex items-center justify-center text-white">
              <Music size={24} />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tighter text-brand-blue">SAPCYM</span>
          </div>

          <button 
            onClick={signInWithGoogle}
            className="px-6 py-2.5 bg-brand-blue text-white rounded-full font-bold text-sm tracking-tight hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
          >
            Enter Portal
            <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue/5 rounded-full text-brand-blue text-xs font-bold uppercase tracking-widest border border-brand-blue/10">
              <ShieldCheck size={14} />
              Official Ministry Portal
            </div>
            <h1 className="text-7xl lg:text-8xl font-serif font-bold tracking-tighter text-brand-blue leading-[0.9]">
              The Heart <br />
              <span className="italic opacity-50">of Worship.</span>
            </h1>
            <p className="text-xl text-brand-blue/60 leading-relaxed max-w-xl">
              Saint Paul Catholic Young Movement (SAPCYM). A dedicated space for spiritual growth, choral excellence, and fraternal unity.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={signInWithGoogle}
                className="px-10 py-5 bg-black text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl flex items-center gap-3"
              >
                Join the Ministry
                <ChevronRight size={20} />
              </button>
              <a href="#activities" className="px-10 py-5 bg-white text-brand-blue border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-sm">
                Explore Activities
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-brand-blue/5 rounded-[4rem] relative overflow-hidden group">
              {photos[0] ? (
                <img src={photos[0].url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="Hero" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-blue/10">
                  <Music size={200} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/80 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12 right-12">
                <p className="text-white text-3xl font-serif font-bold italic leading-tight">"Where words fail, music speaks."</p>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute top-12 -right-8 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 hidden md:block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-blue/5 rounded-2xl text-brand-blue">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-blue/40">Active Members</p>
                  <p className="text-2xl font-serif font-bold text-brand-blue tracking-tighter">50+ Brothers</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Announcements Section */}
      <section id="activities" className="py-24 bg-white px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-5xl font-serif font-bold tracking-tighter text-brand-blue">Announcements</h2>
              <p className="text-brand-blue/40 font-mono text-sm uppercase tracking-widest font-bold">Stay updated with our latest activities</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <Bell className="text-brand-blue" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 hover:border-brand-blue/30 transition-all group">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-blue/30 mb-6">
                  {ann.timestamp ? format(ann.timestamp.toDate(), 'MMMM dd, yyyy') : 'No date'}
                </div>
                <h3 className="text-2xl font-serif font-bold text-brand-blue leading-tight mb-4 group-hover:text-brand-blue/70 transition-colors">
                  {ann.title}
                </h3>
                <p className="text-brand-blue/50 line-clamp-3 leading-relaxed mb-8">
                  {ann.content}
                </p>
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-blue group-hover:gap-4 transition-all">
                  Read Announcement
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="col-span-3 text-center py-20 text-brand-blue/20 italic">
                No public announcements at this time.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Gallery Highlight */}
      <section className="py-24 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-serif font-bold tracking-tighter text-brand-blue italic">Captured Moments</h2>
            <div className="w-24 h-1 bg-brand-blue mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {photos.map((photo, i) => (
              <motion.div 
                key={photo.id}
                whileHover={{ y: -10 }}
                className={`aspect-[3/4] bg-gray-200 rounded-[2.5rem] overflow-hidden relative group ${i % 2 !== 0 ? 'md:mt-12' : ''}`}
              >
                <img src={photo.url} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Gallery" />
                <div className="absolute inset-x-6 bottom-6 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white font-bold italic tracking-tight">{photo.caption || 'Activity'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-blue text-white rounded-2xl flex items-center justify-center">
              <Music size={24} />
            </div>
            <div>
              <p className="font-serif font-bold text-2xl tracking-tighter">SAPCYM</p>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-blue/30">L’excellence au service de Dieu</p>
            </div>
          </div>

          <div className="flex gap-12 text-xs font-bold uppercase tracking-widest text-brand-blue/50">
            <a href="#" className="hover:text-brand-blue transition-colors">Confidentiality</a>
            <a href="#" className="hover:text-brand-blue transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-blue transition-colors">Terms</a>
          </div>

          <p className="text-xs font-mono font-bold text-brand-blue/20">© 2026 SAPCYM PORTAL</p>
        </div>
      </footer>
    </div>
  );
}
