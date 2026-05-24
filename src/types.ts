export interface PlayerProfile {
  nickname: string;
  avatar: string; // Key of the retro avatar icon
  high_score: number;
  total_coins: number;
  total_time: number; // in seconds
  total_deaths: number;
  completed_levels: number[]; // Array of completed level IDs [1, 2, 3...]
  created_at?: string;
}

export interface LevelProgress {
  id?: number;
  nickname: string;
  level_id: number;
  coins_collected: number;
  time_taken: number;
  completed_at?: string;
}

export interface LeaderboardEntry {
  nickname: string;
  avatar: string;
  high_score: number;
  total_coins: number;
  total_time: number;
  total_deaths: number;
  levels_count: number;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isCustom: boolean; // True if using their own Supabase, false if using browser LocalStorage
}

export interface GameStats {
  score: number;
  coins: number;
  lives: number;
  time: number;
  levelId: number;
  isGameOver: boolean;
  isLevelCompleted: boolean;
}
