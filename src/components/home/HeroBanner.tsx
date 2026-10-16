import React, { useState, useRef, useCallback } from 'react';
import { Movie } from '../../types/movie';
import { Play, Info, Bookmark, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBannerProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
  isWatchlisted: (movieId: string) => boolean;
  onToggleWatchlist: (movieId: string, e: React.MouseEvent) => void;
  onOpenTrailer: (movie: Movie) => void;
  onOpenWatch?: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movies,
  onSelectMovie,
  isWatchlisted,
  onToggleWatchlist,
  onOpenTrailer,
  onOpenWatch,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Touch / pointer gesture tracking state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);
  const isHorizontalSwipe = useRef<boolean>(false);
  const isSwiping = useRef<boolean>(false);
  const suppressClickUntil = useRef<number>(0);

  // Take top 6 candidates for the featured carousel
  const carouselMovies = movies.slice(0, 6);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + carouselMovies.length) % carouselMovies.length);
  }, [carouselMovies.length]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % carouselMovies.length);
  }, [carouselMovies.length]);

  // Touch Event Handlers (iOS Safari, Android Chrome, Brave)
  // Utilizes touch-action: pan-y to allow 100% natural vertical page scrolling
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    touchDeltaX.current = 0;
    isHorizontalSwipe.current = false;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX.current;
    const dy = touch.clientY - touchStartY.current;

    // Check gesture angle on initial movement
    if (!isHorizontalSwipe.current && Math.abs(dy) > Math.abs(dx)) {
      // User is scrolling vertically down the page — do not interfere!
      return;
    }

    if (Math.abs(dx) > 10) {
      isHorizontalSwipe.current = true;
      isSwiping.current = true;
      touchDeltaX.current = dx;
    }
  };

  const handleTouchEnd = () => {
    const delta = touchDeltaX.current;
    const threshold = 38; // Sensitive, natural swipe threshold in px

    if (isHorizontalSwipe.current && Math.abs(delta) >= threshold) {
      // Suppress any synthetic click event so swipe does not open the movie modal
      suppressClickUntil.current = Date.now() + 350;

      if (delta < -threshold) {
        // Swiped Left -> Advance to next slide
        handleNext();
      } else if (delta > threshold) {
        // Swiped Right -> Return to previous slide
        handlePrev();
      }
    }

    // Reset touch refs
    touchStartX.current = null;
    touchStartY.current = null;
    touchDeltaX.current = 0;
    isHorizontalSwipe.current = false;
    setTimeout(() => {
      isSwiping.current = false;
    }, 100);
  };

  const handleCardClick = (movie: Movie) => {
    // If user just performed a swipe gesture, ignore the click
    if (Date.now() < suppressClickUntil.current || isSwiping.current) {
      return;
    }
    onSelectMovie(movie);
  };

  if (!carouselMovies || carouselMovies.length === 0) return null;

  return (
    <section 
      className="relative w-full max-w-full overflow-hidden mb-6 pt-1 select-none"
      style={{ touchAction: 'pan-y' }}
      aria-label="Featured Movie Carousel"
    >
      <div className="relative w-full px-0 sm:px-2">
        
        {/* Carousel Frame with Slide Track */}
        <div 
          className="relative w-full aspect-[16/10] sm:aspect-[21/9] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F88F22]/20 shadow-2xl bg-[#0D0402]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Animated Slide Track */}
          <div 
            className="flex w-full h-full transition-transform duration-500 ease-out will-change-transform"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {carouselMovies.map((movie, idx) => {
              const watchlisted = isWatchlisted(movie.id);
              const isActive = idx === currentIndex;

              return (
                <div
                  key={movie.id}
                  onClick={() => handleCardClick(movie)}
                  className="relative w-full h-full shrink-0 min-w-full cursor-pointer group"
                  aria-hidden={!isActive}
                >
                  {/* Backdrop Image */}
                  <img
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />

                  {/* Cinematic Scrims for Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0402] via-[#0A0402]/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0A0402]/90 via-[#0A0402]/45 to-transparent sm:w-2/3" />

                  {/* Top-Right Resolution Badge */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md border border-[#F88F22]/30 text-[10px] font-bold text-[#FFE3B3] tracking-wider uppercase">
                      4K Ultra HD
                    </span>
                  </div>

                  {/* Bottom Foreground Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7 z-10 space-y-2 max-w-2xl">
                    {/* Featured Tag */}
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EA6113]" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#FBB931]">
                        {movie.universeName || 'Featured Premiere'}
                      </span>
                    </div>

                    {/* Movie Title */}
                    <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
                      {movie.title}
                    </h1>

                    {/* Metadata Line */}
                    <div className="flex items-center gap-2 text-xs text-neutral-300 font-medium">
                      <span className="flex items-center gap-1 text-[#FBB931] font-bold tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-[#FBB931] text-[#FBB931]" />
                        {movie.rating ? movie.rating.toFixed(1) : '7.8'}
                      </span>
                      <span>•</span>
                      <span>{movie.year}</span>
                      <span>•</span>
                      <span className="text-neutral-400 truncate max-w-[150px] sm:max-w-none">
                        {movie.genres.slice(0, 2).join(', ')}
                      </span>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1.5">
                      {/* Watch Movie (if onOpenWatch provided) */}
                      {onOpenWatch && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenWatch(movie);
                          }}
                          className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sunset-gradient-btn text-white font-bold text-xs sm:text-sm shadow-[0_4px_16px_rgba(234,97,19,0.4)] transition-all active:scale-95 cursor-pointer"
                          title={`Watch Full Movie — ${movie.title}`}
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Watch Movie</span>
                        </button>
                      )}

                      {/* Play Trailer Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrailer(movie);
                        }}
                        className={`flex items-center gap-2 px-4 py-2 sm:px-4 sm:py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer ${
                          onOpenWatch
                            ? 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15'
                            : 'sunset-gradient-btn shadow-[0_4px_16px_rgba(234,97,19,0.4)]'
                        }`}
                        title={`Play Trailer — ${movie.title}`}
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Play Trailer</span>
                      </button>

                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMovie(movie);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/10 transition-all active:scale-95 cursor-pointer"
                        title="View Full Details"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      {/* Watchlist Bookmark */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(movie.id, e);
                        }}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          watchlisted
                            ? 'bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white shadow-[0_0_14px_rgba(234,97,19,0.7)]'
                            : 'bg-black/60 hover:bg-black/80 text-neutral-300 hover:text-white backdrop-blur-md border border-white/15'
                        }`}
                        title={watchlisted ? 'Remove from Watchlist' : 'Save to Watchlist'}
                        aria-label="Toggle watchlist"
                      >
                        <Bookmark className={`w-4 h-4 ${watchlisted ? 'fill-white' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accessible Desktop and Mobile Navigation Arrows */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-3 pointer-events-none z-20">
            <button
              type="button"
              onClick={handlePrev}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center pointer-events-auto border border-[#F88F22]/30 backdrop-blur-md transition-all active:scale-90 hover:scale-105 cursor-pointer shadow-lg"
              aria-label="Previous movie slide"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE3B3]" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/65 hover:bg-black/90 text-white flex items-center justify-center pointer-events-auto border border-[#F88F22]/30 backdrop-blur-md transition-all active:scale-90 hover:scale-105 cursor-pointer shadow-lg"
              aria-label="Next movie slide"
              title="Next"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFE3B3]" />
            </button>
          </div>
        </div>

        {/* Carousel Indicator Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {carouselMovies.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 h-1.5 bg-gradient-to-r from-[#EA6113] to-[#FBB931] shadow-[0_0_8px_rgba(248,143,34,0.6)]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
