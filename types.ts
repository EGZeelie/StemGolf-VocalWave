
export interface Chapter {
  id: string;
  title: string;
  timestamp: number; // Seconds from start of voice track
}

export interface EqualizerSettings {
  low: number; // dB (-12 to 12)
  mid: number; // dB
  high: number; // dB
}

export interface ProductionSettings {
  introMusic?: 'news' | 'story' | 'upbeat' | 'none' | 'custom';
  introAudioUrl?: string; // Data URL or Blob URL
  outroMusic?: 'news' | 'story' | 'upbeat' | 'none' | 'custom';
  outroAudioUrl?: string; // Data URL or Blob URL
  
  // Background / Bed
  backgroundMusic?: string; // Data URL for looping background
  backgroundVolume?: number;

  // Voice Processing
  playbackSpeed: number; // 0.5 to 2.0
  pitch: number; // -12 to 12 semitones
  voiceVolume?: number; // 0.0 to 2.0
  
  // Advanced FX
  eqSettings?: EqualizerSettings;
  compression?: boolean;
  reverb?: 'none' | 'studio' | 'room' | 'hall';
  
  // Global Levels
  introVolume?: number;
  outroVolume?: number;
}

export interface DistributionMetadata {
  author: string;
  genre: string;
  season: number;
  episode: number;
  type: 'full' | 'trailer' | 'bonus';
  explicit: boolean;
  coverArt?: string; // Data URL or URL
  publishDate?: string; // ISO String for scheduling
}

export interface YoutubeMetadata {
  title: string;
  description: string;
  tags: string[];
  thumbnailUrl?: string;
  privacyStatus: 'public' | 'private' | 'unlisted';
}

export interface Series {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  createdAt: number;
}

export interface PodcastProject {
  id: string;
  title: string;
  description: string;
  content: string;
  audioUrl?: string;
  audioBlob?: Blob; // New field for persistence
  createdAt: number;
  duration?: number; // in seconds
  voice: string;
  coHostVoice?: string; // Optional second speaker
  tone: 'formal' | 'conversational' | 'storytelling';
  productionSettings: ProductionSettings;
  chapters: Chapter[];
  // New Distribution Fields
  metadata: DistributionMetadata;
  distributionStatus: 'draft' | 'scheduled' | 'published' | 'failed';
  platforms?: string[]; // List of IDs like 'spotify', 'apple'
  seriesId?: string; // Link to a Series
  youtubeMetadata?: YoutubeMetadata;
}

export interface CustomLink {
  id: string;
  label: string;
  url: string;
}

export interface SeoSettings {
  googleAnalyticsId?: string; // G-XXXXXXXXXX
  googleSiteVerification?: string; // Meta tag content
  facebookPixelId?: string; // FB Pixel ID
}

export interface Integrations {
  facebookPageId?: string;
  facebookPageAccessToken?: string;
  xComAccessToken?: string; // Token for posting to X
}

export interface HostProfile {
  id: string;
  name: string;
  bio: string;
  imageUrl?: string;
}

export interface CreatorProfile {
  name: string;
  slug: string;
  bio: string;
  coverImage?: string;
  brandColor: string; // Hex
  links: {
    spotify?: string;
    apple?: string;
    rss?: string;
    website?: string;
    youtube?: string;
  };
  customLinks: CustomLink[]; // Flexible array for other social/streaming links
  hosts?: HostProfile[]; // New Host Profiles
  seo?: SeoSettings; // New SEO configurations
  integrations?: Integrations; // Third-party API keys
  // Visual Customization
  theme: 'classic' | 'minimal' | 'bold';
  font: 'modern' | 'serif';
  // Pro Features
  plan: 'free' | 'pro'; // Subscription status
  customDomain?: string;
  removeBranding: boolean;
  role: 'user' | 'admin';
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string; // HTML or Markdown
  author: string;
  date: string;
  createdAt: number;
  coverImage?: string;
  tags: string[];
  status: 'draft' | 'published';
  linkedEpisodeId?: string; // ID of the PodcastProject
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  style: string;
}

export enum AppRoute {
  LOGIN = 'login',
  DASHBOARD = 'dashboard',
  STUDIO = 'studio',
  BLOG_EDITOR = 'blog_editor',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  CREATOR_SETTINGS = 'creator_settings',
  SPONSOR_MANAGER = 'sponsor_manager',
  PUBLIC_PAGE = 'public_page',
  ADMIN = 'admin',
  STREAMING_DECK = 'streaming_deck'
}

// Gemini specific types usually come from the SDK, but we define internal mapped types here
export type GenerationStatus = 'idle' | 'generating_script' | 'synthesizing_audio' | 'mixing' | 'ready' | 'error' | 'publishing' | 'generating_youtube';