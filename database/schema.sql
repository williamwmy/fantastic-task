-- =============================================================================
-- Fantastic Task - Supabase Database Schema
-- =============================================================================
-- This schema defines the database structure for a family task management
-- system with points-based gamification.

-- Users table (bruker Supabase Auth)
-- auth.users (built-in) - Supabase provides this automatically

-- =============================================================================
-- FAMILIES
-- =============================================================================

-- Families table - represents a household or group
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Family members - connects users to families with roles and profiles
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  nickname TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#82bcf4',
  role TEXT DEFAULT 'member', -- 'admin', 'member', 'child'
  points_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- TASKS
-- =============================================================================

-- Tasks table - defines repeatable activities
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  estimated_minutes INTEGER,
  recurring_days INTEGER[], -- 0=Sunday, 1=Monday, ..., 6=Saturday
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES family_members(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task assignments - specific instances of tasks assigned to members
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES family_members(id),
  assigned_by UUID REFERENCES family_members(id),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task completions - records when tasks are completed
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES task_assignments(id),
  completed_by UUID REFERENCES family_members(id),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_minutes INTEGER,
  comment TEXT,
  points_awarded INTEGER,
  verified_by UUID REFERENCES family_members(id),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- POINTS SYSTEM
-- =============================================================================

-- Points transactions - tracks all point changes for gamification
CREATE TABLE points_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_member_id UUID REFERENCES family_members(id),
  points INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earned', 'spent', 'bonus', 'penalty'
  description TEXT,
  task_completion_id UUID REFERENCES task_completions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES (Optional - add for performance)
-- =============================================================================

-- CREATE INDEX idx_family_members_family_id ON family_members(family_id);
-- CREATE INDEX idx_family_members_user_id ON family_members(user_id);
-- CREATE INDEX idx_tasks_family_id ON tasks(family_id);
-- CREATE INDEX idx_task_assignments_task_id ON task_assignments(task_id);
-- CREATE INDEX idx_task_assignments_assigned_to ON task_assignments(assigned_to);
-- CREATE INDEX idx_task_completions_task_id ON task_completions(task_id);
-- CREATE INDEX idx_task_completions_completed_by ON task_completions(completed_by);
-- CREATE INDEX idx_points_transactions_family_member_id ON points_transactions(family_member_id);