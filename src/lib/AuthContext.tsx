import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Member } from '../types';
import { handleFirestoreError, OperationType } from './error-handler';

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
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setMember(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user) {
      const memberPath = `members/${user.uid}`;
      const unsub = onSnapshot(doc(db, 'members', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setMember({ uid: user.uid, ...docSnap.data() } as Member);
        } else {
          setMember(null);
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, memberPath);
        setLoading(false);
      });
      return unsub;
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
