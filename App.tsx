
import React, { useState, useMemo, useEffect } from 'react';
import { Task, Member, TaskStatus } from './types.ts';
import { MEMBERS as INITIAL_MEMBERS, INITIAL_TASKS } from './constants.tsx';
import { TaskCard } from './components/TaskCard.tsx';
import { TaskForm } from './components/TaskForm.tsx';
import { MemberCalendar } from './components/MemberCalendar.tsx';
import { MemberSettings } from './components/MemberSettings.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { getWorkloadAdvice, getAiKey } from './services/geminiService.ts';

const TASKS_STORAGE_KEY = 'cg-flow-master-tasks-v3';
const MEMBERS_STORAGE_KEY = 'cg-flow-master-members-v3';
const ADMIN_PW_KEY = 'cg-flow-admin-password-v3';
const DEFAULT_ADMIN_PASSWORD = '1234';

const App: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_ADMIN_PASSWORD;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(MEMBERS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_MEMBERS;
      }
    }
    return INITIAL_MEMBERS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(TASKS_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_TASKS;
      }
    }
    return INITIAL_TASKS;
  });

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMemberSettings, setShowMemberSettings] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetMemberId, setDropTargetMemberId] = useState<string | null | 'POOL' | 'DELETE'>(null);
  
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [hasAiKey, setHasAiKey] = useState(false);

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(ADMIN_PW_KEY, adminPassword);
  }, [adminPassword]);

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
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLogin = (password: string) => {
    if (password === adminPassword) {
      setIsAdmin(true);
      setShowLoginModal(false);
    } else {
      alert('비밀번호가 틀렸습니다.');
    }
  };

  const handleUpdatePassword = (newPw: string) => {
    setAdminPassword(newPw);
    localStorage.setItem(ADMIN_PW_KEY, newPw);
    alert('비밀번호가 성공적으로 변경되었습니다.');
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
    setTasks(prev => [newTask, ...prev]);
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const completeTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'DONE' as TaskStatus, completedAt: Date.now() } : t
    ));
  };

  const updateTask = (taskId: string, targetMemberId: string | null) => {
    setTasks(prev => {
      const draggedTask = prev.find(t => t.id === taskId);
      if (!draggedTask) return prev;

      return prev.map(t => {
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
    });
  };

  const updateTaskDeadline = (taskId: string, days: number) => {
    setTasks(prev => prev.map(t => {
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
    setMembers(prev => [...prev, newMember]);
  };

  const handleUpdateMember = (id: string, name: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setTasks(prev => prev.map(t => t.assignedTo === id ? { ...t, assignedTo: undefined, status: 'BACKLOG' } : t));
  };

  const onDragStart = (taskId: string) => {
    if (isAdmin) setDraggedTaskId(taskId);
  };
  
  const onDragOver = (e: React.DragEvent, target: string | null | 'POOL' | 'DELETE') => {
    if (!isAdmin) return;
    e.preventDefault();
    setDropTargetMemberId(target);
  };

  const onDrop = (e: React.DragEvent, target: string | null | 'POOL' | 'DELETE') => {
    if (!isAdmin) return;
    e.preventDefault();
    if (!draggedTaskId) return;

    if (target === 'DELETE') {
      deleteTask(draggedTaskId);
    } else {
      updateTask(draggedTaskId, target === 'POOL' ? null : target);
    }
    
    setDraggedTaskId(null);
    setDropTargetMemberId(null);
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
      <header className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-[60]">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic tracking-tighter text-white">CG FLOW</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[8px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded italic">CONNECTED</span>
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">BUILD 3.0.4</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex gap-8 items-center px-8 py-2.5 bg-white/[0.02] rounded-2xl border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-red-500 leading-none">{stats.emergencyCount}</span>
              <span className="text-[8px] text-slate-500 font-black mt-1 uppercase tracking-tighter">긴급</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-amber-500 leading-none">{stats.inefficientCount}</span>
              <span className="text-[8px] text-slate-500 font-black mt-1 uppercase tracking-tighter">지연 의심</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-white leading-none">{stats.activeCount}</span>
              <span className="text-[8px] text-slate-500 font-black mt-1 uppercase tracking-tighter">전체 업무</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleAdmin}
              className={`p-3.5 rounded-2xl font-black text-[12px] transition-all active:scale-95 uppercase tracking-widest flex items-center gap-2 border ${isAdmin ? 'bg-indigo-600 text-white border-white/20 shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-800 text-slate-400 border-white/5'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="hidden sm:inline">{isAdmin ? '관리자 모드' : '로그인'}</span>
            </button>
            
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowMemberSettings(true)}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-500 p-3.5 rounded-2xl font-black text-[12px] transition-all active:scale-95 border border-amber-500/20"
                >
                  <span className="text-lg">🔑</span>
                </button>

                <button
                  onClick={() => setShowMemberSettings(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white p-3.5 rounded-2xl font-black text-[12px] transition-all active:scale-95 border border-white/5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black text-[12px] transition-all active:scale-95 uppercase tracking-widest"
                >
                  + 업무 추가
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {isAdmin && (
        <div 
          onDragOver={(e) => onDragOver(e, 'DELETE')}
          onDrop={(e) => onDrop(e, 'DELETE')}
          className={`fixed top-[88px] left-0 right-0 z-40 transition-all duration-300 flex items-center justify-center pointer-events-none ${
            draggedTaskId ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0'
          }`}
        >
          <div className={`w-full max-w-lg h-24 border-2 border-dashed rounded-b-3xl flex flex-col items-center justify-center transition-all ${
            dropTargetMemberId === 'DELETE' ? 'bg-red-600/20 border-red-500 scale-105 shadow-xl' : 'bg-red-950/20 border-red-900/40'
          }`}>
            <div className="text-3xl">🗑️</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">업무 삭제</p>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 space-y-10 max-w-[1600px] mx-auto w-full transition-all duration-500">
        {isAdmin && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-6 h-0.5 bg-indigo-500 rounded-full"></div>
              <h2 className="text-sm font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                요청 업무 풀
                <span className="text-[10px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded italic">
                  {poolTasks.length}건 대기 중
                </span>
              </h2>
            </div>

            <div 
              onDragOver={(e) => onDragOver(e, 'POOL')}
              onDrop={(e) => onDrop(e, 'POOL')}
              className={`min-h-[140px] rounded-2xl border border-dashed transition-all p-4 flex gap-4 overflow-x-auto scrollbar-hide ${
                dropTargetMemberId === 'POOL' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/10'
              }`}
            >
              {poolTasks.length === 0 ? (
                <div className="w-full flex items-center justify-center">
                  <p className="text-slate-700 font-black italic uppercase tracking-[0.2em] text-sm">대기 중인 요청이 없습니다</p>
                </div>
              ) : (
                poolTasks.map(task => (
                  <div key={task.id} className="min-w-[280px]">
                    <TaskCard 
                      task={task} 
                      members={members} 
                      onDragStart={() => onDragStart(task.id)} 
                      onComplete={() => completeTask(task.id)} 
                      isAdmin={isAdmin}
                      onUpdateDeadline={(days) => updateTaskDeadline(task.id, days)}
                    />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        <section className="space-y-6">
           <div className="flex items-center gap-3 px-2">
            <div className="w-6 h-0.5 bg-emerald-500 rounded-full"></div>
            <h2 className="text-sm font-black text-white uppercase italic tracking-wider">업무 배분 현황</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map(member => {
              const memberTasks = tasks.filter(t => t.assignedTo === member.id && t.status === 'IN_PROGRESS');
              const isOverloaded = memberTasks.length >= 3;

              return (
                <div 
                  key={member.id}
                  onDragOver={(e) => onDragOver(e, member.id)}
                  onDrop={(e) => onDrop(e, member.id)}
                  onDragLeave={() => setDropTargetMemberId(null)}
                  className={`relative flex flex-col rounded-2xl border transition-all p-4 space-y-4 ${
                    isAdmin && dropTargetMemberId === member.id 
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-lg' 
                      : 'border-white/5 bg-slate-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedMemberId(member.id)} className="relative group/avatar">
                        <img src={member.avatar} className="w-10 h-10 rounded-xl border border-white/10 group-hover:border-indigo-500 transition-all shadow-md" alt="" />
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#050811] ${isOverloaded ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                      </button>
                      <div>
                        <h3 className="text-sm font-black text-white italic tracking-tighter uppercase">{member.name}</h3>
                        <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">진행 중: {memberTasks.length}건</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    {memberTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        members={members} 
                        onDragStart={() => onDragStart(task.id)} 
                        onComplete={() => completeTask(task.id)} 
                        isAdmin={isAdmin}
                        onUpdateDeadline={(days) => updateTaskDeadline(task.id, days)}
                      />
                    ))}
                    {memberTasks.length === 0 && (
                      <div className="h-32 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-[10px] text-slate-800 font-black italic uppercase">
                        작업 대기 중
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {isAdmin && hasAiKey && (
        <div className="fixed bottom-8 right-8 z-50">
          {aiAdvice && (
            <div className="absolute bottom-20 right-0 w-[24rem] bg-white text-black rounded-2xl shadow-2xl p-6 border border-slate-200 animate-in slide-in-from-bottom-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[8px] font-black text-indigo-600 flex items-center gap-2 italic uppercase tracking-widest">
                  AI 팀장 분석 리포트
                </h4>
                <button onClick={() => setAiAdvice(null)} className="text-slate-400 hover:text-black font-bold text-lg">✕</button>
              </div>
              <p className="text-sm text-slate-950 font-bold italic leading-snug">"{aiAdvice}"</p>
            </div>
          )}
          <button
            onClick={handleAiAdvice}
            disabled={isLoadingAdvice}
            className="w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all group border border-slate-200"
          >
            {isLoadingAdvice ? <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div> : <span className="text-2xl">🤖</span>}
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
