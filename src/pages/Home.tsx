import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [roomIdInput, setRoomIdInput] = useState('');

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = roomIdInput.trim();
    if (!cleanId) return;
    
    // If user pasted a full URL or path, extract the room ID
    const match = cleanId.match(/room\/([a-zA-Z0-9_-]+)/);
    const targetId = match ? match[1] : cleanId;
    navigate(`/room/${targetId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between p-6 max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex justify-between items-center pt-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Door</h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 tracking-wide">
            Тактильная связь в реальном времени
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[var(--color-online)] shadow-[0_0_8px_var(--color-online)]" />
          <span className="text-xs text-white/70 font-mono">online</span>
        </div>
      </header>

      {/* Main Options */}
      <main className="flex flex-col gap-6 my-auto py-8">
        {/* Primary Action: Create Room */}
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => navigate('/create')}
            className="w-full h-18 bg-white rounded-2xl text-black font-semibold text-lg active:scale-98 transition-all duration-200 shadow-[0_0_35px_rgba(255,255,255,0.12)] flex items-center justify-between px-6 hover:bg-neutral-100"
          >
            <div className="text-left">
              <span className="block leading-tight">Открыть Door</span>
              <span className="text-xs font-normal text-neutral-600 block mt-0.5">Создать комнату для двоих</span>
            </div>
            <ArrowRight size={22} className="text-black/80" />
          </button>
        </div>

        {/* 0n<3 Digital Companion Card */}
        <div 
          onClick={() => navigate('/room/0n3')}
          className="relative w-full rounded-2xl p-5 cursor-pointer active:scale-98 transition-all duration-200 shadow-[0_0_25px_rgba(0,255,133,0.08)] border border-[var(--color-online)]/30 bg-gradient-to-br from-[var(--color-online)]/10 via-black/40 to-black/60 group hover:border-[var(--color-online)]/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative w-12 h-12 rounded-xl bg-[var(--color-online)]/15 flex items-center justify-center border border-[var(--color-online)]/40 shrink-0">
                <div className="w-2.5 h-2.5 bg-[var(--color-online)] rounded-full animate-ping absolute" />
                <Sparkles size={20} className="text-[var(--color-online)] relative z-10" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-wide">0n&lt;3</h2>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[var(--color-online)]/20 text-[var(--color-online)] border border-[var(--color-online)]/30">
                    AI Echo
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-0.5">Цифровой компаньон • Одиночный режим</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-[var(--color-online)] opacity-80 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Join by Code / Link */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
          <label className="text-xs text-[var(--color-text-secondary)] font-medium">
            Войти по ID или ссылке
          </label>
          <form onSubmit={handleJoinByCode} className="flex gap-2">
            <input
              type="text"
              placeholder="Введи ID комнаты..."
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors font-mono"
            />
            <button
              type="submit"
              disabled={!roomIdInput.trim()}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 disabled:opacity-30 disabled:hover:bg-white/15 text-white rounded-xl text-sm font-medium transition-all active:scale-95"
            >
              Войти
            </button>
          </form>
        </div>
      </main>

      {/* Footer minimal info */}
      <footer className="text-center pb-2">
        <p className="text-[11px] text-white/30 tracking-widest uppercase font-mono">
          Door • Pure Tactile Resonance
        </p>
      </footer>
    </div>
  );
}
