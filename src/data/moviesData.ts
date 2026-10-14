/**
 * Movie Verse — Curated Universe Lore & Watch Order Architecture
 * Developer — Estiaq Mehedi
 * 
 * Defines universe connections, watch order guides, mood taxonomies, and external directory indexes.
 * External destinations strictly preserved: HDHub4u and MovieLinkBD.
 */

import { Movie, MovieUniverse, WatchOrderGuide, MoodCategory, WhereToWatchSite } from '../types/movie';

// Generated cinematic visual assets for universe lore covers
import heroSciFi from '../assets/images/hero_cinematic_scifi_1791913249885.jpg';
import heroGothicNoir from '../assets/images/hero_gothic_noir_1791913249424.jpg';
import posterCosmos from '../assets/images/poster_quantum_cosmos_1791913250357.jpg';
import posterNoirDetective from '../assets/images/poster_shadow_detective_1791913251077.jpg';
import posterCyber from '../assets/images/poster_cyber_odyssey_1791913251262.jpg';

export const MOODS: MoodCategory[] = [
  { id: 'dark-gritty', name: 'Dark & Gritty', description: 'Visceral crime, rain-soaked streets, and morally gray antiheroes', accent: '#EA6113' },
  { id: 'mind-bending', name: 'Mind-Bending', description: 'Fractured reality, temporal anomalies, and philosophical labyrinths', accent: '#F88F22' },
  { id: 'action-heavy', name: 'Action-Heavy', description: 'Relentless kinetic stuntwork, acrobatic set pieces, and high stakes', accent: '#FBB931' },
  { id: 'sci-fi-epic', name: 'Sci-Fi Epic', description: 'Vast interstellar empires, mystical prophecy, and grand cosmic scale', accent: '#FFE3B3' },
  { id: 'psychological', name: 'Psychological', description: 'Taut character studies descending into madness and obsession', accent: '#EA6113' },
  { id: 'feel-good', name: 'Feel-Good & Wonder', description: 'Vibrant journeys bursting with heart and artistry', accent: '#F88F22' },
  { id: 'mystery-suspense', name: 'Mystery & Suspense', description: 'Unfolding secrets, high-stakes investigations, and ticking clocks', accent: '#FBB931' },
  { id: 'cyberpunk', name: 'Cyberpunk Dystopia', description: 'Synthetic rain, rogue cybernetics, and corporate neon dystopias', accent: '#EA6113' },
];

export const UNIVERSES: MovieUniverse[] = [
  {
    id: 'dune-universe',
    name: 'The Arrakis Chronicles',
    slug: 'arrakis-chronicles',
    tagline: 'Power over spice is power over all.',
    description: 'Denis Villeneuve and Frank Herbert’s monumental saga spanning ancient sisterhoods, desert messiahs, and galactic jihad across the deep dunes.',
    coverImage: heroSciFi,
    movieCount: 3,
    genres: ['Sci-Fi', 'Epic', 'Drama'],
    movieIds: ['dune-part-2', 'dune-part-1', 'dune-prophecy']
  },
  {
    id: 'gotham-noir',
    name: 'Gotham Underworld',
    slug: 'gotham-underworld',
    tagline: 'Fear is a tool. When that light hits the sky, it is a warning.',
    description: 'From Christopher Nolan’s grounded vigilante trilogy to Matt Reeves’ rain-drenched detective noir and criminal dynasties.',
    coverImage: heroGothicNoir,
    movieCount: 5,
    genres: ['Crime', 'Action', 'Neo-Noir'],
    movieIds: ['the-batman', 'the-dark-knight', 'the-penguin', 'the-dark-knight-rises', 'batman-begins']
  },
  {
    id: 'nolan-cosmos',
    name: 'The Quantum & Temporal Cosmos',
    slug: 'nolan-cosmos',
    tagline: 'Time is not a straight line, but an ocean to survive.',
    description: 'Christopher Nolan’s cerebral explorations of time dilation, inverted entropy, architectural subconscious, and cosmic sacrifice.',
    coverImage: posterCosmos,
    movieCount: 4,
    genres: ['Sci-Fi', 'Thriller', 'Drama'],
    movieIds: ['interstellar', 'oppenheimer', 'inception', 'tenet']
  },
  {
    id: 'wick-continental',
    name: 'The High Table & Continental',
    slug: 'wick-continental',
    tagline: 'Si vis pacem, para bellum.',
    description: 'The mythic global underworld of blood oaths, gold markers, sovereign sanctuary hotels, and hyper-stylized kinetic violence.',
    coverImage: posterNoirDetective,
    movieCount: 4,
    genres: ['Action', 'Thriller', 'Neo-Noir'],
    movieIds: ['john-wick-4', 'john-wick-1', 'the-continental', 'ballerina']
  },
  {
    id: 'cyber-dystopia',
    name: 'Cybernetic Futures',
    slug: 'cybernetic-futures',
    tagline: 'More human than human in a neon-drenched oblivion.',
    description: 'Dystopian cyberpunk sagas examining artificial consciousness, airborne spinners, and corporate monoliths.',
    coverImage: posterCyber,
    movieCount: 2,
    genres: ['Cyberpunk', 'Sci-Fi', 'Neo-Noir'],
    movieIds: ['blade-runner-1982', 'blade-runner-2049']
  }
];

