
import React, { useState, useEffect } from 'react';
import { Member } from '../types.ts';
import { getAiKey, saveAiKey } from '../services/geminiService.ts';
import { safeStorage } from '../services/storageService.ts';

interface MemberSettingsProps {
  members: Member[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onUpdatePassword: (newPw: string) => void;
  onClose: () => void;
}

export const MemberSettings: React.FC<MemberSettingsProps> = ({ members, onAdd, onUpdate, onDelete, onUpdatePassword, onClose }) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  
  const [newPw, setNewPw] = useState('');
  const [showPwChange, setShowPwChange] = useState(false);

  const [aiKey, setAiKey] = useState('');

  useEffect(() => {
    setAiKey(getAiKey());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    onAdd(newMemberName.trim());
    setNewMemberName('');
  };

  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditValue(member.name);
  };

  const saveEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdate(editingId, editValue.trim());
      setEditingId(null);
    }
  };

  const handlePwChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPw.trim()) return;
    onUpdatePassword(newPw.trim());
    setNewPw('');
    setShowPwChange(false);
  };

  const handleAiKeySave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAiKey(aiKey.trim());
    alert('AI API 키가 저장되었습니다.');
  };

  const handleReset = () => {
    if (confirm('모든 데이터(업무, 팀원)가 초기화되고 첫 화면으로 돌아갑니다. 진행하시겠습니까?')) {
      safeStorage.clearAll();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
      <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-md border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black italic text-white flex items-center gap-3">
              <span className="w-2.5 h-6 bg-indigo-500 rounded-full"></span>
              시스템 설정
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            
            <section className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">AI 분석 엔진</h3>
              <form onSubmit={handleAiKeySave} className="space-y-3">
                <input
                  type="password"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none text-white font-bold text-xs focus:ring-1 focus:ring-amber-500"
                  placeholder="Gemini API Key..."
                  value={aiKey}
                  onChange={e => setAiKey(e.target.value)}
                />
                <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-black text-xs transition-all active:scale-95">키 저장</button>
              </form>
            </section>

            <section className="space-y-4">
              <form onSubmit={handleAdd}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">팀원 추가</label>
                <div className="flex gap-2">
                  <input type="text" className="flex-1 bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 outline-none text-white font-bold text-sm" placeholder="이름" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                  <button type="submit" className="bg-emerald-600 text-white px-4 rounded-xl font-black text-xs">추가</button>
                </div>
              </form>

              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <img src={member.avatar} className="w-8 h-8 rounded-lg" alt="" />
                    <div className="flex-1">
                      {editingId === member.id ? (
                        <input autoFocus className="bg-slate-800 border border-indigo-500 rounded px-2 py-1 text-xs text-white" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} />
                      ) : (
                        <p className="text-xs font-black text-white italic">{member.name}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(member)} className="p-1 text-slate-500 hover:text-white">✎</button>
                      {member.role !== 'LEAD' && <button onClick={() => onDelete(member.id)} className="p-1 text-slate-500 hover:text-red-500">✕</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-4 border-t border-white/5 space-y-4">
               <button onClick={() => setShowPwChange(!showPwChange)} className="text-[10px] font-black text-slate-500 uppercase">
                비밀번호 변경 {showPwChange ? '▲' : '▼'}
              </button>
              {showPwChange && (
                <form onSubmit={handlePwChangeSubmit} className="flex gap-2">
                  <input type="password" className="flex-1 bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 outline-none text-white font-bold text-sm" placeholder="새 PW" value={newPw} onChange={e => setNewPw(e.target.value)} />
                  <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl font-black text-xs">변경</button>
                </form>
              )}
              
              <div className="pt-4">
                <button onClick={handleReset} className="w-full py-3 bg-red-950/20 border border-red-900/40 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-900/20 transition-all">
                  ⚠️ 모든 데이터 초기화 (Reset)
                </button>
              </div>
            </section>
          </div>

          <button onClick={onClose} className="w-full mt-8 py-4 bg-slate-800 text-slate-400 rounded-2xl font-black text-xs">닫기</button>
        </div>
      </div>
    </div>
  );
};
