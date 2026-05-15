-- SAPCYM Supabase Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Members Table
create table if not exists members (
  uid uuid references auth.users not null primary key,
  full_name text not null,
  role text default 'Member',
  gender text not null,
  voice_section text,
  status text default 'Active',
  onboarding_date timestamp with time zone default now(),
  old_member boolean default false,
  pending_approval boolean default true,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- 2. Songs Table
create table if not exists songs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  composer text,
  musical_key text,
  upload_date timestamp with time zone default now(),
  score_url text,
  lyrics_url text,
  audio_url text,
  lyrics_text text,
  uploaded_by uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

-- 3. Attendance Table
create table if not exists attendance (
  id uuid default uuid_generate_v4() primary key,
  date date default current_date,
  member_id uuid references auth.users not null,
  status text check (status in ('present', 'absent')),
  marked_by uuid references auth.users not null,
  created_at timestamp with time zone default now()
);

-- 4. Chat Messages Table
create table if not exists chat_messages (
  id uuid default uuid_generate_v4() primary key,
  content text not null,
  author_id uuid references auth.users not null,
  author_name text not null,
  author_avatar text,
  timestamp timestamp with time zone default now(),
  reply_to_id uuid references chat_messages(id),
  reply_to_content text
);

-- 5. Announcements Table
create table if not exists announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  author_name text not null,
  timestamp timestamp with time zone default now()
);

-- 6. Financial Reports Table
create table if not exists financial_reports (
  id uuid default uuid_generate_v4() primary key,
  year integer not null,
  month integer not null,
  pdf_url text not null,
  upload_date timestamp with time zone default now(),
  uploaded_by uuid references auth.users not null
);

-- 7. Gallery Photos Table
create table if not exists gallery_photos (
  id uuid default uuid_generate_v4() primary key,
  url text not null,
  caption text,
  timestamp timestamp with time zone default now(),
  uploaded_by uuid references auth.users not null
);

-- 8. Settings Table (For Regulations)
create table if not exists settings (
  key text primary key,
  content text,
  pdf_url text,
  updated_at timestamp with time zone default now()
);

-- Initial Setting for Regulations
insert into settings (key, content) values ('regulations', '# Internal Regulations\n\nWelcome to SAPCYM...') on conflict (key) do nothing;

-- STORAGE BUCKETS (Run via Console or RLS if needed)
-- Note: Buckets like 'choir_files', 'gallery', 'avatars' should be created in Supabase Dashboard.

-- Basic RLS Rules (Example for members)
alter table members enable row level security;

create policy "Public members are viewable by everyone." on members
  for select using (true);

create policy "Users can update own member profile." on members
  for update using (auth.uid() = uid);

create policy "Admins can update anyone." on members
  for update using (
    exists (select 1 from members where uid = auth.uid() and role = 'Admin')
  );
