import React, { useState } from 'react';
import { WhereToWatchSite, SiteCategory } from '../../types/movie';
import { storageService } from '../../services/storageService';
import { 
  Tv, ExternalLink, Search, Plus, CheckCircle, ShieldAlert, 
  Trash2, Filter, Globe, Sparkles, X, Info, Shield, Compass, ArrowUpRight
} from 'lucide-react';

export const WhereToWatchView: React.FC = () => {
  const [sites, setSites] = useState<WhereToWatchSite[]>(() => storageService.getAllSites());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding custom site
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<SiteCategory>('Movie Discovery and Availability Guides');
  const [formDescription, setFormDescription] = useState('');
  const [formAvailability, setFormAvailability] = useState('');
  const [formRegion, setFormRegion] = useState('Global');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  const filteredSites = sites.filter(site => {
    const matchesQuery = 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.region.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery;
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
      verified: false,
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
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Tv className="w-5 h-5 text-[#F88F22]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#FBB931]">
              Curated Viewing Directory
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Where to Watch
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300 mt-2 leading-relaxed">
            Curated movie discovery portals, regional guides, and streaming platforms. Explore links to external cinema catalogs safely.
          </p>
        </div>

        {/* Add Custom Website Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl sunset-gradient-btn text-white font-bold text-xs transition-all shrink-0 self-start md:self-end"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Directory Entry</span>
        </button>
      </div>

      {/* 9. BRAVE BROWSER INFORMATION CARD (MANDATORY REQUIREMENT) */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-7 border border-[#F88F22]/30 bg-gradient-to-br from-[#241108]/90 via-[#160B05]/95 to-[#0D0704] shadow-[0_8px_32px_rgba(234,97,19,0.2)]">
        {/* Ambient warm glow in background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#EA6113]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#FBB931]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA6113] to-[#F88F22] flex items-center justify-center text-white shadow-md shadow-[#EA6113]/40 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                A Cleaner Streaming Experience
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#FFE3B3]/90 leading-relaxed pl-0 sm:pl-11">
              "Want fewer intrusive ads while browsing? Try Brave Browser with its built-in Shields protection. Some websites may still show ads or require additional permissions."
            </p>
          </div>

          <a
            href="https://brave.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl sunset-gradient-btn text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#EA6113]/30 transition-all shrink-0 self-start sm:self-center active:scale-95 group"
          >
            <span>Get Brave</span>
            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </section>

      {/* Transparency & Legal Notice */}
      <div className="p-4 rounded-2xl bg-[#140A05]/80 border border-[#F88F22]/15 flex items-start gap-3 text-xs text-neutral-300">
        <Info className="w-4 h-4 text-[#FBB931] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>External Directory Notice:</strong> Movie Verse acts as an informational guide. We do not host, broadcast, or store media on our servers. Movie-specific availability is dependent on third-party domains.
        </span>
      </div>

      {/* Search Filter Toolbar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search directory entries by name or region..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#180C06] text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#F88F22] border border-[#F88F22]/20 shadow-inner"
        />
      </div>

      {/* Directory Grid displaying HDHub4u and MovieLinkBD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSites.map((site) => (
          <div
            key={site.id}
            className="sunset-card-glow rounded-3xl p-6 border border-[#F88F22]/20 bg-[#160B05]/90 flex flex-col justify-between hover:border-[#FBB931]/50 transition-all group"
          >
            <div className="space-y-3">
              {/* Category & Status */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FBB931]">
                  {site.availabilityType || site.category}
                </span>

                <div className="flex items-center gap-1.5">
                  {site.isCustom && (
                    <button
                      onClick={() => handleDeleteSite(site.id)}
                      className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                      title="Delete local entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-[#FFE3B3] bg-[#EA6113]/20 px-2 py-0.5 rounded-md border border-[#F88F22]/30 font-medium">
                    <Globe className="w-3 h-3 text-[#F88F22]" />
                    {site.region}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-extrabold text-white group-hover:text-[#FFE3B3] transition-colors">
                {site.name}
              </h3>
              
              {/* URL Display */}
              <div className="text-xs text-[#F88F22] font-mono truncate">
                {site.url}
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-300 leading-relaxed">
                {site.description}
              </p>

              {/* Transparency Note */}
              <div className="p-3 rounded-xl bg-[#0E0603]/80 border border-white/5 text-[11px] text-neutral-400 leading-relaxed">
                <span className="text-[#FFE3B3] font-semibold mr-1">Guidance:</span>
                {site.userExpectationNote}
              </div>
            </div>

            {/* Visit Platform Button */}
            <div className="pt-4 mt-2">
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl sunset-gradient-btn text-xs font-bold text-white transition-all shadow-md group-hover:shadow-[#EA6113]/40"
              >
                <span>Visit {site.name}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

          </div>
        ))}
      </div>

      {/* Add Custom Site Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-[#180C06] text-neutral-200 border border-[#F88F22]/30 shadow-2xl">
            
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Add Directory Platform</h3>
            <p className="text-xs text-neutral-400 mb-6">
              Saved locally to your browser storage.
            </p>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/30 text-xs text-red-200 mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSite} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Platform / Website Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Cinema Vault"
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#F88F22]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Official Website URL *</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#F88F22]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Description *</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  placeholder="Overview of this catalog..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-[#F88F22]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl sunset-gradient-btn text-white font-bold"
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
