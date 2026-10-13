import React, { useState } from 'react';
import { WhereToWatchSite, SiteCategory } from '../../types/movie';
import { storageService } from '../../services/storageService';
import { 
  Tv, ExternalLink, Search, Plus, CheckCircle, ShieldAlert, 
  Trash2, Filter, Globe, Sparkles, X, Info
} from 'lucide-react';

export const WhereToWatchView: React.FC = () => {
  const [sites, setSites] = useState<WhereToWatchSite[]>(() => storageService.getAllSites());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SiteCategory | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding custom site
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<SiteCategory>('Official Free Streaming');
  const [formDescription, setFormDescription] = useState('');
  const [formAvailability, setFormAvailability] = useState('');
  const [formRegion, setFormRegion] = useState('Global');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  const categories: (SiteCategory | 'All')[] = [
    'All',
    'Official Free Streaming',
    'Ad-Supported Streaming',
    'Subscription Streaming',
    'Free Public-Domain Films',
    'Official Movie Platforms',
    'Movie Discovery and Availability Guides'
  ];

  const filteredSites = sites.filter(site => {
    const matchesCat = selectedCategory === 'All' || site.category === selectedCategory;
    const matchesQuery = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim() || !formDescription.trim()) {
      setFormError('Please fill in the website name, valid URL, and description.');
      return;
    }

    try {
      new URL(formUrl);
    } catch {
      setFormError('Please enter a valid URL (e.g., https://example.com).');
      return;
    }

    const newSite: WhereToWatchSite = {
      id: `custom-${Date.now()}`,
      name: formName.trim(),
      url: formUrl.trim(),
      category: formCategory,
      description: formDescription.trim(),
      availabilityType: formAvailability.trim() || 'Custom Added Platform',
      region: formRegion.trim() || 'Global',
      verified: true,
      userExpectationNote: formNote.trim() || 'Manually added by user to local device directory.',
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    const updated = storageService.saveCustomSite(newSite);
    setSites([...updated, ...storageService.getAllSites().filter(s => !s.isCustom)]);
    
    // Reset form
    setFormName('');
    setFormUrl('');
    setFormDescription('');
    setFormAvailability('');
    setFormRegion('Global');
    setFormNote('');
    setFormError('');
    setShowAddModal(false);
  };

  const handleDeleteSite = (siteId: string) => {
    storageService.deleteCustomSite(siteId);
    setSites(prev => prev.filter(s => s.id !== siteId));
  };

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Tv className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Curated Viewing Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Where to Watch
          </h1>
          <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
            Verified, legal platforms where cinema can be experienced safely. From 100% legal free ad-supported vaults to public library streams and arthouse institutions.
          </p>
        </div>

        {/* Add Website Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Directory Entry</span>
        </button>
      </div>

      {/* Region & Legal Notice */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3 text-xs text-neutral-400">
        <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <span>
          Streaming availability fluctuates regularly by jurisdiction and licensing agreements. Movie Verse exclusively curates verified, non-infringing services. We do not provide or host copyrighted streams.
        </span>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platform name, region, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-rose-500 border border-white/10"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap text-xs font-medium border transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-500 font-semibold'
                    : 'bg-white/[0.04] text-neutral-400 border-white/5 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSites.map((site) => (
          <div
            key={site.id}
            className="liquid-glass-card rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-rose-500/30 transition-all group"
          >
            <div>
              {/* Category & Status */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-semibold text-rose-300">
                  {site.category}
                </span>

                <div className="flex items-center gap-1.5">
                  {site.isCustom && (
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete local entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {site.verified && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Region */}
              <h3 className="text-base font-bold text-white group-hover:text-rose-200 transition-colors mb-1">
                {site.name}
              </h3>
              
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mb-3">
                <Globe className="w-3 h-3 text-neutral-500" />
                <span>{site.region}</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className="text-rose-300/80">{site.availabilityType}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                {site.description}
              </p>

              {/* User expectation note */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-400 leading-relaxed mb-4">
                <span className="text-neutral-300 font-semibold mr-1">What to expect:</span>
                {site.userExpectationNote}
              </div>
            </div>

            {/* Visit Platform Link */}
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.05] hover:bg-rose-950/50 border border-white/10 hover:border-rose-500/30 text-xs font-semibold text-neutral-200 hover:text-white transition-all"
            >
              <span>Visit Platform</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

          </div>
        ))}
      </div>

      {/* Add Custom Site Liquid-Glass Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto liquid-glass-panel rounded-3xl p-6 sm:p-8 text-neutral-200 border border-rose-500/25 shadow-2xl">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Add Directory Platform</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Entries are saved locally to your device storage.
            </p>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSite} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Platform Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. BFI Player Classics"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Official Website URL *</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={e => setFormUrl(e.target.value)}
                  placeholder="https://player.bfi.org.uk"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as SiteCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Official Free Streaming">Official Free Streaming</option>
                  <option value="Ad-Supported Streaming">Ad-Supported Streaming</option>
                  <option value="Subscription Streaming">Subscription Streaming</option>
                  <option value="Free Public-Domain Films">Free Public-Domain Films</option>
                  <option value="Official Movie Platforms">Official Movie Platforms</option>
                  <option value="Movie Discovery and Availability Guides">Movie Discovery and Availability Guides</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Short Description *</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Summary of the service and content catalog..."
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Availability Type</label>
                  <input
                    type="text"
                    value={formAvailability}
                    onChange={e => setFormAvailability(e.target.value)}
                    placeholder="e.g. Free with Ads"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Region / Country</label>
                  <input
                    type="text"
                    value={formRegion}
                    onChange={e => setFormRegion(e.target.value)}
                    placeholder="e.g. Global, UK, US"
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">What Users Can Expect</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="e.g. Requires UK post code or library card"
                  className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-900/40"
                >
                  Save Entry
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