const STANDARD_EXTERNAL_PLATFORMS = [
  { name: 'HDHub4u', type: 'External Portal' as const, url: 'https://new7.hdhub4u.cl/?utm=mn1', verified: false },
  { name: 'MovieLinkBD', type: 'External Portal' as const, url: 'https://movielinkbd.one/', verified: false }
];

export const MOVIES: Movie[] = [
  {
    id: 'dune-part-2',
    tmdbId: 693134,
    title: 'Dune: Part Two',
    slug: 'dune-part-two',
    year: 2024,
    duration: '2h 46m',
    rating: 8.6,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    tagline: 'Long live the fighters.',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking vengeance against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem', 'Austin Butler'],
    posterUrl: posterCosmos,
    backdropUrl: heroSciFi,
    universeId: 'dune-universe',
    universeName: 'The Arrakis Chronicles',
    featured: true,
    vibeTags: ['Epic Scale', 'Religious Fervor', 'Visceral Soundscapes', 'Philosophical Dread'],
    vibeProfile: {
      darkAtmosphere: 8,
      actionIntensity: 8,
      psychologicalComplexity: 9,
      mysterySuspense: 8,
      emotionalWeight: 9,
      pacing: 'Propulsive',
      visualStyle: 'Monumental Brutalist Desert Cinema'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['sci-fi-epic', 'mind-bending', 'action-heavy']
  },
  {
    id: 'dune-part-1',
    tmdbId: 438631,
    title: 'Dune: Part One',
    slug: 'dune-part-one',
    year: 2021,
    duration: '2h 35m',
    rating: 8.0,
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    tagline: 'Beyond fear, destiny awaits.',
    overview: 'Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Rebecca Ferguson', 'Oscar Isaac', 'Josh Brolin', 'Stellan Skarsgård'],
    posterUrl: heroSciFi,
    backdropUrl: heroSciFi,
    universeId: 'dune-universe',
    universeName: 'The Arrakis Chronicles',
    vibeTags: ['Atmospheric Dread', 'Slow-Burn Grandeur', 'World-Building Mastery'],
    vibeProfile: {
      darkAtmosphere: 8,
      actionIntensity: 6,
      psychologicalComplexity: 8,
      mysterySuspense: 8,
      emotionalWeight: 7,
      pacing: 'Slow-Burn',
      visualStyle: 'Cinematic Grandeur & Monolithic Design'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['sci-fi-epic', 'mind-bending']
  },
  {
    id: 'dune-prophecy',
    tmdbId: 841,
    title: 'Dune: Prophecy',
    slug: 'dune-prophecy',
    year: 2024,
    duration: 'Series (6 Eps)',
    rating: 7.8,
    genres: ['Sci-Fi', 'Drama', 'Mystery'],
    tagline: 'Before the prophecy, there was the sisterhood.',
    overview: 'Set 10,000 years before the ascension of Paul Atreides, following two Harkonnen sisters as they combat forces that threaten the future of humankind and establish the fabled sect known as the Bene Gesserit.',
    director: 'Anna Foerster',
    cast: ['Emily Watson', 'Olivia Williams', 'Travis Fimmel', 'Jodhi May'],
    posterUrl: posterCosmos,
    backdropUrl: heroSciFi,
    universeId: 'dune-universe',
    universeName: 'The Arrakis Chronicles',
    vibeTags: ['Political Intrigue', 'Occult Sisterhood', 'Ancient Lore'],
    vibeProfile: {
      darkAtmosphere: 8,
      actionIntensity: 5,
      psychologicalComplexity: 9,
      mysterySuspense: 9,
      emotionalWeight: 7,
      pacing: 'Methodical',
      visualStyle: 'Shadowy Feudal Palace Aesthetics'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['sci-fi-epic', 'psychological', 'mystery-suspense']
  },
  {
    id: 'the-batman',
    tmdbId: 414906,
    title: 'The Batman',
    slug: 'the-batman',
    year: 2022,
    duration: '2h 56m',
    rating: 7.8,
    genres: ['Crime', 'Drama', 'Mystery'],
    tagline: 'Unmask the truth.',
    overview: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler, who targets Gotham’s corrupt elite.',
    director: 'Matt Reeves',
    cast: ['Robert Pattinson', 'Zoë Kravitz', 'Paul Dano', 'Jeffrey Wright', 'Colin Farrell'],
    posterUrl: posterNoirDetective,
    backdropUrl: heroGothicNoir,
    universeId: 'gotham-noir',
    universeName: 'Gotham Underworld',
    featured: true,
    vibeTags: ['Rain-Soaked Noir', 'Detective Procedure', 'Pounding Bass', 'Grim Realism'],
    vibeProfile: {
      darkAtmosphere: 10,
      actionIntensity: 8,
      psychologicalComplexity: 8,
      mysterySuspense: 9,
      emotionalWeight: 8,
      pacing: 'Methodical',
      visualStyle: 'Gothic Amber & Wet Asphalt Fincher-esque Noir'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['dark-gritty', 'mystery-suspense', 'psychological']
  },
  {
    id: 'the-dark-knight',
    tmdbId: 155,
    title: 'The Dark Knight',
    slug: 'the-dark-knight',
    year: 2008,
    duration: '2h 32m',
    rating: 9.0,
    genres: ['Action', 'Crime', 'Drama'],
    tagline: 'Why so serious?',
    overview: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine', 'Gary Oldman'],
    posterUrl: posterNoirDetective,
    backdropUrl: heroGothicNoir,
    universeId: 'gotham-noir',
    universeName: 'Gotham Underworld',
    vibeTags: ['Moral Philosophy', 'Chaos Theory', 'Uncompromising Tension', 'Iconic Villainy'],
    vibeProfile: {
      darkAtmosphere: 9,
      actionIntensity: 9,
      psychologicalComplexity: 10,
      mysterySuspense: 9,
      emotionalWeight: 9,
      pacing: 'Propulsive',
      visualStyle: 'Expansive IMAX Architectural Crime Epic'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['dark-gritty', 'action-heavy', 'psychological']
  },
  {
    id: 'the-penguin',
    tmdbId: 194764,
    title: 'The Penguin',
    slug: 'the-penguin',
    year: 2024,
    duration: 'Series (8 Eps)',
    rating: 8.8,
    genres: ['Crime', 'Drama'],
    tagline: 'Gotham belongs to whoever takes it.',
    overview: 'Following the events of The Batman, Oz Cobb wages an unrelenting, bloody struggle for control over Gotham’s criminal underworld in the power vacuum left by Carmine Falcone’s demise.',
    director: 'Craig Zobel',
    cast: ['Colin Farrell', 'Cristin Milioti', 'Rhenzy Feliz', 'Michael Kelly'],
    posterUrl: posterNoirDetective,
    backdropUrl: heroGothicNoir,
    universeId: 'gotham-noir',
    universeName: 'Gotham Underworld',
    vibeTags: ['Gangland War', 'Machiavellian Betrayal', 'Unflinching Character Study'],
    vibeProfile: {
      darkAtmosphere: 9,
      actionIntensity: 7,
      psychologicalComplexity: 9,
      mysterySuspense: 8,
      emotionalWeight: 8,
      pacing: 'Balanced',
      visualStyle: 'Gritty New York-Style Mafia Realism'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['dark-gritty', 'psychological']
  },
  {
    id: 'interstellar',
    tmdbId: 157336,
    title: 'Interstellar',
    slug: 'interstellar',
    year: 2014,
    duration: '2h 49m',
    rating: 8.7,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    tagline: 'Mankind was born on Earth. It was never meant to die here.',
    overview: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers through a newly discovered wormhole near Saturn to find a new planet for humans.',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    posterUrl: posterCosmos,
    backdropUrl: heroSciFi,
    universeId: 'nolan-cosmos',
    universeName: 'The Quantum & Temporal Cosmos',
    featured: true,
    vibeTags: ['Cosmic Isolation', 'Heart-Wrenching Grief', 'Gravitational Wonder', 'Hans Zimmer Organ'],
    vibeProfile: {
      darkAtmosphere: 7,
      actionIntensity: 7,
      psychologicalComplexity: 9,
      mysterySuspense: 8,
      emotionalWeight: 10,
      pacing: 'Balanced',
      visualStyle: 'Scientific Photorealism & Vast Deep Space Silence'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['sci-fi-epic', 'mind-bending', 'emotional']
  },
  {
    id: 'oppenheimer',
    tmdbId: 872585,
    title: 'Oppenheimer',
    slug: 'oppenheimer',
    year: 2023,
    duration: '3h 00m',
    rating: 8.9,
    genres: ['Biography', 'Drama', 'History'],
    tagline: 'The world forever changes.',
    overview: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II, examining the terrifying moral reckoning of unleashing quantum fire upon humanity.',
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.', 'Florence Pugh'],
    posterUrl: posterCosmos,
    backdropUrl: heroSciFi,
    universeId: 'nolan-cosmos',
    universeName: 'The Quantum & Temporal Cosmos',
    vibeTags: ['Existential Dread', 'Auditory Assault', 'Historical Gravity', 'Fractured Consciousness'],
    vibeProfile: {
      darkAtmosphere: 9,
      actionIntensity: 5,
      psychologicalComplexity: 10,
      mysterySuspense: 9,
      emotionalWeight: 9,
      pacing: 'Propulsive',
      visualStyle: 'Monochrome vs Vibrant 65mm IMAX Psychological Montage'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['psychological', 'mind-bending', 'mystery-suspense']
  },
  {
    id: 'inception',
    tmdbId: 27205,
    title: 'Inception',
    slug: 'inception',
    year: 2010,
    duration: '2h 28m',
    rating: 8.8,
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    tagline: 'Your mind is the scene of the crime.',
    overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O., but his tragic past may doom the project and his team.',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page', 'Tom Hardy', 'Ken Watanabe'],
    posterUrl: posterCosmos,
    backdropUrl: heroGothicNoir,
    universeId: 'nolan-cosmos',
    universeName: 'The Quantum & Temporal Cosmos',
    vibeTags: ['Dream Architecture', 'Zero-G Combat', 'Subconscious Haunting', 'Layered Heist'],
    vibeProfile: {
      darkAtmosphere: 6,
      actionIntensity: 9,
      psychologicalComplexity: 9,
      mysterySuspense: 9,
      emotionalWeight: 8,
      pacing: 'Propulsive',
      visualStyle: 'Shifting Gravitational Urban Landscapes'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['mind-bending', 'action-heavy', 'psychological']
  },
  {
    id: 'john-wick-4',
    tmdbId: 603692,
    title: 'John Wick: Chapter 4',
    slug: 'john-wick-chapter-4',
    year: 2023,
    duration: '2h 49m',
    rating: 7.7,
    genres: ['Action', 'Crime', 'Thriller'],
    tagline: 'No way back, one way out.',
    overview: 'John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe and forces that turn old friends into foes.',
    director: 'Chad Stahelski',
    cast: ['Keanu Reeves', 'Donnie Yen', 'Bill Skarsgård', 'Laurence Fishburne', 'Hiroyuki Sanada'],
    posterUrl: posterNoirDetective,
    backdropUrl: heroGothicNoir,
    universeId: 'wick-continental',
    universeName: 'The High Table & Continental',
    featured: true,
    vibeTags: ['Top-Down Dragon Breath', 'Neo-Tokyo Neon', 'Virtuoso Gun-Fu', 'Stunt Mastery'],
    vibeProfile: {
      darkAtmosphere: 7,
      actionIntensity: 10,
      psychologicalComplexity: 6,
      mysterySuspense: 6,
      emotionalWeight: 7,
      pacing: 'Relentless',
      visualStyle: 'High-Saturation Crimson & Amber Stunt Ballet'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['action-heavy', 'dark-gritty']
  },
  {
    id: 'blade-runner-1982',
    tmdbId: 78,
    title: 'Blade Runner',
    slug: 'blade-runner-1982',
    year: 1982,
    duration: '1h 57m',
    rating: 8.1,
    genres: ['Sci-Fi', 'Neo-Noir', 'Thriller'],
    tagline: 'Man has made his match... now it\'s his problem.',
    overview: 'In the smog-choked dystopian Los Angeles of 2019, blade runner Rick Deckard is called out of retirement to terminate four rogue synthetic humans known as replicants who have hijacked a ship in outer space and returned to Earth.',
    director: 'Ridley Scott',
    cast: ['Harrison Ford', 'Rutger Hauer', 'Sean Young', 'Edward James Olmos', 'Daryl Hannah'],
    posterUrl: posterCyber,
    backdropUrl: heroGothicNoir,
    universeId: 'cyber-dystopia',
    universeName: 'Cybernetic Futures',
    vibeTags: ['Vangelis Synth', 'Rain-Slicked Neon', 'Existential Tears in Rain', 'Cyberpunk Solitude'],
    vibeProfile: {
      darkAtmosphere: 10,
      actionIntensity: 6,
      psychologicalComplexity: 10,
      mysterySuspense: 9,
      emotionalWeight: 9,
      pacing: 'Methodical',
      visualStyle: 'Smoky Amber-Crimson Neon & Dystopian Cyberpunk Megacity'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['cyberpunk', 'action-heavy', 'dark-gritty']
  },
  {
    id: 'blade-runner-2049',
    tmdbId: 335984,
    title: 'Blade Runner 2049',
    slug: 'blade-runner-2049',
    year: 2017,
    duration: '2h 44m',
    rating: 8.0,
    genres: ['Sci-Fi', 'Mystery', 'Drama'],
    tagline: 'There is still a little of each of us in everything we touch.',
    overview: 'Young Blade Runner K’s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who has been missing for thirty years, shaking the fragile fabric of human and replicant existence.',
    director: 'Denis Villeneuve',
    cast: ['Ryan Gosling', 'Harrison Ford', 'Ana de Armas', 'Sylvia Hoeks', 'Robin Wright'],
    posterUrl: posterCyber,
    backdropUrl: heroSciFi,
    universeId: 'cyber-dystopia',
    universeName: 'Cybernetic Futures',
    vibeTags: ['Atmospheric Melancholy', 'Roger Deakins Lighting', 'Existential Solitude', 'Deep Bass Drone'],
    vibeProfile: {
      darkAtmosphere: 9,
      actionIntensity: 6,
      psychologicalComplexity: 10,
      mysterySuspense: 9,
      emotionalWeight: 9,
      pacing: 'Slow-Burn',
      visualStyle: 'Orange Radioactive Dust & Monolithic Brutalist Wastelands'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['cyberpunk', 'sci-fi-epic', 'psychological']
  },
  {
    id: 'batman-begins',
    tmdbId: 272,
    title: 'Batman Begins',
    slug: 'batman-begins',
    year: 2005,
    duration: '2h 20m',
    rating: 8.2,
    genres: ['Action', 'Crime', 'Drama'],
    tagline: 'Evil fears the knight.',
    overview: 'Driven by tragedy and guilt after his parents\' murder, Bruce Wayne journeys across the globe to learn the ways of the criminal underworld before being trained by the League of Shadows to wage war against corruption in Gotham City.',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Michael Caine', 'Liam Neeson', 'Katie Holmes', 'Gary Oldman', 'Cillian Murphy'],
    posterUrl: posterNoirDetective,
    backdropUrl: heroGothicNoir,
    universeId: 'gotham-noir',
    universeName: 'Gotham Underworld',
    vibeTags: ['League of Shadows', 'Monastic Discipline', 'Fear Toxin Hallucinations', 'Theatrical Terror'],
    vibeProfile: {
      darkAtmosphere: 10,
      actionIntensity: 8,
      psychologicalComplexity: 9,
      mysterySuspense: 9,
      emotionalWeight: 8,
      pacing: 'Propulsive',
      visualStyle: 'Grounded Gotham Realism & Himalayan Monastic Training'
    },
    streamingPlatforms: STANDARD_EXTERNAL_PLATFORMS,
    moodIds: ['dark-gritty', 'action-heavy', 'psychological']
  }
];


export const WATCH_ORDERS: WatchOrderGuide[] = [
  {
    id: 'order-dune-main',
    universeId: 'dune-universe',
    universeName: 'The Arrakis Chronicles',
    title: 'Arrakis: The Messiah Storyline',
    orderType: 'recommended-story',
    orderTypeLabel: 'Recommended Story Order',
    description: 'The ideal narrative sequence for maximum dramatic resonance and understanding of Paul Atreides’ destiny.',
    entries: [
      {
        movieId: 'dune-part-1',
        orderNumber: 1,
        role: 'The Fall of House Atreides & Awakening',
        priority: 'MUST WATCH',
        reason: 'Essential world-building and character foundations. Do not start with Part Two without seeing this foundation.'
      },
      {
        movieId: 'dune-part-2',
        orderNumber: 2,
        role: 'Fremen Jihad & Holy Ascension',
        priority: 'MUST WATCH',
        reason: 'The breathtaking payoff to all setup in Part One. Mandatory conclusion to the initial Frank Herbert novel adaptation.'
      },
      {
        movieId: 'dune-prophecy',
        orderNumber: 3,
        role: 'Bene Gesserit Historical Genesis',
        priority: 'OPTIONAL',
        reason: 'Fleshes out the deep lore of the Sisterhood 10,000 years prior, but not required to understand Paul’s immediate arc.'
      }
    ]
  },
  {
    id: 'order-dune-chrono',
    universeId: 'dune-universe',
    universeName: 'The Arrakis Chronicles',
    title: 'Deep Timeline: Chronological Order',
    orderType: 'chronological',
    orderTypeLabel: 'In-Universe Chronological',
    description: 'Watch according to in-universe historical timeline, beginning with the ancient foundation of the Great Schools.',
    entries: [
      {
        movieId: 'dune-prophecy',
        orderNumber: 1,
        role: 'Dawn of the Sisterhood (10,000 BG)',
        priority: 'OPTIONAL',
        reason: 'Sets the foundational ancient rules and political machinery of the Imperium.'
      },
      {
        movieId: 'dune-part-1',
        orderNumber: 2,
        role: 'The Arrival on Arrakis (10,191 AG)',
        priority: 'MUST WATCH',
        reason: 'The pivotal catalyst that launches the modern Atreides prophecy.'
      },
      {
        movieId: 'dune-part-2',
        orderNumber: 3,
        role: 'The War for the Golden Path (10,193 AG)',
        priority: 'MUST WATCH',
        reason: 'The coronation and imperial upheaval.'
      }
    ]
  },
  {
    id: 'order-gotham-reeves',
    universeId: 'gotham-noir',
    universeName: 'Gotham Underworld',
    title: 'The Reeves Epic Crime Saga',
    orderType: 'recommended-story',
    orderTypeLabel: 'Recommended Story Order',
    description: 'Matt Reeves’ serialized crime saga tracing the collapse of the Falcone mob and the ascent of masked psychopaths.',
    entries: [
      {
        movieId: 'the-batman',
        orderNumber: 1,
        role: 'The Flood & The Detective’s Awakening',
        priority: 'MUST WATCH',
        reason: 'The foundation of this universe. Establishes the flooded city, corrupt leadership, and Batman’s transition from vengeance to hope.'
      },
      {
        movieId: 'the-penguin',
        orderNumber: 2,
        role: 'The Underworld Turf War',
        priority: 'MUST WATCH',
        reason: 'Directly continues one week after the credits of The Batman, setting the stage for future theatrical installments.'
      },
      {
        movieId: 'batman-begins',
        orderNumber: 3,
        role: 'Dark Knight Genesis & Philosophy',
        priority: 'RECOMMENDED',
        reason: 'Essential companion study into Bruce Wayne’s martial martial training, theatrical terror, and psychological roots.'
      }
    ]
  },
  {
    id: 'order-nolan-cosmos',
    universeId: 'nolan-cosmos',
    universeName: 'The Quantum & Temporal Cosmos',
    title: 'Christopher Nolan: Mind & Cosmos Quadrilogy',
    orderType: 'essential-only',
    orderTypeLabel: 'Essential Experience Order',
    description: 'A curated journey through cinema’s most ambitious explorations of the human mind, space-time, and moral conscience.',
    entries: [
      {
        movieId: 'inception',
        orderNumber: 1,
        role: 'The Subconscious & Shared Memory',
        priority: 'MUST WATCH',
        reason: 'Masterclass in rule-based mental realms and temporal stacking.'
      },
      {
        movieId: 'interstellar',
        orderNumber: 2,
        role: 'Relativity, Black Holes & Love Across Dimensions',
        priority: 'MUST WATCH',
        reason: 'A monumental emotional and scientific triumph that expands scope into cosmic infinity.'
      },
      {
        movieId: 'oppenheimer',
        orderNumber: 3,
        role: 'The Fire of Prometheus & Quantum Paranoia',
        priority: 'MUST WATCH',
        reason: 'The ultimate tragic culmination of theoretical knowledge clashing with geopolitical destruction.'
      }
    ]
  }
];

export const WHERE_TO_WATCH_DIRECTORY: WhereToWatchSite[] = [
  {
    id: 'site-hdhub4u',
    name: 'HDHub4u',
    url: 'https://new7.hdhub4u.cl/?utm=mn1',
    description: 'External movie directory and entertainment portal. Catalogs international titles, multilingual releases, and trending cinema collections.',
    category: 'Movie Discovery and Availability Guides',
    availabilityType: 'External Entertainment Directory',
    region: 'Global / Multilingual',
    verified: false,
    userExpectationNote: 'General external destination. Movie Verse does not host media or verify title-specific availability on external sites.'
  },
  {
    id: 'site-movielinkbd',
    name: 'MovieLinkBD',
    url: 'https://movielinkbd.one/',
    description: 'External entertainment directory index and movie guide. Catalogs global titles, regional media links, and cinema collections.',
    category: 'Movie Discovery and Availability Guides',
    availabilityType: 'External Entertainment Directory',
    region: 'South Asia & Global',
    verified: false,
    userExpectationNote: 'General external destination. Movie Verse does not host media or verify title-specific availability on external sites.'
  }
];
