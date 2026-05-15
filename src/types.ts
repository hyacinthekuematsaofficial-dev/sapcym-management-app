export type UserRole = 'Admin' | 'Executive' | 'Music Director' | 'Member';
export type VoiceSection = 'Soprano' | 'Alto' | 'Ténor' | 'Basse';
export type Gender = 'Male' | 'Female';

export interface Member {
  uid: string;
  fullName: string;
  role: UserRole;
  gender: Gender;
  voiceSection?: VoiceSection;
  status: string;
  onboardingDate: any; // String in Supabase
  oldMember: boolean;
  pendingApproval: boolean;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
  profession?: string;
}

export interface Song {
  id: string;
  title: string;
  composer?: string;
  musicalKey?: string;
  uploadDate: any;
  scoreUrl?: string;
  lyricsUrl?: string;
  audioUrl?: string;
  lyricsText?: string;
  uploadedBy: string;
}

export interface AttendanceRecord {
  id: string;
  date: any;
  memberId: string;
  status: 'present' | 'absent';
  markedBy: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  timestamp: any;
  replyToId?: string;
  replyToContent?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorName: string;
  timestamp: any;
}

export interface FinancialReport {
  id: string;
  year: number;
  month: number;
  pdfUrl: string;
  uploadDate: any;
  uploadedBy: string;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  timestamp: any;
  uploadedBy: string;
}
