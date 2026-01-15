
import React, { useMemo, useState } from 'react';
import { Member, Task } from '../types.ts';

interface MemberCalendarProps {
  member: Member;
  tasks: Task[];
  onClose: () => void;
}

const PROJECT_COLORS = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-lime-500'
];

export const MemberCalendar: React.FC<MemberCalendarProps> = ({ member, tasks, onClose }) => {
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'DONE'>('ACTIVE');
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => viewMode === 'DONE' ? t.status === 'DONE' : t.status !== 'DONE');
  }, [tasks, viewMode]);

  const taskColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    filteredTasks.forEach((task, index) => {
      map[task.id] = PROJECT_COLORS[index % PROJECT_COLORS.length];
    });
    return map;
  }, [filteredTasks]);

  const getTasksForDay = (day: number) => {
    const dayStart = new Date(year, month, day, 0, 0, 0).getTime();
    const dayEnd = new Date(year, month, day, 23, 59, 59).getTime();
    
    return filteredTasks.filter(t => {
      if (viewMode === 'DONE') {
        return t.completedAt && t.completedAt >= dayStart && t.completedAt <= dayEnd;
      } else {
        const start = t.startedAt || t.createdAt;
        const end = t.deadline;
        return start <= dayEnd && end >= dayStart;
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <div className="bg-slate-900 rounded-[2rem] w-full max-w-[340px] border border-white/10 shadow-2xl overflow-hidden p-6 flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div className="flex items-center gap-3">
            <img src={member.avatar} className="w-10 h-10 rounded-xl border border-indigo-500/30 shadow-sm" alt="" />
            <div>
              <h2 className="text-sm font-black italic text-white uppercase tracking-tight leading-none">{member.name}</h2>
              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{year}년 {month + 1}월 일정</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        <div className="flex p-1 bg-black/40 rounded-xl mb-4 border border-white/5 shrink-0">
          <button
            onClick={() => setViewMode('ACTIVE')}
            className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewMode === 'ACTIVE' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            진행 중
          </button>
          <button
            onClick={() => setViewMode('DONE')}
            className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${viewMode === 'DONE' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            완료됨
          </button>
        </div>

        <div className="shrink-0">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (
              <div key={d} className="text-[8px] font-black text-slate-600 text-center py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map(i => <div key={`empty-${i}`} className="aspect-square bg-white/[0.01] rounded-lg"></div>)}
            {days.map(day => {
              const activeTasks = getTasksForDay(day);
              const isToday = day === now.getDate() && month === now.getMonth();

              return (
                <div 
                  key={day} 
                  className={`aspect-square rounded-lg border p-1 flex flex-col gap-0.5 transition-all ${
                    isToday ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-slate-800/40'
                  }`}
                >
                  <span className={`text-[9px] font-black leading-none ${isToday ? 'text-white' : 'text-slate-500'}`}>
                    {day}
                  </span>
                  
                  <div className="flex flex-col gap-0.5 mt-auto overflow-hidden">
                    {activeTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id} 
                        className={`h-0.5 w-full rounded-full ${taskColorMap[task.id] || 'bg-slate-500'}`}
                      ></div>
                    ))}
                    {activeTasks.length > 3 && (
                      <div className="w-full text-[6px] text-slate-600 font-black text-center leading-none">+</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/5 overflow-y-auto max-h-32 scrollbar-hide">
          <div className="space-y-1.5">
             <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className={`w-1 h-2 rounded-full ${viewMode === 'DONE' ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
              {viewMode === 'DONE' ? '이번 달 완료 업무' : '현재 진행 업무'}
            </h3>
            {filteredTasks.length === 0 ? (
              <p className="text-[9px] font-black italic text-slate-700 uppercase text-center py-2">업무 내역 없음</p>
            ) : (
              filteredTasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${taskColorMap[t.id] || 'bg-slate-500'}`}></div>
                  <p className="text-[9px] font-bold text-slate-300 truncate flex-1">{t.title}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
