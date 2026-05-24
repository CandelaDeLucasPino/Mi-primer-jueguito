import { useEffect, useState } from 'react';
import { getPlayerStatsHistory, getPlayerProfile } from '../lib/supabase';
import { PlayerProfile, LevelProgress } from '../types';
import { AVATAR_OPTIONS } from './AvatarSelector';
import { Trophy, Coins, Clock, Skull, Medal, RefreshCw, Calendar, Sparkles, CheckCircle2, Circle, Target, Milestone } from 'lucide-react';

interface DashboardProps {
  playerProfile: PlayerProfile;
  onLogout: () => void;
}

export default function Dashboard({ playerProfile, onLogout }: DashboardProps) {
  const [profile, setProfile] = useState<PlayerProfile>(playerProfile);
  const [history, setHistory] = useState<LevelProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const refreshedProfile = await getPlayerProfile(playerProfile.nickname);
      if (refreshedProfile) {
        setProfile(refreshedProfile);
      }
      const list = await getPlayerStatsHistory(playerProfile.nickname);
      setHistory(list);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [playerProfile.nickname]);

  const activeAvatar = AVATAR_OPTIONS.find((a) => a.key === profile.avatar) || AVATAR_OPTIONS[0];

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Badge list logic
  const badges = [
    {
      id: 'first_play',
      name: 'Primer Salto',
      desc: 'Iniciaste sesión y jugaste tu primera partida.',
      unlocked: true,
      emoji: '👟',
    },
    {
      id: 'coin_collector',
      name: 'Buscador de Oro',
      desc: 'Has recolectado 50 monedas o más entre todas tus partidas.',
      unlocked: profile.total_coins >= 50,
      emoji: '🪙',
    },
    {
      id: 'high_scorer',
      name: 'Campeón de Puntos',
      desc: 'Lograste una puntuación superior a 3000 puntos.',
      unlocked: profile.high_score >= 3000,
      emoji: '⭐️',
    },
    {
      id: 'immortal',
      name: 'Veterano de Batalla',
      desc: 'Has completado al menos 2 niveles distintos.',
      unlocked: (profile.completed_levels || []).length >= 2,
      emoji: '🛡️',
    },
    {
      id: 'survivor',
      name: 'Resistente Térmico',
      desc: 'Has acumulado más de 5 muertes aprendiendo de los errores.',
      unlocked: profile.total_deaths >= 5,
      emoji: '💀',
    },
    {
      id: 'time_traveler',
      name: 'Velocista Olímpico',
      desc: 'Has completado un nivel en menos de 40 segundos.',
      unlocked: history.some((h) => h.time_taken < 45),
      emoji: '⏱️',
    },
  ];

  // Total possible levels
  const levels = [
    { id: 1, name: 'Diplomatura', difficulty: 'Fácil' },
    { id: 2, name: 'Posgrado', difficulty: 'Media' },
    { id: 3, name: 'Maestría', difficulty: 'Difícil' },
    { id: 4, name: 'Doctorado', difficulty: 'Doctorado' },
  ];

  return (
    <div className="bg-slate-900 border-2 border-indigo-500/20 rounded-xl p-6 shadow-2xl font-sans text-slate-100 max-w-4xl mx-auto my-6">
      {/* Profile Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-800 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg border-2 border-indigo-500 bg-slate-950 flex items-center justify-center text-4xl shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            {activeAvatar.emoji}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black font-sans tracking-tight text-white uppercase">{profile.nickname}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider text-white ${activeAvatar.accentColor}`}>
                JUEGA CON {activeAvatar.name.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Miembro de la Plataforma Retro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex-1 md:flex-none py-2 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-750 hover:border-slate-700 text-slate-300 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            Sincronizar
          </button>
          
          <button
            onClick={onLogout}
            className="flex-1 md:flex-none py-2 px-4 bg-red-950/40 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-950 hover:border-red-900 cursor-pointer transition-colors text-xs"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statistics Widgets */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-705 p-3.5 rounded text-center shadow-inner">
              <Trophy className="w-5 h-5 mx-auto text-indigo-400 mb-2" />
              <p className="text-xs text-slate-400 uppercase font-sans tracking-wider font-semibold">Puntaje Máximo</p>
              <p className="text-xl font-bold text-indigo-400 font-mono mt-1">{profile.high_score}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-755 p-3.5 rounded text-center shadow-inner">
              <Coins className="w-5 h-5 mx-auto text-indigo-400 mb-2" />
              <p className="text-xs text-slate-400 uppercase font-sans tracking-wider font-semibold">Monedas Acum.</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">{profile.total_coins}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-755 p-3.5 rounded text-center shadow-inner">
              <Clock className="w-5 h-5 mx-auto text-indigo-300 mb-2" />
              <p className="text-xs text-slate-400 uppercase font-sans tracking-wider font-semibold">Tiempo Jugado</p>
              <p className="text-xl font-bold text-slate-200 font-mono mt-1">{formatTime(profile.total_time)}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-755 p-3.5 rounded text-center shadow-inner">
              <Skull className="w-5 h-5 mx-auto text-rose-500 mb-2" />
              <p className="text-xs text-slate-400 uppercase font-sans tracking-wider font-semibold">Muertes Totales</p>
              <p className="text-xl font-bold text-rose-450 font-mono mt-1">{profile.total_deaths}</p>
            </div>
          </div>

          {/* Level Progress Map */}
          <div className="bg-slate-950/20 border border-slate-850 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5 font-mono uppercase tracking-wide">
              <Milestone className="w-4 h-4 text-emerald-400" /> Mapa de Niveles y Sincronización
            </h3>
            
            <div className="space-y-4">
              {levels.map((lvl) => {
                const isCompleted = profile.completed_levels.includes(lvl.id);
                const progressRecord = history.find((h) => h.level_id === lvl.id);

                return (
                  <div
                    key={lvl.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${
                      isCompleted
                        ? 'bg-emerald-950/10 border-emerald-500/20'
                        : 'bg-slate-950/30 border-slate-850'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white font-mono">
                            NIVEL {lvl.id}: {lvl.name}
                          </p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            lvl.difficulty === 'Fácil' ? 'bg-emerald-950 text-emerald-400' :
                            lvl.difficulty === 'Media' ? 'bg-blue-950 text-blue-400' :
                            lvl.difficulty === 'Difícil' ? 'bg-red-950 text-red-400' :
                            'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}>
                            {lvl.difficulty}
                          </span>
                        </div>
                        {progressRecord ? (
                          <p className="text-xs text-slate-400 mt-1">
                            Récord: <span className="text-indigo-400 font-mono">🔑 {progressRecord.coins_collected}</span> monedas recopiladas en <span className="text-indigo-400 font-mono">{formatTime(progressRecord.time_taken)}</span>
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500 mt-1">
                            Aún no has superado este nivel. ¡Ve por la bandera de meta!
                          </p>
                        )}
                      </div>
                    </div>

                    {!isCompleted && lvl.id > 1 && !profile.completed_levels.includes(lvl.id - 1) && (
                      <span className="text-[10px] text-slate-500 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-center font-mono uppercase self-start sm:self-auto">
                        Bloqueado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Badges Side Column */}
        <div className="space-y-6">
          <div className="bg-slate-955/40 border border-slate-850 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5 font-sans uppercase tracking-wide">
              <Medal className="w-4 h-4 text-indigo-400" /> Logros Desbloqueados
            </h3>

            <div className="space-y-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex gap-3 p-3 rounded-lg border transition-all ${
                    badge.unlocked
                      ? 'bg-indigo-950/20 border-indigo-500/20 text-slate-200'
                      : 'bg-slate-950/60 border-slate-900/60 opacity-40 grayscale text-slate-500 select-none'
                  }`}
                >
                  <span className="text-2xl filter drop-shadow">{badge.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white">{badge.name}</p>
                      {badge.unlocked && <Sparkles className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
