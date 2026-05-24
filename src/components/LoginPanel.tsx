import React, { useState } from 'react';
import AvatarSelector from './AvatarSelector';
import { authenticatePlayer } from '../lib/supabase';
import { PlayerProfile, SupabaseConfig } from '../types';
import { Gamepad2, Play, Database, Cloud, AlertCircle, Heart } from 'lucide-react';

interface LoginPanelProps {
  supabaseConfig: SupabaseConfig;
  onLoginSuccess: (profile: PlayerProfile) => void;
  openConfigPanel: () => void;
}

export default function LoginPanel({ supabaseConfig, onLoginSuccess, openConfigPanel }: LoginPanelProps) {
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('mario');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim().toLowerCase();
    
    if (!cleanNick) {
      setErrorMsg('Por favor ingresa un apodo para jugar.');
      return;
    }

    if (cleanNick.length < 3) {
      setErrorMsg('El apodo debe tener al menos 3 caracteres.');
      return;
    }

    if (cleanNick.length > 15) {
      setErrorMsg('El apodo debe tener un máximo de 15 caracteres.');
      return;
    }

    // Regexp check: allow lowercases, numbers, hyphens, underscores
    if (!/^[a-z0-9-_]+$/.test(cleanNick)) {
      setErrorMsg('Usa solo letras minúsculas, números, guiones (-) o guiones bajos (_).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const profile = await authenticatePlayer(cleanNick, selectedAvatar);
      onLoginSuccess(profile);
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err.message || 'Error al autenticar o guardar perfil localmente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-slate-900 border-2 border-indigo-500/20 p-8 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.6)] font-sans text-slate-100">
      <div className="text-center space-y-2 mb-8 select-none">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-lg text-white animate-bounce shadow-[0_0_20px_rgba(79,70,229,0.5)] mb-2">
          <Gamepad2 className="w-8 h-8 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-200 bg-clip-text text-transparent">
          SUPER ODYSSEY CLOUD
        </h1>
        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-indigo-400 font-bold">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          PROGRESO EN TIEMPO REAL & CLASIFICACIONES DE JUEGO
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
            Introduce tu Nickname
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={15}
              placeholder="ej. super_playerX"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.toLowerCase().replace(/\s/g, ''))}
              className="w-full bg-slate-950/80 border-2 border-slate-800 focus:border-indigo-500 text-slate-100 placeholder-slate-600 rounded-lg px-4 py-3 text-sm font-semibold tracking-wide font-mono focus:outline-none focus:shadow-[0_0_15px_rgba(79,70,229,0.2)] transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
            Solo caracteres alfanuméricos, guiones (-) o guiones bajos (_).
          </p>
        </div>

        <AvatarSelector selectedKey={selectedAvatar} onSelect={setSelectedAvatar} />

        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-950/40 border border-red-500/20 p-3.5 rounded-lg text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 " />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full relative cursor-pointer group bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 px-6 rounded-lg transition-all duration-305 transform active:scale-98 shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-white text-white transition-transform group-hover:scale-120" />
          <span>{loading ? 'INGRESANDO...' : 'COMENZAR LA ODISEA'}</span>
        </button>
      </form>

      {/* Database sync pill */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {supabaseConfig.url ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <Cloud className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold font-mono">SUPABASE ONLINE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-indigo-400">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold font-mono font-sans">LOCAL FALLBACK MODE</span>
          </div>
        )}

        <button
          onClick={openConfigPanel}
          className="text-[11px] text-slate-400 hover:text-indigo-400 underline cursor-pointer font-medium transition-colors"
        >
          {supabaseConfig.url ? 'Ver credenciales en la nube' : 'Conectar mi propia base de datos Supabase'}
        </button>
      </div>
    </div>
  );
}
