import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserPlus, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { auth, db, signInWithGoogle } from '../lib/firebase';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { UserRole, VoiceSection } from '../types';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Onboarding() {
  const { user, member, loading, isSuperAdmin } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    profession: '',
    address: '',
    phone: '',
    desiredRole: 'Member' as UserRole,
    voiceSection: 'Soprano' as VoiceSection,
    oldMember: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="min-h-screen grid place-items-center bg-[#E4E3E0]">Loading...</div>;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const onboardingDate = new Date();
      const status = (formData.oldMember || isSuperAdmin) ? 'Active' : 'Recrue Stagiaire';
      const role = isSuperAdmin ? 'Admin' : 'Member';
      const pendingApproval = !(formData.oldMember || isSuperAdmin);

      const memberPath = `members/${user.uid}`;
      try {
        await setDoc(doc(db, 'members', user.uid), {
          fullName: formData.fullName,
          role: role,
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
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, memberPath);
      }

      setStep(3);
    } catch (error) {
      console.error("Registration error:", error);
      alert(error instanceof Error ? error.message : "Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex flex-col items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-12 rounded-[2rem] border border-gray-200 shadow-xl max-w-md w-full text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white">
              <Shield size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mb-4 font-sans">SAPCYM</h1>
          <p className="text-gray-500 mb-8 font-sans">Ministry Management Portal</p>
          <button 
            onClick={signInWithGoogle}
            className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 invert" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  if (member) return null; // Already registered

  return (
    <div className="min-h-screen bg-[#E4E3E0] p-8 flex items-center justify-center">
      <motion.div 
        layout
        className="bg-white rounded-[2rem] border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        <div className="p-12">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-3xl font-bold tracking-tighter mb-2 flex items-center gap-3">
                <UserPlus className="text-gray-400" />
                Join the Ministry
              </h2>
              <p className="text-gray-500 mb-8">Welcome, {user.displayName}. Let's set up your profile.</p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-black transition-all outline-none font-sans"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Phone</label>
                    <input 
                      type="text" 
                      placeholder="+237 ..."
                      className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-black transition-all outline-none font-sans"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Profession</label>
                  <input 
                    type="text" 
                    placeholder="What do you do?"
                    className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-black transition-all outline-none font-sans"
                    value={formData.profession}
                    onChange={(e) => setFormData({...formData, profession: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Address</label>
                  <input 
                    type="text" 
                    placeholder="Residential area"
                    className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-black transition-all outline-none font-sans"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <button 
                  onClick={() => setStep(2)}
                  disabled={!formData.fullName}
                  className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="text-3xl font-bold tracking-tighter mb-8">Role & Status</h2>
              
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-xs uppercase font-bold tracking-widest text-gray-400">Voice Section</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Soprano', 'Alto', 'Ténor', 'Basse'].map((v) => (
                      <button
                        key={v}
                        onClick={() => setFormData({...formData, voiceSection: v as VoiceSection})}
                        className={`p-4 rounded-xl border transition-all text-left font-medium ${formData.voiceSection === v ? 'border-black bg-black text-white' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 p-6 rounded-2xl bg-black/5 border border-black/5">
                  <input 
                    type="checkbox" 
                    id="oldMember"
                    className="w-6 h-6 accent-black"
                    checked={formData.oldMember}
                    onChange={(e) => setFormData({...formData, oldMember: e.target.checked})}
                  />
                  <label htmlFor="oldMember" className="flex-1 cursor-pointer">
                    <span className="block font-bold">I am an existing choir member</span>
                    <span className="text-sm text-gray-500">Bypass the 90-day probationary period</span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-100 text-black py-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleRegister}
                    disabled={isSubmitting}
                    className="flex-[2] bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? 'Registering...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle size={40} />
                </div>
              </div>
              <h2 className="text-3xl font-bold tracking-tighter mb-4">Registration Sent!</h2>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                {formData.oldMember 
                  ? "Welcome back! You can now access the portal." 
                  : "Your application is under review. You'll have limited access until an administrator approves your profile."}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-black text-white px-8 py-4 rounded-xl font-medium hover:bg-gray-900 transition-colors"
              >
                Go to Dashboard
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
