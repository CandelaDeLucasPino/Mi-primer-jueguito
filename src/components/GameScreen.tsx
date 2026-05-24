import { useEffect, useRef, useState } from 'react';
import { PlayerProfile } from '../types';
import { submitLevelStats, getLeaderboard } from '../lib/supabase';
import { Trophy, Coins, Clock, Heart, Volume2, VolumeX, RotateCcw, ArrowRight, Flag, HelpCircle } from 'lucide-react';

interface GameScreenProps {
  playerProfile: PlayerProfile;
  onStatsUpdated: (updatedProfile: PlayerProfile) => void;
  openDashboard: () => void;
}

// 8-bit Sound Synthesizer using Web Audio API
class RetroAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy initialize when first sound is triggered to comply with browser autoplay policies
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playJump() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCoin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playStomp() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playPowerup() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [330, 392, 659, 523, 587, 784];
    const time = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time + i * 0.07);
      gain.gain.setValueAtTime(0.08, time + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.005, time + i * 0.07 + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time + i * 0.07);
      osc.stop(time + i * 0.07 + 0.08);
    });
  }

  playDamage() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playDeath() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [500, 450, 400, 350, 300, 200, 100];
    const time = this.ctx.currentTime;

    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time + i * 0.08);
      
      gain.gain.setValueAtTime(0.18, time + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.01, time + i * 0.08 + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time + i * 0.08);
      osc.stop(time + i * 0.08 + 0.08);
    });
  }

  playWinFanfare() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const melody = [523, 659, 784, 1046, 784, 1046]; // C5, E5, G5, C6, G5, C6
    const dur = [0.15, 0.15, 0.15, 0.3, 0.15, 0.5];
    const delay = [0, 0.15, 0.3, 0.45, 0.75, 0.9];
    const time = this.ctx.currentTime;

    melody.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time + delay[idx]);
      
      gain.gain.setValueAtTime(0.1, time + delay[idx]);
      gain.gain.linearRampToValueAtTime(0.005, time + delay[idx] + dur[idx] - 0.02);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(time + delay[idx]);
      osc.stop(time + delay[idx] + dur[idx]);
    });
  }
}

const audio = new RetroAudio();

// TILE MAP CONFIGURATION
// Map grid cells are 32x32 pixels
const TILE_SIZE = 32;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface Goomba {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isDead: boolean;
  deadTimer: number;
}

interface Fireball {
  x: number;
  y: number;
  vx: number;
  width: number;
  height: number;
}

interface HeartProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
}

interface Item {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'mushroom' | 'star' | 'flower';
  collected: boolean;
}

interface Block {
  gridX: number;
  gridY: number;
  type: 'brick' | 'mystery_coin' | 'mystery_mushroom' | 'mystery_star' | 'empty';
  bounceOffset: number;
  bounceTimer: number;
}

// PROGRAMMATIC TEXTURE DRAWING HELPERS
function drawGrassTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Base green
  ctx.fillStyle = '#15803d'; // Tailwind green-700
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // Grass blades / highlight
  ctx.fillStyle = '#22c55e'; // Tailwind green-500
  ctx.fillRect(x, y, TILE_SIZE, 6);
  ctx.fillRect(x + 4, y + 6, 4, 4);
  ctx.fillRect(x + 16, y + 6, 6, 3);
  ctx.fillRect(x + 24, y + 6, 2, 4);
  // Shadow bottom
  ctx.fillStyle = '#166534'; // Tailwind green-800
  ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);
}

function drawUndergroundTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#1e293b'; // Slate-800
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = '#475569'; // Slate-600 cracks
  ctx.fillRect(x, y, TILE_SIZE, 3);
  ctx.fillRect(x, y, 3, TILE_SIZE);
  ctx.fillRect(x + 12, y + 8, 4, 16);
  ctx.fillRect(x + 22, y + 16, 5, 5);
}

function drawCastleTile(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#3f3f46'; // Zinc-700
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // Brick joints
  ctx.fillStyle = '#18181b'; // Zinc-900 line
  ctx.fillRect(x, y + 14, TILE_SIZE, 2);
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
  ctx.fillRect(x + 14, y, 2, 14);
  ctx.fillRect(x + 24, y + 16, 2, 14);
}

function drawBrickBlock(ctx: CanvasRenderingContext2D, x: number, y: number, isCastle: boolean = false) {
  ctx.fillStyle = isCastle ? '#27272a' : '#c2410c'; // Dark Red / Charcoal
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Borders & Grooves
  ctx.fillStyle = isCastle ? '#18181b' : '#7c2d12'; // Line outline
  ctx.fillRect(x, y, TILE_SIZE, 2);
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
  ctx.fillRect(x, y, 2, TILE_SIZE);
  ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);

  // Highlights
  ctx.fillStyle = isCastle ? '#52525b' : '#ea580c';
  ctx.fillRect(x + 2, y + 2, 12, 4);
  ctx.fillRect(x + 18, y + 2, 12, 4);
  ctx.fillRect(x + 2, y + 18, 12, 4);
  ctx.fillRect(x + 18, y + 18, 12, 4);
}

function drawMysteryBlock(ctx: CanvasRenderingContext2D, x: number, y: number, isEmpty: boolean, isStarBlock?: boolean) {
  if (isEmpty) {
    ctx.fillStyle = '#78716c'; // Stone-600 empty block
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#44403c';
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
    return;
  }

  if (isStarBlock) {
    // Special glowing Indigo/Purple Mystery block for star!
    ctx.fillStyle = '#4f46e5'; // Indigo-600
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.fillStyle = '#818cf8'; // Indigo highlights
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 3);
    ctx.fillRect(x + 2, y + 2, 3, TILE_SIZE - 4);

    ctx.fillStyle = '#312e81'; // Dark outline
    ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
    ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);

    // Big Star Symbol
    ctx.fillStyle = '#facc15'; // Glowing Yellow star
    ctx.font = 'bold 18px font-sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x + TILE_SIZE / 2, x + TILE_SIZE / 2 + 1);
    return;
  }

  // Golden Mystery Brick
  ctx.fillStyle = '#d97706'; // Amber-600
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  ctx.fillStyle = '#f59e0b'; // Light Highlights
  ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, 3);
  ctx.fillRect(x + 2, y + 2, 3, TILE_SIZE - 4);

  ctx.fillStyle = '#78350f'; // Dark outline
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
  ctx.fillRect(x + TILE_SIZE - 2, y, 2, TILE_SIZE);

  // Big Question Mark
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px font-mono';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', x + TILE_SIZE / 2, x + TILE_SIZE / 2);
}

// 3 GAME LEVELS programmatically defined
const STAGE_HEIGHT = 13; // tiles high (416 pixels)

const LEVEL_MAPS: Record<number, string[]> = {
  1: [
    '                                                                              ',
    '                                                                              ',
    '                                                                              ',
    '                                                                              ',
    '         c  c                                                                 ',
    '       bbbbbbb                                                                ',
    '                   ?   M   ?      bb?bb       c  c  c            S          F ',
    '                                             bbbbbbbbb                      # ',
    '                                                                            # ',
    '                                  P                                         # ',
    '     g                      g    ###                                      g # ',
    '#####################################LL#######################################',
    '#####################################LL#######################################',
  ],
  2: [
    '                                                                              ',
    '                                                                              ',
    '                                                                              ',
    '     c  c  c            c  c                                                  ',
    '     bb?bb?b          bbbbbb       ?   S   ?                                  ',
    '                                                                              ',
    '                                               bbbbb                        F ',
    '    S   bSb    P                bbbbbbb        #####         b?b            # ',
    '              ###               #######        #####                        # ',
    '             #####                                                          # ',
    '      g     g                                                g              # ',
    '################LLLL#######################LLLLLLLLLLL########################',
    '################LLLL#######################LLLLLLLLLLL########################',
  ],
  3: [
    '                                                                              ',
    '                                                                              ',
    '                                                                              ',
    '     c   c   c                                                                ',
    '    bbbbbbbbbbb                              c   c                            ',
    '                     bbbbbbbb                                                 ',
    '                                             bbbbb                            ',
    '                                                                              ',
    '             b?bS?b                                                         X ',
    '                                                                            # ',
    '      g                   g                                    B            # ',
    '#####################LLLLLLLLLL#########################LLLLLLLLLL############',
    '#####################LLLLLLLLLL#########################LLLLLLLLLL############',
  ],
  4: [
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                                                                                ',
    '                    bbbbbbbb                                                    ',
    '                                         bbbbb                                  ',
    '          g                                                    bbbb             ',
    '                                                             ########         F ',
    '                                                             ########         # ',
    '               P                  g                          ########         # ',
    '              ###       g        ###                         ########         # ',
    '      g      #####     ###      #####                        ########         # ',
    '################################################################################',
    '################################################################################',
  ],
};

