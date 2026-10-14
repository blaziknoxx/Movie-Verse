/**
 * Movie Verse — CineProfile Avatar Presets
 * Bespoke original vector illustrations inspired by iconic cinema masks & aesthetics.
 */

import React from 'react';

export interface AvatarPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  accent: string;
  render: (className?: string) => React.ReactNode;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'arachnid-hero',
    name: 'Web-Weaver Mask',
    category: 'Vigilante / Kinetic',
    description: 'Crimson geometric webbing with high-contrast reflective eye lenses and dark navy facets.',
    accent: '#EA6113',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#120408" stroke="#EA6113" strokeWidth="2" />
        {/* Head Shape */}
        <path d="M50 14 C28 14 22 36 22 56 C22 74 38 88 50 88 C62 88 78 74 78 56 C78 36 72 14 50 14 Z" fill="#991B1B" />
        {/* Web Radial Pattern */}
        <line x1="50" y1="14" x2="50" y2="88" stroke="#1F0404" strokeWidth="1.2" />
        <line x1="22" y1="56" x2="78" y2="56" stroke="#1F0404" strokeWidth="1.2" />
        <line x1="28" y1="32" x2="72" y2="78" stroke="#1F0404" strokeWidth="1.2" />
        <line x1="28" y1="78" x2="72" y2="32" stroke="#1F0404" strokeWidth="1.2" />
        <ellipse cx="50" cy="54" rx="16" ry="18" fill="none" stroke="#1F0404" strokeWidth="1" />
        <ellipse cx="50" cy="54" rx="24" ry="26" fill="none" stroke="#1F0404" strokeWidth="1" />
        {/* Left Lens */}
        <path d="M46 44 C42 42 32 44 28 54 C34 57 44 55 46 44 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
        {/* Right Lens */}
        <path d="M54 44 C58 42 68 44 72 54 C66 57 56 55 54 44 Z" fill="#FFFFFF" stroke="#000000" strokeWidth="2.5" />
      </svg>
    )
  },
  {
    id: 'heist-salvador',
    name: 'Resistance Heist Mask',
    category: 'Theatrical / Defiance',
    description: 'Iconic red-hooded porcelain resistance mask with arched brows, defiant smile, and mustache.',
    accent: '#DC2626',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#1C060B" stroke="#DC2626" strokeWidth="2" />
        {/* Red Hood */}
        <path d="M50 12 C24 12 18 38 18 64 C18 84 34 92 50 92 C66 92 82 84 82 64 C82 38 76 12 50 12 Z" fill="#B91C1C" />
        {/* Faceplate */}
        <path d="M50 24 C34 24 30 40 30 58 C30 76 40 82 50 82 C60 82 70 76 70 58 C70 40 66 24 50 24 Z" fill="#FEE2E2" />
        {/* Exaggerated Arched Brows */}
        <path d="M34 40 Q42 32 48 44" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M66 40 Q58 32 52 44" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Expressive Eyes */}
        <circle cx="41" cy="48" r="3" fill="#111827" />
        <circle cx="59" cy="48" r="3" fill="#111827" />
        {/* Sculpted Nose */}
        <path d="M50 48 L48 62 L52 62 Z" fill="#E5E7EB" />
        {/* Pointed Upturned Mustache */}
        <path d="M36 68 Q46 64 50 67 Q54 64 64 68 Q58 72 50 69 Q42 72 36 68 Z" fill="#1F2937" />
      </svg>
    )
  },
  {
    id: 'inferno-rider',
    name: 'Inferno Phantom Skull',
    category: 'Dark Biker / Supernatural',
    description: 'Graphite bone skull crowned with kinetic crimson and blazing amber hellfire.',
    accent: '#F97316',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#0A0302" stroke="#F97316" strokeWidth="2" />
        {/* Fire Flames Aura */}
        <path d="M50 8 C40 22 28 26 34 46 C24 38 20 54 26 66 C30 38 46 22 50 8 Z" fill="#FBB931" opacity="0.8" />
        <path d="M50 8 C60 22 72 26 66 46 C76 38 80 54 74 66 C70 38 54 22 50 8 Z" fill="#F88F22" opacity="0.85" />
        <path d="M42 16 C48 30 52 38 50 50 C58 36 64 24 42 16 Z" fill="#EA6113" />
        {/* Skull Dome */}
        <path d="M50 32 C34 32 30 46 30 62 C30 72 38 78 42 82 L42 88 L58 88 L58 82 C62 78 70 72 70 62 C70 46 66 32 50 32 Z" fill="#E5E7EB" />
        {/* Dark Eye Sockets */}
        <ellipse cx="42" cy="56" rx="5" ry="6" fill="#1C0605" stroke="#EA6113" strokeWidth="1" />
        <ellipse cx="58" cy="56" rx="5" ry="6" fill="#1C0605" stroke="#EA6113" strokeWidth="1" />
        {/* Nasal Cavity */}
        <path d="M50 64 L48 70 L52 70 Z" fill="#1C0605" />
        {/* Teeth Grid */}
        <line x1="45" y1="84" x2="55" y2="84" stroke="#4B5563" strokeWidth="2" />
        <line x1="48" y1="80" x2="48" y2="88" stroke="#4B5563" strokeWidth="1.5" />
        <line x1="52" y1="80" x2="52" y2="88" stroke="#4B5563" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'avenger-gold',
    name: 'Futuristic Titan Helm',
    category: 'Cyber Armor / Sci-Fi',
    description: 'High-gloss crimson shell with brushed-gold titanium faceplate and glowing amber HUD slits.',
    accent: '#FBB931',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#140602" stroke="#FBB931" strokeWidth="2" />
        {/* Outer Red Helmet */}
        <path d="M50 16 C30 16 24 32 24 54 C24 74 34 86 50 86 C66 86 76 74 76 54 C76 32 70 16 50 16 Z" fill="#991B1B" />
        {/* Gold Faceplate */}
        <path d="M50 26 C38 26 34 38 34 52 L36 76 L44 82 L56 82 L64 76 L66 52 C66 38 62 26 50 26 Z" fill="#FBB931" />
        <path d="M38 38 L50 42 L62 38 L60 48 L40 48 Z" fill="#D97706" />
        {/* Glowing Optical Slits */}
        <polygon points="38,54 46,55 45,58 39,57" fill="#67E8F9" stroke="#E0F2FE" strokeWidth="0.5" />
        <polygon points="62,54 54,55 55,58 61,57" fill="#67E8F9" stroke="#E0F2FE" strokeWidth="0.5" />
        {/* Mouth Plate Lines */}
        <line x1="44" y1="72" x2="56" y2="72" stroke="#92400E" strokeWidth="1.5" />
      </svg>
    )
  },
  {
    id: 'noir-detective',
    name: 'Noir Silhouette Fedora',
    category: 'Gothic Noir / Mystery',
    description: 'Chiaroscuro detective fedora angled in rain-drenched shadow with a glowing amber match-strike gaze.',
    accent: '#F88F22',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#0A0605" stroke="#F88F22" strokeWidth="2" />
        {/* Fedora Brim */}
        <ellipse cx="50" cy="46" rx="34" ry="10" fill="#18181B" stroke="#27272A" strokeWidth="1" />
        {/* Fedora Crown */}
        <path d="M32 44 L36 22 Q50 18 64 22 L68 44 Z" fill="#09090B" />
        {/* Hat Ribbon */}
        <path d="M33 42 L35 37 L65 37 L67 42 Z" fill="#EA6113" />
        {/* Shadowed Face */}
        <path d="M38 48 C38 66 42 76 50 78 C58 76 62 66 62 48 Z" fill="#18181B" />
        {/* Trench Coat Lapels */}
        <path d="M26 88 L38 68 L50 82 L62 68 L74 88 Z" fill="#27272A" />
        {/* Piercing Amber Eye Glance in Shadow */}
        <ellipse cx="44" cy="56" rx="3" ry="1.2" fill="#FBB931" />
        <ellipse cx="56" cy="56" rx="3" ry="1.2" fill="#FBB931" />
      </svg>
    )
  },
  {
    id: 'cyber-samurai',
    name: 'Cyber Ronin Visor',
    category: 'Cyberpunk / Dystopia',
    description: 'Obsidian carbon-fiber kabuto with an ultra-wide amber neon tactical HUD band.',
    accent: '#06B6D4',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#05070A" stroke="#06B6D4" strokeWidth="2" />
        {/* Helmet Crown & Crest */}
        <path d="M50 14 L53 26 L62 20 L58 32 L50 30 L42 32 L38 20 L47 26 Z" fill="#F59E0B" />
        <path d="M26 40 C26 28 36 24 50 24 C64 24 74 28 74 40 L76 70 L66 84 L34 84 L24 70 Z" fill="#111827" />
        {/* Neon Cyber Visor */}
        <path d="M28 46 L72 46 L70 56 L30 56 Z" fill="#06B6D4" opacity="0.9" filter="drop-shadow(0 0 6px #06B6D4)" />
        <line x1="32" y1="51" x2="68" y2="51" stroke="#FFFFFF" strokeWidth="1" />
        {/* Cyber Respirator Grid */}
        <rect x="42" y="66" width="16" height="12" rx="2" fill="#1F2937" stroke="#374151" strokeWidth="1" />
        <line x1="45" y1="70" x2="55" y2="70" stroke="#06B6D4" strokeWidth="1" />
        <line x1="45" y1="74" x2="55" y2="74" stroke="#06B6D4" strokeWidth="1" />
      </svg>
    )
  },
  {
    id: 'gladiator-sun',
    name: 'Imperial Centurion Helm',
    category: 'Epic / Historical',
    description: 'Hammered gold and bronze gladiator helmet with crimson horsehair crest and cheek guards.',
    accent: '#D97706',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#160803" stroke="#D97706" strokeWidth="2" />
        {/* Centurion Red Crest */}
        <path d="M46 10 C46 10 50 14 54 10 L56 36 L44 36 Z" fill="#DC2626" />
        {/* Helmet Dome */}
        <path d="M50 28 C34 28 30 40 30 56 L30 76 L38 72 L42 56 L58 56 L62 72 L70 76 L70 56 C70 40 66 28 50 28 Z" fill="#FBB931" stroke="#B45309" strokeWidth="1.5" />
        {/* Brow Ridge */}
        <path d="M30 48 Q50 44 70 48" stroke="#78350F" strokeWidth="3" fill="none" />
        {/* Vertical Nasal Guard */}
        <rect x="47" y="46" width="6" height="26" fill="#D97706" stroke="#78350F" strokeWidth="1" />
        {/* Eye Apertures */}
        <rect x="36" y="50" width="9" height="4" fill="#000000" />
        <rect x="55" y="50" width="9" height="4" fill="#000000" />
      </svg>
    )
  },
  {
    id: 'phantom-opera',
    name: 'Sovereign Opera Masque',
    category: 'Arthouse / Drama',
    description: 'Asymmetric ivory porcelain half-mask with delicate filigree gold trimming and velvet ribbon.',
    accent: '#A855F7',
    render: (className = 'w-full h-full') => (
      <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="48" fill="#0F0614" stroke="#A855F7" strokeWidth="2" />
        {/* Shadowed Face */}
        <path d="M50 20 C32 20 28 36 28 56 C28 76 40 84 50 84 C60 84 72 76 72 56 C72 36 68 20 50 20 Z" fill="#1F1528" />
        {/* Asymmetrical Right Half Masque */}
        <path d="M50 22 C64 22 72 34 72 52 C72 68 64 74 52 76 L50 22 Z" fill="#F8FAFC" stroke="#FBB931" strokeWidth="2" />
        {/* Right Masque Eye Aperture */}
        <ellipse cx="60" cy="46" rx="6" ry="4" fill="#0F0614" stroke="#FBB931" strokeWidth="1.5" />
        {/* Filigree Ornament Curve */}
        <path d="M54 30 Q66 28 68 38" stroke="#FBB931" strokeWidth="1.5" fill="none" />
        <path d="M56 64 Q68 66 64 56" stroke="#FBB931" strokeWidth="1.5" fill="none" />
      </svg>
    )
  }
];

export function getAvatarById(id: string): AvatarPreset {
  return AVATAR_PRESETS.find(a => a.id === id) || AVATAR_PRESETS[0];
}
