// Mock data for local testing when VITE_LOCAL_TEST_USER=true
// All test data is centralized here for easy maintenance

const today = new Date().toISOString().split('T')[0];
const now = new Date().toISOString();

// User data
export const mockUser = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'test@test.com',
  nickname: 'Test Admin',
  role: 'admin'
};

// Family data
export const mockFamily = {
  id: 'mock-family-id',
  name: 'Test Familie',
  family_code: 'FAM15', // Simple 5-character family code
  require_child_verification: true, // Default to requiring verification for children
  created_by: mockUser.id,
  created_at: now
};

// Family members
export const mockFamilyMembers = [
  {
    id: 'mock-member-id',
    family_id: mockFamily.id,
    user_id: mockUser.id,
    nickname: 'Test Admin',
    role: 'admin',
    avatar_color: '#82bcf4',
    background_preference: 'gradient_northern_lights',
    points_balance: 100,
    created_at: now
  },
  {
    id: 'mock-member-2',
    family_id: mockFamily.id,
    user_id: 'mock-user-2',
    nickname: 'Test Barn',
    role: 'child',
    avatar_color: '#ff6b6b',
    background_preference: 'gradient_sunset',
    points_balance: 68, // 50 + 5 + 13 (includes bonus)
    created_at: now
  },
  {
    id: 'mock-member-3',
    family_id: mockFamily.id,
    user_id: 'mock-user-3',
    nickname: 'Test Forelder',
    role: 'member',
    avatar_color: '#4ecdc4',
    background_preference: 'solid_mint',
    points_balance: 105, // 75 + 12 + 18 (includes bonus)
    created_at: now
  }
];

// Get current member (admin)
export const mockCurrentMember = mockFamilyMembers[0];

// Family code is now part of the family object itself (family.family_code)