export default function GameScreen({ playerProfile, onStatsUpdated, openDashboard }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [levelId, setLevelId] = useState(1);
  const [lives, setLives] = useState(3);
  const [coins, setCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(150);
  const [starPowerActive, setStarPowerActive] = useState(false);
  const [flowerPowerActive, setFlowerPowerActive] = useState(false);
  const [competitors, setCompetitors] = useState<any[]>([]);
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'gameover' | 'completed' | 'victory_all' | 'victory_level4'>('intro');
  const [syncing, setSyncing] = useState(false);

  // Mutable game-loop variables inside refs to avoid React re-render lag
  const keysPressed = useRef<Record<string, boolean>>({});
  
  // Player physical traits
  const playerRef = useRef({
    x: 80,
    y: 200,
    vx: 0,
    vy: 0,
    width: 22,
    height: 32,
    isGrounded: false,
    isBig: false,
    invincibleTimer: 0,
    flashTimer: 0,
    hasStar: false,
    starTimer: 0,
    hasFlower: false,
    flowerTimer: 0,
    facingDirection: 'right' as 'left' | 'right',
  });

  const goombasRef = useRef<Goomba[]>([]);
  const fireballsRef = useRef<Fireball[]>([]);
  const heartsRef = useRef<HeartProjectile[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Camera scroll target
  const cameraX = useRef(0);

  // Bowser boss properties
  const bowserRef = useRef({
    x: 0,
    y: 0,
    width: 48,
    height: 64,
    health: 4,
    vx: -1,
    vy: 0,
    jumpTimer: 0,
    fireTimer: 0,
    hurtTimer: 0,
    isDead: false,
  });

  // Track timer loop internally
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCompetitors = async () => {
    try {
      const data = await getLeaderboard();
      if (data && data.length > 0) {
        setCompetitors(data);
      } else {
        throw new Error("No data");
      }
    } catch {
      setCompetitors([
        { nickname: 'Luigi Speedruns', avatar: 'luigi', high_score: 9500 },
        { nickname: 'Princesa Peach', avatar: 'peach', high_score: 8200 },
        { nickname: 'Bowser Temible', avatar: 'bowser', high_score: 7100 },
        { nickname: 'Yoshi Glotón', avatar: 'toad', high_score: 5900 },
        { nickname: 'Toad Veloz', avatar: 'toad', high_score: 4100 },
      ]);
    }
  };

  const shootHeart = () => {
    if (gameState !== 'playing' || levelId !== 4) return;
    audio.playCoin(); // soft firing sound
    const player = playerRef.current;
    
    const hvx = player.facingDirection === 'left' ? -5.5 : 5.5;
    
    heartsRef.current.push({
      x: player.x + (player.facingDirection === 'left' ? -10 : player.width),
      y: player.y + player.height / 3,
      vx: hvx,
      vy: 0,
      width: 14,
      height: 14,
    });

    // Make some pretty flower trail sparkles when fired
    for (let i = 0; i < 4; i++) {
      particlesRef.current.push({
        x: player.x + (player.facingDirection === 'left' ? 0 : player.width),
        y: player.y + player.height / 2,
        vx: (Math.random() - 0.5) * 2 + hvx * 0.2,
        vy: (Math.random() - 0.5) * 2,
        color: '#f43f5e',
        size: Math.random() * 3 + 2,
        life: Math.random() * 10 + 10,
      });
    }
  };

  const shootHeartRef = useRef(shootHeart);
  shootHeartRef.current = shootHeart;

  useEffect(() => {
    fetchCompetitors();
  }, []);

  // Web Synth sound toggler
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audio.enabled = next;
  };

  // Keyboard controls key bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', ' ', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); // blocks scrolling the viewport
      }

      // Check shooting triggers
      if (['f', 'F', 'z', 'Z', 'Enter', 'Shift'].includes(e.key)) {
        shootHeartRef.current();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // STARTING GAME TRIGGER
  const startLevel = (lvlNum: number, startFresh = false) => {
    setLevelId(lvlNum);
    setTimeRemaining(lvlNum === 3 ? 180 : 150);
    setGameState('playing');

    if (startFresh) {
      setLives(3);
      setCoins(0);
      setScore(0);
      playerRef.current.isBig = false;
    }

    // Camera setup
    cameraX.current = 0;

    // Player setup
    playerRef.current.x = 80;
    playerRef.current.y = 100;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.width = 20;
    playerRef.current.height = playerRef.current.isBig ? 44 : 28;
    playerRef.current.invincibleTimer = 0;
    playerRef.current.hasStar = false;
    playerRef.current.starTimer = 0;
    playerRef.current.hasFlower = false;
    playerRef.current.flowerTimer = 0;
    playerRef.current.facingDirection = 'right';
    setStarPowerActive(false);
    setFlowerPowerActive(false);

    // Initialize lists
    goombasRef.current = [];
    fireballsRef.current = [];
    heartsRef.current = [];
    itemsRef.current = [];
    blocksRef.current = [];
    particlesRef.current = [];

    // Parse level maps programmably
    const map = LEVEL_MAPS[lvlNum] || LEVEL_MAPS[1];
    
    // Parse map grid for dynamic items
    for (let r = 0; r < map.length; r++) {
      const row = map[r];
      for (let c = 0; c < row.length; c++) {
        const char = row[c];
        const pixelX = c * TILE_SIZE;
        const pixelY = r * TILE_SIZE;

        if (char === 'g') {
          goombasRef.current.push({
            x: pixelX,
            y: pixelY,
            vx: -1.2,
            vy: 0,
            width: 24,
            height: 24,
            isDead: false,
            deadTimer: 0,
          });
        } else if (char === '?') {
          blocksRef.current.push({
            gridX: c,
            gridY: r,
            type: 'mystery_coin',
            bounceOffset: 0,
            bounceTimer: 0,
          });
        } else if (char === 'M') {
          blocksRef.current.push({
            gridX: c,
            gridY: r,
            type: 'mystery_mushroom',
            bounceOffset: 0,
            bounceTimer: 0,
          });
        } else if (char === 'S') {
          blocksRef.current.push({
            gridX: c,
            gridY: r,
            type: 'mystery_star',
            bounceOffset: 0,
            bounceTimer: 0,
          });
        } else if (char === 'b') {
          blocksRef.current.push({
            gridX: c,
            gridY: r,
            type: 'brick',
            bounceOffset: 0,
            bounceTimer: 0,
          });
        }
      }
    }

    // Boss setup if castle level (Level 3)
    if (lvlNum === 3) {
      bowserRef.current = {
        x: 1800, // Near the climax of Level 3
        y: 200,
        width: 52,
        height: 64,
        health: 4,
        vx: -0.8,
        vy: 0,
        jumpTimer: 0,
        fireTimer: 0,
        hurtTimer: 0,
        isDead: false,
      };
    }

    // Start Clock Countdown Timer
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    gameTimerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handlePlayerDeath(true); // Times up!
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // CLEANUP LOOP TIMEOUTS
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, []);

  // PARTICLES MAKER
  const spawnBlockDebris = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: x + TILE_SIZE / 2,
        y: y + TILE_SIZE / 2,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.7) * 8,
        color,
        size: Math.random() * 4 + 2,
        life: 30, // frames
      });
    }
  };

  // ENEMY DEATH DUST
  const spawnDustCloud = (x: number, y: number) => {
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: '#f59e0b',
        size: Math.random() * 3 + 2,
        life: 15,
      });
    }
  };

  // DEAL DAMAGE OR DIE
  const handlePlayerDamage = () => {
    if (playerRef.current.invincibleTimer > 0) return;

    if (playerRef.current.isBig) {
      playerRef.current.isBig = false;
      playerRef.current.height = 28;
      playerRef.current.invincibleTimer = 60; // 1 second flashing invincibility
      audio.playDamage();
    } else {
      handlePlayerDeath();
    }
  };

  // HERO DEATH
  const handlePlayerDeath = (instantOver = false) => {
    audio.playDeath();
    const currentLives = lives;
    const nextLives = instantOver ? 0 : currentLives - 1;
    setLives(nextLives);

    if (nextLives > 0) {
      // Retry Level
      startLevel(levelId, false);
    } else {
      // GAME OVER
      setGameState('gameover');
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      // Submit statistics to cloud/local store (Registering death)
      submitProgressToDatabase(true);
    }
  };

  // SUCCESS STAGE TRIGGER
  const handleLevelComplete = () => {
    audio.playWinFanfare();
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    // Calculate score points bonus for time remaining
    const bonusPoints = timeRemaining * 10;
    setScore((prev) => prev + bonusPoints);

    // Sync progress in real time
    submitProgressToDatabase(false, bonusPoints);
  };

  // CLOUD OR LOCAL PROGRESS SYNC WRAPPER
  const submitProgressToDatabase = async (isLoss: boolean, bonusScore: number = 0) => {
    setSyncing(true);
    try {
      const finalTurnScore = score + bonusScore;
      const finalScoreToSend = isLoss ? score : finalTurnScore;
      const timeElapsed = (levelId === 3 ? 180 : 150) - timeRemaining;

      const updated = await submitLevelStats(
        playerProfile.nickname,
        levelId,
        finalScoreToSend,
        coins,
        Math.max(1, timeElapsed),
        isLoss
      );

      // Trigger callback to recheck globally in top state
      onStatsUpdated(updated);

      if (!isLoss) {
        if (levelId === 3) {
          setGameState('victory_all');
        } else if (levelId === 4) {
          setGameState('victory_level4');
        } else {
          setGameState('completed');
        }
      }
    } catch (err) {
      console.error('Error auto-syncing retro scores to database:', err);
    } finally {
      setSyncing(false);
    }
  };

  // RUNTIME COLLISION CHECKS WITH TILEMAP
  const checkTileSolid = (worldX: number, worldY: number, currentMap: string[]) => {
    const tileCol = Math.floor(worldX / TILE_SIZE);
    const tileRow = Math.floor(worldY / TILE_SIZE);

    if (tileCol < 0 || tileCol >= currentMap[0].length) {
      // Out of bounds horizontally causes screen stop except castle end
      return worldX < 0; 
    }
    if (tileRow < 0) return false; // Air up high
    if (tileRow >= STAGE_HEIGHT) {
      // Pits (lethal fall damage)
      return false;
    }

    const cell = currentMap[tileRow][tileCol];
    
    // Check if cell has standard dynamic block representation
    const blockOverride = blocksRef.current.find(
      (b) => b.gridX === tileCol && b.gridY === tileRow
    );

    if (blockOverride && blockOverride.type === 'empty') {
      return true; // Still solid stone block
    }

    return cell === '#' || cell === 'P' || blockOverride !== undefined;
  };

  // TRIGGER BLOCK BLOCK HIT FROM UNDERNEATH
  const handleBlockHit = (tileCol: number, tileRow: number) => {
    const block = blocksRef.current.find((b) => b.gridX === tileCol && b.gridY === tileRow);
    const map = LEVEL_MAPS[levelId] || LEVEL_MAPS[1];
    
    if (block) {
      if (block.type === 'empty') return; // Cannot re-hit empty block

      // Quick visual bounce
      block.bounceOffset = -8;
      block.bounceTimer = 6;

      if (block.type === 'mystery_coin') {
        audio.playCoin();
        setCoins((c) => c + 1);
        setScore((s) => s + 100);
        block.type = 'empty';

        // Spawn a coin jumping out particle
        particlesRef.current.push({
          x: tileCol * TILE_SIZE + TILE_SIZE / 2,
          y: tileRow * TILE_SIZE - 10,
          vx: 0,
          vy: -6,
          color: '#f59e0b',
          size: 6,
          life: 20,
        });
      } else if (block.type === 'mystery_mushroom') {
        audio.playPowerup();
        block.type = 'empty';
        
        // Push a sliding health mushroom
        itemsRef.current.push({
          x: tileCol * TILE_SIZE + 4,
          y: (tileRow - 1) * TILE_SIZE + 4,
          vx: 1.5,
          vy: 0,
          width: 24,
          height: 24,
          type: 'mushroom',
          collected: false,
        });
      } else if (block.type === 'mystery_star') {
        audio.playPowerup();
        block.type = 'empty';
        
        // Spawn standard bouncing Star item!
        itemsRef.current.push({
          x: tileCol * TILE_SIZE + 4,
          y: (tileRow - 1) * TILE_SIZE + 4,
          vx: 1.6,
          vy: -4, // bounce upwards first!
          width: 24,
          height: 24,
          type: 'star',
          collected: false,
        });
      } else if (block.type === 'brick') {
        if (playerRef.current.isBig) {
          audio.playStomp();
          // Break/Delete the block completely!
          blocksRef.current = blocksRef.current.filter((b) => b !== block);
          spawnBlockDebris(tileCol * TILE_SIZE, tileRow * TILE_SIZE, '#ea580c');
          setScore((s) => s + 50);

          // Update static character text map to space to let player traverse
          const updatedRow = map[tileRow].substring(0, tileCol) + ' ' + map[tileRow].substring(tileCol + 1);
          map[tileRow] = updatedRow;
        } else {
          audio.playDamage(); // simple thump bounce
          setScore((s) => s + 10);
        }
      }
    } else {
      // If none list found, check if it's static brick block 'b' to add list
      const char = map[tileRow][tileCol];
      if (char === 'b') {
        // Safe register block
        const nBlock: Block = {
          gridX: tileCol,
          gridY: tileRow,
          type: 'brick',
          bounceOffset: -6,
          bounceTimer: 4,
        };
        blocksRef.current.push(nBlock);
        handleBlockHit(tileCol, tileRow);
      }
    }
  };

  // CORE ADV_GAME ENGINE LOOP RUNTIME
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      if (gameState !== 'playing') {
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      const map = LEVEL_MAPS[levelId] || LEVEL_MAPS[1];
      const player = playerRef.current;

      /* ==========================================
         PLAYER MOTION / PHYSICS CONTROLS
         ========================================== */
      const speedPower = (player.hasStar || player.starTimer > 0 || player.hasFlower || player.flowerTimer > 0) ? 4.8 : 2.4;
      const gravity = 0.45;
      const jumpPower = -9.2;
      const friction = 0.82;

      // Invincibility timers
      if (player.invincibleTimer > 0) {
        player.invincibleTimer--;
      }

      // Star jump power countdown and trailing sparkles
      if (player.starTimer > 0) {
        player.starTimer--;
        if (player.starTimer === 0) {
          player.hasStar = false;
        }

        // Spawn continuous trailing sparkles near player feet/body
        if (Math.random() > 0.4) {
          particlesRef.current.push({
            x: player.x + Math.random() * player.width,
            y: player.y + player.height - Math.random() * 8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.5 - 0.5,
            color: Math.random() > 0.5 ? '#f59e0b' : '#38bdf8', // gold / cyan sprinkles
            size: Math.random() * 3 + 2,
            life: Math.random() * 15 + 15,
          });
        }

        if (starPowerActive === false) {
          setStarPowerActive(true);
        }
      } else {
        if (starPowerActive === true) {
          setStarPowerActive(false);
        }
      }

      // Flower boost power countdown and beautiful rose floral trailing sparkles
      if (player.flowerTimer > 0) {
        player.flowerTimer--;
        if (player.flowerTimer === 0) {
          player.hasFlower = false;
        }

        // Spawn continuous rose / pink floral sparkles near player
        if (Math.random() > 0.3) {
          particlesRef.current.push({
            x: player.x + Math.random() * player.width,
            y: player.y + player.height - Math.random() * 8,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -Math.random() * 1.5 - 0.5,
            color: Math.random() > 0.5 ? '#f43f5e' : '#ec4899', // rose / pink floral sparkles
            size: Math.random() * 3 + 2,
            life: Math.random() * 15 + 15,
          });
        }

        if (flowerPowerActive === false) {
          setFlowerPowerActive(true);
        }
      } else {
        if (flowerPowerActive === true) {
          setFlowerPowerActive(false);
        }
      }

      // X motion
      if (keysPressed.current['ArrowLeft'] || keysPressed.current['a'] || keysPressed.current['A'] || keysPressed.current['moveLeft']) {
        player.vx = -speedPower;
        player.facingDirection = 'left';
      } else if (keysPressed.current['ArrowRight'] || keysPressed.current['d'] || keysPressed.current['D'] || keysPressed.current['moveRight']) {
        player.vx = speedPower;
        player.facingDirection = 'right';
      } else {
        player.vx *= friction;
      }

      // Gravity apply
      player.vy += gravity;

      // Move horizontally with collision verification
      player.x += player.vx;
      
      // Horizontal Wall constraints
      const pLeft = player.x;
      const pRight = player.x + player.width;
      const pTop = player.y;
      const pBottom = player.y + player.height;

      // Colls left
      if (player.vx < 0) {
        if (
          checkTileSolid(pLeft, pTop + 4, map) ||
          checkTileSolid(pLeft, pBottom - 4, map)
        ) {
          player.x = (Math.floor(pLeft / TILE_SIZE) + 1) * TILE_SIZE;
          player.vx = 0;
        }
      }
      // Colls right
      if (player.vx > 0) {
        if (
          checkTileSolid(pRight, pTop + 4, map) ||
          checkTileSolid(pRight, pBottom - 4, map)
        ) {
          player.x = Math.floor(pRight / TILE_SIZE) * TILE_SIZE - player.width;
          player.vx = 0;
        }
      }

      // Move vertically with collision verification
      player.y += player.vy;
      player.isGrounded = false;

      const pLeftUpd = player.x;
      const pRightUpd = player.x + player.width;
      const pTopUpd = player.y;
      const pBottomUpd = player.y + player.height;

      // Coll upward (hitting blocks from below!)
      if (player.vy < 0) {
        if (
          checkTileSolid(pLeftUpd + 2, pTopUpd, map) ||
          checkTileSolid(pRightUpd - 2, pTopUpd, map)
        ) {
          // Identify precise tile grid that was punched
          const hitTileX = Math.floor((pLeftUpd + player.width / 2) / TILE_SIZE);
          const hitTileY = Math.floor(pTopUpd / TILE_SIZE);
          handleBlockHit(hitTileX, hitTileY);

          player.y = (Math.floor(pTopUpd / TILE_SIZE) + 1) * TILE_SIZE;
          player.vy = 0;
        }
      }

      // Coll downward (landing on grass/bricks!)
      if (player.vy >= 0) {
        if (
          checkTileSolid(pLeftUpd + 2, pBottomUpd, map) ||
          checkTileSolid(pRightUpd - 2, pBottomUpd, map)
        ) {
          player.y = Math.floor(pBottomUpd / TILE_SIZE) * TILE_SIZE - player.height;
          player.vy = 0;
          player.isGrounded = true;
        }
      }

      // Jumping actuation
      if ((keysPressed.current['ArrowUp'] || keysPressed.current[' '] || keysPressed.current['w'] || keysPressed.current['W'] || keysPressed.current['jump']) && player.isGrounded) {
        player.vy = (player.hasStar || player.starTimer > 0 || player.hasFlower || player.flowerTimer > 0) ? -14.0 : jumpPower;
        player.isGrounded = false;
        audio.playJump();
        
        // Remove virtual trigger immediately if it was from touch pad
        if (keysPressed.current['jump']) {
          keysPressed.current['jump'] = false;
        }
      }

      // Safe constraints edge of map left
      if (player.x < 4) {
        player.x = 4;
      }

      // Pit fall check
      if (player.y > canvas.height + 60) {
        handlePlayerDeath(true); // fall is direct level reset
        return;
      }

      /* ==========================================
         CAMERA SCROLLING
         ========================================== */
      // Camera locks on player once they cross the midpoint
      const midPoint = canvas.width / 2;
      if (player.x > midPoint) {
        cameraX.current = player.x - midPoint;
      }
      
      // Limit camera at maximum map length (map length is 80 columns * 32px = 2560px)
      const maxCamera = 2560 - canvas.width;
      if (cameraX.current > maxCamera) {
        cameraX.current = maxCamera;
      }

      /* ==========================================
         CHECK LEVEL FINISH FLAGPOLE
         ========================================== */
      let flagpoleCol = -1;
      for (let r = 0; r < map.length; r++) {
        const cIdx = map[r].indexOf('F');
        if (cIdx !== -1) {
          flagpoleCol = cIdx;
          break;
        }
      }

      if (flagpoleCol !== -1) {
        const flagpoleX = flagpoleCol * TILE_SIZE;
        // If the player's right side reaches the flagpole column (adjacent to or touching the wall/flagpole)
        if (player.x + player.width >= flagpoleX - 6) {
          handleLevelComplete();
          return;
        }
      }

      /* ==========================================
         BOUNCING BLOCKS ANIMATION PROCESS
         ========================================== */
      blocksRef.current.forEach((block) => {
        if (block.bounceTimer > 0) {
          block.bounceTimer--;
          if (block.bounceTimer === 0) {
            block.bounceOffset = 0;
          } else {
            // make smooth sine bounce
            block.bounceOffset = -Math.sin((block.bounceTimer / 6) * Math.PI) * 6;
          }
        }
      });

      /* ==========================================
         SLIDING POWERUP HEALTH MUSHROOMS
         ========================================== */
       itemsRef.current.forEach((item) => {
         if (item.collected) return;
         
         // Apply gravity to mushroom
         item.vy += 0.4;
         item.x += item.vx;

         // Check block collision horizontals
         if (item.vx > 0) {
           if (checkTileSolid(item.x + item.width, item.y + 4, map) || checkTileSolid(item.x + item.width, item.y + item.height - 4, map)) {
             item.vx = -item.vx; // turn back
           }
         } else {
           if (checkTileSolid(item.x, item.y + 4, map) || checkTileSolid(item.x, item.y + item.height - 4, map)) {
             item.vx = -item.vx;
           }
         }

         item.y += item.vy;
         // Check ground collision downward
         if (checkTileSolid(item.x + 2, item.y + item.height, map) || checkTileSolid(item.x + item.width - 2, item.y + item.height, map)) {
           item.y = Math.floor((item.y + item.height) / TILE_SIZE) * TILE_SIZE - item.height;
           if (item.type === 'star') {
             item.vy = -5.0; // Bouncy star!
           } else {
             item.vy = 0;
           }
         }

         // Verify player collection
         if (
           player.x < item.x + item.width &&
           player.x + player.width > item.x &&
           player.y < item.y + item.height &&
           player.y + player.height > item.y
         ) {
           item.collected = true;
           audio.playPowerup();
           setScore((s) => s + 1000);

           if (item.type === 'flower') {
             player.hasFlower = true;
             player.flowerTimer = 540; // ~9 seconds of speed/jump power!
             for (let i = 0; i < 15; i++) {
               particlesRef.current.push({
                 x: player.x + Math.random() * player.width,
                 y: player.y + Math.random() * player.height,
                 vx: (Math.random() - 0.5) * 4,
                 vy: (Math.random() - 0.5) * 4 - 2,
                 color: i % 2 === 0 ? '#f43f5e' : '#ec4899', // rose / pink flower colors
                 size: Math.random() * 4 + 2,
                 life: Math.random() * 20 + 20,
               });
             }
           }
           
           if (item.type === 'mushroom') {
             if (!player.isBig) {
               player.isBig = true;
               player.height = 42;
               player.y -= 14; // Prevent ground glitches
             }
           } else if (item.type === 'star') {
             player.hasStar = true;
             player.starTimer = 540; // ~9 seconds of jump boost
             // Spawn a rainbow explosion of shiny particles!
             for (let i = 0; i < 15; i++) {
               particlesRef.current.push({
                 x: player.x + Math.random() * player.width,
                 y: player.y + Math.random() * player.height,
                 vx: (Math.random() - 0.5) * 4,
                 vy: (Math.random() - 0.5) * 4 - 2,
                 color: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#a78bfa' : '#38bdf8', // gold/purple/sky particles
                 size: Math.random() * 4 + 2,
                 life: Math.random() * 20 + 20,
               });
             }
           }

           // Particles
           spawnDustCloud(item.x + item.width / 2, item.y + item.height / 2);
         }
       });

      /* ==========================================
         WALKING ENEMY GOOMBAS PHYSICS
         ========================================== */
      goombasRef.current.forEach((goomba) => {
        if (goomba.isDead) {
          goomba.deadTimer++;
          return;
        }

        // Apply gravity
        goomba.vy += 0.4;
        
        // Horizontal movement
        goomba.x += goomba.vx;

        // Wall collisions
        if (goomba.vx > 0) {
          if (
            checkTileSolid(goomba.x + goomba.width, goomba.y + 4, map) ||
            checkTileSolid(goomba.x + goomba.width, goomba.y + goomba.height - 4, map)
          ) {
            goomba.vx = -goomba.vx;
          }
        } else {
          if (
            checkTileSolid(goomba.x, goomba.y + 4, map) ||
            checkTileSolid(goomba.x, goomba.y + goomba.height - 4, map)
          ) {
            goomba.vx = -goomba.vx;
          }
        }

        // Fall handling
        goomba.y += goomba.vy;
        if (
          checkTileSolid(goomba.x + 2, goomba.y + goomba.height, map) ||
          checkTileSolid(goomba.x + goomba.width - 2, goomba.y + goomba.height, map)
        ) {
          goomba.y = Math.floor((goomba.y + goomba.height) / TILE_SIZE) * TILE_SIZE - goomba.height;
          goomba.vy = 0;
        }

        // --- COLLISION GOOMBA VS HERO ---
        if (
          player.x < goomba.x + goomba.width &&
          player.x + player.width > goomba.x &&
          player.y < goomba.y + goomba.height &&
          player.y + player.height > goomba.y
        ) {
          // Verify vertical squish stomp: is player jumping down on Goomba's head?
          const isStomp = player.vy > 0.4 && player.y + player.height - player.vy <= goomba.y + 10;
          
          if (isStomp) {
            audio.playStomp();
            goomba.isDead = true;
            goomba.vx = 0;
            player.vy = -5.8; // jump rebound feedback
            setScore((s) => s + 200);
            setCoins((c) => c + 1);
            spawnDustCloud(goomba.x + goomba.width / 2, goomba.y + goomba.height / 2);
          } else {
            // Damage player
            handlePlayerDamage();
          }
        }
      });

      /* ==========================================
         BOWSER BOSS CHOREOGRAPHY (Level 3 ONLY)
         ========================================== */
      if (levelId === 3 && !bowserRef.current.isDead) {
        const bowser = bowserRef.current;
        
        // Periodic Jumping logic
        bowser.jumpTimer++;
        if (bowser.jumpTimer > 110) {
          bowser.vy = -7.5; // jump!
          bowser.jumpTimer = 0;
        }
        
        // Periodic Fireball Attack Launcher
        bowser.fireTimer++;
        if (bowser.fireTimer > 140) {
          audio.playDamage();
          fireballsRef.current.push({
            x: bowser.x - 10,
            y: bowser.y + 20 + (Math.random() - 0.5) * 15,
            vx: -3.5,
            width: 22,
            height: 18,
          });
          bowser.fireTimer = 0;
        }

        // Gravity apply boss
        bowser.vy += 0.35;
        bowser.y += bowser.vy;

        // Ground lock/bounce
        if (checkTileSolid(bowser.x + 2, bowser.y + bowser.height, map) || checkTileSolid(bowser.x + bowser.width - 2, bowser.y + bowser.height, map)) {
          bowser.y = Math.floor((bowser.y + bowser.height) / TILE_SIZE) * TILE_SIZE - bowser.height;
          bowser.vy = 0;
        }

        // Horizontal pacing limits
        bowser.x += bowser.vx;
        if (bowser.x < 1650) {
          bowser.vx = 0.8;
        } else if (bowser.x > 1850) {
          bowser.vx = -0.8;
        }

        // Bowser hurt cooldown timers
        if (bowser.hurtTimer > 0) {
          bowser.hurtTimer--;
        }

        // --- HERO COLLISION VS BOWSER ---
        if (
          player.x < bowser.x + bowser.width &&
          player.x + player.width > bowser.x &&
          player.y < bowser.y + bowser.height &&
          player.y + player.height > bowser.y
        ) {
          // If hero stomps on Bowser from above, damage him!
          const isStomp = player.vy > 0.4 && player.y + player.height - player.vy <= bowser.y + 15;
          
          if (isStomp && bowser.hurtTimer === 0) {
            audio.playStomp();
            bowser.health--;
            bowser.hurtTimer = 40; // invincible frames
            player.vy = -6.5; // rebound leap!
            setScore((s) => s + 500);

            // Spawn dramatic particles
            spawnBlockDebris(bowser.x, bowser.y, '#f59e0b');

            if (bowser.health <= 0) {
              bowser.isDead = true;
              audio.playWinFanfare();
              setScore((s) => s + 5000);
            }
          } else {
            handlePlayerDamage();
          }
        }

        // --- CHECK RECOVERY GOAL AXE (SAVING PRINCESS) ---
        // Axe is placed at grid column 63 in level 3
        const gridX = Math.floor((player.x + player.width / 2) / TILE_SIZE);
        const gridY = Math.floor((player.y + player.height / 2) / TILE_SIZE);
        if (gridX >= 62 && gridY >= 7 && gridY <= 10) {
          handleLevelComplete();
          return;
        }
      }

      /* ==========================================
         MOVE FIREBALL ENTIRES FROM BOWSER
         ========================================== */
      fireballsRef.current.forEach((fb) => {
        fb.x += fb.vx;

        // Verify collision with Hero
        if (
          player.x < fb.x + fb.width &&
          player.x + player.width > fb.x &&
          player.y < fb.y + fb.height &&
          player.y + player.height > fb.y
        ) {
          handlePlayerDamage();
        }
      });

      // Filter off-screen fireballs to keep rendering fast
      fireballsRef.current = fireballsRef.current.filter((fb) => fb.x > cameraX.current - 50);

      /* ==========================================
         MOVE HEART PROJECTILES (Level 4 weapon)
         ========================================== */
      heartsRef.current.forEach((heart) => {
        heart.x += heart.vx;
        heart.y += heart.vy;

        // Verify collision with Goombas
        goombasRef.current.forEach((goomba) => {
          if (goomba.isDead) return;

          if (
            heart.x < goomba.x + goomba.width &&
            heart.x + heart.width > goomba.x &&
            heart.y < goomba.y + goomba.height &&
            heart.y + heart.height > goomba.y
          ) {
            // Transform Goomba!
            goomba.isDead = true;
            goomba.vx = 0;
            audio.playPowerup(); // happy flower conversion sound

            // Spawn dynamic Good Flower item
            itemsRef.current.push({
              x: goomba.x,
              y: goomba.y - 12,
              vx: 0,
              vy: -2, // pop upwards!
              width: 24,
              height: 24,
              type: 'flower',
              collected: false,
            });

            // Heart explode particles (beautiful pink hearts)
            for (let i = 0; i < 11; i++) {
              particlesRef.current.push({
                x: goomba.x + 12,
                y: goomba.y + 12,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 2,
                color: i % 2 === 0 ? '#f43f5e' : '#ec4899',
                size: Math.random() * 4 + 2.5,
                life: Math.random() * 20 + 15,
              });
            }

            // Mark heart as hit (out of screen bounds)
            heart.x = -9999;
          }
        });
      });

      // Filter off-screen hearts
      heartsRef.current = heartsRef.current.filter((heart) => heart.x > cameraX.current - 50 && heart.x < cameraX.current + 1000);

      /* ==========================================
         ANITY PARTICLES LIFE SYSTEM
         ========================================== */
      particlesRef.current.forEach((part) => {
        part.x += part.vx;
        part.y += part.vy;
        part.life--;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      /* ==========================================
         RENDER CANVAS DRAWINGS SECTION
         ========================================== */
      // 1. Clear Frame canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Sky backdrop color depending on environment mood!
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (levelId === 1) {
        skyGrad.addColorStop(0, '#0284c7'); // Bright Sky-600
        skyGrad.addColorStop(1, '#bae6fd'); // Light Sky-200
      } else if (levelId === 2) {
        skyGrad.addColorStop(0, '#0f172a'); // Pits deep Slate-900
        skyGrad.addColorStop(1, '#1e1b4b'); // Deep Navy-950
      } else {
        skyGrad.addColorStop(0, '#450a0a'); // Bowser Dark Red Castle-950
        skyGrad.addColorStop(1, '#180000'); // Black
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Save view context to translate camera offset
      ctx.save();
      ctx.translate(-cameraX.current, 0);

      // 3. Draw programmatic tiles depending on character coordinates
      const startTileCol = Math.floor(cameraX.current / TILE_SIZE);
      const endTileCol = startTileCol + Math.ceil(canvas.width / TILE_SIZE) + 1;

      for (let r = 0; r < STAGE_HEIGHT; r++) {
        for (let c = startTileCol; c < endTileCol; c++) {
          if (c < 0 || c >= map[0].length) continue;

          const char = map[r][c];
          const pixelX = c * TILE_SIZE;
          const pixelY = r * TILE_SIZE;

          // Process and render block bouncing offsets
          const activeBlock = blocksRef.current.find((b) => b.gridX === c && b.gridY === r);
          const drawY = pixelY + (activeBlock ? activeBlock.bounceOffset : 0);

          if (char === '#') {
            if (levelId === 1) {
              drawGrassTile(ctx, pixelX, pixelY);
            } else if (levelId === 2) {
              drawUndergroundTile(ctx, pixelX, pixelY);
            } else {
              drawCastleTile(ctx, pixelX, pixelY);
            }
          } else if (char === 'P') {
            // Draw Warp green Pipe
            ctx.fillStyle = '#15803d'; // Pipe rim
            ctx.fillRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = '#22c55e'; // Highlight
            ctx.fillRect(pixelX + 4, pixelY, 6, TILE_SIZE);
            ctx.fillStyle = '#166534'; // Shadow
            ctx.fillRect(pixelX + TILE_SIZE - 6, pixelY, 6, TILE_SIZE);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(pixelX, pixelY, TILE_SIZE, TILE_SIZE);
          } else if (char === 'F') {
            // Level flagpole
            ctx.fillStyle = '#94a3b8'; // Pole metal
            ctx.fillRect(pixelX + 13, pixelY, 6, TILE_SIZE);
            
            // Draw flag at top
            if (r === 2) {
              ctx.fillStyle = '#f59e0b'; // Gold flag knob
              ctx.beginPath();
              ctx.arc(pixelX + 16, pixelY, 8, 0, Math.PI * 2);
              ctx.fill();
            }
            if (r === 4) {
              // Red Triangle flag
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.moveTo(pixelX + 16, pixelY);
              ctx.lineTo(pixelX - 16, pixelY + 14);
              ctx.lineTo(pixelX + 16, pixelY + 28);
              ctx.fill();
            }
          } else if (char === 'X') {
            // Golden goal axe for castle lvl 3 (Bridge trigger)
            ctx.fillStyle = '#fbbf24'; // Gold axe body
            ctx.fillRect(pixelX + 14, pixelY, 4, TILE_SIZE);
            if (r === 8) {
              // Blades
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.arc(pixelX + 16, pixelY + 16, 12, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#f59e0b';
              ctx.fillText('🪓', pixelX + 16, pixelY + 16);
            }
          } else if (char === 'L') {
            // Lava glowing red
            const phase = Math.sin(Date.now() / 150) * 4;
            ctx.fillStyle = '#b91c1c'; // base dark red
            ctx.fillRect(pixelX, pixelY + phase, TILE_SIZE, TILE_SIZE - phase);
            ctx.fillStyle = '#f97316'; // orange accents
            ctx.fillRect(pixelX + 4, pixelY + 4 + phase, 8, 4);
            ctx.fillRect(pixelX + 18, pixelY + 10 + phase, 10, 3);
          }

          if (activeBlock) {
            drawMysteryBlock(ctx, pixelX, drawY, activeBlock.type === 'empty', activeBlock.type === 'mystery_star');
          } else if (char === 'b') {
            drawBrickBlock(ctx, pixelX, drawY, levelId === 3);
          }
        }
      }

      // 4. Draw powerup items
      itemsRef.current.forEach((item) => {
        if (item.collected) return;
        if (item.type === 'mushroom') {
          // Draw elegant cute cute mushroom red and white
          ctx.fillStyle = '#ef4444'; // Red top
          ctx.beginPath();
          ctx.arc(item.x + 12, item.y + 10, 10, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#ffffff'; // Dots
          ctx.beginPath();
          ctx.arc(item.x + 8, item.y + 6, 2.5, 0, Math.PI * 2);
          ctx.arc(item.x + 16, item.y + 6, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a'; // Mushroom stem beige
          ctx.fillRect(item.x + 8, item.y + 10, 8, 10);
          
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
        } else if (item.type === 'star') {
          // Draw beautiful gold glowing star
          ctx.fillStyle = '#fbbf24'; // Gold yellow
          ctx.beginPath();
          const cx = item.x + item.width / 2;
          const cy = item.y + item.height / 2;
          const spikes = 5;
          const outerRadius = 11;
          const innerRadius = 5;
          let rot = (Math.PI / 2) * 3;
          let x = cx;
          let y = cy;
          const step = Math.PI / spikes;

          ctx.moveTo(cx, cy - outerRadius);
          for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fill();

          // Star black eyes
          ctx.fillStyle = '#000000';
          ctx.fillRect(cx - 3, cy - 3, 1.5, 5);
          ctx.fillRect(cx + 1.5, cy - 3, 1.5, 5);

          ctx.strokeStyle = '#d97706'; // thin outline
          ctx.lineWidth = 1;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
        } else if (item.type === 'flower') {
          // Draw a gorgeous power-up flower with green stem and rose pink petals!
          const cx = item.x + item.width / 2;
          const cy = item.y + item.height / 2;
          
          // Stem
          ctx.strokeStyle = '#22c55e'; // Bright green stem
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy + 12);
          ctx.lineTo(cx, cy);
          ctx.stroke();

          // Green Leaves
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(cx - 5, cy + 6, 4, 2, Math.PI / 4, 0, Math.PI * 2);
          ctx.ellipse(cx + 5, cy + 6, 4, 2, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

          // Rose/pink Petals (flower shape)
          ctx.fillStyle = '#f43f5e'; // Beautiful pink rose
          ctx.beginPath();
          ctx.arc(cx, cy - 4, 7, 0, Math.PI * 2); // Core
          ctx.fill();
          
          ctx.fillStyle = '#ec4899'; // Outer petals
          ctx.beginPath();
          ctx.arc(cx - 5, cy - 8, 4.5, 0, Math.PI * 2);
          ctx.arc(cx + 5, cy - 8, 4.5, 0, Math.PI * 2);
          ctx.arc(cx, cy - 10, 4.5, 0, Math.PI * 2);
          ctx.arc(cx - 6, cy - 2, 4.5, 0, Math.PI * 2);
          ctx.arc(cx + 6, cy - 2, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Glowing gold center
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx, cy - 4, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#e11d48';
          ctx.lineWidth = 1;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
        }
      });

      // 5. Draw Goomba enemies
      goombasRef.current.forEach((goomba) => {
        if (goomba.isDead) {
          // Flattened/dead scale squish frame (stays active for a moments)
          if (goomba.deadTimer < 35) {
            ctx.fillStyle = '#7c2d12'; // Brown crushed goomba body
            ctx.fillRect(goomba.x, goomba.y + goomba.height - 6, goomba.width, 6);
          }
          return;
        }

        // Standard Goomba
        ctx.fillStyle = '#ea580c'; // Brown head dome
        ctx.beginPath();
        ctx.arc(goomba.x + goomba.width / 2, goomba.y + 12, 12, Math.PI, 0);
        ctx.fill();
        // Eye pixels
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(goomba.x + 6, goomba.y + 6, 3, 6);
        ctx.fillRect(goomba.x + 15, goomba.y + 6, 3, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(goomba.x + 7, goomba.y + 8, 2, 4);
        ctx.fillRect(goomba.x + 15, goomba.y + 8, 2, 4);

        // Body feet
        ctx.fillStyle = '#fed7aa'; // tan feet base
        ctx.fillRect(goomba.x + 4, goomba.y + 14, 16, 10);
        ctx.fillStyle = '#000000'; // black shoes
        ctx.fillRect(goomba.x + 2, goomba.y + 22, 9, 3);
        ctx.fillRect(goomba.x + 13, goomba.y + 22, 9, 3);
      });

      // 6. Draw Bowser Boss (Level 3 ONLY)
      if (levelId === 3 && !bowserRef.current.isDead) {
        const bowser = bowserRef.current;
        const flashHurt = bowser.hurtTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0;

        if (!flashHurt) {
          // Main thick bulky scale shell
          ctx.fillStyle = '#15803d'; // Dark Green shells
          ctx.fillRect(bowser.x + 12, bowser.y + 8, 32, 48);
          // Yellow tummy spike chest plate
          ctx.fillStyle = '#eab308'; // Orange armor plate
          ctx.fillRect(bowser.x, bowser.y + 20, 16, 32);
          
          // Spike nodes
          ctx.fillStyle = '#ffffff'; // Spikes
          ctx.fillRect(bowser.x + 36, bowser.y + 14, 6, 6);
          ctx.fillRect(bowser.x + 40, bowser.y + 26, 6, 6);
          ctx.fillRect(bowser.x + 36, bowser.y + 38, 6, 6);

          // Head snaps
          ctx.fillStyle = '#16a34a'; // Green snout head
          ctx.fillRect(bowser.x - 8, bowser.y + 8, 20, 16);
          ctx.fillStyle = '#ef4444'; // Red glowing eyes
          ctx.fillRect(bowser.x - 4, bowser.y + 10, 4, 3);
          
          // Spooky Horns
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(bowser.x + 8, bowser.y, 6, 10);
        }
      }

      // 7. Draw Active Bowser Fireballs
      fireballsRef.current.forEach((fb) => {
        // Flickering fireballs orange / yellow
        const pulseColor = Math.random() > 0.5 ? '#f97316' : '#ef4444';
        ctx.fillStyle = pulseColor;
        ctx.beginPath();
        ctx.arc(fb.x + 11, fb.y + 9, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24'; // Yellow nucleus
        ctx.beginPath();
        ctx.arc(fb.x + 11, fb.y + 9, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 7.1 Draw Active Player Heart Projectiles
      heartsRef.current.forEach((heart) => {
        const hcx = heart.x + heart.width / 2;
        const hcy = heart.y + heart.height / 2;
        
        ctx.fillStyle = '#f43f5e'; // Rose pink
        ctx.beginPath();
        ctx.moveTo(hcx, hcy - 2);
        // left hump
        ctx.bezierCurveTo(hcx - 5, hcy - 8, hcx - 10, hcy - 4, hcx - 10, hcy + 2);
        // left bottom curve
        ctx.bezierCurveTo(hcx - 10, hcy + 6, hcx - 5, hcy + 10, hcx, hcy + 13);
        // right bottom curve
        ctx.bezierCurveTo(hcx + 5, hcy + 10, hcx + 10, hcy + 6, hcx + 10, hcy + 2);
        // right hump
        ctx.bezierCurveTo(hcx + 10, hcy - 4, hcx + 5, hcy - 8, hcx, hcy - 2);
        ctx.fill();

        // draw cute white shine on the left top hump
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(hcx - 4, hcy - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 8. Draw Particle debris
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // 9. Draw the Hero Player character
      const invFlash = player.invincibleTimer > 0 && Math.floor(Date.now() / 70) % 2 === 0;
      
      if (!invFlash) {
        // Red Cap & blue trousers programmatically styled around their chosen avatar
        const playerColor = 
          playerProfile.avatar === 'mario' ? '#da291c' :
          playerProfile.avatar === 'luigi' ? '#00b140' :
          playerProfile.avatar === 'peach' ? '#f472b6' :
          playerProfile.avatar === 'bowser' ? '#ea580c' :
          playerProfile.avatar === 'toad' ? '#3b82f6' : '#22c55e'; // yoshi

        const shirtColor = 
          playerProfile.avatar === 'mario' ? '#0038a8' :
          playerProfile.avatar === 'luigi' ? '#000000' :
          playerProfile.avatar === 'peach' ? '#ffffff' :
          playerProfile.avatar === 'bowser' ? '#1e293b' :
          playerProfile.avatar === 'toad' ? '#ffffff' : '#eab308';

        // Draw Player Head
        ctx.fillStyle = '#ffdbac'; // Skin tone beige
        ctx.fillRect(player.x + 3, player.y + 4, 14, 10);

        // Cap/Hair
        ctx.fillStyle = playerColor;
        ctx.fillRect(player.x + 1, player.y, 18, 4); // main cap rim

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(player.x + 13, player.y + 6, 2.5, 3.5);

        // Mustache / details
        if (playerProfile.avatar === 'mario' || playerProfile.avatar === 'luigi' || playerProfile.avatar === 'bowser') {
          ctx.fillStyle = '#4a2511'; // Brown moustache
          ctx.fillRect(player.x + 11, player.y + 10, 6, 2.5);
        }

        // Shirt Torso
        ctx.fillStyle = playerColor;
        ctx.fillRect(player.x + 3, player.y + 14, 14, player.isBig ? 18 : 10);

        // Trousers Overalls
        ctx.fillStyle = shirtColor;
        ctx.fillRect(player.x + 4, player.y + (player.isBig ? 32 : 24), 12, player.isBig ? 10 : 4);

        // Feet / Shoes
        ctx.fillStyle = '#451a03'; // Brown safety boots
        ctx.fillRect(player.x + 2, player.y + player.height - 2, 7, 3);
        ctx.fillRect(player.x + player.width - 9, player.y + player.height - 2, 7, 3);
      }

      ctx.restore(); // Restore camera translation

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, levelId]);

  return (
    <div className="bg-slate-950 rounded-xl border-2 border-indigo-500/20 p-6 shadow-[0_0_20px_rgba(0,0,0,0.4)] font-sans text-slate-100 max-w-4xl mx-auto my-6">
      {/* Heads-up Display Retro Dashboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800/80 p-4 rounded-lg mb-4 select-none">
        
        {/* Profile indicator */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold">JUGADOR</p>
            <p className="text-sm font-extrabold text-white uppercase font-sans leading-none mt-0.5">{playerProfile.nickname}</p>
          </div>
        </div>

        {/* Lives remaining */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Heart
                key={idx}
                className={`w-4 h-4 ${idx < lives ? 'fill-red-500 text-red-500' : 'text-slate-700'}`}
              />
            ))}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-sans font-bold">VIDAS</p>
          </div>
        </div>

        {/* Points & Coins */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-sans font-bold">PUNTOS</p>
            <p className="text-sm font-black text-indigo-400 font-mono">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-sans font-bold font-semibold">MONEDAS</p>
            <p className="text-sm font-black text-indigo-300 font-mono flex items-center gap-1">
              🔑 {coins}
            </p>
          </div>
        </div>

        {starPowerActive && (
          <div className="flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/40 px-2.5 py-1 rounded-lg text-yellow-300 animate-pulse text-xs font-bold select-none">
            <span className="text-sm leading-none">⭐</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-yellow-400/80 uppercase font-mono tracking-wider font-semibold leading-none">SÚPER SALTO</span>
              <span className="font-mono text-[11px] leading-none mt-0.5">{Math.max(0, Math.ceil(playerRef.current.starTimer / 60))}s restan</span>
            </div>
          </div>
        )}

        {flowerPowerActive && (
          <div className="flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg text-rose-300 animate-pulse text-xs font-bold select-none">
            <span className="text-sm leading-none">🌸</span>
            <div className="flex flex-col text-left">
              <span className="text-[9px] text-rose-400/80 uppercase font-mono tracking-wider font-semibold leading-none">PODER FLORAL</span>
              <span className="font-mono text-[11px] leading-none mt-0.5">{Math.max(0, Math.ceil(playerRef.current.flowerTimer / 60))}s restan</span>
            </div>
          </div>
        )}

        {/* Level indicator */}
        <div className="text-center font-mono">
          <p className="text-[10px] text-slate-400">NIVEL ACTUAL</p>
          <p className="text-sm font-bold text-sky-400 mt-0.5">
            {levelId === 1 ? '1: Diplomatura' : levelId === 2 ? '2: Posgrado' : levelId === 3 ? '3: Maestría' : '4: Doctorado'}
          </p>
        </div>

        {/* Time Remaining Clock */}
        <div className="text-center font-mono">
          <p className="text-[10px] text-slate-400">TIEMPO</p>
          <p className={`text-sm font-bold ${timeRemaining < 30 ? 'text-red-500 animate-pulse' : 'text-emerald-400'} mt-0.5`}>
            {timeRemaining}s
          </p>
        </div>

        {/* Sound toggle and quit triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-750 rounded-lg text-slate-300 transition-colors cursor-pointer"
            title={soundOn ? 'Silenciar sonidos' : 'Activar sonido'}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => {
              if (confirm('¿Seguro que deseas salir al panel? El progreso de este nivel no se guardará.')) {
                openDashboard();
              }
            }}
            className="py-1.5 px-3 bg-red-950/20 hover:bg-red-950/60 border border-red-900/40 text-red-300 text-xs rounded-lg transition-colors cursor-pointer"
          >
            Abandonar
          </button>
        </div>
      </div>

      {/* GAME VIEWPORT AND SCREENS CONTAINER */}
      <div className="relative border-4 border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner flex flex-col items-center justify-center">
        
        {/* Standard Canvas Game Element */}
        <canvas
          ref={canvasRef}
          width={740}
          height={416}
          className={`max-w-full block bg-slate-950 ${gameState !== 'playing' ? 'blur-[3px]' : ''}`}
        />

        {/* Screen overlayers based on game states */}
        {gameState === 'intro' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-center p-6 select-none leading-relaxed">
            <h2 className="text-2xl font-black text-indigo-400 uppercase tracking-widest font-sans mb-2 flex items-center gap-2">
              <Flag className="w-6 h-6 animate-pulse text-indigo-400" /> SELECCIÓN DE NIVEL
            </h2>
            <p className="text-xs text-slate-400 max-w-md mb-6 font-sans font-bold leading-normal">
              Supera la meta en cada nivel para registrar tus estadísticas de speedrun en tiempo real en la base de datos Supabase.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
              {/* Level 1 Card */}
              <button
                onClick={() => startLevel(1, true)}
                className="bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 p-4 rounded-xl cursor-pointer text-left transition-all hover:scale-103 group flex flex-col justify-between h-32"
              >
                <div>
                  <span className="text-2xl">🌲</span>
                  <p className="text-xs font-bold text-white font-mono mt-1">Nivel 1: Diplomatura</p>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-semibold">Dificultad básica. Perfecto para calentar saltos.</p>
              </button>

              {/* Level 2 Card */}
              <button
                disabled={!playerProfile.completed_levels.includes(1)}
                onClick={() => startLevel(2, true)}
                className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between h-32 ${
                  playerProfile.completed_levels.includes(1)
                    ? 'bg-slate-900 border-2 border-slate-800 hover:border-sky-500 group hover:scale-103 cursor-pointer'
                    : 'bg-slate-950 border-2 border-slate-900 opacity-40 cursor-not-allowed'
                }`}
              >
                <div>
                  <span className="text-2xl">🦇</span>
                  <p className="text-xs font-bold text-white font-mono mt-1">Nivel 2: Posgrado</p>
                </div>
                {playerProfile.completed_levels.includes(1) ? (
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">Fosos mortales y saltos al vacío estrechos.</p>
                ) : (
                  <p className="text-[9px] text-indigo-400 font-sans mt-1 flex items-center gap-1">🔒 Supera Diplomatura</p>
                )}
              </button>

              {/* Level 3 Card */}
              <button
                disabled={!playerProfile.completed_levels.includes(2)}
                onClick={() => startLevel(3, true)}
                className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between h-32 ${
                  playerProfile.completed_levels.includes(2)
                    ? 'bg-slate-900 border-2 border-slate-800 hover:border-indigo-500 group hover:scale-103 cursor-pointer'
                    : 'bg-slate-950 border-2 border-slate-900 opacity-40 cursor-not-allowed'
                }`}
              >
                <div>
                  <span className="text-2xl">🏰</span>
                  <p className="text-xs font-bold text-white font-mono mt-1">Nivel 3: Maestría</p>
                </div>
                {playerProfile.completed_levels.includes(2) ? (
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">Enfréntate al temible Bowser y esquiva sus llamaradas.</p>
                ) : (
                  <p className="text-[9px] text-indigo-400 font-sans mt-1 flex items-center gap-1">🔒 Supera el Posgrado</p>
                )}
              </button>

              {/* Level 4 Card */}
              <button
                disabled={!playerProfile.completed_levels.includes(3)}
                onClick={() => startLevel(4, true)}
                className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between h-32 ${
                  playerProfile.completed_levels.includes(3)
                    ? 'bg-slate-900 border-2 border-slate-800 hover:border-rose-500 group hover:scale-103 cursor-pointer'
                    : 'bg-slate-950 border-2 border-slate-900 opacity-40 cursor-not-allowed'
                }`}
              >
                <div>
                  <span className="text-2xl">🌸</span>
                  <p className="text-xs font-bold text-white font-mono mt-1">Nivel 4: Doctorado</p>
                </div>
                {playerProfile.completed_levels.includes(3) ? (
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">Dispara corazones a los honguitos para ganar poderes.</p>
                ) : (
                  <p className="text-[9px] text-indigo-400 font-sans mt-1 flex items-center gap-1">🔒 Supera la Maestría</p>
                )}
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-center p-6 select-none font-mono">
            <h2 className="text-4xl font-black text-red-500 tracking-wider mb-2 animate-pulse">GAME OVER</h2>
            <p className="text-xs text-red-300 max-w-sm mb-6">Tu energía se agotó aprendiendo de tus errores. ¡Inténtalo de nuevo!</p>
            
            <div className="flex gap-4">
              <button
                onClick={() => startLevel(levelId, true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>REINTENTAR NIVEL</span>
              </button>
              
              <button
                onClick={openDashboard}
                className="bg-slate-905 border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer transition-colors"
              >
                VOLVER AL PANEL
              </button>
            </div>
          </div>
        )}

        {gameState === 'completed' && (
          <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center text-center p-6 select-none font-mono">
            <span className="text-5xl mb-2 animate-bounce">🎓✨</span>
            <h2 className="text-3xl font-black text-emerald-400 tracking-wider mb-2">¡NIVEL SUPERADO!</h2>
            <p className="text-xs text-emerald-300 max-w-md mb-6 leading-relaxed">
              Monedas recolectadas: <span className="text-indigo-400 font-bold">{coins}</span> | Puntuación total: <span className="text-indigo-400 font-bold">{score}</span>
              <br />
              <span className="text-slate-400 text-[10px]">Guardando estadísticas del speedrun de forma remota en tiempo real...</span>
            </p>

            <div className="flex gap-4">
              {levelId < 4 ? (
                <button
                  onClick={() => startLevel(levelId + 1, false)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <span>SIGUIENTE NIVEL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={openDashboard}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer flex items-center gap-2 shadow-lg"
                >
                  <span>SÍ GANÉ TODO: VOLVER PANEL</span>
                </button>
              )}
              
              <button
                onClick={openDashboard}
                className="bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-bold py-2.5 px-6 rounded-lg text-xs cursor-pointer"
              >
                IR AL PANEL
              </button>
            </div>
          </div>
        )}

        {gameState === 'victory_all' && (
          <div className="absolute inset-0 bg-slate-900 border border-indigo-550/25 flex flex-col items-center justify-center text-center p-8 select-none font-sans">
            <span className="text-6xl mb-3 animate-bounce">🎓🧑‍🎓👩‍🎓✨</span>
            <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent tracking-widest leading-none mb-3">
              ¡MAESTRÍA COMPLETADA!
            </h2>
            <p className="text-xs text-slate-300 max-w-md mb-8 leading-relaxed font-sans">
              ¡Has superado con éxito la Maestría y defendido tu tesis ante Bowser! Tu brillante speedrun ha sido registrado en la base de datos Supabase.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => startLevel(4, false)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3 px-8 rounded-lg text-xs cursor-pointer shadow-xl transition-all hover:scale-105 flex items-center gap-2"
              >
                <span>CURSAR DOCTORADO (NIVEL 4) 🎓</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={openDashboard}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3 px-8 rounded-lg text-xs cursor-pointer shadow-xl transition-all hover:scale-105"
              >
                GESTIONAR MIS ESTADÍSTICAS
              </button>
              
              <button
                onClick={() => setGameState('intro')}
                className="bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 font-bold py-3 px-8 rounded-lg text-xs cursor-pointer"
              >
                REPASAR NIVELES
              </button>
            </div>
          </div>
        )}

        {gameState === 'victory_level4' && (
          <div className="absolute inset-0 bg-slate-950/95 border border-rose-500/30 flex flex-col items-center justify-center text-center p-5 select-none font-sans overflow-y-auto">
            <span className="text-6xl mb-1 animate-bounce">🎓👩‍🎓🧑‍🎓✨🏅</span>
            
            <h2 className="text-2xl font-black bg-gradient-to-r from-rose-400 via-pink-400 to-amber-200 bg-clip-text text-transparent tracking-widest leading-none mb-1 text-center">
              ¡CONGRATULACIONES, DOCTOR/A!
            </h2>
            
            <p className="text-xs font-semibold text-rose-300 mb-2 font-sans text-center">
              ¡Has aprobado y finalizado con éxito tu Doctorado (Jardín de las Flores Buenas)!
            </p>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl max-w-sm w-full mb-3 text-center">
              <span className="text-[9px] text-slate-500 font-mono tracking-wider uppercase">Puntuación Lograda</span>
              <p className="text-2xl font-black text-rose-400 font-mono leading-none mt-0.5">
                {score} <span className="text-xs text-rose-300 font-normal">pts</span>
              </p>
              
              <div className="mt-3 border-t border-slate-800 pt-2">
                <span className="text-[9px] text-slate-500 font-mono tracking-wider block mb-1 text-left">COMPARACIÓN DE PUNTOS CON CONTRINCANTES:</span>
                <div className="space-y-1">
                  {[
                    { nickname: 'Tú (Jugador)', avatar: playerProfile.avatar, high_score: score, isPlayer: true },
                    ...competitors.filter(c => c.nickname !== playerProfile.nickname).map(c => ({ ...c, isPlayer: false }))
                  ]
                    .sort((a, b) => b.high_score - a.high_score)
                    .map((item, idx) => {
                      const isMe = item.isPlayer;
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center justify-between text-[11px] px-2 py-1 rounded-md border ${
                            isMe 
                              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 font-bold' 
                              : 'bg-slate-950/40 border-slate-850 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-[9px] text-slate-500 w-4 text-left">#{idx + 1}</span>
                            <span className="text-xs shrink-0">{item.avatar === 'luigi' ? '🟢' : item.avatar === 'peach' ? '🌸' : item.avatar === 'bowser' ? '🐢' : '🍄'}</span>
                            <span className="truncate max-w-[120px] text-left">{item.nickname}</span>
                          </div>
                          <span className="font-mono font-bold text-rose-400 shrink-0">{item.high_score} pts</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={openDashboard}
                className="bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-extrabold py-2 px-5 rounded-lg text-xs cursor-pointer shadow-lg transition-transform hover:scale-105"
              >
                IR AL PANEL
              </button>
              
              <button
                onClick={() => setGameState('intro')}
                className="bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 font-bold py-2 px-5 rounded-lg text-xs cursor-pointer"
              >
                REPASAR NIVELES
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GAME PAD VIRTUAL CONTROLS FOR RESPONSIVE PREVIEWS & INLINE MOBILE */}
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-900 pt-5 select-none md:hidden font-sans">
        {/* Direction arrows */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={() => { keysPressed.current['moveLeft'] = true; }}
            onTouchEnd={() => { keysPressed.current['moveLeft'] = false; }}
            onMouseDown={() => { keysPressed.current['moveLeft'] = true; }}
            onMouseUp={() => { keysPressed.current['moveLeft'] = false; }}
            className="w-16 h-14 bg-slate-800 hover:bg-slate-705 active:bg-slate-650 cursor-pointer text-slate-200 font-extrabold text-xl flex items-center justify-center rounded-lg transition-colors border-b-4 border-slate-900"
          >
            ◀
          </button>
          
          <button
            onTouchStart={() => { keysPressed.current['moveRight'] = true; }}
            onTouchEnd={() => { keysPressed.current['moveRight'] = false; }}
            onMouseDown={() => { keysPressed.current['moveRight'] = true; }}
            onMouseUp={() => { keysPressed.current['moveRight'] = false; }}
            className="w-16 h-14 bg-slate-800 hover:bg-slate-705 active:bg-slate-650 cursor-pointer text-slate-200 font-extrabold text-xl flex items-center justify-center rounded-lg transition-colors border-b-4 border-slate-900"
          >
            ▶
          </button>
        </div>

        {/* Action jump and heart weapon shoot */}
        <div className="flex justify-end gap-2">
          {levelId === 4 && (
            <button
              onClick={shootHeart}
              className="w-16 h-14 bg-rose-600 active:bg-rose-500 cursor-pointer text-white font-black text-[10px] flex flex-col items-center justify-center rounded-lg tracking-wider border-b-4 border-rose-850 transition-colors"
            >
              <span>DISPARAR</span>
              <span className="text-[8px] opacity-80 leading-none mt-1">CORAZÓN</span>
            </button>
          )}

          <button
            onTouchStart={() => { keysPressed.current['jump'] = true; }}
            onTouchEnd={() => { keysPressed.current['jump'] = false; }}
            onMouseDown={() => { keysPressed.current['jump'] = true; }}
            onMouseUp={() => { keysPressed.current['jump'] = false; }}
            className="w-20 h-14 bg-indigo-600 active:bg-indigo-500 cursor-pointer text-white font-extrabold text-xs flex flex-col items-center justify-center rounded-lg tracking-wider border-b-4 border-indigo-800"
          >
            <span>SALTAR</span>
            <span className="text-[9px] opacity-70">A / SPACE</span>
          </button>
        </div>
      </div>

      <div className="mt-4 text-center text-[11px] text-slate-500 font-mono hidden md:flex items-center justify-center gap-1 flex-wrap">
        <HelpCircle className="w-3.5 h-3.5" /> <strong>Controles de Teclado:</strong> Usar Teclas de Dirección o <kbd className="bg-slate-900 px-1 rounded text-slate-400">A</kbd>/<kbd className="bg-slate-900 px-1 rounded text-slate-400">D</kbd> para moverte y <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Espacio / Flecha Arriba</kbd> para saltar. {levelId === 4 && <span>Usa <kbd className="bg-slate-900 px-1 rounded text-rose-400">F</kbd>, <kbd className="bg-slate-900 px-1 rounded text-rose-400">Z</kbd>, <kbd className="bg-slate-900 px-1 rounded text-rose-400">Shift</kbd> o <kbd className="bg-slate-900 px-1 rounded text-rose-400">Enter</kbd> para disparar corazones.</span>}
      </div>
    </div>
  );
}
