import { useEffect, useState } from 'react';
import { getLeaderboard } from '../lib/supabase';
import { LeaderboardEntry } from '../types';
import { AVATAR_OPTIONS } from './AvatarSelector';
import { Trophy, RefreshCw, Star, Coins, Clock, Skull, Medal, Search, Sparkles } from 'lucide-react';

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard();
      setEntries(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format time (seconds to MM:SS)
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAvatarEmoji = (key: string) => {
    return AVATAR_OPTIONS.find((a) => a.key === key)?.emoji || '👤';
  };

  const handleSearchChange = (val: string) => {
    setSearch(val.toLowerCase().trim());
  };

  const filteredEntries = entries.filter((e) =>
    e.nickname.toLowerCase().includes(search)
  );

  return (
    <div className="bg-slate-900 border-2 border-indigo-500/20 rounded-xl p-6 shadow-2xl font-sans text-slate-100 max-w-4xl mx-auto my-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5 mb-5 select-none font-sans">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 animate-pulse">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black bg-gradient-to-r from-white via-indigo-100 to-indigo-350 bg-clip-text text-transparent uppercase flex items-center gap-1.5">
              Marcador Arcade Global <Sparkles className="w-4 h-4 text-indigo-400" />
            </h2>
            <p className="text-xs text-slate-400">
              Puntuaciones máximas y estadísticas de juego en tiempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Refresh button */}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-750 hover:border-indigo-500/30 text-slate-300 rounded-lg cursor-pointer transition-colors flex items-center justify-center disabled:opacity-50"
            title="Sincronizar Marcador"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Search box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Cargando clasificaciones...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-dashed border-slate-850 rounded-xl select-none">
          <Medal className="w-10 h-10 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-semibold">No se encontraron clasificaciones</p>
          <p className="text-xs mt-1">Registra tu puntuación en el juego para figurar en la tabla.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TOP 3 Podium Grid (Visual Highlights) */}
          {search === '' && filteredEntries.length >= 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-2">
              {/* 2nd Place */}
              {filteredEntries[1] && (
                <div className="order-2 sm:order-1 bg-slate-950/40 border border-indigo-505/10 rounded-xl p-4 text-center text-slate-300 relative overflow-hidden sm:h-40 flex flex-col justify-center">
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-0.5 bg-slate-800 rounded-md text-[9px] font-bold text-slate-400">
                    <Medal className="w-3 h-3 text-slate-400" /> #2 SILBER
                  </div>
                  <div className="text-4xl filter drop-shadow mb-1">
                    {getAvatarEmoji(filteredEntries[1].avatar)}
                  </div>
                  <p className="text-sm font-bold text-white uppercase truncate">{filteredEntries[1].nickname}</p>
                  <p className="text-lg font-black text-indigo-400 font-mono mt-1 flex items-center justify-center gap-1.5">
                    <Star className="w-4 h-4 fill-indigo-400 inline text-border text-indigo-400" /> {filteredEntries[1].high_score}
                  </p>
                  <div className="flex justify-center gap-3 text-[10px] text-slate-500 font-mono mt-2 pt-1.5 border-t border-slate-900">
                    <span className="flex items-center gap-0.5"><Coins className="w-3 h-3" /> {filteredEntries[1].total_coins}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {formatTime(filteredEntries[1].total_time)}</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {filteredEntries[0] && (
                <div className="order-1 sm:order-2 bg-slate-950/60 border-2 border-indigo-500 rounded-xl p-5 text-center text-indigo-400 relative overflow-hidden sm:h-48 shadow-[0_0_20px_rgba(79,70,229,0.2)] flex flex-col justify-center">
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 px-2 py-0.5 bg-indigo-600 text-white rounded-md text-[9px] font-extrabold tracking-wider">
                    👑 #1 ORO
                  </div>
                  <div className="text-5xl filter drop-shadow mb-1.5 animate-bounce">
                    {getAvatarEmoji(filteredEntries[0].avatar)}
                  </div>
                  <p className="text-base font-extrabold text-white uppercase leading-none truncate">{filteredEntries[0].nickname}</p>
                  <p className="text-2xl font-black text-indigo-400 font-mono mt-1.5 flex items-center justify-center gap-1.5">
                    <Star className="w-5 h-5 fill-indigo-400 text-indigo-400 inline" /> {filteredEntries[0].high_score}
                  </p>
                  <div className="flex justify-center gap-3 text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-slate-905">
                    <span className="flex items-center gap-0.5"><Coins className="w-3.5 h-3 text-indigo-400" /> {filteredEntries[0].total_coins}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3 text-indigo-400" /> {formatTime(filteredEntries[0].total_time)}</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {filteredEntries[2] && (
                <div className="order-3 bg-slate-950/40 border border-indigo-505/10 rounded-xl p-4 text-center text-indigo-300 relative overflow-hidden sm:h-40 flex flex-col justify-center">
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 px-2 py-0.5 bg-slate-800 rounded-md text-[9px] font-bold text-indigo-400">
                    <Medal className="w-3 h-3 text-indigo-400" /> #3 BRONZE
                  </div>
                  <div className="text-4xl filter drop-shadow mb-1">
                    {getAvatarEmoji(filteredEntries[2].avatar)}
                  </div>
                  <p className="text-sm font-bold text-white uppercase truncate">{filteredEntries[2].nickname}</p>
                  <p className="text-lg font-black text-indigo-400/90 font-mono mt-1 flex items-center justify-center gap-1.5">
                    <Star className="w-4 h-4 fill-indigo-400 inline text-border text-indigo-400" /> {filteredEntries[2].high_score}
                  </p>
                  <div className="flex justify-center gap-3 text-[10px] text-slate-500 font-mono mt-2 pt-1.5 border-t border-slate-900">
                    <span className="flex items-center gap-0.5"><Coins className="w-3 h-3" /> {filteredEntries[2].total_coins}</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {formatTime(filteredEntries[2].total_time)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Board Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 font-mono text-[10px] tracking-wider text-slate-400 uppercase border-b border-slate-850 select-none">
                  <th className="py-3 px-4 text-center w-12">RANGO</th>
                  <th className="py-3 px-4">JUGADOR</th>
                  <th className="py-3 px-4 text-right">SCORE MÁXIMO</th>
                  <th className="py-3 px-4 text-center">MONEDAS</th>
                  <th className="py-3 px-4 text-center">NIVELES</th>
                  <th className="py-3 px-4 text-center">MUERTES</th>
                  <th className="py-3 px-4 text-right">TIEMPO TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 font-sans text-sm">
                {filteredEntries.map((player, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr key={player.nickname} className="hover:bg-slate-850/30 transition-colors group">
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-500 font-bold select-none">
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xl filter drop-shadow select-none">{getAvatarEmoji(player.avatar)}</span>
                          <span className="uppercase group-hover:text-indigo-400 transition-colors">{player.nickname}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-400">
                        {player.high_score.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                        🔑 {player.total_coins}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                        ⭐️ {player.levels_count} completados
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-red-400/80">
                        💀 {player.total_deaths}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">
                        ⏰ {formatTime(player.total_time)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
