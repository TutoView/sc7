
import { Member, Task } from './types.ts';

export const MEMBERS: Member[] = [
  { id: '1', name: '나 (팀장)', role: 'LEAD', avatar: 'https://picsum.photos/seed/lead/100/100' },
  { id: '2', name: '김철수', role: 'MEMBER', avatar: 'https://picsum.photos/seed/member1/100/100' },
  { id: '3', name: '이영희', role: 'MEMBER', avatar: 'https://picsum.photos/seed/member2/100/100' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: '뉴스 오프닝 타이틀 수정',
    pdName: '최PD',
    description: '기존 오프닝의 폰트 가독성 상향 조정',
    priority: 'HIGH',
    category: 'STANDARD',
    status: 'IN_PROGRESS',
    assignedTo: '2',
    createdAt: Date.now() - 86400000 * 3,
    startedAt: Date.now() - 86400000 * 2,
    deadline: Date.now() + 86400000 * 2,
    originalDeadline: Date.now() + 86400000 * 2,
    delayCount: 0,
  },
  {
    id: 't2',
    title: '예능 자막 패키지 제작',
    pdName: '박PD',
    description: '여름 특집용 시원한 느낌의 자막 세트',
    priority: 'NORMAL',
    category: 'STANDARD',
    status: 'BACKLOG',
    createdAt: Date.now() - 86400000,
    deadline: Date.now() + 86400000 * 5,
    originalDeadline: Date.now() + 86400000 * 5,
    delayCount: 0,
  }
];

export const PRIORITY_COLORS = {
  LOW: 'bg-slate-500',
  NORMAL: 'bg-indigo-500',
  HIGH: 'bg-orange-500',
  EMERGENCY: 'bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]'
};
