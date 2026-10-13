import React, { useState } from 'react';
import { Movie, MovieUniverse, MovieConnection, RelationshipType } from '../../types/movie';
import { UNIVERSES, CONNECTIONS, MOVIES } from '../../data/moviesData';
import { Network, ArrowRight, ArrowLeftRight, GitFork, BookOpen, Layers, CheckCircle2, Info } from 'lucide-react';

interface ConnectionsViewProps {
  onSelectMovie: (movie: Movie) => void;
  selectedUniverseId?: string;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({
  onSelectMovie,
  selectedUniverseId: initialUniverseId
}) => {
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>(
    initialUniverseId || 'dune-universe'
  );
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all');

  const activeUniverse = UNIVERSES.find(u => u.id === selectedUniverseId) || UNIVERSES[0];

  // Movies in this universe
  const universeMovies = MOVIES.filter(m => m.universeId === activeUniverse.id);

  // Relevant connections (source or target inside this universe, or all if broad)
  const universeConnections = CONNECTIONS.filter(conn => {
    const isSourceInUniverse = universeMovies.some(m => m.id === conn.sourceMovieId);
    const isTargetInUniverse = universeMovies.some(m => m.id === conn.targetMovieId);
    const matchesUniverse = isSourceInUniverse || isTargetInUniverse;
    if (!matchesUniverse) return false;
    if (filterType === 'all') return true;
    return conn.relationshipType === filterType;
  });

  const getMovie = (id: string) => MOVIES.find(m => m.id === id);

  const relationshipBadges: { type: RelationshipType; label: string; color: string }[] = [
    { type: 'direct-sequel', label: 'Direct Sequel', color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40' },
    { type: 'prequel', label: 'Prequel', color: 'border-blue-500/30 text-blue-300 bg-blue-950/40' },
    { type: 'spin-off', label: 'Spin-Off', color: 'border-amber-500/30 text-amber-300 bg-amber-950/40' },
    { type: 'story-related', label: 'Story-Related / Lineage', color: 'border-purple-500/30 text-purple-300 bg-purple-950/40' },
    { type: 'optional-companion', label: 'Optional Companion', color: 'border-rose-500/30 text-rose-300 bg-rose-950/40' },
    { type: 'shared-characters', label: 'Shared Characters', color: 'border-cyan-500/30 text-cyan-300 bg-cyan-950/40' },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header section */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-2">
          <Network className="w-5 h-5 text-rose-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Movie Connection Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Universe & Storyline Genealogy
        </h1>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          Untangle how films correlate: canonical sequels, ancient prequels, spin-offs, and narrative companions that enrich the mythology without requiring blind completionism.
        </p>
      </div>

      {/* Universe Switcher Bar */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Select Cinematic Universe</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {UNIVERSES.map((universe) => {
            const isSelected = selectedUniverseId === universe.id;
            return (
              <button
                key={universe.id}
                onClick={() => setSelectedUniverseId(universe.id)}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-rose-950/70 border-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/5 text-neutral-300'
                }`}
              >
                <div className="text-xs font-bold text-rose-400 mb-1">{universe.genres.join(' · ')}</div>
                <div className="text-sm font-semibold text-white line-clamp-1">{universe.name}</div>
                <div className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">{universe.tagline}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Universe Lore Spotlight Banner */}
      <div className="p-6 rounded-3xl liquid-glass border border-rose-500/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
            Current Lore Scope
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {activeUniverse.name}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            {activeUniverse.description}
          </p>
        </div>
      </div>

      {/* Relationship Type Filters */}
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <span className="text-xs text-neutral-400 mr-2">Filter Connection Type:</span>
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
            filterType === 'all'
              ? 'bg-white text-black border-white'
              : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
          }`}
        >
          All Relationships ({universeConnections.length})
        </button>
        {relationshipBadges.map(badge => (
          <button
            key={badge.type}
            onClick={() => setFilterType(badge.type)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              filterType === badge.type
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-white/5 text-neutral-400 border-white/10 hover:text-white'
            }`}
          >
            {badge.label}
          </button>
        ))}
      </div>

      {/* Visual Relationship Cards */}
      <div className="space-y-4">
        {universeConnections.length === 0 ? (
          <div className="p-8 rounded-2xl liquid-glass text-center text-neutral-400 text-sm">
            No connections found for the selected filter in this universe.
          </div>
        ) : (
          universeConnections.map((conn) => {
            const source = getMovie(conn.sourceMovieId);
            const target = getMovie(conn.targetMovieId);
            if (!source || !target) return null;

            return (
              <div
                key={conn.id}
                className="liquid-glass-card rounded-2xl p-5 border border-white/10 hover:border-rose-500/30 transition-all space-y-4"
              >
                {/* Visual Connection Node Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Source Movie */}
                  <div
                    onClick={() => onSelectMovie(source)}
                    className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-white/5 transition-colors flex-1"
                  >
                    <img
                      src={source.posterUrl}
                      alt={source.title}
                      className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0"
                    />
                    <div>
                      <div className="text-[11px] text-neutral-400">{source.year} · {source.genres[0]}</div>
                      <div className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                        {source.title}
                      </div>
                      <div className="text-[10px] text-neutral-400">{source.director}</div>
                    </div>
                  </div>

                  {/* Relationship Link Pill & Indicator */}
                  <div className="flex flex-col items-center justify-center px-4 py-2 text-center shrink-0">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold mb-1">
                      <ArrowRight className="w-4 h-4 hidden md:inline" />
                      <span>{conn.relationshipLabel}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400">
                      {conn.isCanonical ? 'Canonical Continuity' : 'Thematic Lineage'}
                    </span>
                  </div>

                  {/* Target Movie */}
                  <div
                    onClick={() => onSelectMovie(target)}
                    className="flex items-center gap-3 cursor-pointer group p-2 rounded-xl hover:bg-white/5 transition-colors flex-1 md:justify-end text-left md:text-right"
                  >
                    <div className="order-2 md:order-1">
                      <div className="text-[11px] text-neutral-400">{target.year} · {target.genres[0]}</div>
                      <div className="text-sm font-bold text-white group-hover:text-rose-300 transition-colors">
                        {target.title}
                      </div>
                      <div className="text-[10px] text-neutral-400">{target.director}</div>
                    </div>
                    <img
                      src={target.posterUrl}
                      alt={target.title}
                      className="w-12 h-16 object-cover rounded-lg border border-white/10 shrink-0 order-1 md:order-2"
                    />
                  </div>

                </div>

                {/* Explanation text */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-neutral-300 leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{conn.description}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
