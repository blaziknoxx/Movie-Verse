import React from 'react';
import { X, ExternalLink, Play, AlertCircle } from 'lucide-react';
import { Movie } from '../../types/movie';

interface TrailerModalProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ movie, isOpen, onClose }) => {
  if (!isOpen || !movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-[#0c0408] rounded-3xl border border-rose-500/30 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Play className="w-4 h-4 fill-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                {movie.title}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Official Cinematic Trailer & Stream Options
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white flex items-center justify-center transition-colors border border-white/10"
            aria-label="Close player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player or Fallback */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center">
          {movie.trailerKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}?autoplay=1&rel=0`}
              title={`${movie.title} Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="p-8 text-center max-w-md space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Trailer Currently Unavailable</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  An official video preview is not currently available for this title, but verified streaming and rental options are ready below.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Streaming Availability Footer */}
        <div className="p-4 sm:p-5 bg-[#12050d] border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
              Where to Watch Full Film
            </div>
            <div className="text-xs text-neutral-300 mt-0.5">
              Available across verified platforms & JustWatch directory
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {movie.streamingPlatforms.map((platform, idx) => (
              <a
                key={idx}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-semibold transition-all group"
              >
                <span>{platform.name}</span>
                <span className="text-[10px] text-rose-400">({platform.type})</span>
                <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-white" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
