import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PlayerProfile, LeaderboardEntry, SupabaseConfig, LevelProgress } from '../types';

// Storage keys
const STORAGE_KEYS = {
  URL: 'retro_mario_supabase_url',
  ANON_KEY: 'retro_mario_supabase_anon_key',
  PROFILE: 'retro_mario_active_profile',
  OFFLINE_PROFILES: 'retro_mario_offline_profiles',
  OFFLINE_PROGRESS: 'retro_mario_offline_progress',
};

// Check if variables are defined in import.meta.env
const envUrl = ((import.meta as any).env?.VITE_SUPABASE_URL as string) || '';
const envAnonKey = ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string) || '';

/**
 * Recovers current configuration
 */
export function getSupabaseConfig(): SupabaseConfig {
  const localUrl = localStorage.getItem(STORAGE_KEYS.URL) || '';
  const localKey = localStorage.getItem(STORAGE_KEYS.ANON_KEY) || '';

  if (envUrl && envAnonKey) {
    return {
      url: envUrl,
      anonKey: envAnonKey,
      isCustom: false,
    };
  }

  return {
    url: localUrl,
    anonKey: localKey,
    isCustom: !!(localUrl && localKey),
  };
}

/**
 * Saves custom user credentials
 */
export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEYS.URL, url.trim());
  localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
}

/**
 * Resets custom user credentials
 */
export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.URL);
  localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
}

// Global cached client instance
let supabaseInstance: SupabaseClient | null = null;
let currentConfigSig = '';

/**
 * Retrieves or creates a Supabase Client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    supabaseInstance = null;
    return null;
  }

  const sig = `${config.url}:${config.anonKey}`;
  if (supabaseInstance && currentConfigSig === sig) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: { persistSession: false },
    });
    currentConfigSig = sig;
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabaseInstance = null;
    return null;
  }
}

/* ==========================================
   OFFLINE MOCK/FALLBACK SYSTEM
   This handles LocalStorage operation when
   Supabase is not configured yet.
   ========================================== */

function getOfflineProfiles(): PlayerProfile[] {
  const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_PROFILES);
  return data ? JSON.parse(data) : [];
}

function saveOfflineProfiles(profiles: PlayerProfile[]): void {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_PROFILES, JSON.stringify(profiles));
}

function getOfflineProgress(): LevelProgress[] {
  const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_PROGRESS);
  return data ? JSON.parse(data) : [];
}

function saveOfflineProgress(progress: LevelProgress[]): void {
  localStorage.setItem(STORAGE_KEYS.OFFLINE_PROGRESS, JSON.stringify(progress));
}

/* ==========================================
   PUBLIC DATABASE API FUNCTIONS
   Calls Supabase if active, otherwise LocalStorage
   ========================================== */

/**
 * Signs up or logs in a player by checking/creating their nickname profile
 */
export async function authenticatePlayer(nickname: string, avatar: string): Promise<PlayerProfile> {
  const client = getSupabaseClient();
  const lowerNickname = nickname.trim().toLowerCase();

  if (!lowerNickname) throw new Error('El nickname no puede estar vacío.');

  if (client) {
    try {
      // Try to fetch profile
      const { data: profile, error } = await client
        .from('player_profiles')
        .select('*')
        .eq('nickname', lowerNickname)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        // Logged in! Let's update avatar if they chose a new one, or return saved one
        if (profile.avatar !== avatar && avatar) {
          const { data: updatedProfile, error: updateError } = await client
            .from('player_profiles')
            .update({ avatar })
            .eq('nickname', lowerNickname)
            .select()
            .single();

          if (updateError) throw updateError;
          return updatedProfile;
        }
        return profile;
      } else {
        // Register new profile
        const newProfile: PlayerProfile = {
          nickname: lowerNickname,
          avatar: avatar || 'mario',
          high_score: 0,
          total_coins: 0,
          total_time: 0,
          total_deaths: 0,
          completed_levels: [],
        };

        const { data: inserted, error: insertError } = await client
          .from('player_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (insertError) throw insertError;
        return inserted;
      }
    } catch (err: any) {
      console.warn('Error running on Supabase database, falling back to LocalStorage:', err);
      // Fallback below
    }
  }

  // --- LOCAL FALLBACK ---
  const offlineList = getOfflineProfiles();
  const existing = offlineList.find((p) => p.nickname === lowerNickname);

  if (existing) {
    if (avatar && existing.avatar !== avatar) {
      existing.avatar = avatar;
      saveOfflineProfiles(offlineList);
    }
    return existing;
  } else {
    const newProfile: PlayerProfile = {
      nickname: lowerNickname,
      avatar: avatar || 'mario',
      high_score: 0,
      total_coins: 0,
      total_time: 0,
      total_deaths: 0,
      completed_levels: [],
      created_at: new Date().toISOString(),
    };
    offlineList.push(newProfile);
    saveOfflineProfiles(offlineList);
    return newProfile;
  }
}

