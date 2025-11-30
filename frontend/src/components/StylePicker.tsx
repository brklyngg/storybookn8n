'use client';

import { Check } from 'lucide-react';

interface ArtStyle {
  id: string;
  name: string;
  prompt: string;
  gradient: string;
  icon: string;
}

const artStyles: ArtStyle[] = [
  {
    id: 'watercolor',
    name: 'Watercolor',
    prompt: 'watercolor children\'s book illustration, soft and whimsical, gentle brush strokes',
    gradient: 'from-sky-200 via-rose-200 to-amber-200',
    icon: '🎨',
  },
  {
    id: 'pixar',
    name: 'Pixar 3D',
    prompt: 'Pixar-style 3D render, vibrant and expressive, high quality CGI',
    gradient: 'from-blue-400 via-purple-400 to-pink-400',
    icon: '✨',
  },
  {
    id: 'papercut',
    name: 'Paper Cutout',
    prompt: 'paper cutout collage, colorful and tactile, layered paper art',
    gradient: 'from-orange-300 via-yellow-200 to-green-300',
    icon: '📄',
  },
  {
    id: 'disney',
    name: 'Classic Disney',
    prompt: 'classic Disney animation style, warm and magical, hand-drawn feel',
    gradient: 'from-indigo-300 via-pink-300 to-yellow-200',
    icon: '🏰',
  },
  {
    id: 'ghibli',
    name: 'Studio Ghibli',
    prompt: 'Studio Ghibli inspired, detailed and serene, magical realism',
    gradient: 'from-emerald-300 via-sky-300 to-blue-300',
    icon: '🌸',
  },
  {
    id: 'cartoon',
    name: 'Bold Cartoon',
    prompt: 'bold cartoon style, bright colors and clean lines, modern illustration',
    gradient: 'from-red-400 via-yellow-400 to-blue-400',
    icon: '💫',
  },
];

interface StylePickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function StylePicker({ value, onChange }: StylePickerProps) {
  // Find selected style by matching prompt
  const selectedStyle = artStyles.find(s => s.prompt === value) || artStyles[0];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-700">
        Art Style
      </label>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {artStyles.map((style) => {
          const isSelected = style.prompt === value;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.prompt)}
              className={`
                relative group p-4 rounded-xl text-left
                transition-all duration-300
                ${isSelected
                  ? 'ring-2 ring-amber-500 ring-offset-2 shadow-lg'
                  : 'hover:shadow-md hover:scale-[1.02]'
                }
              `}
            >
              {/* Gradient background */}
              <div className={`
                absolute inset-0 rounded-xl bg-gradient-to-br ${style.gradient}
                opacity-60 group-hover:opacity-80 transition-opacity
              `} />

              {/* Content */}
              <div className="relative z-10">
                <div className="text-2xl mb-2">{style.icon}</div>
                <div className="font-medium text-stone-800 text-sm">
                  {style.name}
                </div>
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected style preview */}
      <div className="mt-4 p-3 bg-stone-50 rounded-xl">
        <p className="text-xs text-stone-500 leading-relaxed">
          <span className="font-medium text-stone-600">Style prompt:</span>{' '}
          {selectedStyle.prompt}
        </p>
      </div>
    </div>
  );
}
