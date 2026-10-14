/**
 * Movie Verse — My CineProfile
 * Developer — Estiaq Mehedi
 * 
 * Luxury personal cinephile dashboard:
 * - Bespoke cinema mask avatars with avatar selector modal
 * - Dynamic cinephile badges & editable display name
 * - Genuine viewing statistics & estimated watch hours
 * - Calculated Vibe DNA / Genre Matrix from tracked activity
 * - Watchlist, completed history, and custom user collections
 * - Cache management, honest local sync status, and JSON data backup/restore
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Movie, CustomCollection, UserProfile } from '../../types/movie';
import { storageService } from '../../services/storageService';
import { MovieCard } from '../discover/MovieCard';
import { AVATAR_PRESETS, getAvatarById } from './avatarPresets';
import { 
  User, Bookmark, CheckCircle2, Clock, Film, Sparkles, 
  Trash2, Plus, Edit2, Check, X, Download, Upload, 
  RefreshCw, ArrowLeft, Shield, ExternalLink, Flame, 
  Award, Heart, Layers, Sliders, Database, Search, FolderPlus, Info
} from 'lucide-react';

interface CineProfileViewProps {
  onBack: () => void;
  onSelectMovie: (movie: Movie) => void;
  watchlist: string[];
  watched: string[];
  onToggleWatchlist: (movieId: string, e?: React.MouseEvent) => void;
  onToggleWatched: (movieId: string) => void;
  onOpenTrailer?: (movie: Movie) => void;
}

type ProfileTab = 'overview' | 'watchlist' | 'watched' | 'collections' | 'settings';

export const CineProfileView: React.FC<CineProfileViewProps> = ({
  onBack,
  onSelectMovie,
  watchlist,
  watched,
  onToggleWatchlist,
  onToggleWatched,
  onOpenTrailer
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [collections, setCollections] = useState<CustomCollection[]>(() => storageService.getCollections());
  const [cachedCount, setCachedCount] = useState<number>(() => storageService.getCachedMoviesCount());

  // Edit Profile States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(profile.displayName);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Custom Collections State
  const [showCreateCollectionModal, setShowCreateCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editCollectionName, setEditCollectionName] = useState('');
  const [collectionMovieSearch, setCollectionMovieSearch] = useState('');

  // Status feedback
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile changes
  const handleSaveName = () => {
    const trimmed = editNameValue.trim() || 'Cinephile';
    const updated = { ...profile, displayName: trimmed };
    setProfile(updated);
    storageService.saveProfile(updated);
    setIsEditingName(false);
    showFeedback('Display name updated');
  };

  const handleSelectAvatar = (avatarId: string) => {
    const updated = { ...profile, avatarId };
    setProfile(updated);
    storageService.saveProfile(updated);
    setShowAvatarModal(false);
    showFeedback('Avatar updated');
  };

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // Resolve genuine cached Movie objects for watched & watchlist
  const watchedMovies = useMemo(() => {
    return watched
      .map(id => storageService.getCachedMovie(id))
      .filter((m): m is Movie => Boolean(m));
  }, [watched]);

  const watchlistMovies = useMemo(() => {
    return watchlist
      .map(id => storageService.getCachedMovie(id))
      .filter((m): m is Movie => Boolean(m));
  }, [watchlist]);

  // Statistics Calculations (Part 6)
  const stats = useMemo(() => {
    const totalWatched = watched.length;
    
    // Count shows vs movies based on duration string (e.g. "Series" or "Eps")
    let showCount = 0;
    let totalMinutes = 0;

    watchedMovies.forEach(m => {
      if (m.duration && (m.duration.toLowerCase().includes('series') || m.duration.toLowerCase().includes('eps'))) {
        showCount += 1;
        // Estimate series runtime (e.g. 8 eps * ~50 min)
        const match = m.duration.match(/(\d+)\s*eps/i);
        const eps = match ? parseInt(match[1], 10) : 6;
        totalMinutes += eps * 50;
      } else if (m.duration) {
        // Parse "2h 46m" or "105m"
        const hoursMatch = m.duration.match(/(\d+)\s*h/i);
        const minsMatch = m.duration.match(/(\d+)\s*m/i);
        const h = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
        const min = minsMatch ? parseInt(minsMatch[1], 10) : 0;
        totalMinutes += (h * 60) + min;
      }
    });

    const hours = (totalMinutes / 60).toFixed(1);

    // Calculate Favourite Genre from actual watched + watchlist movies
    const genreCounts: Record<string, number> = {};
    [...watchedMovies, ...watchlistMovies].forEach(m => {
      (m.genres || []).forEach(g => {
        if (g && g !== 'Cinema') {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        }
      });
    });

    let topGenre = 'None yet';
    let maxCount = 0;
    Object.entries(genreCounts).forEach(([genre, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topGenre = genre;
      }
    });

    // Dynamic Cinephile Badge (Part 5)
    let badgeTitle = 'Film Novice';
    let badgeColor = 'text-neutral-300 border-neutral-700 bg-neutral-900/50';
    if (totalWatched >= 36) {
      badgeTitle = 'Master Cinephile';
      badgeColor = 'text-[#FBB931] border-[#FBB931]/60 bg-[#2A1308]';
    } else if (totalWatched >= 21) {
      badgeTitle = 'Film Critic';
      badgeColor = 'text-[#F88F22] border-[#F88F22]/50 bg-[#241108]';
    } else if (totalWatched >= 11) {
      badgeTitle = 'Pro Cinephile';
      badgeColor = 'text-[#EA6113] border-[#EA6113]/50 bg-[#1E0D05]';
    } else if (totalWatched >= 5) {
      badgeTitle = 'Movie Buff';
      badgeColor = 'text-[#FFE3B3] border-[#F88F22]/40 bg-[#160B05]';
    } else if (totalWatched >= 1) {
      badgeTitle = 'Curious Cinephile';
      badgeColor = 'text-amber-200 border-amber-500/30 bg-amber-950/30';
    }

    return {
      totalWatched,
      totalMovies: totalWatched - showCount,
      totalShows: showCount,
      totalHours: parseFloat(hours),
      topGenre,
      badgeTitle,
      badgeColor
    };
  }, [watched, watchedMovies, watchlistMovies]);

  // Vibe DNA Matrix (Part 7)
  const vibeMatrix = useMemo(() => {
    const allTracked = [...watchedMovies, ...watchlistMovies];
    const totalCount = allTracked.length;

    const categories = [
      { id: 'sci-fi', name: 'Sci-Fi', matchKeys: ['sci-fi', 'space', 'cyberpunk', 'futuristic'] },
      { id: 'thriller', name: 'Thriller', matchKeys: ['thriller', 'crime', 'tension', 'suspense'] },
      { id: 'mystery', name: 'Mystery', matchKeys: ['mystery', 'detective', 'puzzle', 'investigation'] },
      { id: 'dark', name: 'Dark & Atmospheric', matchKeys: ['dark', 'noir', 'gritty', 'horror', 'gothic'] },
      { id: 'drama', name: 'Drama', matchKeys: ['drama', 'emotional', 'character'] },
      { id: 'action', name: 'Action', matchKeys: ['action', 'adventure', 'stunt', 'combat'] },
      { id: 'romance', name: 'Romance', matchKeys: ['romance', 'love'] },
      { id: 'comedy', name: 'Comedy & Feel-Good', matchKeys: ['comedy', 'animation', 'family', 'feel-good'] }
    ];

    if (totalCount === 0) {
      return { hasData: false, categories: categories.map(c => ({ ...c, percentage: 0, count: 0 })) };
    }

    let totalPoints = 0;
    const scoredCategories = categories.map(cat => {
      let score = 0;
      allTracked.forEach(m => {
        const textToSearch = [
          ...(m.genres || []),
          ...(m.vibeTags || []),
          m.overview || ''
        ].join(' ').toLowerCase();

        const matched = cat.matchKeys.some(k => textToSearch.includes(k));
        if (matched) score += 1;
      });
      totalPoints += score;
      return { ...cat, count: score, rawScore: score };
    });

    const divisor = Math.max(1, totalPoints);
    const finalized = scoredCategories.map(cat => {
      const percentage = Math.min(100, Math.round((cat.count / divisor) * 100));
      return {
        ...cat,
        percentage
      };
    });

    return { hasData: true, categories: finalized };
  }, [watchedMovies, watchlistMovies]);

  // Collections Handlers (Part 8)
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    const newCol: CustomCollection = {
      id: `col-${Date.now()}`,
      name: newCollectionName.trim(),
      description: newCollectionDesc.trim() || 'Custom curated collection.',
      movieIds: [],
      createdAt: Date.now()
    };
    storageService.saveCollection(newCol);
    setCollections(storageService.getCollections());
    setNewCollectionName('');
    setNewCollectionDesc('');
    setShowCreateCollectionModal(false);
    showFeedback(`Collection "${newCol.name}" created`);
  };

  const handleDeleteCollection = (id: string, name: string) => {
    if (confirm(`Delete collection "${name}"?`)) {
      storageService.deleteCollection(id);
      setCollections(storageService.getCollections());
      if (activeCollectionId === id) setActiveCollectionId(null);
      showFeedback(`Collection deleted`);
    }
  };

  const handleRenameCollection = (id: string) => {
    if (!editCollectionName.trim()) return;
    const col = collections.find(c => c.id === id);
    if (!col) return;
    const updated = { ...col, name: editCollectionName.trim() };
    storageService.saveCollection(updated);
    setCollections(storageService.getCollections());
    setEditingCollectionId(null);
    showFeedback('Collection renamed');
  };

  // Cache & Backup Handlers (Part 9)
  const handleClearCache = () => {
    if (confirm('Clear local movie metadata cache? Your watchlist and collections will be preserved.')) {
      storageService.clearMovieCache();
      setCachedCount(0);
      showFeedback('Local movie cache cleared');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movieverse_cineprofile_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Backup file exported');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = storageService.importBackupJSON(text);
        if (ok) {
          setProfile(storageService.getProfile());
          setCollections(storageService.getCollections());
          showFeedback('Profile & collections restored from backup');
        } else {
          showFeedback('Invalid backup file format', 'error');
        }
      } catch {
        showFeedback('Could not read backup file', 'error');
      }
    };
    reader.readAsText(file);
  };

  const activeAvatar = getAvatarById(profile.avatarId);

  // Starter Collection Ideas
  const STARTER_IDEAS = [
    { name: 'Rainy Night Noir', desc: 'Moody detective thrillers, rain-soaked asphalt, and moral ambiguity.' },
    { name: 'Mind-Bending Marathons', desc: 'Temporal paradoxes, fractured realities, and puzzle narratives.' },
    { name: 'Epic Space Sagas', desc: 'Interstellar empires, cosmic dread, and monolithic world-building.' },
    { name: 'High-Octane Stunts', desc: 'Relentless kinetic stunt choreography and adrenaline set-pieces.' }
  ];

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden pb-12">
      
      {/* Toast Feedback Notification */}
      {feedbackMsg && (
        <div className={`fixed top-20 right-4 sm:right-8 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce ${
          feedbackMsg.type === 'success' 
            ? 'bg-[#180C05] border-[#FBB931]/60 text-[#FFE3B3]' 
            : 'bg-red-950/90 border-red-500/50 text-red-200'
        }`}>
          <Sparkles className="w-3.5 h-3.5 text-[#F88F22]" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <div className="flex items-center justify-between gap-4 border-b border-[#F88F22]/15 pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#F88F22]/20 text-xs font-bold text-neutral-300 hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 text-[#F88F22]" />
          <span>Back to Discover</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local Device Vault</span>
        </div>
      </div>

      {/* 1. Custom CineProfile Header (Part 5) */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#241108]/95 via-[#160B05]/95 to-[#0D0704] border border-[#F88F22]/30 shadow-2xl overflow-hidden sunset-card-glow">
        
        {/* Ambient Top Gradient Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 sunset-gradient-bar" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          {/* Avatar with Click-to-Change Button */}
          <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-[#FBB931]/60 p-1 bg-[#120502] shadow-[0_0_24px_rgba(248,143,34,0.35)] transition-transform group-hover:scale-105">
              {activeAvatar.render('w-full h-full')}
            </div>
            <div className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[11px] font-bold text-center px-1">
              Change Avatar
            </div>
            <button 
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full sunset-gradient-btn flex items-center justify-center text-white border border-black shadow"
              title="Change avatar mask"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Profile Identity Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            
            {/* Display Name with Quick Edit */}
            <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    maxLength={32}
                    className="px-3 py-1 rounded-xl bg-black/70 border border-[#F88F22] text-white text-lg font-bold focus:outline-none focus:ring-1 focus:ring-[#FBB931]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-lg sunset-gradient-btn text-white"
                    title="Save name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditNameValue(profile.displayName);
                      setIsEditingName(false);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 text-neutral-400 hover:text-white"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {profile.displayName}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-neutral-400 hover:text-[#FBB931] transition-colors p-1"
                    title="Edit display name"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Dynamic Cinephile Badge */}
              <div className={`px-3 py-1 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${stats.badgeColor}`}>
                <Award className="w-3.5 h-3.5 text-[#FBB931]" />
                <span>{stats.badgeTitle}</span>
              </div>
            </div>

            {/* Avatar Mask Title */}
            <p className="text-xs font-semibold text-[#FBB931]">
              Mask Identity: <span className="text-[#FFE3B3]">{activeAvatar.name}</span> · {activeAvatar.category}
            </p>

            {/* Bio */}
            <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
              {profile.bio}
            </p>

            {/* Storage Transparency Note */}
            <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>100% Private On-Device Storage</span>
              </span>
              <span>•</span>
              <span>{watched.length} Completed</span>
              <span>•</span>
              <span>{watchlist.length} In Queue</span>
              <span>•</span>
              <span>{collections.length} Collections</span>
            </div>

          </div>

        </div>

      </div>

      {/* 2. Primary Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-touch py-1 border-b border-white/5">
        {[
          { id: 'overview', label: 'CineProfile Overview', icon: Sparkles },
          { id: 'watchlist', label: `Watchlist (${watchlist.length})`, icon: Bookmark },
          { id: 'watched', label: `Completed History (${watched.length})`, icon: CheckCircle2 },
          { id: 'collections', label: `Custom Collections (${collections.length})`, icon: Layers },
          { id: 'settings', label: 'Vault & Cache Settings', icon: Sliders },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'sunset-gradient-btn text-white shadow-md'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Viewing Statistics Metrics Grid (Part 6) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-[#F88F22]/20 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Completed Films</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                {stats.totalWatched}
              </div>
              <div className="text-[10px] text-neutral-400">
                {stats.totalMovies} movies · {stats.totalShows} series
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-[#F88F22]/20 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Estimated Watch Time</span>
                <Clock className="w-4 h-4 text-[#FBB931]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                {stats.totalHours} <span className="text-sm font-semibold text-neutral-400">hrs</span>
              </div>
              <div className="text-[10px] text-neutral-400">
                Summed from genuine runtime data
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-[#F88F22]/20 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Favourite Genre</span>
                <Heart className="w-4 h-4 text-[#EA6113]" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight line-clamp-1">
                {stats.topGenre}
              </div>
              <div className="text-[10px] text-neutral-400">
                Derived from user activity
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl liquid-glass-card border border-[#F88F22]/20 space-y-1">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Watchlist Queue</span>
                <Bookmark className="w-4 h-4 text-[#F88F22]" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                {watchlist.length}
              </div>
              <div className="text-[10px] text-neutral-400">
                Titles saved for viewing
              </div>
            </div>

          </div>

          {/* Vibe DNA / Genre Matrix Breakdown (Part 7) */}
          <div className="p-6 sm:p-8 rounded-3xl liquid-glass-panel border border-[#F88F22]/25 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EA6113]" />
                  <span>My Vibe DNA / Genre Matrix</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Personalized atmospheric balance calculated from your tracked watchlist and completed history
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#FBB931] uppercase tracking-wider px-2.5 py-1 rounded-lg bg-[#2A1308] border border-[#F88F22]/30 self-start sm:self-auto">
                Estimated From Activity
              </span>
            </div>

            {!vibeMatrix.hasData ? (
              <div className="p-8 text-center space-y-3 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#241108] border border-[#F88F22]/30 flex items-center justify-center mx-auto text-[#FBB931]">
                  <Film className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Vibe DNA Calibration Awaiting Activity</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Start building your personalized cinema profile by saving films to your Watchlist or marking watched titles. Your genre matrix updates automatically.
                </p>
                <button
                  onClick={onBack}
                  className="px-4 py-2 rounded-xl sunset-gradient-btn text-white text-xs font-bold"
                >
                  Explore Movies
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {vibeMatrix.categories.map(cat => (
                  <div key={cat.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{cat.name}</span>
                      <span className="text-[#FBB931] font-mono font-bold tabular-nums">
                        {cat.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#EA6113] to-[#FBB931] rounded-full transition-all duration-700" 
                        style={{ width: `${Math.max(4, cat.percentage)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Completed Spotlight Strip */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recently Completed Spotlight</span>
              </h3>
              <button
                onClick={() => setActiveTab('watched')}
                className="text-xs font-semibold text-[#FBB931] hover:underline"
              >
                View all ({watched.length})
              </button>
            </div>

            {watchedMovies.length === 0 ? (
              <div className="p-8 rounded-2xl liquid-glass text-center text-xs text-neutral-400 border border-white/5">
                No completed movies recorded yet. Mark films as watched from detail sheets or cards.
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-touch py-1">
                {watchedMovies.slice(0, 6).map(movie => (
                  <div key={movie.id} className="w-[120px] sm:w-[145px] shrink-0">
                    <MovieCard
                      movie={movie}
                      onSelectMovie={onSelectMovie}
                      isWatchlisted={watchlist.includes(movie.id)}
                      onToggleWatchlist={onToggleWatchlist}
                      onOpenTrailer={onOpenTrailer}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT: WATCHLIST */}
      {activeTab === 'watchlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#F88F22]" />
                <span>My Watchlist ({watchlist.length})</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Titles queued for your upcoming cinema sessions
              </p>
            </div>
          </div>

          {watchlistMovies.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl liquid-glass text-center border border-white/5 max-w-md mx-auto space-y-3">
              <Bookmark className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Your Watchlist is Empty</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Click the bookmark icon on any movie card or detail page to curate your personal queue.
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-semibold"
              >
                <span>Browse Movies</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {watchlistMovies.map(movie => (
                <div key={movie.id} className="relative group">
                  <MovieCard
                    movie={movie}
                    onSelectMovie={onSelectMovie}
                    isWatchlisted={true}
                    onToggleWatchlist={onToggleWatchlist}
                    onOpenTrailer={onOpenTrailer}
                  />
                  <div className="mt-2 flex items-center justify-between px-1">
                    <button
                      onClick={() => onToggleWatched(movie.id)}
                      className="text-[11px] text-neutral-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{watched.includes(movie.id) ? 'Watched' : 'Mark Watched'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: WATCHED HISTORY */}
      {activeTab === 'watched' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Completed Films ({watched.length})</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Your verified cinematic chronicle and completed viewing journey
              </p>
            </div>
          </div>

          {watchedMovies.length === 0 ? (
            <div className="p-12 sm:p-16 rounded-3xl liquid-glass text-center border border-white/5 max-w-md mx-auto space-y-3">
              <CheckCircle2 className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Completed Movies Yet</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Mark movies as watched to track total hours, advance your Cinephile rank, and unlock your Vibe DNA matrix.
              </p>
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-semibold"
              >
                <span>Discover Films</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {watchedMovies.map(movie => (
                <div key={movie.id} className="relative group">
                  <MovieCard
                    movie={movie}
                    onSelectMovie={onSelectMovie}
                    isWatchlisted={watchlist.includes(movie.id)}
                    onToggleWatchlist={onToggleWatchlist}
                    onOpenTrailer={onOpenTrailer}
                  />
                  <div className="mt-2 flex items-center justify-between px-1 text-[11px]">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Watched
                    </span>
                    <button
                      onClick={() => onToggleWatched(movie.id)}
                      className="text-neutral-500 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CUSTOM COLLECTIONS (Part 8) */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FBB931]" />
                <span>Custom Movie Collections ({collections.length})</span>
              </h3>
              <p className="text-xs text-neutral-400">
                Organize your own curated thematic marathon lists and festival queues
              </p>
            </div>

            <button
              onClick={() => setShowCreateCollectionModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl sunset-gradient-btn text-white text-xs font-bold shadow-md self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Collection</span>
            </button>
          </div>

          {/* Starter Ideas Prompt Row */}
          <div className="p-4 rounded-2xl bg-[#140804]/90 border border-[#F88F22]/20 space-y-2">
            <span className="text-[10px] font-bold text-[#FBB931] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#EA6113]" />
              <span>Curator Starter Prompts (Click to create):</span>
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {STARTER_IDEAS.map(idea => (
                <button
                  key={idea.name}
                  onClick={() => {
                    setNewCollectionName(idea.name);
                    setNewCollectionDesc(idea.desc);
                    setShowCreateCollectionModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3 text-[#F88F22]" />
                  <span>{idea.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Collections List */}
          {collections.length === 0 ? (
            <div className="p-12 rounded-3xl liquid-glass text-center border border-white/5 space-y-3 max-w-md mx-auto">
              <FolderPlus className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-base font-bold text-white">No Custom Collections Yet</h4>
              <p className="text-xs text-neutral-400">
                Create your first personalized collection above or select a starter prompt.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {collections.map(col => {
                const colMovies = col.movieIds
                  .map(id => storageService.getCachedMovie(id))
                  .filter((m): m is Movie => Boolean(m));

                return (
                  <div key={col.id} className="p-5 sm:p-6 rounded-2xl liquid-glass-panel border border-[#F88F22]/20 space-y-4">
                    
                    {/* Collection Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                      <div>
                        {editingCollectionId === col.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editCollectionName}
                              onChange={(e) => setEditCollectionName(e.target.value)}
                              className="px-3 py-1 rounded-xl bg-black/70 border border-[#F88F22] text-white text-sm font-bold"
                              autoFocus
                            />
                            <button
                              onClick={() => handleRenameCollection(col.id)}
                              className="p-1 rounded-lg sunset-gradient-btn text-white text-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingCollectionId(null)}
                              className="p-1 rounded-lg bg-white/10 text-neutral-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-white">{col.name}</h4>
                            <button
                              onClick={() => {
                                setEditingCollectionId(col.id);
                                setEditCollectionName(col.name);
                              }}
                              className="text-neutral-500 hover:text-white"
                              title="Rename collection"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-neutral-400">{col.description}</p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="text-xs text-[#FBB931] font-semibold">
                          {col.movieIds.length} titles
                        </span>
                        <button
                          onClick={() => handleDeleteCollection(col.id, col.name)}
                          className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                          title="Delete collection"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Collection Movies Grid */}
                    {colMovies.length === 0 ? (
                      <div className="p-6 rounded-xl bg-black/40 text-center text-xs text-neutral-400 border border-white/5">
                        No films added yet. Save movies to your watchlist or browse titles to populate this collection.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {colMovies.map(movie => (
                          <div key={movie.id} className="relative group">
                            <MovieCard
                              movie={movie}
                              onSelectMovie={onSelectMovie}
                              isWatchlisted={watchlist.includes(movie.id)}
                              onToggleWatchlist={onToggleWatchlist}
                              onOpenTrailer={onOpenTrailer}
                            />
                            <button
                              onClick={() => {
                                storageService.removeMovieFromCollection(col.id, movie.id);
                                setCollections(storageService.getCollections());
                                showFeedback(`Removed from ${col.name}`);
                              }}
                              className="mt-1 text-[10px] text-neutral-500 hover:text-red-400 text-center w-full block transition-colors"
                            >
                              Remove from Collection
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* TAB CONTENT: SETTINGS & CACHE (Part 9) */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          
          {/* Storage & Privacy Status Card */}
          <div className="p-6 rounded-2xl liquid-glass-panel border border-[#F88F22]/20 space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Storage Integrity & Privacy Status</span>
            </h3>
            <div className="space-y-2 text-xs text-neutral-300 leading-relaxed">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span>Storage Mode:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Local On-Device (LocalStorage)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span>Cloud Synchronization:</span>
                <span className="text-neutral-400 font-medium">
                  Not connected (Local Only · No remote account required)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span>Telemetry & Profiling:</span>
                <span className="text-emerald-400 font-medium">
                  Zero analytics, zero tracking cookies
                </span>
              </div>
            </div>
          </div>

          {/* Local Metadata Cache Management */}
          <div className="p-6 rounded-2xl liquid-glass-panel border border-[#F88F22]/20 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-[#FBB931]" />
              <span>Local Movie Metadata Cache</span>
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Movie Verse stores loaded TMDB titles and verified details in your local browser cache to enable instantaneous navigation and offline library inspection.
            </p>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
              <span className="text-neutral-300">Cached Titles in Memory:</span>
              <span className="text-[#FBB931] font-mono font-bold">{cachedCount} records</span>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[#F88F22]/30 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#F88F22]" />
              <span>Clear Metadata Cache</span>
            </button>
          </div>

          {/* Backup & Restore JSON Data */}
          <div className="p-6 rounded-2xl liquid-glass-panel border border-[#F88F22]/20 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-[#EA6113]" />
              <span>Data Portability & Backup</span>
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Export an unencrypted JSON backup of your CineProfile, watchlist, completed viewing history, and custom collections to transfer across devices.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl sunset-gradient-btn text-white text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Backup (JSON)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore from Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportBackup}
              />
            </div>
          </div>

          {/* Connected Services (Honest Unlinked Status) */}
          <div className="p-6 rounded-2xl liquid-glass-panel border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-neutral-400" />
              <span>Connected Cinephile Services</span>
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Integrations with external community tracking networks require backend OAuth authorization credentials.
            </p>
            <div className="space-y-2">
              {[
                { name: 'Trakt.tv', status: 'Not connected · OAuth 2.0 required', note: 'Sync scrobbles and ratings' },
                { name: 'Letterboxd', status: 'Not connected · Partner API required', note: 'Import diary and lists' },
                { name: 'IMDb', status: 'Not connected · Third-party authorization required', note: 'Sync watchlists' }
              ].map(service => (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                  <div>
                    <div className="font-bold text-white">{service.name}</div>
                    <div className="text-[10px] text-neutral-500">{service.note}</div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/5 text-neutral-400">
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* AVATAR SELECTOR MODAL (Part 5) */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto liquid-glass-panel rounded-3xl p-6 sm:p-8 border border-[#F88F22]/30 space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#EA6113]" />
                  <span>Choose Your Cinematic Mask Identity</span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Select an original handcrafted avatar mask matching your cinema persona
                </p>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {AVATAR_PRESETS.map(preset => {
                const isSelected = profile.avatarId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectAvatar(preset.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col items-center text-center space-y-2 group ${
                      isSelected
                        ? 'bg-[#2A1308] border-[#FBB931] shadow-[0_0_16px_rgba(251,185,49,0.4)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 hover:border-[#F88F22]/40'
                    }`}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-1 bg-[#120502]">
                      {preset.render('w-full h-full')}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white group-hover:text-[#FFE3B3] transition-colors line-clamp-1">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-[#F88F22] font-medium">
                        {preset.category}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* CREATE COLLECTION MODAL */}
      {showCreateCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md liquid-glass-panel rounded-3xl p-6 border border-[#F88F22]/30 space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#FBB931]" />
                <span>Create Custom Collection</span>
              </h4>
              <button
                onClick={() => setShowCreateCollectionModal(false)}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Collection Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rainy Night Noir, Sci-Fi Epics..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F88F22]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-1">
                  Description / Theme:
                </label>
                <textarea
                  placeholder="Atmosphere, viewing mood, or marathon focus..."
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-[#F88F22]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateCollectionModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-neutral-400 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim()}
                className="px-4 py-2 rounded-xl sunset-gradient-btn text-white text-xs font-bold disabled:opacity-50"
              >
                Create Collection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
