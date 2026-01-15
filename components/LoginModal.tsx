
import React, { useState } from 'react';

interface LoginModalProps {
  onLogin: (password: string) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4">
      <div className="bg-slate-900 rounded-[2.5rem] w-full max-w-sm border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_-5px_rgba(79,70,229,0.5)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">관리자 인증</h2>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">비밀번호를 입력하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              autoFocus
              type="password"
              className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 outline-none text-white text-center font-bold text-lg tracking-[0.5em] focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg"
              >
                로그인
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
