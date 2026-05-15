import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Image as ImageIcon, 
  Trash2, 
  X,
  Upload,
  Loader2,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase, uploadFile } from '../lib/supabase';
import { GalleryPhoto } from '../types';

export default function PhotoGallery() {
  const { isExecutive, isAdmin, user } = useAuth();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);

  const BUCKET_NAME = 'gallery';

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('upload_date', { ascending: false });

      if (data) {
        setPhotos(data.map(p => ({
          id: p.id,
          url: p.url,
          caption: p.caption,
          timestamp: p.upload_date,
          uploadedBy: p.uploaded_by
        } as GalleryPhoto)));
      }
      setLoading(false);
    };

    fetchPhotos();

    // Subscribe to changes
    const channel = supabase
      .channel('public:gallery_photos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_photos' }, payload => {
        fetchPhotos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (photo: GalleryPhoto) => {
    if (!confirm("Delete this photo?")) return;
    try {
      if (photo.url) {
        // Extract filename from URL
        const filename = photo.url.split('/').pop()?.split('?')[0];
        if (filename) {
          await supabase.storage.from(BUCKET_NAME).remove([filename]);
        }
      }
      await supabase.from('gallery_photos').delete().eq('id', photo.id);
    } catch (e) {
      console.error(e);
      alert("Error deleting photo.");
    }
  };

  if (loading) return <div className="p-8 animate-pulse text-gray-400">Loading gallery...</div>;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Photo Gallery</h1>
          <p className="text-gray-400 font-sans mt-2">Captured moments from our ministry activities.</p>
        </div>

        {isExecutive && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-lg"
          >
            <Plus size={20} />
            Upload Photos
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <motion.div 
            key={photo.id}
            layoutId={photo.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square bg-gray-100 rounded-[2rem] overflow-hidden relative group cursor-pointer"
            onClick={() => setSelectedPhoto(photo)}
          >
            <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-6">
              <div className="flex justify-end gap-2">
                {isExecutive && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo); }}
                    className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button className="p-3 bg-white/20 backdrop-blur-md rounded-xl text-white">
                  <Maximize2 size={18} />
                </button>
              </div>
              <div>
                <p className="text-white font-bold italic leading-tight">{photo.caption || 'SAPCYM Activity'}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-8 lg:p-20"
            onClick={() => setSelectedPhoto(null)}
          >
            <button className="absolute top-8 right-8 text-white hover:rotate-90 transition-transform"><X size={40} /></button>
            <motion.img 
              layoutId={selectedPhoto.id}
              src={selectedPhoto.url} 
              className="max-w-full max-h-full object-contain rounded-3xl" 
            />
            {selectedPhoto.caption && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/20">
                <p className="text-white font-bold italic text-xl">{selectedPhoto.caption}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isModalOpen && (
        <PhotoUploadModal onClose={() => setIsModalOpen(false)} uid={user?.id || ''} />
      )}
    </div>
  );
}

function PhotoUploadModal({ onClose, uid }: { onClose: () => void, uid: string }) {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const filePath = `${timestamp}_${sanitizedName}`;
      
      const { publicUrl } = await uploadFile('gallery', filePath, file);

      const { error: dbError } = await supabase.from('gallery_photos').insert({
        url: publicUrl,
        caption: caption.trim() || 'SAPCYM Activity',
        uploaded_by: uid
      });

      if (dbError) throw dbError;
      onClose();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error uploading photo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-12 space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold tracking-tighter italic">Upload Photo</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Caption (Optional)</label>
              <input 
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans"
                placeholder="e.g. Easter Sunday 2026"
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Image File</label>
              <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-dashed border-gray-100 bg-gray-50 group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {!file ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-300">
                    <ImageIcon size={48} />
                    <p className="text-xs font-bold uppercase tracking-widest">Selected Image</p>
                  </div>
                ) : (
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                )}
              </div>
            </div>

            {isUploading && (
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-black animate-pulse" style={{ width: '100%' }} />
              </div>
            )}
          </div>

          <button 
            onClick={handleUpload}
            disabled={isUploading || !file}
            className="w-full bg-black text-white py-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-lg disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={20} />}
            {isUploading ? 'Uploading...' : 'Publish to Gallery'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
