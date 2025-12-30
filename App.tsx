import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Studio from './pages/Studio';
import Analytics from './pages/Analytics';
import CreatorSettings from './pages/CreatorSettings';
import PublicPage from './pages/PublicPage';
import BlogEditor from './pages/BlogEditor';
import { AppRoute, PodcastProject, CreatorProfile, BlogPost, Series } from './types';
import { db } from './services/db';
import { PixelService } from './services/pixel';
import { Loader2 } from 'lucide-react';

// Placeholder data used for first-time initialization
const MOCK_PROJECTS: PodcastProject[] = [
  {
    id: '1',
    title: 'Die Oggend Nuus',
    description: 'Daily news summary in formal Afrikaans.',
    content: 'Goeie more, hier is die nuus...',
    createdAt: Date.now() - 86400000,
    voice: 'Fenrir',
    tone: 'formal',
    productionSettings: {
      introMusic: 'news',
      outroMusic: 'none',
      playbackSpeed: 1.0,
      pitch: 0,
      introVolume: 0.5,
      outroVolume: 0.5,
      voiceVolume: 1.0
    },
    chapters: [],
    metadata: {
      author: 'Jan De Vries',
      genre: 'News',
      season: 1,
      episode: 42,
      type: 'full',
      explicit: false,
    },
    distributionStatus: 'draft'
  },
  {
    id: '2',
    title: 'Spookstories van die Kaap',
    description: 'Episode 1: Die Vlieënde Hollander',
    content: 'Dit was n donker en stormagtige nag...',
    createdAt: Date.now() - 172800000,
    voice: 'Kore',
    tone: 'storytelling',
    productionSettings: {
       introMusic: 'story',
       outroMusic: 'story',
       playbackSpeed: 0.9,
       pitch: 0,
       introVolume: 0.6,
       outroVolume: 0.6,
       voiceVolume: 0.95
    },
    chapters: [],
    metadata: {
      author: 'Sarie Marais',
      genre: 'Fiction',
      season: 1,
      episode: 1,
      type: 'full',
      explicit: true,
    },
    distributionStatus: 'published'
  }
];

// Mock Blog Posts
const MOCK_BLOGS: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Afrikaans Media',
    excerpt: 'How artificial intelligence is revitalizing local language content creation and broadcasting.',
    content: `
      <p class="mb-6 text-lg leading-relaxed text-slate-300">Artificial Intelligence is not just for English speakers. In recent years, we have seen a surge in tools adapting to local languages, including Afrikaans.</p>
      <p class="mb-6 text-lg leading-relaxed text-slate-300">From text-to-speech engines like StemGolf to automated translation services, the barrier to entry for content creators is lowering significantly. This democratization of technology means that stories from the Klein Karoo to Pretoria can be told with production values that rival international studios.</p>
      <h3 class="text-2xl font-bold text-white mt-8 mb-4">Why it matters</h3>
      <p class="mb-6 text-lg leading-relaxed text-slate-300">Preserving language through technology ensures that the next generation engages with their heritage in modern formats like podcasts, audiobooks, and interactive media. It is about keeping the language alive in the digital age.</p>
    `,
    author: 'Jan De Vries',
    date: 'Oct 12, 2023',
    createdAt: Date.now() - 1000000,
    tags: ['Technology', 'Language'],
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1000&auto=format&fit=crop',
    status: 'published'
  },
];