// Tasks
export const mockTasks = [
  {
    id: 'mock-task-1',
    family_id: mockFamily.id,
    title: 'Rydde rommet',
    description: 'Rydde og støvsuge rommet grundig',
    points: 10,
    estimated_minutes: 30,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'daily',
    recurring_days: [1, 2, 3, 4, 5], // Ukedager
    flexible_interval: null
  },
  {
    id: 'mock-task-2',
    family_id: mockFamily.id,
    title: 'Ta ut søppel',
    description: 'Ta ut søppel og sortere avfall',
    points: 5,
    estimated_minutes: 10,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'weekly_flexible',
    recurring_days: null,
    flexible_interval: 7
  },
  {
    id: 'mock-task-3',
    family_id: mockFamily.id,
    title: 'Vaske opp',
    description: 'Vaske opp etter middag',
    points: 8,
    estimated_minutes: 15,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'daily',
    recurring_days: [0, 1, 2, 3, 4, 5, 6], // Alle dager
    flexible_interval: null
  },
  {
    id: 'mock-task-4',
    family_id: mockFamily.id,
    title: 'Støvsuge stue',
    description: 'Støvsuge hele stuen og under sofa',
    points: 12,
    estimated_minutes: 25,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'monthly_flexible',
    recurring_days: null,
    flexible_interval: 30
  },
  {
    id: 'mock-task-5',
    family_id: mockFamily.id,
    title: 'Lage middag',
    description: 'Planlegge og lage middag for familien',
    points: 15,
    estimated_minutes: 45,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'daily',
    recurring_days: [0, 1, 2, 3, 4, 5, 6],
    flexible_interval: null
  },
  {
    id: 'mock-task-6',
    family_id: mockFamily.id,
    title: 'Vaske bad',
    description: 'Rengjøre badet grundig med alle flater',
    points: 20,
    estimated_minutes: 40,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'weekly_flexible',
    recurring_days: null,
    flexible_interval: 7
  },
  {
    id: 'mock-task-7',
    family_id: mockFamily.id,
    title: 'Handle mat',
    description: 'Handle ukens matvarer og husholdningsartikler',
    points: 25,
    estimated_minutes: 60,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'weekly_flexible',
    recurring_days: null,
    flexible_interval: 7
  },
  {
    id: 'mock-task-8',
    family_id: mockFamily.id,
    title: 'Vaske klær',
    description: 'Sortere, vaske og henge opp tøy',
    points: 10,
    estimated_minutes: 20,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'weekly_flexible',
    recurring_days: null,
    flexible_interval: 7
  },
  {
    id: 'mock-task-9',
    family_id: mockFamily.id,
    title: 'Klippe gresset',
    description: 'Klippe gressplenen og rydde rundt huset',
    points: 30,
    estimated_minutes: 90,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'monthly_flexible',
    recurring_days: null,
    flexible_interval: 14
  },
  {
    id: 'mock-task-10',
    family_id: mockFamily.id,
    title: 'Organisere skap',
    description: 'Sortere og organisere klær i garderoben',
    points: 18,
    estimated_minutes: 35,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'monthly_flexible',
    recurring_days: null,
    flexible_interval: 30
  },
  {
    id: 'mock-task-11',
    family_id: mockFamily.id,
    title: 'Mate kjæledyr',
    description: 'Gi mat og vann til hund og katt',
    points: 3,
    estimated_minutes: 5,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'daily',
    recurring_days: [0, 1, 2, 3, 4, 5, 6],
    flexible_interval: null
  },
  {
    id: 'mock-task-12',
    family_id: mockFamily.id,
    title: 'Betale regninger',
    description: 'Betale månedens regninger og sjekke økonomi',
    points: 15,
    estimated_minutes: 30,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'monthly_flexible',
    recurring_days: null,
    flexible_interval: 30
  },
  {
    id: 'mock-task-13',
    family_id: mockFamily.id,
    title: 'Tømme oppvaskmaskin',
    description: 'Tømme og starte ny runde i oppvaskmaskinen',
    points: 4,
    estimated_minutes: 8,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'daily',
    recurring_days: [1, 2, 3, 4, 5],
    flexible_interval: null
  },
  {
    id: 'mock-task-14',
    family_id: mockFamily.id,
    title: 'Planlegge familieaktivitet',
    description: 'Finne på noe morsomt å gjøre sammen',
    points: 12,
    estimated_minutes: 20,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'weekly_flexible',
    recurring_days: null,
    flexible_interval: 7
  },
  {
    id: 'mock-task-15',
    family_id: mockFamily.id,
    title: 'Lese med barn',
    description: 'Les godnattsagor eller hjelpemiddag med lekser',
    points: 8,
    estimated_minutes: 15,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: now,
    recurring_type: 'daily',
    recurring_days: [1, 2, 3, 4, 5],
    flexible_interval: null
  }
];

// Task assignments
export const mockTaskAssignments = [
  {
    id: 'mock-assignment-1',
    task_id: mockTasks[0].id,
    assigned_to: mockFamilyMembers[1].id, // Test Barn
    assigned_by: mockCurrentMember.id,
    due_date: today,
    status: 'pending',
    created_at: now,
    tasks: mockTasks[0],
    assigned_to_member: mockFamilyMembers[1],
    assigned_by_member: mockCurrentMember
  },
  {
    id: 'mock-assignment-2',
    task_id: mockTasks[2].id,
    assigned_to: mockFamilyMembers[2].id, // Test Forelder
    assigned_by: mockCurrentMember.id,
    due_date: today,
    status: 'pending',
    created_at: now,
    tasks: mockTasks[2],
    assigned_to_member: mockFamilyMembers[2],
    assigned_by_member: mockCurrentMember
  }
];

