import React from 'react';
import { Shield, Eye, Flame, Award, Sparkles, Layers, Activity } from 'lucide-react';

interface TraitBadgeProps {
  category: 'background' | 'eyes' | 'mouth' | 'head' | 'body' | 'aura' | 'tier';
  value: string;
  effectSummary?: string;
  className?: string;
}

const CATEGORY_META = {
  background: {
    label: 'Biome',
    icon: Layers,
    color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/20',
  },
  eyes: {
    label: 'Targeting',
    icon: Eye,
    color: 'text-blue-400 border-blue-500/40 bg-blue-950/20',
  },
  mouth: {
    label: 'Attack',
    icon: Flame,
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/20',
  },
  head: {
    label: 'Ability',
    icon: Shield,
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
  },
  body: {
    label: 'Archetype',
    icon: Activity,
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/20',
  },
  aura: {
    label: 'Chaos',
    icon: Sparkles,
    color: 'text-pink-400 border-pink-500/40 bg-pink-950/20',
  },
  tier: {
    label: 'Cartridge Tier',
    icon: Award,
    color: 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20',
  },
};

export default function TraitBadge({
  category,
  value,
  effectSummary,
  className = '',
}: TraitBadgeProps) {
  const meta = CATEGORY_META[category] || CATEGORY_META.tier;
  const Icon = meta.icon;

  return (
    <div
      className={`flex flex-col rounded-md border p-2 text-xs transition hover:border-zinc-500 ${meta.color} ${className}`}
    >
      <div className="flex items-center space-x-1.5 opacity-80">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] uppercase tracking-wider font-semibold">
          {meta.label}
        </span>
      </div>
      <div className="mt-1 font-bold text-white tracking-wide truncate">
        {value}
      </div>
      {effectSummary && (
        <div className="mt-1 text-[10px] text-zinc-300 font-medium leading-tight">
          {effectSummary}
        </div>
      )}
    </div>
  );
}
