
import React, { useState } from 'react';
import { Priority, Task, TaskCategory } from '../types.ts';

interface TaskFormProps {
  onAdd: (task: Partial<Task>) => void;
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    pdName: '',
    description: '',
    priority: 'NORMAL' as Priority,
    category: 'STANDARD' as TaskCategory,
    deadline: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) return;

    onAdd({
      title: formData.title,
      pdName: formData.pdName,
      description: formData.description,
      priority: formData.priority,
      category: formData.category,
      deadline: new Date(formData.deadline).getTime(),
      originalDeadline: new Date(formData.deadline).getTime(),
      delayCount: 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10">
          <h2 className="text-2xl font-black mb-8 flex items-center gap-3 italic text-white">
            <span className="w-3 h-8 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.4)]"></span>
            CG 작업 요청 등록
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">작업명</label>
              <input
                autoFocus
                type="text"
                required
                className="w-full bg-slate-800/30 border border-white/5 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="작업 제목을 입력하세요"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">요청 PD</label>
                <input
                  type="text"
                  className="w-full bg-slate-800/30 border border-white/5 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all"
                  value={formData.pdName}
                  onChange={e => setFormData({ ...formData, pdName: e.target.value })}
                  placeholder="PD 성함"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">마감 기한</label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-800/30 border border-white/5 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-white font-bold transition-all"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">작업 난이도</label>
              <div className="flex gap-3">
                {(['SIMPLE', 'STANDARD', 'COMPLEX'] as TaskCategory[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: c })}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${
                      formData.category === c 
                        ? 'bg-white text-slate-900 shadow-lg scale-[1.02]' 
                        : 'bg-slate-800 text-slate-500 hover:text-white'
                    }`}
                  >
                    {c === 'SIMPLE' ? '⚡ 단순수정' : c === 'COMPLEX' ? '💎 대형제작' : '🧱 일반'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">우선순위</label>
              <div className="flex gap-3">
                {(['NORMAL', 'HIGH', 'EMERGENCY'] as Priority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p })}
                    className={`flex-1 py-3 rounded-xl text-[11px] font-black transition-all ${
                      formData.priority === p 
                        ? p === 'EMERGENCY' ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-indigo-600 text-white shadow-lg' 
                        : 'bg-slate-800 text-slate-500 hover:text-white'
                    }`}
                  >
                    {p === 'EMERGENCY' ? '🚨 긴급' : p === 'HIGH' ? '높음' : '보통'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-black text-xs transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-4 bg-white text-slate-900 hover:bg-slate-200 rounded-2xl font-black text-xs transition-colors shadow-xl"
              >
                업무 등록
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