// Task completions
export const mockTaskCompletions = [
  {
    id: 'mock-completion-1',
    task_id: mockTasks[1].id,
    completed_by: mockFamilyMembers[1].id, // Test Barn
    completed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 timer siden
    time_spent_minutes: 15,
    comment: 'Tok litt ekstra tid, men fikk sortert alt',
    points_awarded: 5,
    verified_by: null,
    verified_at: null,
    tasks: mockTasks[1],
    completed_by_member: mockFamilyMembers[1]
  },
  {
    id: 'mock-completion-2',
    task_id: mockTasks[3].id,
    completed_by: mockFamilyMembers[2].id, // Test Forelder
    completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 dag siden
    time_spent_minutes: 30,
    comment: 'Grundig jobbing, fant mye støv under sofaen',
    points_awarded: 12,
    verified_by: mockCurrentMember.id,
    verified_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    tasks: mockTasks[3],
    completed_by_member: mockFamilyMembers[2],
    verified_by_member: mockCurrentMember
  }
];

// Points transactions
export const mockPointsTransactions = [
  {
    id: 'mock-transaction-1',
    family_member_id: mockFamilyMembers[1].id,
    points: 5,
    bonus_points: 0,
    transaction_type: 'earned',
    description: 'Task completion - Ta ut søppel',
    task_completion_id: mockTaskCompletions[0].id,
    created_at: mockTaskCompletions[0].completed_at,
    family_members: mockFamilyMembers[1],
    task_completions: mockTaskCompletions[0]
  },
  {
    id: 'mock-transaction-2',
    family_member_id: mockFamilyMembers[2].id,
    points: 12,
    bonus_points: 0,
    transaction_type: 'earned',
    description: 'Task completion (verified) - Støvsuge stue',
    task_completion_id: mockTaskCompletions[1].id,
    created_at: mockTaskCompletions[1].verified_at,
    family_members: mockFamilyMembers[2],
    task_completions: mockTaskCompletions[1]
  },
  {
    id: 'mock-transaction-3',
    family_member_id: mockFamilyMembers[1].id,
    points: 10,
    bonus_points: 3,
    transaction_type: 'earned',
    description: 'Task completion with 3 bonus points',
    task_completion_id: null,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 timer siden
    family_members: mockFamilyMembers[1]
  },
  {
    id: 'mock-transaction-4',
    family_member_id: mockFamilyMembers[2].id,
    points: 15,
    bonus_points: 3,
    transaction_type: 'earned',
    description: 'Task completion with 3 bonus points',
    task_completion_id: null,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 timer siden
    family_members: mockFamilyMembers[2]
  }
];

// Helper functions to generate new mock data
export const generateMockFamilyCode = () => {
  return Math.random().toString(36).substring(2, 7).toUpperCase(); // 5 characters
};

export const generateMockTask = (taskData) => {
  return {
    id: 'mock-task-' + Date.now(),
    family_id: mockFamily.id,
    created_by: mockCurrentMember.id,
    is_active: true,
    created_at: new Date().toISOString(),
    recurring_type: 'daily',
    recurring_days: null,
    flexible_interval: null,
    ...taskData
  };
};

export const generateMockTaskCompletion = (taskId, completedBy, completionData) => {
  const task = mockTasks.find(t => t.id === taskId);
  const member = mockFamilyMembers.find(m => m.id === completedBy);
  
  return {
    id: 'mock-completion-' + Date.now(),
    task_id: taskId,
    completed_by: completedBy,
    completed_at: completionData?.completed_at || new Date().toISOString(),
    verified_by: null,
    verified_at: null,
    tasks: task,
    completed_by_member: member,
    ...completionData
  };
};

export const generateMockPointsTransaction = (memberId, points, type, description, taskCompletionId = null, bonusPoints = 0) => {
  const member = mockFamilyMembers.find(m => m.id === memberId);
  
  return {
    id: 'mock-transaction-' + Date.now(),
    family_member_id: memberId,
    points,
    bonus_points: bonusPoints,
    transaction_type: type,
    description,
    task_completion_id: taskCompletionId,
    created_at: new Date().toISOString(),
    family_members: member
  };
};

// Export all mock data as a single object for easy access
export const mockData = {
  user: mockUser,
  family: mockFamily,
  familyMembers: mockFamilyMembers,
  currentMember: mockCurrentMember,
  tasks: mockTasks,
  taskAssignments: mockTaskAssignments,
  taskCompletions: mockTaskCompletions,
  pointsTransactions: mockPointsTransactions
};