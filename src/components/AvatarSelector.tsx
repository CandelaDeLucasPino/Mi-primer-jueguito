import { Check } from 'lucide-react';

export interface AvatarOption {
  key: string;
  name: string;
  emoji: string;
  colorBg: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    key: 'mario',
    name: 'Mario',
    emoji: '🔴',
    colorBg: 'bg-red-950/40 hover:bg-red-950/60',
    borderColor: 'border-red-500/30 hover:border-red-500',
    textColor: 'text-red-400',
    accentColor: 'bg-red-600',
  },
  {
    key: 'luigi',
    name: 'Luigi',
    emoji: '🟢',
    colorBg: 'bg-emerald-950/40 hover:bg-emerald-950/60',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500',
    textColor: 'text-emerald-400',
    accentColor: 'bg-emerald-600',
  },
  {
    key: 'peach',
    name: 'Peach',
    emoji: '🌸',
    colorBg: 'bg-pink-950/40 hover:bg-pink-950/60',
    borderColor: 'border-pink-500/30 hover:border-pink-500',
    textColor: 'text-pink-400',
    accentColor: 'bg-pink-600',
  },
  {
    key: 'bowser',
    name: 'Bowser',
    emoji: '🐉',
    colorBg: 'bg-orange-950/40 hover:bg-orange-950/60',
    borderColor: 'border-orange-500/30 hover:border-orange-500',
    textColor: 'text-orange-400',
    accentColor: 'bg-orange-600',
  },
  {
    key: 'toad',
    name: 'Toad',
    emoji: '🍄',
    colorBg: 'bg-blue-950/40 hover:bg-blue-950/60',
    borderColor: 'border-blue-500/30 hover:border-blue-500',
    textColor: 'text-blue-400',
    accentColor: 'bg-blue-600',
  },
  {
    key: 'yoshi',
    name: 'Yoshi',
    emoji: '🦖',
    colorBg: 'bg-lime-950/40 hover:bg-lime-950/60',
    borderColor: 'border-lime-500/30 hover:border-lime-500',
    textColor: 'text-lime-400',
    accentColor: 'bg-lime-600',
  },
];

interface AvatarSelectorProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export default function AvatarSelector({ selectedKey, onSelect }: AvatarSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
        Selecciona tu Personaje (Avatar)
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {AVATAR_OPTIONS.map((avatar) => {
          const isSelected = selectedKey === avatar.key;
          return (
            <button
              key={avatar.key}
              type="button"
              onClick={() => onSelect(avatar.key)}
              className={`relative cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-250 ${
                isSelected
                  ? `border-indigo-500 ${avatar.colorBg} scale-105 shadow-[0_0_15px_rgba(79,70,229,0.3)]`
                  : `border-slate-800 bg-slate-950/40 hover:scale-102 ${avatar.colorBg} ${avatar.borderColor}`
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 text-white rounded-full p-0.5 shadow-md">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
              <span className="text-3xl mb-1 filter drop-shadow" role="img" aria-label={avatar.name}>
                {avatar.emoji}
              </span>
              <span className={`text-[11px] font-bold ${avatar.textColor}`}>
                {avatar.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
