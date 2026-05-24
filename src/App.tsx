import { useState, useEffect } from 'react';
import { PlayerProfile, SupabaseConfig } from './types';
import { getSupabaseConfig, getPlayerProfile } from './lib/supabase';
import LoginPanel from './components/LoginPanel';
import ConfigPanel from './components/ConfigPanel';
import Leaderboard from './components/Leaderboard';
import Dashboard from './components/Dashboard';
import GameScreen from './components/GameScreen';
import { Gamepad2, Trophy, Eye, User, Database, LogOut, Cloud, AlertCircle, Heart } from 'lucide-react';

export default function App() {
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>({ url: '', anonKey: '', isCustom: false });
  const [activeProfile, setActiveProfile] = useState<PlayerProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'game' | 'dashboard' | 'leaderboard' | 'config'>('game');
  const [sessionLoading, setSessionLoading] = useState(false);

  // Reload current configs from LocalStorage or env
  const refreshConfig = () => {
    const config = getSupabaseConfig();
    setSupabaseConfig(config);
  };

  useEffect(() => {
    refreshConfig();
    
    // Check if there is already an active logged in profile in local cache
    const cachedNick = localStorage.getItem('retro_mario_active_nickname');
    if (cachedNick) {
      setSessionLoading(true);
      getPlayerProfile(cachedNick)
        .then((profile) => {
          if (profile) {
            setActiveProfile(profile);
          }
        })
        .catch((err) => console.error('Failed to restore active profile:', err))
        .finally(() => setSessionLoading(false));
    }
  }, []);

  const handleLoginSuccess = (profile: PlayerProfile) => {
    setActiveProfile(profile);
    localStorage.setItem('retro_mario_active_nickname', profile.nickname);
    setActiveTab('game'); // Enter the game straight away!
  };

  const handleLogout = () => {
    setActiveProfile(null);
    localStorage.removeItem('retro_mario_active_nickname');
  };

  const handleStatsUpdated = (updatedProfile: PlayerProfile) => {
    // Reactively refresh child components
    setActiveProfile(updatedProfile);
  };

  return (
    <div id="app-root-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white border-8 border-slate-800">
      
      {/* HEADER SECTION BAR */}
      <header className="bg-slate-900 border-b-2 border-indigo-500/30 px-6 py-4 sticky top-0 z-40 select-none shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(79,70,229,0.5)]">
              <span className="animate-pulse">🍄</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white font-sans uppercase">
                ODYSSEY Retro-Platformer
              </h1>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[rgb(34,197,94)]">
                <div className="w-2 h-2 bg-emerald-450 rounded-full animate-pulse"></div>
                BASE DE DATOS EN LA NUBE INTEGRADA
              </div>
            </div>
          </div>

          {/* Sync indicator pill */}
          <div className="flex items-center gap-3">
            {supabaseConfig.url ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold font-mono">
                <Cloud className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Nube Conectada</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold font-mono">
                <Database className="w-3.5 h-3.5" />
                <span>Offline Fallback</span>
              </div>
            )}

            {/* User Session Profile mini pill */}
            {activeProfile && (
              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 border border-slate-850 rounded-lg shadow-inner">
                <span className="text-sm font-bold text-slate-200 font-mono uppercase">
                  {activeProfile.nickname}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CORE FRAME SPACE */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {sessionLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <span className="text-4xl animate-bounce">🪙</span>
              <p className="text-sm text-slate-400 font-mono">Reanudando sesión del jugador...</p>
            </div>
          ) : !activeProfile ? (
            // NOT LOGGED IN SHOW LOGIN SCREEN OR CUSTOM DB CONNECTOR SETUP
            <div className="space-y-6">
              <LoginPanel
                supabaseConfig={supabaseConfig}
                onLoginSuccess={handleLoginSuccess}
                openConfigPanel={() => setActiveTab('config')}
              />
              
              {/* Optional Inline DB connector at startup */}
              {activeTab === 'config' ? (
                <div className="border-t border-slate-900 pt-6">
                  <ConfigPanel onConfigChanged={refreshConfig} />
                  <div className="text-center">
                    <button
                      onClick={() => setActiveTab('game')}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Volver al inicio de sesión
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setActiveTab('config')}
                    className="text-xs text-slate-500 hover:text-slate-300 underline font-mono"
                  >
                    🛠️ Configuración avanzada del servidor Supabase
                  </button>
                </div>
              )}
            </div>
          ) : (
            // LOGGED IN DASHBOARD CORE SYSTEM WITH HEADER SWITCHER
            <div className="space-y-6">
              {/* Navigation Menu Hub */}
              <div className="grid grid-cols-4 bg-slate-900 border-2 border-slate-805 rounded-xl max-w-lg mx-auto select-none overflow-hidden shadow-lg shadow-indigo-950/20">
                <button
                  onClick={() => setActiveTab('game')}
                  className={`py-3 px-3.5 cursor-pointer text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'game'
                      ? 'bg-slate-800 border-b-2 border-indigo-500 text-indigo-400 font-extrabold'
                      : 'text-slate-500 hover:text-white hover:bg-slate-850/50'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Jugar</span>
                </button>

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-3 px-3.5 cursor-pointer text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'dashboard'
                      ? 'bg-slate-800 border-b-2 border-indigo-500 text-indigo-400 font-extrabold'
                      : 'text-slate-500 hover:text-white hover:bg-slate-850/50'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Mis Logros</span>
                </button>

                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`py-3 px-3.5 cursor-pointer text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'leaderboard'
                      ? 'bg-slate-800 border-b-2 border-indigo-500 text-indigo-400 font-extrabold'
                      : 'text-slate-500 hover:text-white hover:bg-slate-850/50'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>Marcador</span>
                </button>

                <button
                  onClick={() => setActiveTab('config')}
                  className={`py-3 px-3.5 cursor-pointer text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'config'
                      ? 'bg-slate-800 border-b-2 border-indigo-500 text-indigo-400 font-extrabold'
                      : 'text-slate-500 hover:text-white hover:bg-slate-850/50'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Servidor</span>
                </button>
              </div>

              {/* ROUTER SELECT BLOCK */}
              <div className="transition-all duration-300">
                {activeTab === 'game' && (
                  <GameScreen
                    playerProfile={activeProfile}
                    onStatsUpdated={handleStatsUpdated}
                    openDashboard={() => setActiveTab('dashboard')}
                  />
                )}

                {activeTab === 'dashboard' && (
                  <Dashboard
                    playerProfile={activeProfile}
                    onLogout={handleLogout}
                  />
                )}

                {activeTab === 'leaderboard' && <Leaderboard />}

                {activeTab === 'config' && (
                  <ConfigPanel onConfigChanged={refreshConfig} />
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER METRICS SYSTEM */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 px-4 select-none">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600 font-mono leading-none">
            © 2026 Plataformero Retro Odyssey - Cloud Architecture & Real-time Progression.
          </p>
          <div className="flex gap-4 text-[10px] text-slate-600 font-mono">
            <span>Powered by <b>Supabase</b></span>
            <span>•</span>
            <span>Crafted with 💖 and 8-bit Synths</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
