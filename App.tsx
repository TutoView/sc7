
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Task, Member, TaskStatus } from './types.ts';
import { MEMBERS as INITIAL_MEMBERS, INITIAL_TASKS } from './constants.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { TaskForm } from './components/TaskForm.tsx';
import { MemberCalendar } from './components/MemberCalendar.tsx';
import { MemberSettings } from './components/MemberSettings.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { getWorkloadAdvice, getAiKey } from './services/geminiService.ts';
import { safeStorage } from './services/storageService.ts';

// 고유 키를 사용하여 이전 버전 캐시 충돌 방지
const TASKS_KEY = 'cg_flow_tasks_stable_v1';
const MEMBERS_KEY = 'cg_flow_members_stable_v1';
const ADMIN_PW_KEY = 'cg_flow_pw_stable_v1';
const ADMIN_SESSION_KEY = 'cg_flow_admin_session_v1';
const DEFAULT_PW = '1234';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(() => safeStorage.get(ADMIN_SESSION_KEY, false));
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);
  
  const [adminPassword, setAdminPassword] = useState(() => safeStorage.get(ADMIN_PW_KEY, DEFAULT_PW));
  const [members, setMembers] = useState<Member[]>(() => safeStorage.get(MEMBERS_KEY, INITIAL_MEMBERS));
  const [tasks, setTasks] = useState<Task[]>(() => safeStorage.get(TASKS_KEY, INITIAL_TASKS));

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberSettings, setShowMemberSettings] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetMemberId, setDropTargetMemberId] = useState<string | null | 'POOL' | 'DELETE'>(null);
  
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);

  // 즉시 저장 및 상태 업데이트
  const commitTasks = useCallback((newTasks: Task[]) => {
    setTasks([...newTasks]);
    safeStorage.set(TASKS_KEY, newTasks);
    triggerSaveEffect();
  }, []);

  const commitMembers = useCallback((newMembers: Member[]) => {
    setMembers([...newMembers]);
    safeStorage.set(MEMBERS_KEY, newMembers);
    triggerSaveEffect();
  }, []);

  const triggerSaveEffect = () => {
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 1000);
  };

  useEffect(() => {
    const key = getAiKey();
    setHasAiKey(!!key && key.length > 10);
  }, [showMemberSettings]);

  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'DONE');
    const emergencyCount = active.filter(t => t.priority === 'EMERGENCY').length;
    const inefficientCount = active.filter(t => {
      if (!t.startedAt) return false;
      const hours = (Date.now() - t.startedAt) / 3600000;
      return t.category === 'SIMPLE' && hours > 12;
    }).length;
    return { activeCount: active.length, emergencyCount, inefficientCount };
  }, [tasks]);

  const handleToggleAdmin = () => {
    if (isAdmin) {
      setIsAdmin(false);
      safeStorage.set(ADMIN_SESSION_KEY, false);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = (password: string) => {
    if (password === adminPassword) {
      setIsAdmin(true);
      safeStorage.set(ADMIN_SESSION_KEY, true);
      setShowLoginModal(false);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleUpdatePassword = (newPw: string) => {
    setAdminPassword(newPw);
    safeStorage.set(ADMIN_PW_KEY, newPw);
    alert('비밀번호가 변경되었습니다.');
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

  const handleAddMember = (name: string) => {
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      role: 'MEMBER',
      avatar: `https://picsum.photos/seed/${Math.random()}/100/100`
    };
    commitMembers([...members, newMember]);
  };

  const handleUpdateMember = (id: string, name: string) => {
    commitMembers(members.map(m => m.id === id ? { ...m, name } : m));
  };

  const handleDeleteMember = (id: string) => {
    commitMembers(members.filter(m => m.id !== id));
    commitTasks(tasks.map(t => t.assignedTo === id ? { ...t, assignedTo: undefined, status: 'BACKLOG' } : t));
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

  const handleAiAdvice = async () => {
    setIsLoadingAdvice(true);
    const advice = await getWorkloadAdvice(tasks, members);
    if (advice) setAiAdvice(advice);
    setIsLoadingAdvice(false);
  };

  const poolTasks = tasks.filter(t => !t.assignedTo || t.status === 'BACKLOG').sort((a, b) => b.createdAt - a.createdAt);
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const selectedMemberAllTasks = tasks.filter(t => t.assignedTo === selectedMemberId);

  return (
    <div className="min-h-screen flex flex-col bg-[#050811] text-slate-200 select-none font-sans overflow-x-hidden">
      <header className="px-4 sm:px-8 py-5 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-[60]">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg sm:text-xl font-black italic tracking-tighter text-white">CG FLOW</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className={`text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 rounded italic transition-all duration-300 ${saveStatus ? 'bg-emerald-400 text-black' : 'bg-slate-800 text-slate-500'}`}>
                 {saveStatus ? 'DB_SYNCED' : 'CONNECTED'}
               </span>
               <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">3.2.0-STABLE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <div className="hidden xs:flex gap-3 sm:gap-6 items-center px-3 sm:px-6 py-2 bg-white/[0.02] rounded-xl border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-black text-red-500 leading-none">{stats.emergencyCount}</span>
              <span className="text-[6px] sm:text-[7px] text-slate-600 font-black mt-1 uppercase">긴급</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-black text-white leading-none">{stats.activeCount}</span>
              <span className="text-[6px] sm:text-[7px] text-slate-600 font-black mt-1 uppercase">전체</span>
            </div>
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <button onClick={handleToggleAdmin} className={`p-2.5 sm:p-3 rounded-xl font-black text-[10px] sm:text-[11px] transition-all active:scale-90 border ${isAdmin ? 'bg-indigo-600 text-white border-white/20' : 'bg-slate-800 text-slate-400 border-white/5'}`}>
               {isAdmin ? 'ADM' : '🔒'}
            </button>
            {isAdmin && (
              <button onClick={() => setShowTaskForm(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black text-[10px] sm:text-[11px] transition-all active:scale-90 uppercase">
                + 업무
              </button>
            )}
            <button onClick={() => setShowMemberSettings(true)} className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 sm:p-3 rounded-xl transition-all active:scale-90 border border-white/5">
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {isAdmin && (
        <div onDragOver={(e) => onDragOver(e, 'DELETE')} onDrop={(e) => onDrop(e, 'DELETE')} className={`fixed top-[88px] left-0 right-0 z-40 transition-all duration-300 flex items-center justify-center pointer-events-none ${draggedTaskId ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0'}`}>
          <div className={`w-full max-w-lg h-20 border-2 border-dashed rounded-b-3xl flex flex-col items-center justify-center transition-all ${dropTargetMemberId === 'DELETE' ? 'bg-red-600/20 border-red-500 scale-105' : 'bg-red-950/20 border-red-900/40'}`}>
            <span className="text-xl">🗑️</span>
            <p className="text-[9px] font-black uppercase text-red-500">삭제 영역</p>
          </div>
        </div>
      )}

      <main className="flex-1 p-4 sm:p-6 space-y-8 max-w-[1600px] mx-auto w-full">
        {isAdmin && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <div className="w-4 h-0.5 bg-indigo-500 rounded-full"></div>
              <h2 className="text-xs font-black text-slate-400 uppercase italic tracking-wider">배정 대기</h2>
            </div>
            <div onDragOver={(e) => onDragOver(e, 'POOL')} onDrop={(e) => onDrop(e, 'POOL')} className={`min-h-[140px] rounded-2xl border border-dashed transition-all p-4 flex gap-4 overflow-x-auto scrollbar-hide ${dropTargetMemberId === 'POOL' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/10'}`}>
              {poolTasks.length === 0 ? <div className="w-full flex items-center justify-center"><p className="text-slate-800 font-black italic uppercase text-[11px]">No Waiting Tasks</p></div> : poolTasks.map(task => (<div key={task.id} className="min-w-[260px] sm:min-w-[280px]"><TaskCard task={task} members={members} onDragStart={() => onDragStart(task.id)} onComplete={() => completeTask(task.id)} isAdmin={isAdmin} onUpdateDeadline={(days) => updateTaskDeadline(task.id, days)}/></div>))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2"><div className="w-4 h-0.5 bg-emerald-500 rounded-full"></div><h2 className="text-xs font-black text-slate-400 uppercase italic tracking-wider">팀원별 진행 상황</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {members.map(member => {
              const memberTasks = tasks.filter(t => t.assignedTo === member.id && t.status === 'IN_PROGRESS');
              const isOverloaded = memberTasks.length >= 3;
              return (
                <div key={member.id} onDragOver={(e) => onDragOver(e, member.id)} onDrop={(e) => onDrop(e, member.id)} className={`relative flex flex-col rounded-2xl border transition-all p-4 space-y-4 ${isAdmin && dropTargetMemberId === member.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-slate-900/20'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedMemberId(member.id)} className="relative group/avatar">
                        <img src={member.avatar} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/10" alt="" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#050811] ${isOverloaded ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      </button>
                      <div><h3 className="text-sm font-black text-white italic tracking-tighter">{member.name}</h3><p className="text-[8px] text-slate-500 font-black uppercase">Active: {memberTasks.length}</p></div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    {memberTasks.map(task => (<TaskCard key={task.id} task={task} members={members} onDragStart={() => onDragStart(task.id)} onComplete={() => completeTask(task.id)} isAdmin={isAdmin} onUpdateDeadline={(days) => updateTaskDeadline(task.id, days)}/>))}
                    {memberTasks.length === 0 && <div className="h-20 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-[9px] text-slate-800 font-black italic uppercase">Waiting</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {isAdmin && hasAiKey && (
        <div className="fixed bottom-6 right-6 z-50">
          {aiAdvice && (
            <div className="absolute bottom-16 right-0 w-[18rem] sm:w-[22rem] bg-white text-black rounded-xl shadow-2xl p-5 border border-slate-200 animate-in slide-in-from-bottom-5">
              <div className="flex items-center justify-between mb-3"><h4 className="text-[8px] font-black text-indigo-600 italic uppercase">AI Analyst</h4><button onClick={() => setAiAdvice(null)} className="text-slate-400 font-bold">✕</button></div>
              <p className="text-xs sm:text-sm text-slate-950 font-bold italic leading-relaxed">"{aiAdvice}"</p>
            </div>
          )}
          <button onClick={handleAiAdvice} disabled={isLoadingAdvice} className="w-12 h-12 sm:w-14 sm:h-14 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border border-slate-200">
            {isLoadingAdvice ? <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div> : <span className="text-xl">🤖</span>}
          </button>
        </div>
      )}

      {showLoginModal && <LoginModal onLogin={handleLogin} onClose={() => setShowLoginModal(false)} />}
      {showTaskForm && <TaskForm onAdd={addTask} onClose={() => setShowTaskForm(false)} />}
      {showMemberSettings && <MemberSettings members={members} onAdd={handleAddMember} onUpdate={handleUpdateMember} onDelete={handleDeleteMember} onUpdatePassword={handleUpdatePassword} onClose={() => setShowMemberSettings(false)} />}
      {selectedMember && <MemberCalendar member={selectedMember} tasks={selectedMemberAllTasks} onClose={() => setSelectedMemberId(null)} />}
    </div>
  );
};

export default App;
