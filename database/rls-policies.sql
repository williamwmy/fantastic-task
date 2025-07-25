-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================
-- These policies ensure users can only access data from their own family

-- Enable RLS on all tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- FAMILY POLICIES
-- =============================================================================

-- Users can only see families they belong to
CREATE POLICY "Users can view their own families" ON families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create new families
CREATE POLICY "Users can create families" ON families
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Family admins can update their family
CREATE POLICY "Family admins can update their family" ON families
  FOR UPDATE USING (
    id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- FAMILY MEMBERS POLICIES
-- =============================================================================

-- Users can view members of their own family
CREATE POLICY "Users can view family members in their family" ON family_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create family member records (for invitations)
CREATE POLICY "Users can create family member records" ON family_members
  FOR INSERT WITH CHECK (
    -- Either joining their own family or being invited by an admin
    user_id = auth.uid() OR
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own member record, admins can update any in their family
CREATE POLICY "Users can update family member records" ON family_members
  FOR UPDATE USING (
    user_id = auth.uid() OR
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- TASKS POLICIES
-- =============================================================================

-- Users can view tasks in their family
CREATE POLICY "Users can view family tasks" ON tasks
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create tasks in their family
CREATE POLICY "Users can create family tasks" ON tasks
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update tasks they created, admins can update any in their family
CREATE POLICY "Users can update tasks" ON tasks
  FOR UPDATE USING (
    created_by IN (
      SELECT id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- TASK ASSIGNMENTS POLICIES
-- =============================================================================

-- Users can view assignments in their family
CREATE POLICY "Users can view task assignments" ON task_assignments
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create assignments in their family
CREATE POLICY "Users can create task assignments" ON task_assignments
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can update assignments they created or are assigned to
CREATE POLICY "Users can update task assignments" ON task_assignments
  FOR UPDATE USING (
    assigned_by IN (
      SELECT id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR
    assigned_to IN (
      SELECT id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- TASK COMPLETIONS POLICIES
-- =============================================================================

-- Users can view completions in their family
CREATE POLICY "Users can view task completions" ON task_completions
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create completions for tasks in their family
CREATE POLICY "Users can create task completions" ON task_completions
  FOR INSERT WITH CHECK (
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    ) AND
    completed_by IN (
      SELECT id FROM family_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own completions, admins can verify any
CREATE POLICY "Users can update task completions" ON task_completions
  FOR UPDATE USING (
    completed_by IN (
      SELECT id FROM family_members 
      WHERE user_id = auth.uid()
    ) OR
    task_id IN (
      SELECT id FROM tasks WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- =============================================================================
-- POINTS TRANSACTIONS POLICIES
-- =============================================================================

-- Users can view points transactions in their family
CREATE POLICY "Users can view points transactions" ON points_transactions
  FOR SELECT USING (
    family_member_id IN (
      SELECT id FROM family_members WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- System can create points transactions (triggered by completions)
CREATE POLICY "System can create points transactions" ON points_transactions
  FOR INSERT WITH CHECK (
    family_member_id IN (
      SELECT id FROM family_members WHERE family_id IN (
        SELECT family_id FROM family_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- FAMILY INVITATION CODES TABLE
-- =============================================================================

-- Add a table for family invitation codes
CREATE TABLE family_invitation_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES family_members(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on invitation codes
ALTER TABLE family_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Family admins can manage invitation codes
CREATE POLICY "Family admins can manage invitation codes" ON family_invitation_codes
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone can view valid invitation codes (needed for joining)
CREATE POLICY "Anyone can view valid invitation codes" ON family_invitation_codes
  FOR SELECT USING (
    is_active = true AND 
    expires_at > NOW() AND 
    used_count < max_uses
  );