/**
 * Retrieves a player profile
 */
export async function getPlayerProfile(nickname: string): Promise<PlayerProfile | null> {
  const client = getSupabaseClient();
  const lowerNickname = nickname.trim().toLowerCase();

  if (client) {
    try {
      const { data, error } = await client
        .from('player_profiles')
        .select('*')
        .eq('nickname', lowerNickname)
        .maybeSingle();

      if (!error && data) return data;
    } catch (err) {
      console.error('Supabase error:', err);
    }
  }

  const offlineList = getOfflineProfiles();
  return offlineList.find((p) => p.nickname === lowerNickname) || null;
}

/**
 * Updates player game statistics and registers completed level
 */
export async function submitLevelStats(
  nickname: string,
  levelId: number,
  score: number,
  coins: number,
  timeTaken: number,
  isDeath: boolean
): Promise<PlayerProfile> {
  const client = getSupabaseClient();
  const lowerNickname = nickname.trim().toLowerCase();

  if (client) {
    try {
      // 1. Fetch current profile
      const { data: current, error: fetchErr } = await client
        .from('player_profiles')
        .select('*')
        .eq('nickname', lowerNickname)
        .single();

      if (fetchErr) throw fetchErr;

      // Calculate updates
      const newHighScore = Math.max(current.high_score, score);
      const newTotalCoins = current.total_coins + coins;
      const newTotalTime = current.total_time + timeTaken;
      const newTotalDeaths = current.total_deaths + (isDeath ? 1 : 0);
      
      let nextCompletedLevels = [...(current.completed_levels || [])];
      const isNewLevelCompletion = !isDeath && !nextCompletedLevels.includes(levelId);
      if (isNewLevelCompletion) {
        nextCompletedLevels.push(levelId);
      }

      // Update base profile
      const { data: updatedProfile, error: updateErr } = await client
        .from('player_profiles')
        .update({
          high_score: newHighScore,
          total_coins: newTotalCoins,
          total_time: newTotalTime,
          total_deaths: newTotalDeaths,
          completed_levels: nextCompletedLevels,
        })
        .eq('nickname', lowerNickname)
        .select()
        .single();

      if (updateErr) throw updateErr;

      // 2. Insert detailed Level Progress history if completed
      if (!isDeath) {
        const progressEntry = {
          nickname: lowerNickname,
          level_id: levelId,
          coins_collected: coins,
          time_taken: timeTaken,
        };

        // Try insert or upsert unique by (nickname, level_id)
        await client.from('level_progress').upsert(progressEntry, {
          onConflict: 'nickname,level_id',
        });
      }

      return updatedProfile;
    } catch (err) {
      console.error('Supabase submission failed, using offline fallback schema:', err);
    }
  }

  // --- LOCAL FALLBACK ---
  const offlineList = getOfflineProfiles();
  const idx = offlineList.findIndex((p) => p.nickname === lowerNickname);

  if (idx !== -1) {
    const current = offlineList[idx];
    const newHighScore = Math.max(current.high_score, score);
    const newTotalCoins = current.total_coins + coins;
    const newTotalTime = current.total_time + timeTaken;
    const newTotalDeaths = current.total_deaths + (isDeath ? 1 : 0);

    let nextCompletedLevels = [...(current.completed_levels || [])];
    const isNewLevelCompletion = !isDeath && !nextCompletedLevels.includes(levelId);
    if (isNewLevelCompletion) {
      nextCompletedLevels.push(levelId);
    }

    const updated: PlayerProfile = {
      ...current,
      high_score: newHighScore,
      total_coins: newTotalCoins,
      total_time: newTotalTime,
      total_deaths: newTotalDeaths,
      completed_levels: nextCompletedLevels,
    };

    offlineList[idx] = updated;
    saveOfflineProfiles(offlineList);

    // Save level progression offline
    if (!isDeath) {
      const offlineProgress = getOfflineProgress();
      const existingProgIdx = offlineProgress.findIndex(
        (p) => p.nickname === lowerNickname && p.level_id === levelId
      );

      const entry: LevelProgress = {
        nickname: lowerNickname,
        level_id: levelId,
        coins_collected: coins,
        time_taken: timeTaken,
        completed_at: new Date().toISOString(),
      };

      if (existingProgIdx !== -1) {
        offlineProgress[existingProgIdx] = entry;
      } else {
        offlineProgress.push(entry);
      }
      saveOfflineProgress(offlineProgress);
    }

    return updated;
  }

  throw new Error('Perfil no encontrado para guardar las estadísticas.');
}

