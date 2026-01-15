
export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';
export type TaskStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type TaskCategory = 'SIMPLE' | 'STANDARD' | 'COMPLEX';

export interface Member {
  id: string;
  name: string;
  role: 'LEAD' | 'MEMBER';
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  pdName: string;
  description: string;
  priority: Priority;
  category: TaskCategory;
  status: TaskStatus;
  assignedTo?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  deadline: number;
  originalDeadline: number; // To track if it was pushed back
  delayCount: number; // How many times it was bumped
  pushedBy?: string; // ID of the task that caused the delay
}
