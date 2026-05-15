import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Member } from '../types';

interface AuthContextType {
  user: User | null;
  member: Member | null;
  loading: boolean;
  isAdmin: boolean;
  isExecutive: boolean;
  isMusicDirector: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  member: null,
  loading: true,
  isAdmin: false,
  isExecutive: false,
  isMusicDirector: false,
  isSuperAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

const SUPER_ADMIN_EMAILS = [
  'kuematsahy@gmail.com',
  'hyacinthekuematsaofficial@gmail.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setMember(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchMember = async () => {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('uid', user.id)
          .single();

        if (data) {
          // Map snake_case to camelCase
          const mappedMember: Member = {
            uid: data.uid,
            fullName: data.full_name,
            role: data.role,
            gender: data.gender,
            voiceSection: data.voice_section,
            status: data.status,
            onboardingDate: data.onboarding_date,
            oldMember: data.old_member,
            pendingApproval: data.pending_approval,
            avatarUrl: data.avatar_url
          };
          setMember(mappedMember);
        } else {
          setMember(null);
        }
        setLoading(false);
      };

      fetchMember();

      // Real-time subscription for member changes
      const channel = supabase
        .channel(`public:members:uid=eq.${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'members', 
          filter: `uid=eq.${user.id}` 
        }, payload => {
          if (payload.new) {
            const data = payload.new as any;
            setMember({
              uid: data.uid,
              fullName: data.full_name,
              role: data.role,
              gender: data.gender,
              voiceSection: data.voice_section,
              status: data.status,
              onboardingDate: data.onboarding_date,
              oldMember: data.old_member,
              pendingApproval: data.pending_approval,
              avatarUrl: data.avatar_url
            });
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const isSuperAdmin = user ? SUPER_ADMIN_EMAILS.includes(user.email || '') : false;
  const isAdmin = isSuperAdmin || member?.role === 'Admin';
  const isExecutive = isAdmin || member?.role === 'Executive';
  const isMusicDirector = isAdmin || member?.role === 'Music Director';

  return (
    <AuthContext.Provider value={{ user, member, loading, isAdmin, isExecutive, isMusicDirector, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
