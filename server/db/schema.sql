-- CampusHub Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  branch VARCHAR(100),
  year INTEGER CHECK (year BETWEEN 1 AND 4),
  skills TEXT[],
  bio TEXT,
  wallet_address VARCHAR(42),
  avatar_url TEXT,
  contribution_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notices
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) CHECK (category IN ('exam', 'event', 'internship', 'urgent', 'general')),
  department VARCHAR(100),
  is_pinned BOOLEAN DEFAULT false,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notice seen tracking
CREATE TABLE IF NOT EXISTS notice_seen (
  notice_id UUID REFERENCES notices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  seen_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (notice_id, user_id)
);

-- Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(100) NOT NULL,
  semester INTEGER CHECK (semester BETWEEN 1 AND 8),
  branch VARCHAR(100),
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  download_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Study Material Likes
CREATE TABLE IF NOT EXISTS study_likes (
  material_id UUID REFERENCES study_materials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (material_id, user_id)
);

-- Timetable Slots
CREATE TABLE IF NOT EXISTS timetable_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(100) NOT NULL,
  room VARCHAR(50),
  instructor VARCHAR(100),
  color VARCHAR(20) DEFAULT '#4f46e5',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  venue VARCHAR(255),
  organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  club_id UUID,
  category VARCHAR(50) DEFAULT 'general',
  banner_url TEXT,
  max_attendees INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('going', 'interested')),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  logo_url TEXT,
  president_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Club Memberships
CREATE TABLE IF NOT EXISTS club_memberships (
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (club_id, user_id)
);

-- Discussions
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  answer_count INTEGER DEFAULT 0,
  is_solved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Discussion Comments
CREATE TABLE IF NOT EXISTS discussion_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  vote_count INTEGER DEFAULT 0,
  is_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Votes (unified for discussions and comments)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(20) CHECK (entity_type IN ('discussion', 'comment')),
  entity_id UUID NOT NULL,
  value INTEGER CHECK (value IN (1, -1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  color VARCHAR(20),
  token_id INTEGER UNIQUE
);

-- User Badges
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP DEFAULT NOW(),
  tx_hash VARCHAR(66),
  PRIMARY KEY (user_id, badge_id)
);

-- Seed default badges
INSERT INTO badges (name, description, icon, color, token_id) VALUES
  ('Top Contributor', 'Uploaded 10+ study materials', '📚', '#f59e0b', 1),
  ('Active Member', 'Posted 20+ discussions', '💬', '#3b82f6', 2),
  ('Event Enthusiast', 'Attended 5+ events', '🎉', '#10b981', 3),
  ('Helpful Soul', 'Got 50+ upvotes on answers', '⭐', '#8b5cf6', 4),
  ('Club Leader', 'President of a club', '👑', '#ef4444', 5)
ON CONFLICT (name) DO NOTHING;
