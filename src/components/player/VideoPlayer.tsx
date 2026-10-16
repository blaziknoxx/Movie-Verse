/**
 * Movie Verse — Universal Cinematic Video Player Architecture
 * Developer — Estiaq Mehedi
 * 
 * Supports:
 * - Direct MP4 HTML5 playback with custom cinematic controls & fullscreen API
 * - Adaptive HLS (m3u8) streaming via Hls.js with native Safari fallback
 * - Official iframe embeds from approved allowlisted providers (YouTube, Vimeo)
 * - Safe webpage / external directory fallbacks for un-embeddable portals
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import { PlaybackSource } from '../../types/movie';
import { validatePlaybackUrl } from '../../services/videoSecurityService';
import { PlayerLoadingState } from './PlayerLoadingState';
import { PlayerErrorState } from './PlayerErrorState';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, Settings, ShieldCheck, Film
} from 'lucide-react';

interface VideoPlayerProps {
  source: PlaybackSource;
  title: string;
  posterUrl?: string;
  onSourceError?: (source: PlaybackSource) => void;
  autoPlay?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  title,
  posterUrl,
  onSourceError,
  autoPlay = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [retryKey, setRetryKey] = useState<number>(0);

  // Validate the URL through security rules (memoized to maintain referential stability)
  const validation = useMemo(() => validatePlaybackUrl(source.url), [source.url]);

  // Track previous source URL to only reset player when source URL actually changes
  const prevUrlRef = useRef<string>(source.url);

  useEffect(() => {
    if (prevUrlRef.current !== source.url) {
      prevUrlRef.current = source.url;
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(undefined);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [source.url]);

  // For embed sources (NexStream, YouTube, Vimeo), set a fallback timer
  // to ensure the loading overlay NEVER blocks the user on mobile / Android
  // even if third-party assets, adblockers, or fonts delay the iframe's onload event.
  useEffect(() => {
    if (source.type === 'embed') {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [source.type, source.url, retryKey]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement;
      setIsFullscreen(Boolean(fsEl));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Controls auto-hide timer for HTML5 / HLS video
  const triggerUserActivity = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setIsSpeedMenuOpen(false);
      }, 3500);
    }
  }, [isPlaying]);

  // Manage HLS and MP4 direct video attachments (Embeds manage their own iframe lifecycle)
  useEffect(() => {
    // If source is embed or external webpage, let the dedicated branches handle rendering
    if (source.type === 'embed' || source.type === 'webpage' || !validation.isValid || !validation.canEmbedInIframe) {
      return;
    }

    const videoEl = videoRef.current;
    if (!videoEl) return;

    // Clean up previous HLS instance if any
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let isSubscribed = true;

    if (source.type === 'hls') {
      // 1. Check if native HLS is supported (Safari / iOS)
      if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = source.url;
        if (autoPlay) {
          videoEl.play().catch(() => {
            // Autoplay with audio may be blocked by browser policy
            videoEl.muted = true;
            setIsMuted(true);
            videoEl.play().catch(() => {});
          });
        }
      } else if (Hls.isSupported()) {
        // 2. Use Hls.js for Chrome, Firefox, Edge, Android
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        hlsRef.current = hls;

        hls.loadSource(source.url);
        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!isSubscribed) return;
          setIsLoading(false);
          if (autoPlay) {
            videoEl.play().catch(() => {
              videoEl.muted = true;
              setIsMuted(true);
              videoEl.play().catch(() => {});
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!isSubscribed) return;
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('[HLS] Network error, attempting recovery:', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('[HLS] Media error, attempting recovery:', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('[HLS] Fatal unrecoverable error:', data);
                hls.destroy();
                setHasError(true);
                setErrorMessage('HLS stream encountered an unrecoverable connection failure.');
                setIsLoading(false);
                onSourceError?.(source);
                break;
            }
          }
        });
      } else {
        setHasError(true);
        setErrorMessage('Your browser does not support HLS streaming.');
        setIsLoading(false);
      }
    } else if (source.type === 'mp4') {
      videoEl.src = source.url;
      videoEl.load();
      if (autoPlay) {
        videoEl.play().catch(() => {
          videoEl.muted = true;
          setIsMuted(true);
          videoEl.play().catch(() => {});
        });
      }
    }

    return () => {
      isSubscribed = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [source.url, source.type, autoPlay, validation.isValid, validation.canEmbedInIframe, onSourceError]);

  // Video event handlers
  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    triggerUserActivity();
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('The media file could not be loaded or the format is unsupported.');
    onSourceError?.(source);
  };

  // User actions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.warn);
    }
    triggerUserActivity();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !videoRef.current.muted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
    if (!newMuted && videoRef.current.volume === 0) {
      videoRef.current.volume = 0.5;
      setVolume(0.5);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.min(Math.max(0, videoRef.current.currentTime + seconds), duration);
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    triggerUserActivity();
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setIsSpeedMenuOpen(false);
      triggerUserActivity();
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(() => {});
      } else if ((container as any).webkitRequestFullscreen) {
        (container as any).webkitRequestFullscreen();
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        // iOS Safari native video fullscreen
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage(undefined);
    setIsLoading(true);
    setRetryKey(prev => prev + 1);
    if (source.type !== 'embed' && videoRef.current) {
      videoRef.current.load();
      if (autoPlay) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Case 1: External Webpage link or un-embeddable provider
  if (source.type === 'webpage' || (!validation.canEmbedInIframe && source.type === 'embed')) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F88F22]/25 shadow-2xl sunset-card-glow min-h-[220px] sm:min-h-[340px]"
      >
        <PlayerErrorState
          title={title}
          isWebpageFallback={true}
          providerName={source.name}
          externalUrl={source.url}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Case 2: Playback Error
  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F88F22]/25 shadow-2xl sunset-card-glow min-h-[220px] sm:min-h-[340px]"
      >
        <PlayerErrorState
          title={title}
          errorMessage={errorMessage}
          providerName={source.name}
          externalUrl={source.url}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Case 3: Official Allowlisted Embed (NexStream / YouTube / Vimeo / Archive.org)
  if (source.type === 'embed') {
    const embedUrl = validation.sanitizedUrl || source.url;

    return (
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F88F22]/30 shadow-[0_16px_50px_rgba(0,0,0,0.95)] sunset-card-glow group min-h-[220px] sm:min-h-[360px] md:min-h-[460px]"
      >
        {/* 
          Loading Overlay:
          - Rendered only while isLoading is true.
          - Once loading finishes or timeout expires, completely unmounted from the DOM
            so that Android Chrome can deliver native touch events and UserActivation directly to the iframe.
        */}
        {isLoading && (
          <div 
            className="absolute inset-0 z-20 transition-opacity duration-300 pointer-events-none"
            aria-hidden={!isLoading}
          >
            <PlayerLoadingState title={title} sourceName={source.name} />
          </div>
        )}

        <iframe
          key={`${source.id}-${retryKey}`}
          src={embedUrl}
          title={`${title} — ${source.name}`}
          onLoad={() => {
            setIsLoading(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
            setErrorMessage('Embed player failed to initialize. Please check network connection or retry.');
          }}
          allow="autoplay *; fullscreen *; encrypted-media *; picture-in-picture *; clipboard-write *; screen-wake-lock *; web-share *; accelerometer *; gyroscope *"
          allowFullScreen={true}
          referrerPolicy="origin-when-cross-origin"
          loading="eager"
          className="w-full h-full border-0 relative z-10"
          style={{ width: '100%', height: '100%', minHeight: '220px', border: 'none' }}
        />
      </div>
    );
  }

  // Case 4: Native / Adaptive Video Stream (MP4 / HLS)
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      ref={containerRef}
      onMouseMove={triggerUserActivity}
      onTouchStart={triggerUserActivity}
      onClick={triggerUserActivity}
      className="relative w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-[#F88F22]/30 shadow-[0_16px_50px_rgba(0,0,0,0.95)] sunset-card-glow group select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={posterUrl}
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onError={handleVideoError}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer relative z-0"
      />

      {/* Loading overlay */}
      {isLoading && (
        <PlayerLoadingState title={title} sourceName={source.name} />
      )}

      {/* Top Floating Badge (Source info & Security Check) */}
      <div 
        className={`absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-[#F88F22]/25 text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md">
            <Film className="w-3 h-3 text-[#FBB931]" />
            <span className="max-w-[140px] sm:max-w-[200px] truncate">{source.name}</span>
          </span>
          {source.quality && (
            <span className="px-2 py-0.5 rounded-md bg-[#2B1307]/80 border border-[#F88F22]/40 text-[10px] font-extrabold text-[#FFE3B3] uppercase tracking-wider">
              {source.quality}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-emerald-400 font-semibold">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">Secure Stream</span>
        </div>
      </div>

      {/* Center Big Play Button (when paused) */}
      {!isPlaying && !isLoading && (
        <div 
          onClick={togglePlay}
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black/35 backdrop-blur-[2px] transition-all"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full sunset-gradient-btn text-white flex items-center justify-center shadow-[0_0_30px_rgba(234,97,19,0.7)] transform hover:scale-110 active:scale-95 transition-all">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white translate-x-0.5" />
          </div>
        </div>
      )}

      {/* Custom Bottom Control Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-8 pb-3 px-3 sm:px-5 space-y-2 transition-opacity duration-300 pointer-events-auto ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrub Bar */}
        <div className="relative w-full flex items-center group/scrubber cursor-pointer">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 sm:h-2 rounded-full appearance-none bg-white/20 accent-[#F88F22] cursor-pointer focus:outline-none transition-all group-hover/scrubber:h-2.5"
            style={{
              background: `linear-gradient(to right, #EA6113 0%, #FBB931 ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%, rgba(255,255,255,0.2) 100%)`
            }}
            aria-label="Seek timeline"
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-white text-xs pt-1">
          {/* Left Controls: Play/Pause, Skips, Time, Volume */}
          <div className="flex items-center gap-2 sm:gap-3.5">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              )}
            </button>

            {/* Skip 10s Backward */}
            <button
              type="button"
              onClick={() => skipSeconds(-10)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-90"
              title="Rewind 10s"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip 10s Forward */}
            <button
              type="button"
              onClick={() => skipSeconds(10)}
              className="w-8 h-8 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-90"
              title="Fast Forward 10s"
              aria-label="Fast forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time Indicator */}
            <div className="font-mono text-[11px] text-[#FFE3B3] tracking-wider font-semibold pl-1">
              <span>{formatTime(currentTime)}</span>
              <span className="text-neutral-500 mx-1">/</span>
              <span className="text-neutral-400">{formatTime(duration)}</span>
            </div>

            {/* Volume & Mute */}
            <div className="hidden sm:flex items-center gap-2 pl-2">
              <button
                type="button"
                onClick={toggleMute}
                className="w-8 h-8 rounded-lg hover:bg-white/10 text-neutral-300 hover:text-white flex items-center justify-center transition-all active:scale-90"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 rounded-full appearance-none bg-white/20 accent-[#F88F22] cursor-pointer"
                aria-label="Adjust volume"
              />
            </div>
          </div>

          {/* Right Controls: Playback Speed, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] font-bold text-[#FFE3B3] transition-all flex items-center gap-1 active:scale-95"
                title="Playback Speed"
                aria-label="Playback Speed"
              >
                <Settings className="w-3 h-3 text-[#FBB931]" />
                <span>{playbackSpeed}x</span>
              </button>

              {isSpeedMenuOpen && (
                <div className="absolute bottom-9 right-0 py-1.5 px-1 bg-[#1A0B05] border border-[#F88F22]/30 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[75px] z-30 backdrop-blur-xl">
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => changeSpeed(s)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold text-left transition-colors ${
                        playbackSpeed === s
                          ? 'sunset-gradient-btn text-white'
                          : 'text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all active:scale-90"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