/**
 * Fetches the global high scores leaderboard
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('player_profiles')
        .select('*')
        .order('high_score', { ascending: false })
        .limit(20);

      if (!error && data) {
        return data.map((p: any) => ({
          nickname: p.nickname,
          avatar: p.avatar,
          high_score: p.high_score,
          total_coins: p.total_coins,
          total_time: p.total_time,
          total_deaths: p.total_deaths,
          levels_count: (p.completed_levels || []).length,
        }));
      }
    } catch (err) {
      console.error('Failed leaderboard fetch on Supabase, pulling LocalStorage rankings:', err);
    }
  }

  // --- LOCAL FALLBACK ---
  const offlineList = getOfflineProfiles();
  return offlineList
    .map((p) => ({
      nickname: p.nickname,
      avatar: p.avatar,
      high_score: p.high_score,
      total_coins: p.total_coins,
      total_time: p.total_time,
      total_deaths: p.total_deaths,
      levels_count: (p.completed_levels || []).length,
    }))
    .sort((a, b) => b.high_score - a.high_score)
    .slice(0, 20);
}

/**
 * Fetches detailed level progression for a specific player
 */
export async function getPlayerStatsHistory(nickname: string): Promise<LevelProgress[]> {
  const client = getSupabaseClient();
  const lowerNickname = nickname.trim().toLowerCase();

  if (client) {
    try {
      const { data, error } = await client
        .from('level_progress')
        .select('*')
        .eq('nickname', lowerNickname)
        .order('level_id', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.error('Failed historical progress fetch on Supabase:', err);
    }
  }

  // --- LOCAL FALLBACK ---
  const offlineProgress = getOfflineProgress();
  return offlineProgress.filter((p) => p.nickname === lowerNickname);
}

/**
 * SQL script helper for the player setup dashboard.
 * Gives them the raw query to copy and run in their Supabase console.
 */
export const SQL_SETUP_SCRIPT = `-- SCRIPT DE CONFIGURACIÓN DE TABLAS DE JUEGO PARA RETRO MARIO

-- 1. Crear tabla de perfiles de jugadores
CREATE TABLE IF NOT EXISTS player_profiles (
  nickname TEXT PRIMARY KEY,
  avatar TEXT NOT NULL DEFAULT 'mario',
  high_score INT DEFAULT 0,
  total_coins INT DEFAULT 0,
  total_time INT DEFAULT 0,
  total_deaths INT DEFAULT 0,
  completed_levels JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Habilitar acceso de lectura/escritura pública (ideal para juegos de demostración)
-- Desactiva la seguridad de nivel de fila (RLS) en estas tablas de demostración
ALTER TABLE player_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Crear tabla de registro de niveles completados
CREATE TABLE IF NOT EXISTS level_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nickname TEXT REFERENCES player_profiles(nickname) ON DELETE CASCADE,
  level_id INT NOT NULL,
  coins_collected INT NOT NULL DEFAULT 0,
  time_taken INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(nickname, level_id)
);

ALTER TABLE level_progress DISABLE ROW LEVEL SECURITY;

-- 3. Crear publicación para actualizaciones en tiempo real (Supabase Realtime)
-- Esto permite la sincronización reactiva en tiempo real de tableros y puntuaciones
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;
alter publication supabase_realtime add table player_profiles;
alter publication supabase_realtime add table level_progress;
`;
