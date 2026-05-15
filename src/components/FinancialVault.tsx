import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Vault, 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  X,
  ExternalLink,
  Loader2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase, uploadFile } from '../lib/supabase';
import { FinancialReport } from '../types';
import { format, parseISO } from 'date-fns';

export default function FinancialVault() {
  const { isExecutive, isAdmin, user } = useAuth();
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isExecutive) return;
    
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (data) {
        setReports(data.map(r => ({
          id: r.id,
          year: r.year,
          month: r.month,
          pdfUrl: r.pdf_url,
          uploadDate: r.upload_date,
          uploadedBy: r.uploaded_by
        } as FinancialReport)));
      }
      setLoading(false);
    };

    fetchReports();

    // Subscribe to changes
    const channel = supabase
      .channel('public:financial_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_reports' }, payload => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isExecutive]);

  const handleDelete = async (report: FinancialReport) => {
    if (!confirm("Permanently delete this financial report?")) return;
    try {
      if (report.pdfUrl) {
        const filename = report.pdfUrl.split('/').pop()?.split('?')[0];
        if (filename) {
          await supabase.storage.from('ministry_files').remove([`reports/${report.year}/${filename}`]);
        }
      }
      await supabase.from('financial_reports').delete().eq('id', report.id);
    } catch (e) {
      console.error(e);
      alert("Error deleting report.");
    }
  };

  if (!isExecutive) return <div className="p-8 text-center text-red-500 font-bold border border-red-100 bg-red-50 rounded-3xl">Access Restricted. Executives only.</div>;
  if (loading) return <div className="p-8 animate-pulse text-gray-400">Opening vault...</div>;

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter">Financial Vault</h1>
          <p className="text-gray-400 font-sans mt-2">Secure repository for ministry financial transparency.</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-lg"
        >
          <Upload size={20} />
          Upload Report
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence>
          {reports.map((report) => (
            <motion.div 
              key={report.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                  <Vault size={24} />
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => handleDelete(report)}
                    className="p-2 text-red-200 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold tracking-tighter italic leading-none">{months[report.month - 1]}</h3>
                <p className="text-gray-400 font-mono font-bold mt-1">{report.year}</p>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <Calendar size={12} />
                  Uploaded {format(typeof report.uploadDate === 'string' ? parseISO(report.uploadDate) : new Date(), 'MMM dd')}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex gap-3">
                <a 
                  href={report.pdfUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-50 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                >
                  <ExternalLink size={14} />
                  View
                </a>
                <a 
                  href={report.pdfUrl} 
                  download
                  className="px-4 flex items-center justify-center bg-gray-50 rounded-2xl text-gray-400 hover:bg-black hover:text-white transition-all"
                >
                  <Download size={18} />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {isModalOpen && (
        <UploadReportModal onClose={() => setIsModalOpen(false)} uid={user?.id || ''} />
      )}
    </div>
  );
}

function UploadReportModal({ onClose, uid }: { onClose: () => void, uid: string }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file");
    setIsUploading(true);

    try {
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const filePath = `reports/${year}/${month}_${sanitizedName}`;
      
      const { publicUrl } = await uploadFile('ministry_files', filePath, file);

      const { error: dbError } = await supabase.from('financial_reports').insert({
        year,
        month,
        pdf_url: publicUrl,
        uploaded_by: uid
      });

      if (dbError) throw dbError;
      onClose();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Error uploading report");
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
            <h2 className="text-3xl font-bold tracking-tighter italic">Upload Report</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Year</label>
                <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans font-bold" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Month</label>
                <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-black font-sans font-bold" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-gray-400">PDF Document</label>
              <div className="relative group">
                <input 
                  type="file" 
                  accept=".pdf"
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <div className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${file ? 'border-black bg-black/5' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                  {file ? <FileText size={40} /> : <Upload size={40} className="text-gray-300" />}
                  <p className="text-xs font-bold uppercase tracking-widest">{file ? file.name : 'Select or drop PDF'}</p>
                </div>
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
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Vault size={20} />}
            {isUploading ? 'Locking into Vault...' : 'Deposit Report'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
