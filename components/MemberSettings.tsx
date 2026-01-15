
import React, { useState, useEffect } from 'react';
import { Member } from '../types.ts';
import { getAiKey, saveAiKey } from '../services/geminiService.ts';

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
    alert('AI 분석용 API 키가 성공적으로 저장되었습니다. 이제 업무 효율 분석 기능을 사용하실 수 있습니다.');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
      <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-md border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black italic text-white flex items-center gap-3">
              <span className="w-2.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></span>
              시스템 관리
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            
            <section className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">AI 분석 엔진 활성화</h3>
              </div>
              
              <form onSubmit={handleAiKeySave} className="space-y-4">
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed">
                  Google AI Studio에서 발급받은 Gemini API 키를 입력하세요. 키가 있어야 우측 하단 분석 버튼이 활성화됩니다.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="password"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 outline-none text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 transition-all"
                    placeholder="AI_KEY_..."
                    value={aiKey}
                    onChange={e => setAiKey(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg"
                  >
                    키 저장 및 활성화
                  </button>
                </div>
              </form>
            </section>

            <section className="pt-2">
              <form onSubmit={handleAdd} className="mb-6">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">팀원 추가</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 outline-none text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="이름 입력"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl font-black text-xs transition-all active:scale-95 shadow-md"
                  >
                    추가
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">팀원 목록</label>
                {members.map(member => (
                  <div key={member.id} className="group flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all">
                    <img src={member.avatar} className="w-8 h-8 rounded-lg shadow-sm" alt="" />
                    
                    {editingId === member.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          autoFocus
                          type="text"
                          className="flex-1 bg-slate-800 border border-emerald-500/50 rounded-lg px-2 py-1 text-xs text-white font-bold outline-none"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit()}
                          onBlur={saveEdit}
                        />
                      </div>
                    ) : (
                      <div className="flex-1">
                        <p className="text-xs font-black text-white italic">{member.name}</p>
                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">{member.role === 'LEAD' ? '관리자' : '멤버'}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(member)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {member.role !== 'LEAD' && (
                        <button onClick={() => onDelete(member.id)} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-6 border-t border-white/5">
              <button 
                onClick={() => setShowPwChange(!showPwChange)}
                className="text-[10px] font-black text-slate-400 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <span>🔑 관리자 비밀번호 변경</span>
                <svg className={`w-3 h-3 transition-transform ${showPwChange ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showPwChange && (
                <form onSubmit={handlePwChangeSubmit} className="mt-4 animate-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      className="flex-1 bg-slate-800/30 border border-white/5 rounded-xl px-4 py-3 outline-none text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="새 비밀번호"
                      value={newPw}
                      onChange={e => setNewPw(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded-xl font-black text-xs transition-all active:scale-95 shadow-md"
                    >
                      변경
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl font-black text-xs transition-colors"
          >
            설정 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
