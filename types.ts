export interface Chapter {
  id: string;
  title: string;
  timestamp: number; // Seconds from start of voice track
}

export interface ProductionSettings {
  introMusic?: 'news' | 'story' | 'upbeat' | 'none';
  outroMusic?: 'news' | 'story' | 'upbeat' | 'none';
  playbackSpeed: number; // 0.5 to 2.0
  pitch: number; // -12 to 12 semitones (simulated via rate or detune)
  introVolume?: number;
  outroVolume?: number;
  voiceVolume?: number; // 0.0 to 2.0
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
  // Visual Customization
  theme: 'classic' | 'minimal' | 'bold';
  font: 'modern' | 'serif';
  // Pro Features
  customDomain?: string;
  removeBranding: boolean;
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
  DASHBOARD = 'dashboard',
  STUDIO = 'studio',
  BLOG_EDITOR = 'blog_editor',
  ANALYTICS = 'analytics',
  SETTINGS = 'settings',
  CREATOR_SETTINGS = 'creator_settings',
  PUBLIC_PAGE = 'public_page'
}

// Gemini specific types usually come from the SDK, but we define internal mapped types here
export type GenerationStatus = 'idle' | 'generating_script' | 'synthesizing_audio' | 'mixing' | 'ready' | 'error' | 'publishing' | 'generating_youtube';