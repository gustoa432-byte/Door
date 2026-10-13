import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Copy, Check, ArrowRight, Share2 } from 'lucide-react';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateRoomId = () => {
    // Generate clean 6-character room ID (e.g. D7K9M2)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const handleCreate = () => {
    const id = generateRoomId();
    setCreatedRoomId(id);
  };

  const getRoomUrl = () => {
    if (!createdRoomId) return '';
    return `${window.location.origin}/room/${createdRoomId}`;
  };

  const handleCopy = () => {
    const url = getRoomUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdRoomId) {
    const roomUrl = getRoomUrl();

    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between p-6 max-w-md mx-auto">
        <header className="pt-4 flex items-center justify-between">
          <button 
            onClick={() => setCreatedRoomId(null)} 
            className="p-2 -ml-2 text-white/80 hover:text-white"
          >
            <ChevronLeft size={28} />
          </button>
          <span className="text-xs font-mono uppercase tracking-widest text-white/40">Комната готова</span>
          <div className="w-8" />
        </header>

        <main className="my-auto flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Share2 size={28} className="text-white/90" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">
              {roomName.trim() ? roomName : 'Комната для двоих'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Отправь ссылку или код партнёру для синхронизации
            </p>
          </div>

          {/* Room ID Badge */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full flex flex-col items-center gap-2">
            <span className="text-xs text-white/50 uppercase font-mono tracking-wider">Код комнаты</span>
            <span className="text-3xl font-mono font-bold tracking-[0.2em] text-[var(--color-online)]">
              {createdRoomId}
            </span>
            <p className="text-xs text-white/40 font-mono break-all px-2 mt-1">
              {roomUrl}
            </p>
          </div>

          {/* Copy Button */}
          <button 
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 py-3.5 rounded-xl active:scale-98 transition-all text-sm font-medium text-white"
          >
            {copied ? (
              <>
                <Check size={18} className="text-[var(--color-online)]" />
                <span className="text-[var(--color-online)]">Ссылка скопирована!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span>Скопировать ссылку</span>
              </>
            )}
          </button>
        </main>

        <footer className="pb-6">
          <button 
            onClick={() => navigate(`/room/${createdRoomId}`)}
            className="w-full h-16 bg-white rounded-2xl text-black font-semibold text-lg active:scale-98 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 hover:bg-neutral-100"
          >
            <span>Войти в комнату</span>
            <ArrowRight size={20} />
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col justify-between p-6 max-w-md mx-auto">
      <header className="pt-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white">
          <ChevronLeft size={28} />
        </button>
        <span className="text-xs font-mono uppercase tracking-widest text-white/40">Новая комната</span>
        <div className="w-8" />
      </header>

      <main className="my-auto flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Создать пространство</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Приватная комната реального времени без таймеров и ограничений.
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
          <label className="text-xs text-white/60 font-medium">Название комнаты (опционально)</label>
          <input
            type="text"
            placeholder="Например: Уютный вечер"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors"
            maxLength={30}
          />
        </div>
      </main>

      <footer className="pb-6">
        <button 
          onClick={handleCreate}
          className="w-full h-16 bg-white rounded-2xl text-black font-semibold text-lg active:scale-98 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-neutral-100 flex items-center justify-center gap-2"
        >
          <span>Создать комнату</span>
          <ArrowRight size={20} />
        </button>
      </footer>
    </div>
  );
}
