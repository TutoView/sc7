
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Task, Member, TaskStatus } from './types.ts';
import { MEMBERS as INITIAL_MEMBERS, INITIAL_TASKS } from './constants.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { TaskForm } from './components/TaskForm.tsx';
import { MemberCalendar } from './components/MemberCalendar.tsx';
import { MemberSettings } from './components/MemberSettings.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { getWorkloadAdvice, getAiKey } from './services/geminiService.ts';
import { safeStorage, STORAGE_KEYS } from './services/storageService.ts';

const DEFAULT_PW = '1234';

const App: React.FC = () => {
  // 초기 로드 시 memoryCache와 localStorage를 동기화하여 가져옴
  const [isAdmin, setIsAdmin] = useState(() => safeStorage.get(STORAGE_KEYS.ADMIN_SESSION, false));
  const [adminPassword] = useState(() => safeStorage.get(STORAGE_KEYS.ADMIN_PW, DEFAULT_PW));
  const [members, setMembers] = useState<Member[]>(() => safeStorage.get(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS));
  const [tasks, setTasks] = useState<Task[]>(() => safeStorage.get(STORAGE_KEYS.TASKS, INITIAL_TASKS));

  const [saveStatus, setSaveStatus] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberSettings, setShowMemberSettings] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetMemberId, setDropTargetMemberId] = useState<string | null | 'POOL' | 'DELETE'>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);

  // 저장 함수 일원화
  const commitTasks = useCallback((newTasks: Task[]) => {
    setTasks([...newTasks]);
    safeStorage.set(STORAGE_KEYS.TASKS, newTasks);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 1000);
  }, []);

  const commitMembers = useCallback((newMembers: Member[]) => {
    setMembers([...newMembers]);
    safeStorage.set(STORAGE_KEYS.MEMBERS, newMembers);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 1000);
  }, []);

  useEffect(() => {
    setHasAiKey(getAiKey().length > 10);
  }, [showMemberSettings]);

  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'DONE');
    return {
      activeCount: active.length,
      emergencyCount: active.filter(t => t.priority === 'EMERGENCY').length
    };
  }, [tasks]);

  const handleToggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      safeStorage.set(STORAGE_KEYS.ADMIN_SESSION, false);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = (password: string) => {
    if (password === adminPassword) {
      setIsAdmin(true);
      safeStorage.set(STORAGE_KEYS.ADMIN_SESSION, true);
      setShowLoginModal(false);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const addTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: taskData.title || '',
      pdName: taskData.pdName || '미지정',
      description: taskData.description || '',
      priority: taskData.priority || 'NORMAL',
      category: taskData.category || 'STANDARD',
      status: 'BACKLOG',
      createdAt: Date.now(),
      deadline: taskData.deadline || Date.now(),
      originalDeadline: taskData.originalDeadline || taskData.deadline || Date.now(),
      delayCount: 0,
    };
    commitTasks([newTask, ...tasks]);
  };

  const deleteTask = (taskId: string) => {
    commitTasks(tasks.filter(t => t.id !== taskId));
  };

  const completeTask = (taskId: string) => {
    commitTasks(tasks.map(t => 
      t.id === taskId ? { ...t, status: 'DONE' as TaskStatus, completedAt: Date.now() } : t
    ));
  };

  const updateTask = (taskId: string, targetMemberId: string | null) => {
    const newTasks = tasks.map(t => {
      if (t.id === taskId) {
        const isAssigning = targetMemberId !== null;
        return { 
          ...t, 
          status: isAssigning ? 'IN_PROGRESS' : 'BACKLOG', 
          assignedTo: targetMemberId || undefined,
          startedAt: (isAssigning && !t.startedAt) ? Date.now() : t.startedAt
        };
      }
      return t;
    });
    commitTasks(newTasks);
  };

  const updateTaskDeadline = (taskId: string, days: number) => {
    commitTasks(tasks.map(t => {
      if (t.id === taskId) {
        const newDeadline = t.deadline + (days * 86400000);
        return { ...t, deadline: newDeadline, delayCount: days > 0 ? t.delayCount + 1 : t.delayCount };
      }
      return t;
    }));
  };

  const onDragStart = (taskId: string) => { if (isAdmin) setDraggedTaskId(taskId); };
  const onDragOver = (e: React.DragEvent, target: any) => { if (isAdmin) { e.preventDefault(); setDropTargetMemberId(target); } };
  const onDrop = (e: React.DragEvent, target: any) => {
    if (!isAdmin || !draggedTaskId) return;
    e.preventDefault();
    if (target === 'DELETE') deleteTask(draggedTaskId);
    else updateTask(draggedTaskId, target === 'POOL' ? null : target);
    setDraggedTaskId(null); setDropTargetMemberId(null);
  };

  const poolTasks = tasks.filter(t => !t.assignedTo || t.status === 'BACKLOG').sort((a, b) => b.createdAt - a.createdAt);
  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="min-h-screen flex flex-col bg-[#050811] text-slate-200 select-none font-sans overflow-x-hidden">
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-[60]">
        <div className="flex flex-col">
          <h1 className="text-lg font-black italic text-white leading-none">CG FLOW</h1>
          <div className="flex items-center gap-1.5 mt-1">
             <span className={`text-[7px] font-black px-1 py-0.5 rounded transition-colors ${saveStatus ? 'bg-emerald-400 text-black' : 'bg-slate-800 text-slate-500'}`}>
               {saveStatus ? 'SYNCED' : 'READY'}
             </span>
             <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">v4.0.0-FINAL</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden xs:flex gap-4 items-center px-4 py-2 bg-white/[0.02] rounded-xl border border-white/5">
             <div className="text-center"><p className="text-xs font-black text-red-500">{stats.emergencyCount}</p><p className="text-[6px] text-slate-600 font-black uppercase">Urgent</p></div>
             <div className="text-center"><p className="text-xs font-black text-white">{stats.activeCount}</p><p className="text-[6px] text-slate-600 font-black uppercase">Tasks</p></div>
          </div>
          <button onClick={handleToggleAdmin} className={`p-2.5 rounded-xl transition-all border ${isAdmin ? 'bg-indigo-600 border-white/20' : 'bg-slate-800 border-white/5'}`}>
             {isAdmin ? 'ADM' : '🔒'}
          </button>
          {isAdmin && (
            <button onClick={() => setShowTaskForm(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase">+ 업무</button>
          )}
          <button onClick={() => setShowMemberSettings(true)} className="bg-slate-800 p-2.5 rounded-xl border border-white/5">⚙️</button>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 space-y-8 max-w-[1600px] mx-auto w-full">
        {isAdmin && (
          <section className="space-y-3">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">배정 대기 업무</h2>
            <div onDragOver={(e) => onDragOver(e, 'POOL')} onDrop={(e) => onDrop(e, 'POOL')} className={`min-h-[140px] rounded-2xl border border-dashed transition-all p-4 flex gap-4 overflow-x-auto scrollbar-hide ${dropTargetMemberId === 'POOL' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/10'}`}>
              {poolTasks.length === 0 ? <div className="w-full flex items-center justify-center text-[10px] text-slate-800 font-black italic">NO WAITING TASKS</div> : poolTasks.map(task => (<div key={task.id} className="min-w-[280px]"><TaskCard task={task} members={members} onDragStart={() => onDragStart(task.id)} onComplete={() => completeTask(task.id)} isAdmin={isAdmin} onUpdateDeadline={(days) => updateTaskDeadline(task.id, days)}/></div>))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">팀원별 워크플로우</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => {
              const memberTasks = tasks.filter(t => t.assignedTo === member.id && t.status === 'IN_PROGRESS');
              return (
                <div key={member.id} onDragOver={(e) => onDragOver(e, member.id)} onDrop={(e) => onDrop(e, member.id)} className={`flex flex-col rounded-2xl border transition-all p-4 space-y-4 ${isAdmin && dropTargetMemberId === member.id ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/5 bg-slate-900/20'}`}>
                  <div className="flex items-center gap-3">
                    <img src={member.avatar} className="w-9 h-9 rounded-xl border border-white/10" alt="" />
                    <div><h3 className="text-sm font-black text-white italic">{member.name}</h3><p className="text-[8px] text-slate-500 font-black uppercase">진행 중: {memberTasks.length}건</p></div>
                  </div>
                  <div className="space-y-3">
                    {memberTasks.map(task => (<TaskCard key={task.id} task={task} members={members} onDragStart={() => onDragStart(task.id)} onComplete={() => completeTask(task.id)} isAdmin={isAdmin} onUpdateDeadline={(days) => updateTaskDeadline(task.id, days)}/>))}
                    {memberTasks.length === 0 && <div className="h-20 border border-dashed border-white/5 rounded-xl flex items-center justify-center text-[9px] text-slate-800 font-black">WAITING</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {showLoginModal && <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />}
      {showTaskForm && <TaskForm onAdd={addTask} onClose={() => setShowTaskForm(false)} />}
      {showMemberSettings && <MemberSettings members={members} onAdd={(name) => commitMembers([...members, { id: Math.random().toString(36).substr(2,9), name, role: 'MEMBER', avatar: `https://picsum.photos/seed/${name}/100/100` }])} onUpdate={(id, name) => commitMembers(members.map(m => m.id === id ? { ...m, name } : m))} onDelete={(id) => commitMembers(members.filter(m => m.id !== id))} onUpdatePassword={(pw) => safeStorage.set(STORAGE_KEYS.ADMIN_PW, pw)} onClose={() => setShowMemberSettings(false)} />}
      {selectedMember && <MemberCalendar member={selectedMember} tasks={tasks.filter(t => t.assignedTo === selectedMember.id)} onClose={() => setSelectedMemberId(null)} />}
    </div>
  );
};

export default App;
