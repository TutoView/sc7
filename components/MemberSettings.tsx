
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
  const [showBackup, setShowBackup] = useState(false);
  const [backupString, setBackupString] = useState('');
  const [importString, setImportString] = useState('');

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
    if (confirm('모든 데이터가 초기화됩니다. 이 작업은 되돌릴 수 없습니다.')) {
      safeStorage.clearAll();
    }
  };

  const handleGenerateBackup = () => {
    const b64 = safeStorage.exportData();
    setBackupString(b64);
    alert('백업 코드가 생성되었습니다. 아래 텍스트를 복사해 안전한 곳에 저장하세요.');
  };

  const handleImport = () => {
    if (!importString.trim()) return;
    if (confirm('현재 데이터가 백업 데이터로 대체됩니다. 진행하시겠습니까?')) {
      const success = safeStorage.importData(importString.trim());
      if (success) {
        alert('데이터 복구 성공! 페이지를 새로고침합니다.');
        window.location.reload();
      } else {
        alert('올바르지 않은 백업 코드입니다.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4">
      <div className="bg-slate-900 rounded-[2rem] w-full max-w-md border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black italic text-white flex items-center gap-2">
              <span className="w-2 h-5 bg-indigo-500 rounded-full"></span>
              SETTINGS
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white">✕</button>
          </div>

          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            
            <section className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
              <h3 className="text-[9px] font-black text-amber-500 uppercase mb-3">AI Engine</h3>
              <form onSubmit={handleAiKeySave} className="flex gap-2">
                <input
                  type="password"
                  className="flex-1 bg-slate-950 border border-white/5 rounded-xl px-3 py-2.5 outline-none text-white text-xs"
                  placeholder="Gemini API Key"
                  value={aiKey}
                  onChange={e => setAiKey(e.target.value)}
                />
                <button type="submit" className="bg-amber-600 px-3 rounded-xl font-black text-[10px] text-white">SAVE</button>
              </form>
            </section>

            <section className="space-y-4">
              <form onSubmit={handleAdd} className="flex gap-2">
                <input type="text" className="flex-1 bg-slate-800/30 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs" placeholder="New Team Member Name" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} />
                <button type="submit" className="bg-emerald-600 text-white px-4 rounded-xl font-black text-[10px]">ADD</button>
              </form>

              <div className="grid grid-cols-1 gap-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                    <img src={member.avatar} className="w-7 h-7 rounded-lg" alt="" />
                    <div className="flex-1">
                      {editingId === member.id ? (
                        <input autoFocus className="bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white w-full" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={saveEdit} onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                      ) : (
                        <p className="text-xs font-black text-white italic">{member.name}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(member)} className="p-1 text-slate-500">✎</button>
                      {member.role !== 'LEAD' && <button onClick={() => onDelete(member.id)} className="p-1 text-slate-500 hover:text-red-500">✕</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="pt-4 border-t border-white/5 space-y-3">
              <button onClick={() => setShowBackup(!showBackup)} className="text-[9px] font-black text-slate-500 uppercase w-full text-left">
                Data Management (Backup/Restore) {showBackup ? '▲' : '▼'}
              </button>
              
              {showBackup && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <button onClick={handleGenerateBackup} className="w-full py-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-500/20">백업 코드 생성</button>
                    {backupString && <textarea readOnly className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2 text-[8px] text-slate-400 font-mono break-all" value={backupString} onClick={(e) => (e.target as any).select()} />}
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <textarea className="w-full h-20 bg-black/40 border border-white/10 rounded-lg p-2 text-[8px] text-white font-mono" placeholder="여기에 백업 코드를 붙여넣으세요" value={importString} onChange={e => setImportString(e.target.value)} />
                    <button onClick={handleImport} className="w-full py-2 bg-emerald-600/20 text-emerald-400 rounded-lg text-[10px] font-black border border-emerald-500/20">데이터 복구 적용</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button onClick={() => setShowPwChange(!showPwChange)} className="text-[9px] font-black text-slate-500 uppercase text-left">Change Password</button>
                {showPwChange && (
                  <form onSubmit={handlePwChangeSubmit} className="flex gap-2">
                    <input type="password" className="flex-1 bg-slate-800/30 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs" placeholder="New Password" value={newPw} onChange={e => setNewPw(e.target.value)} />
                    <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl font-black text-[10px]">SET</button>
                  </form>
                )}
                <button onClick={handleReset} className="w-full py-3 bg-red-950/20 border border-red-900/40 text-red-500 rounded-xl font-black text-[9px] uppercase tracking-widest mt-2">
                  Hard Reset (Delete All)
                </button>
              </div>
            </section>
          </div>

          <button onClick={onClose} className="w-full mt-6 py-4 bg-slate-800 text-slate-400 rounded-xl font-black text-[11px]">CLOSE</button>
        </div>
      </div>
    </div>
  );
};
