import React from 'react';
import { MOODS } from '../../data/moviesData';
import { Sparkles } from 'lucide-react';

interface MoodBrowserProps {
  selectedMoodId: string | null;
  onSelectMood: (moodId: string | null) => void;
}

export const MoodBrowser: React.FC<MoodBrowserProps> = ({
  selectedMoodId,
  onSelectMood
}) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse by Mood</h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">Filter cinema experiences by emotional atmospheric state</p>
        </div>
        {selectedMoodId && (
          <button
            onClick={() => onSelectMood(null)}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Mood Carousel / Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {MOODS.map((mood) => {
          const isSelected = selectedMoodId === mood.id;
          return (
            <button
              key={mood.id}
              onClick={() => onSelectMood(isSelected ? null : mood.id)}
              className={`text-left p-3 rounded-2xl transition-all duration-200 border ${
                isSelected
                  ? 'bg-rose-950/80 border-rose-500 text-white shadow-[0_0_18px_rgba(225,29,72,0.3)] scale-[1.02]'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-neutral-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: mood.accent }}
                />
                <span className="text-xs font-semibold truncate leading-tight">
                  {mood.name}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                {mood.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