const DEFAULT_PROFILE: CreatorProfile = {
  name: 'Jan De Vries',
  slug: 'jan-se-nuus',
  bio: 'Bringing you the latest updates and stories from Cape Town in authentic Afrikaans.',
  brandColor: '#ea580c',
  links: {
    spotify: 'https://spotify.com',
    website: 'https://stemgolf.app'
  },
  theme: 'classic',
  font: 'modern',
  removeBranding: false
};

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);

  // State
  const [projects, setProjects] = useState<PodcastProject[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [profile, setProfile] = useState<CreatorProfile>(DEFAULT_PROFILE);
  
  const [editingProject, setEditingProject] = useState<PodcastProject | null>(null);

  // Initial Data Load
  useEffect(() => {
    // Initialize Pixel
    PixelService.init();
    // Track initial page load
    PixelService.trackPageView();

    const loadData = async () => {
      try {
        const [loadedProjects, loadedBlogs, loadedSeries, loadedProfile] = await Promise.all([
          db.projects.list(),
          db.content.list(),
          db.series.list(),
          db.users.getProfile()
        ]);

        // Seed default data if empty (first run)
        if (loadedProjects.length === 0 && loadedBlogs.length === 0 && !loadedProfile) {
          await Promise.all([
             ...MOCK_PROJECTS.map(p => db.projects.save(p)),
             ...MOCK_BLOGS.map(b => db.content.save(b)),
             db.users.saveProfile(DEFAULT_PROFILE)
          ]);
          setProjects(MOCK_PROJECTS);
          setBlogPosts(MOCK_BLOGS);
          setProfile(DEFAULT_PROFILE);
          setSeriesList([]);
        } else {
          setProjects(loadedProjects);
          setBlogPosts(loadedBlogs);
          setSeriesList(loadedSeries);
          if (loadedProfile) setProfile(loadedProfile);
        }
      } catch (e) {
        console.error("Database load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleNavigate = (route: AppRoute) => {
    setCurrentRoute(route);
    PixelService.trackPageView(); // Track route changes as PageViews
    if (route !== AppRoute.STUDIO) {
      setEditingProject(null);
    }
  };

  const handleEditProject = (project: PodcastProject) => {
    setEditingProject(project);
    setCurrentRoute(AppRoute.STUDIO);
  };

  const handleSaveProject = async (project: PodcastProject) => {
    // Track Studio usage (e.g. Content Generated)
    PixelService.trackStudioUsage(project.title, project.duration || 0);

    const saved = await db.projects.save(project);
    setProjects(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) {
        const newProjects = [...prev];
        newProjects[idx] = saved;
        return newProjects;
      }
      return [saved, ...prev];
    });
    
    // If currently editing, update that ref too
    if (editingProject?.id === saved.id) {
       setEditingProject(saved);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await db.projects.delete(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (editingProject?.id === id) {
        setEditingProject(null);
        setCurrentRoute(AppRoute.DASHBOARD);
      }
    }
  };

  const handleDuplicateProject = async (project: PodcastProject) => {
    const dup = { ...project, id: `proj_${Date.now()}`, title: `${project.title} (Copy)`, createdAt: Date.now() };
    await handleSaveProject(dup);
  };

  const handleUpdateProfile = async (newProfile: CreatorProfile) => {
    await db.users.saveProfile(newProfile);
    setProfile(newProfile);
  };

  const handleSavePost = async (post: BlogPost) => {
    await db.content.save(post);
    setBlogPosts(prev => {
      const idx = prev.findIndex(p => p.id === post.id);
      if (idx >= 0) {
        const newPosts = [...prev];
        newPosts[idx] = post;
        return newPosts;
      }
      return [post, ...prev];
    });
  };

  const handleDeletePost = async (id: string) => {
     if (confirm("Delete this article?")) {
        await db.content.delete(id);
        setBlogPosts(prev => prev.filter(p => p.id !== id));
     }
  };

  const handleCreateSeries = async (series: Series) => {
    await db.series.save(series);
    setSeriesList(prev => [series, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600 mb-4" />
        <p className="text-slate-400 font-mono text-sm">Loading Studio...</p>
      </div>
    );
  }

  return (
    <Layout currentRoute={currentRoute} onNavigate={handleNavigate} profile={profile}>
      {currentRoute === AppRoute.DASHBOARD && (
        <Dashboard 
          onNavigate={handleNavigate} 
          onEditProject={handleEditProject} 
          projects={projects} 
        />
      )}
      
      {currentRoute === AppRoute.STUDIO && (
        <Studio 
          initialProject={editingProject}
          projects={projects}
          seriesList={seriesList} 
          creatorProfile={profile}
          onSave={handleSaveProject}
          onSelectProject={(p) => p ? handleEditProject(p) : handleNavigate(AppRoute.STUDIO)}
          onDeleteProject={handleDeleteProject}
          onDuplicateProject={handleDuplicateProject}
          onCreateBlogPost={handleSavePost}
          onCreateSeries={handleCreateSeries}
        />
      )}

      {currentRoute === AppRoute.BLOG_EDITOR && (
         <BlogEditor 
            posts={blogPosts}
            profile={profile}
            projects={projects}
            onSave={handleSavePost}
            onDelete={handleDeletePost}
         />
      )}

      {currentRoute === AppRoute.ANALYTICS && <Analytics />}
      
      {currentRoute === AppRoute.CREATOR_SETTINGS && (
        <CreatorSettings 
          profile={profile} 
          onUpdate={handleUpdateProfile} 
          onNavigate={handleNavigate}
        />
      )}

      {currentRoute === AppRoute.PUBLIC_PAGE && (
        <PublicPage 
          profile={profile} 
          projects={projects}
          posts={blogPosts}
          onNavigate={handleNavigate}
        />
      )}
    </Layout>
  );
};

export default App;