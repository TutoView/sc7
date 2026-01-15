
import React from 'react';
import { Task, Member, Priority, TaskCategory } from '../types.ts';
import { PRIORITY_COLORS } from '../constants.tsx';

interface TaskCardProps {
  task: Task;
  members: Member[];
  onDragStart: () => void;
  onComplete: () => void;
  isAdmin?: boolean;
  onUpdateDeadline?: (days: number) => void;
}

const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: '낮음',
  NORMAL: '보통',
  HIGH: '높음',
  EMERGENCY: '긴급'
};

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  members, 
  onDragStart, 
  onComplete, 
  isAdmin = false,
  onUpdateDeadline 
}) => {
  const getElapsedHours = () => {
    if (!task.startedAt) return 0;
    const diff = (task.status === 'DONE' && task.completedAt ? task.completedAt : Date.now()) - task.startedAt;
    return Math.floor(diff / (1000 * 60 * 60));
  };

  const deadlineDate = new Date(task.deadline);
  const month = (deadlineDate.getMonth() + 1).toString().padStart(2, '0');
  const date = deadlineDate.getDate().toString().padStart(2, '0');
  
  const elapsedHours = getElapsedHours();
  const isInefficient = task.status !== 'DONE' && task.category === 'SIMPLE' && elapsedHours > 12;
  const isEmergency = task.status !== 'DONE' && task.priority === 'EMERGENCY';
  const isOverdue = task.status !== 'DONE' && task.deadline < Date.now();
  const isDone = task.status === 'DONE';

  const handleDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    if (!isAdmin || isDone || target.closest('button')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart();
  };

  return (
    <div 
      draggable={isAdmin && !isDone}
      onDragStart={handleDragStart}
      className={`group relative bg-slate-900/90 border p-4 rounded-2xl transition-all shadow-sm ${
        isDone 
          ? 'opacity-60 grayscale border-white/5 cursor-default' 
          : isAdmin 
            ? 'cursor-grab active:cursor-grabbing hover:translate-y-[-2px] active:scale-[0.98]' 
            : 'cursor-default'
      } ${
        !isDone && isEmergency 
          ? 'border-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)] z-10' 
          : !isDone && isInefficient
            ? 'border-amber-500 bg-amber-950/20'
            : !isDone && isOverdue 
              ? 'border-orange-500/60 shadow-md' 
              : 'border-white/10 hover:border-indigo-500/50'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-slate-500 font-black uppercase tracking-tighter">우선순위</span>
          <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black text-white uppercase shadow-sm ${isDone ? 'bg-slate-700' : PRIORITY_COLORS[task.priority]}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">마감일</span>
          <div className="flex items-center gap-1">
            {isAdmin && !isDone && (
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onUpdateDeadline?.(-1)}
                className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 rounded-md text-[10px] transition-colors"
                title="하루 단축"
              >
                -
              </button>
            )}
            <div className={`text-3xl font-black leading-none tracking-tighter ${!isDone && isOverdue ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {month}.{date}
            </div>
            {isAdmin && !isDone && (
              <button 
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onUpdateDeadline?.(1)}
                className="w-5 h-5 flex items-center justify-center bg-white/5 hover:bg-white/10 text-slate-400 rounded-md text-[10px] transition-colors"
                title="하루 연장"
              >
                +
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <h3 className={`text-[14px] font-bold leading-tight tracking-tight transition-colors line-clamp-2 ${isDone ? 'text-slate-500 line-through' : 'text-slate-100 group-hover:text-indigo-400'}`}>
          {task.title}
        </h3>
        
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-400 font-black uppercase px-1.5 py-0.5 bg-white/5 rounded italic">
            {task.pdName} PD
          </span>
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
            isDone ? 'border-slate-800 text-slate-700' : task.category === 'SIMPLE' ? 'border-emerald-500/30 text-emerald-400' : 'border-slate-700 text-slate-500'
          }`}>
            {task.category === 'SIMPLE' ? '단순수정' : task.category === 'COMPLEX' ? '대형제작' : '일반'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">상태</span>
          <div className={`text-[11px] font-black italic text-slate-400 uppercase`}>
            {isDone ? '작업 완료' : task.startedAt ? '진행 중' : '배분 대기'}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && !isDone && task.status === 'IN_PROGRESS' && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-all shadow-md"
            >
              완료 처리
            </button>
          )}
        </div>
      </div>

      {!isDone && isInefficient && (
        <div className="absolute -top-2 left-4 bg-amber-500 text-black px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter shadow-lg z-20">
          ⚠️ 비효율 감지
        </div>
      )}
    </div>
  );
};
