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
import { supabase } from '../lib/supabase';
import { Announcement, GalleryPhoto } from '../types';
import { format, parseISO } from 'date-fns';

export default function LandingPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error signing in:', error.message);
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(3);
      
      if (annData) {
        setAnnouncements(annData.map(d => ({
          id: d.id,
          title: d.title,
          content: d.content,
          authorName: d.author_name,
          timestamp: d.timestamp
        } as Announcement)));
      }

      const { data: photoData } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(4);

      if (photoData) {
        setPhotos(photoData.map(d => ({
          id: d.id,
          url: d.url,
          caption: d.caption,
          timestamp: d.upload_date,
          uploadedBy: d.uploaded_by
        } as GalleryPhoto)));
      }
    };

    fetchData();

    const annChannel = supabase.channel('ann_landing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, fetchData)
      .subscribe();

    const photoChannel = supabase.channel('photo_landing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_photos' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(annChannel);
      supabase.removeChannel(photoChannel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F5F3] font-sans selection:bg-black selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Saint_Paul_by_El_Greco_%28Prado%29.jpg/800px-Saint_Paul_by_El_Greco_%28Prado%29.jpg" 
                alt="Saint Paul" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-serif font-bold text-2xl tracking-tighter text-black">SAPCYM</span>
          </div>

          <button 
            onClick={handleSignIn}
            className="px-6 py-2.5 bg-black text-white rounded-full font-bold text-sm tracking-tight hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-black text-xs font-bold uppercase tracking-widest border border-black/10">
              <div className="w-5 h-5 rounded-md overflow-hidden shrink-0">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Saint_Paul_by_El_Greco_%28Prado%29.jpg/800px-Saint_Paul_by_El_Greco_%28Prado%29.jpg" 
                  alt="Saint Paul" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              Official Ministry Portal
            </div>
            <h1 
              style={{ backgroundColor: '#eef1f7', borderColor: '#000000' }}
              className="text-7xl lg:text-8xl font-serif font-bold tracking-tighter text-black leading-[0.9] border"
            >
              The Heart <br />
              <span className="italic opacity-50">of Worship.</span>
            </h1>
            <p className="text-xl text-gray-500 leading-relaxed max-w-xl">
              Saint Paul Catholic Young Movement (SAPCYM). A dedicated space for spiritual growth, choral excellence, and fraternal unity.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={handleSignIn}
                style={{ backgroundColor: '#156dd2' }}
                className="px-10 py-5 text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-2xl flex items-center gap-3"
              >
                Join the Ministry
                <ChevronRight size={20} />
              </button>
              <a href="#activities" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all shadow-sm">
                Explore Activities
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-black/5 rounded-[4rem] relative overflow-hidden group">
              {photos[0] ? (
                <img src={photos[0].url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt="Hero" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black/10">
                  <Music size={200} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-12 left-12 right-12">
                <p className="text-white text-3xl font-serif font-bold italic leading-tight">"Where words fail, music speaks."</p>
              </div>
            </div>
            
            {/* Floating Stats */}
            <div className="absolute top-12 -right-8 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100 hidden md:block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/5 rounded-2xl text-black">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-black/40">Active Members</p>
                  <p className="text-2xl font-serif font-bold text-black tracking-tighter">50+ Brothers</p>
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
              <h2 className="text-5xl font-serif font-bold tracking-tighter text-black">Announcements</h2>
              <p className="text-gray-400 font-mono text-sm uppercase tracking-widest font-bold">Stay updated with our latest activities</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl">
              <Bell className="text-black" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {announcements.map((ann) => (
              <div key={ann.id} className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 hover:border-black/30 transition-all group">
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-300 mb-6">
                  {ann.timestamp ? format(typeof ann.timestamp === 'string' ? parseISO(ann.timestamp) : ann.timestamp, 'MMMM dd, yyyy') : 'No date'}
                </div>
                <h3 className="text-2xl font-serif font-bold text-black leading-tight mb-4 group-hover:text-black/70 transition-colors">
                  {ann.title}
                </h3>
                <p className="text-gray-500 line-clamp-3 leading-relaxed mb-8">
                  {ann.content}
                </p>
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black group-hover:gap-4 transition-all">
                  Read Announcement
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
            {announcements.length === 0 && (
              <div className="col-span-3 text-center py-20 text-black/20 italic">
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
            <h2 className="text-5xl font-serif font-bold tracking-tighter text-black italic">Captured Moments</h2>
            <div className="w-24 h-1 bg-black mx-auto rounded-full" />
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
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Saint_Paul_by_El_Greco_%28Prado%29.jpg/800px-Saint_Paul_by_El_Greco_%28Prado%29.jpg" 
                alt="Saint Paul" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="font-serif font-bold text-2xl tracking-tighter text-black">SAPCYM</p>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300">L’excellence au service de Dieu</p>
            </div>
          </div>

          <div className="flex gap-12 text-xs font-bold uppercase tracking-widest text-gray-300">
            <a href="#" className="hover:text-black transition-colors">Confidentiality</a>
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
          </div>

          <p className="text-xs font-mono font-bold text-gray-200">© 2026 SAPCYM PORTAL</p>
        </div>
      </footer>
    </div>
  );
}
