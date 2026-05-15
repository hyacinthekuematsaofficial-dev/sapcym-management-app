import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, Check, Shield, Loader2, Music, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { auth, db } from '../lib/firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { VoiceSection, Gender } from '../types';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Onboarding() {
  const { user, member, loading, isSuperAdmin } = useAuth();
  const [step, setStep] = useState(member?.pendingApproval ? 3 : 1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    profession: '',
    voiceSection: 'Ténor' as VoiceSection,
    gender: 'Male' as Gender,
    oldMember: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If member document already exists and is pending approval, jump to Step 3
  useEffect(() => {
    if (member?.pendingApproval) {
      setStep(3);
    }
  }, [member]);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const status = (formData.oldMember || isSuperAdmin) ? 'Active' : 'Recrue Stagiaire';
      const role = isSuperAdmin ? 'Admin' : 'Member';
      const pendingApproval = !(formData.oldMember || isSuperAdmin);

      const memberPath = `members/${user.uid}`;
      try {
        await setDoc(doc(db, 'members', user.uid), {
          fullName: formData.fullName,
          role: role,
          gender: formData.gender,
          voiceSection: formData.voiceSection,
          status: status,
          onboardingDate: serverTimestamp(),
          oldMember: formData.oldMember,
          pendingApproval: pendingApproval,
          avatarUrl: user.photoURL,
        });

        await setDoc(doc(db, 'members', user.uid, 'private', 'data'), {
          email: user.email,
          phone: formData.phone,
          address: formData.address,
          profession: formData.profession,
        });

        if (pendingApproval) {
          setStep(3);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, memberPath);
      }
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen grid place-items-center bg-[#F5F5F3] p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white rounded-[3.5rem] shadow-2xl border border-gray-100 overflow-hidden"
      >
        <div className="p-16 space-y-12">
          {step === 1 && (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-brand-blue rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl">
                  <UserPlus size={40} />
                </div>
                <h1 className="text-5xl font-serif font-black tracking-tighter text-brand-blue italic leading-none">
                  Saint Paul Catholic <br/> Young Movement
                </h1>
                <p className="text-lg text-brand-blue/50 font-sans leading-relaxed">
                  Join the ministry of SAPCYM. Step forward to serve the Almighty with your voice and dedication. 
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-brand-blue/30">FullName</label>
                  <input 
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-blue transition-all font-sans text-brand-blue font-bold"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-brand-blue/30">Gender</label>
                  <select 
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-blue transition-all font-sans text-brand-blue font-bold"
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as Gender })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-brand-blue/30">Voice Section</label>
                  <select 
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-blue transition-all font-sans text-brand-blue font-bold"
                    value={formData.voiceSection}
                    onChange={e => setFormData({ ...formData, voiceSection: e.target.value as VoiceSection })}
                  >
                    <option value="Soprano">Soprano (Women)</option>
                    <option value="Alto">Alto (Women)</option>
                    <option value="Ténor">Ténor (Men)</option>
                    <option value="Basse">Basse (Men)</option>
                  </select>
                </div>
              </div>

              <div 
                className="flex items-center gap-6 p-8 bg-gray-50 rounded-3xl cursor-pointer group hover:bg-brand-blue/5 transition-all text-left"
                onClick={() => setFormData({ ...formData, oldMember: !formData.oldMember })}
              >
                <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${formData.oldMember ? 'bg-brand-blue border-brand-blue text-white shadow-lg' : 'border-gray-200 group-hover:border-brand-blue'}`}>
                  {formData.oldMember && <Check size={20} />}
                </div>
                <div>
                  <p className="font-serif font-bold text-lg text-brand-blue">Old Member Re-Registration</p>
                  <p className="text-xs text-brand-blue/40">Select this if you were already a member before the portal.</p>
                </div>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!formData.fullName}
                className="w-full bg-brand-blue text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <div className="space-y-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-brand-blue/30 hover:text-brand-blue font-bold text-xs uppercase tracking-widest transition-colors mb-4">
                   Back
                </button>
                <h1 className="text-5xl font-serif font-black tracking-tighter text-brand-blue italic leading-none">
                  Personal Records
                </h1>
                <p className="text-brand-blue/50">These details are kept strictly confidential for ministry organization.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-brand-blue/30">Phone Number</label>
                    <input 
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-blue font-sans font-bold"
                      placeholder="+237..."
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-brand-blue/30">Profession</label>
                    <input 
                      className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-blue font-sans font-bold"
                      placeholder="Student, Engineer, etc."
                      value={formData.profession}
                      onChange={e => setFormData({ ...formData, profession: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-brand-blue/30">Residential Address</label>
                  <input 
                    className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-brand-blue font-sans font-bold"
                    placeholder="Quartier, Ville"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.phone}
                className="w-full bg-brand-blue text-white py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Shield size={20} />}
                {isSubmitting ? 'Registering...' : 'Finalize Registration'}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-10 py-10">
              <div className="w-24 h-24 bg-brand-blue/5 text-brand-blue rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-brand-blue/10 animate-pulse">
                <Music size={48} />
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl font-serif font-black tracking-tighter text-brand-blue italic leading-none">
                  Record Saved. <br /> Pending Approval.
                </h1>
                <p className="text-lg text-brand-blue/50 max-w-sm mx-auto leading-relaxed">
                  Your registration for SAPCYM (Saint Paul Catholic Young Movement) has been sent to the Executive Committee. 
                </p>
              </div>

              <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 font-mono text-[10px] space-y-3">
                <p className="flex justify-between items-center text-brand-blue/40 uppercase tracking-widest">
                  Status <span>Reviewing Credentials</span>
                </p>
                <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '60%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="h-full bg-brand-blue" 
                  />
                </div>
              </div>

              <button 
                onClick={() => auth.signOut()}
                className="text-xs font-black uppercase tracking-widest text-brand-blue hover:opacity-50 transition-all underline underline-offset-8"
              >
                Sign out temporarily
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
