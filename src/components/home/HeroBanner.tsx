import React, { useState, useEffect, useRef, memo } from 'react';
import { Movie } from '../../types/movie';
import { Play, Info, Bookmark, Star, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  isWatchlisted: (movieId: string) => boolean;
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  onOpenTrailer: (movie: Movie) => void;
  onOpenWatch?: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = memo(({
  movies,
  onSelectMovie,
  isWatchlisted,
  onToggleWatchlist,
  onOpenTrailer,
  onOpenWatch
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isInteractingRef = useRef(false);

  // Take top 6 candidates for the featured carousel
  const carouselMovies = movies.slice(0, 6);
  const currentMovie = carouselMovies[currentIndex] || movies[0];

  useEffect(() => {
    // Auto-advance carousel every 7 seconds when visible and not interacting
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !isInteractingRef.current && carouselMovies.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % carouselMovies.length);
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [carouselMovies.length]);

  if (!currentMovie) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + carouselMovies.length) % carouselMovies.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % carouselMovies.length);
  };

  return (
    <section 
      className="relative w-full max-w-full overflow-hidden mb-6 pt-1"
      onMouseEnter={() => { isInteractingRef.current = true; }}
      onMouseLeave={() => { isInteractingRef.current = false; }}
      onTouchStart={() => { isInteractingRef.current = true; }}
      onTouchEnd={() => { setTimeout(() => { isInteractingRef.current = false; }, 4000); }}
    >
      {/* Featured Card Wrapper with Peek Preview on the Right */}
      <div className="relative w-full px-0 sm:px-2">
        
        {/* Main Hero Card */}
        <div 
          onClick={() => onSelectMovie(currentMovie)}
          className="group relative w-full aspect-[16/10] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/[0.08] shadow-2xl bg-[#12040b]"
        >
          {/* Backdrop Image with High Loading Priority for LCP */}
          <img
            src={currentMovie.backdropUrl || currentMovie.posterUrl}
            alt={currentMovie.title}
            className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
            loading="eager"
            // @ts-ignore
            fetchpriority="high"
            decoding="async"
          />

          {/* Cinematic Scrims for Flawless Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070104] via-[#070104]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070104]/90 via-[#070104]/40 to-transparent sm:w-2/3" />

          {/* Top-Right Resolution / Universe Badge */}
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white tracking-wider uppercase">
              4K Ultra HD
            </span>
          </div>

          {/* Bottom Foreground Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7 z-10 space-y-2 max-w-2xl">
            {/* Universe or Featured Tag */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-red-400">
                {currentMovie.universeName || 'Featured Premiere'}
              </span>
            </div>

            {/* Movie Title */}
            <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
              {currentMovie.title}
            </h1>

            {/* Metadata Line */}
            <div className="flex items-center gap-2 text-xs text-neutral-300 font-medium">
              <span className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {currentMovie.rating ? currentMovie.rating.toFixed(1) : '8.0'}
              </span>
              <span>•</span>
              <span>{currentMovie.year}</span>
              <span>•</span>
              <span className="text-neutral-400 truncate max-w-[150px] sm:max-w-none">
                {currentMovie.genres.slice(0, 2).join(', ')}
              </span>
            </div>

            {/* Synopsis / Overview */}
            {currentMovie.overview && (
              <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed max-w-xl hidden sm:block">
                {currentMovie.overview}
              </p>
            )}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1.5">
              {/* Prominent Play / Watch Movie Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenWatch) {
                    onOpenWatch(currentMovie);
                  } else {
                    onOpenTrailer(currentMovie);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sunset-gradient-btn text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(234,97,19,0.4)] transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Movie</span>
              </button>

              {/* Watch Trailer Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTrailer(currentMovie);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FFE3B3] hover:text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-[#F88F22]/30 transition-all active:scale-95"
              >
                <span>Trailer</span>
              </button>

              {/* View Details Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMovie(currentMovie);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/10 transition-all active:scale-95"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Details</span>
              </button>

              {/* Watchlist Bookmark */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(currentMovie.id, e);
                }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all ${
                  isWatchlisted(currentMovie.id)
                    ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(229,9,20,0.6)]'
                    : 'bg-black/60 hover:bg-black/80 text-neutral-300 hover:text-white backdrop-blur-md border border-white/10'
                }`}
                title="Save to Watchlist"
                aria-label="Toggle watchlist"
              >
                <Bookmark className={`w-4 h-4 ${isWatchlisted(currentMovie.id) ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>

          {/* Desktop Carousel Arrows */}
          <div className="hidden sm:flex absolute inset-y-0 left-0 right-0 items-center justify-between px-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePrev}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center pointer-events-auto border border-white/10 backdrop-blur-md transition-transform active:scale-90"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-9 h-9 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center pointer-events-auto border border-white/10 backdrop-blur-md transition-transform active:scale-90"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {carouselMovies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex
                  ? 'w-6 h-1.5 bg-red-600'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
});

HeroBanner.displayName = 'HeroBanner';
