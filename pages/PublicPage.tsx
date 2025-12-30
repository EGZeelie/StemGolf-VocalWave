import React, { useState, useEffect } from 'react';
import { CreatorProfile, PodcastProject, AppRoute, BlogPost } from '../types';
import { Play, Pause, ArrowLeft, Headphones, Mail, ArrowRight, Instagram, Twitter, Facebook, Linkedin, Circle, Calendar, User, Clock, Search, Home, Info, Mic, FileText, Phone, AlertTriangle, X, Menu, Share2, Volume2, SkipBack, SkipForward, Youtube, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface PublicPageProps {
  profile: CreatorProfile;
  projects: PodcastProject[];
  posts: BlogPost[];
  onNavigate: (route: AppRoute) => void;
}

type PublicView = 'home' | 'about' | 'episodes' | 'episode_detail' | 'blog' | 'blog_detail' | 'contact' | '404';

const PublicPage: React.FC<PublicPageProps> = ({ profile, projects, posts, onNavigate }) => {
  const publishedEpisodes = projects.filter(p => p.distributionStatus === 'published' || p.distributionStatus === 'scheduled');
  
  // --- STATE ---
  const [currentView, setCurrentView] = useState<PublicView>('home');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filters
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [blogCategory, setBlogCategory] = useState('All');

  // Audio Player State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- THEME DERIVATION ---
  const accentColor = profile.brandColor || '#a855f7'; // Default to purple-500 hex
  const fontClass = profile.font === 'serif' ? 'font-serif' : 'font-sans';
  const theme = profile.theme || 'classic';

  // Base Background styles per theme
  const getThemeBackground = () => {
    switch (theme) {
      case 'minimal': return 'bg-[#080808]'; // Clean, flat dark
      case 'bold': return 'bg-[#020202]'; // Deep black, relies on gradients
      default: return 'bg-black bg-grid-pattern'; // Classic
    }
  };

  // --- AUDIO LOGIC ---
  useEffect(() => {
    if (audioEl) {
        const updateProgress = () => {
            if (audioEl.duration) {
                setProgress((audioEl.currentTime / audioEl.duration) * 100);
            }
        };
        const handleEnded = () => {
            setIsPlaying(false);
            setPlayingId(null);
            setProgress(0);
        };
        
        audioEl.addEventListener('timeupdate', updateProgress);
        audioEl.addEventListener('ended', handleEnded);
        
        return () => {
            audioEl.removeEventListener('timeupdate', updateProgress);
            audioEl.removeEventListener('ended', handleEnded);
        }
    }
  }, [audioEl]);

  const togglePlay = (project: PodcastProject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!project.audioUrl) return;

    if (playingId === project.id && audioEl) {
      if (!audioEl.paused) {
        audioEl.pause();
        setIsPlaying(false);
      } else {
        audioEl.play();
        setIsPlaying(true);
      }
    } else {
      if (audioEl) audioEl.pause();
      const newAudio = new Audio(project.audioUrl);
      newAudio.play();
      setIsPlaying(true);
      setAudioEl(newAudio);
      setPlayingId(project.id);
    }
  };

  const navigateTo = (view: PublicView, id: string | null = null) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentView(view);
    setDetailId(id);
    setMobileMenuOpen(false);
  };

  // --- SUB-COMPONENTS ---

  const StickyPlayer = () => {
    const episode = publishedEpisodes.find(p => p.id === playingId);
    if (!episode || !playingId) return null;

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 border-t border-white/10 backdrop-blur-xl z-50 animate-in slide-in-from-bottom-full duration-300">
         <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-4 min-w-0 w-1/3">
               <div className="w-12 h-12 rounded bg-[#222] overflow-hidden flex-shrink-0 relative">
                 <img src={episode.metadata.coverArt || profile.coverImage} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/10"></div>
               </div>
               <div className="min-w-0 hidden sm:block">
                  <div className="text-sm font-bold text-white truncate">{episode.title}</div>
                  <div className="text-xs text-slate-400 truncate">{episode.metadata.author}</div>
               </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center flex-1 max-w-md">
               <div className="flex items-center gap-6 mb-1">
                  <button className="text-slate-400 hover:text-white transition-colors"><SkipBack className="w-5 h-5" /></button>
                  <button 
                    onClick={(e) => togglePlay(episode, e)}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform"
                  >
                     {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <button className="text-slate-400 hover:text-white transition-colors"><SkipForward className="w-5 h-5" /></button>
               </div>
               {/* Progress Bar */}
               <div className="w-full flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                  <span>{audioEl ? Math.floor(audioEl.currentTime / 60) : 0}:{audioEl ? Math.floor(audioEl.currentTime % 60).toString().padStart(2,'0') : '00'}</span>
                  <div className="flex-1 h-1 bg-[#333] rounded-full overflow-hidden cursor-pointer group">
                     <div className="h-full bg-[var(--accent)] rounded-full relative" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span>{Math.floor((episode.duration || 0) / 60)}:{Math.floor((episode.duration || 0) % 60).toString().padStart(2,'0')}</span>
               </div>
            </div>

            {/* Volume / Extra */}
            <div className="w-1/3 flex justify-end items-center gap-4">
               <button className="text-slate-400 hover:text-white hidden sm:block"><Volume2 className="w-5 h-5" /></button>
               <button className="text-slate-400 hover:text-white hidden sm:block"><Share2 className="w-5 h-5" /></button>
            </div>
         </div>
      </div>
    );
  };

  const Navbar = () => (
    <nav className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center relative z-40">
       <div 
         className="text-2xl font-bold tracking-tighter cursor-pointer flex items-center gap-1 hover:opacity-80 transition-opacity" 
         onClick={() => navigateTo('home')}
       >
         {profile.name}<span className="text-[var(--accent)] text-4xl leading-3">.</span>
       </div>

       {/* Desktop Nav */}
       <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
          {[
             { id: 'home', label: 'Home' },
             { id: 'about', label: 'About' },
             { id: 'episodes', label: 'Episodes' },
             { id: 'blog', label: 'Blog' },
             { id: 'contact', label: 'Contact' }
          ].map(link => (
             <button 
               key={link.id}
               onClick={() => navigateTo(link.id as PublicView)} 
               className={`hover:text-white transition-colors relative py-1 ${currentView.includes(link.id) || (link.id === 'home' && currentView === 'home') ? 'text-white after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-[var(--accent)]' : ''}`}
             >
               {link.label}
             </button>
          ))}
       </div>

       <div className="hidden md:block">
         <button className="px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm hover:bg-slate-200 transition-all">
           Subscribe
         </button>
       </div>

       {/* Mobile Toggle */}
       <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
       </button>

       {/* Mobile Menu */}
       {mobileMenuOpen && (
         <div className="absolute top-full left-0 right-0 bg-[#0f0f0f] border-b border-white/10 p-4 flex flex-col gap-4 md:hidden shadow-2xl animate-in slide-in-from-top-2">
            {[
             { id: 'home', label: 'Home' },
             { id: 'about', label: 'About' },
             { id: 'episodes', label: 'Episodes' },
             { id: 'blog', label: 'Blog' },
             { id: 'contact', label: 'Contact' }
            ].map(link => (
              <button 
                key={link.id}
                onClick={() => navigateTo(link.id as PublicView)}
                className={`text-left px-4 py-3 rounded-lg text-lg font-medium ${currentView.includes(link.id) ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              >
                {link.label}
              </button>
            ))}
             <button className="w-full py-3 bg-[var(--accent)] text-white font-bold rounded-lg mt-2">
               Subscribe
             </button>
         </div>
       )}
    </nav>
  );

  const Footer = () => (
    <section className="py-24 border-t border-white/10 mt-auto bg-black/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
            <div className="md:col-span-1">
               <h3 className="font-bold text-2xl mb-6 text-white">{profile.name}<span className="text-[var(--accent)]">.</span></h3>
               <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  Unlocking stories, sparking conversations, and inspiring change through AI-powered audio content.
               </p>
               <div className="flex flex-wrap gap-4">
                  {profile.links.youtube && (
                      <a href={profile.links.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white/10 transition-all"><Youtube className="w-5 h-5" /></a>
                  )}
                  {profile.customLinks?.map(link => (
                      <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" title={link.label} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                          <LinkIcon className="w-4 h-4" />
                      </a>
                  ))}
               </div>
            </div>
            <div>
               <h4 className="font-bold text-sm mb-6 text-white uppercase tracking-wider">Explore</h4>
               <ul className="space-y-4 text-sm text-slate-400">
                  <li><button onClick={() => navigateTo('home')} className="hover:text-[var(--accent)] transition-colors">Home</button></li>
                  <li><button onClick={() => navigateTo('about')} className="hover:text-[var(--accent)] transition-colors">About Us</button></li>
                  <li><button onClick={() => navigateTo('episodes')} className="hover:text-[var(--accent)] transition-colors">Episodes</button></li>
                  <li><button onClick={() => navigateTo('blog')} className="hover:text-[var(--accent)] transition-colors">Latest News</button></li>
               </ul>
            </div>
            <div>
               <h4 className="font-bold text-sm mb-6 text-white uppercase tracking-wider">Legal</h4>
               <ul className="space-y-4 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-[var(--accent)] transition-colors">Cookie Policy</a></li>
                  <li><button onClick={() => navigateTo('404')} className="hover:text-[var(--accent)] transition-colors">404 Page</button></li>
               </ul>
            </div>
            <div>
               <h4 className="font-bold text-sm mb-6 text-white uppercase tracking-wider">Creator Studio</h4>
               <p className="text-xs text-slate-500 mb-4">Are you the owner of this podcast?</p>
               <button 
                 onClick={() => onNavigate(AppRoute.CREATOR_SETTINGS)} 
                 className="px-6 py-3 border border-white/20 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-all w-full md:w-auto"
               >
                  Go to Dashboard
               </button>
            </div>
         </div>
         
         <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600 gap-4">
            <span>© {new Date().getFullYear()} {profile.name}. All Rights Reserved.</span>
            <span>Powered by <span className="text-slate-400 font-bold">StemGolf AI</span></span>
         </div>
      </div>
    </section>
  );

  // --- VIEW RENDERERS ---

  const renderHome = () => (
    <div className="animate-in fade-in duration-500">
      <section className="relative min-h-[85vh] flex flex-col items-center border-b border-white/10">
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 relative z-10 py-20">
           
           {/* Dynamic Glow/Gradient based on Theme */}
           {theme === 'bold' ? (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--accent)_0%,transparent_60%)] opacity-30 pointer-events-none"></div>
           ) : (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent)] rounded-full blur-[150px] opacity-20 pointer-events-none"></div>
           )}
           
           <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[0.9]">
              LISTEN THE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">PODCAST</span>
           </h1>
           
           <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
              {profile.bio || "Unlocking stories, sparking conversations, and inspiring change. Welcome, where every episode brings a new perspective."}
           </p>

           <div className="relative group z-20">
              <div className="absolute inset-0 bg-[var(--accent)] rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
              <button 
                onClick={() => navigateTo('episodes')}
                className="relative px-10 py-4 bg-black border border-white/20 rounded-full text-white font-bold hover:scale-105 transition-all flex items-center gap-3 group-hover:border-[var(--accent)]"
              >
                Start Listening <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black"><ArrowRight className="w-3 h-3" /></div>
              </button>
           </div>

           <div className="mt-20 relative w-full max-w-4xl aspect-[21/9] rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10"></div>
              {profile.coverImage ? (
                 <img src={profile.coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                 <img src="https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1000&auto=format&fit=crop" alt="Microphone" className="w-full h-full object-cover opacity-80" />
              )}
           </div>
        </div>
      </section>
      
      {/* Featured Episodes (Home) */}
      <section className="py-24 border-t border-white/10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
               <div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">Latest Episodes</h2>
                  <p className="text-slate-400">Fresh from the studio, delivered to your ears.</p>
               </div>
               <button onClick={() => navigateTo('episodes')} className="text-sm font-bold border-b border-white pb-1 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors">View All Episodes</button>
            </div>
            
            {publishedEpisodes.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {publishedEpisodes.slice(0, 3).map((ep, idx) => (
                     <div key={ep.id} onClick={() => navigateTo('episode_detail', ep.id)} className="group cursor-pointer">
                        <div className="aspect-[4/3] bg-white/5 rounded-2xl overflow-hidden relative border border-white/10 mb-6 shadow-lg group-hover:shadow-[var(--accent)]/20 transition-shadow">
                           <img 
                             src={ep.metadata.coverArt || profile.coverImage || `https://source.unsplash.com/random/800x600?mic,studio&sig=${idx}`} 
                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100" 
                           />
                           <div className="absolute top-4 left-4">
                              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-wider">
                                 {ep.metadata.genre}
                              </span>
                           </div>
                           <button className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center text-black opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-xl">
                              <Play className="w-5 h-5 fill-current ml-1" />
                           </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 font-medium">
                           <span className="text-[var(--accent)] font-bold">Ep {ep.metadata.episode}</span>
                           <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                           <span>{new Date(ep.createdAt).toLocaleDateString()}</span>
                           <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                           <span>{Math.round((ep.duration || 0) / 60)} min</span>
                        </div>
                        <h3 className="text-2xl font-bold group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-tight">{ep.title}</h3>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="text-center py-24 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Mic className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500">No episodes published yet.</p>
               </div>
            )}
         </div>
      </section>

      {/* Recent Articles (Home) */}
      <section className="py-24 bg-white/5 border-t border-white/10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
               <div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-4">From the Blog</h2>
                  <p className="text-slate-400">Insights, updates, and behind the scenes.</p>
               </div>
               <button onClick={() => navigateTo('blog')} className="text-sm font-bold border-b border-white pb-1 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors">Read All Articles</button>
            </div>
            {posts.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {posts.slice(0, 2).map((post) => (
                     <div key={post.id} onClick={() => navigateTo('blog_detail', post.id)} className="group cursor-pointer flex flex-col sm:flex-row gap-6 items-start p-6 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                        <div className="w-full sm:w-40 h-40 rounded-xl bg-[#111] overflow-hidden flex-shrink-0 border border-white/10 shadow-lg">
                           {post.coverImage ? (
                               <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center bg-slate-900"><FileText className="text-slate-600"/></div>
                           )}
                        </div>
                        <div>
                           <div className="text-xs font-bold mb-3 uppercase tracking-wider text-[var(--accent)]">{post.tags[0] || 'Article'}</div>
                           <h3 className="text-2xl font-bold mb-3 group-hover:text-slate-200 transition-colors leading-tight">{post.title}</h3>
                           <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-4">{post.excerpt}</p>
                           <span className="text-xs font-bold text-white border-b border-white/20 pb-0.5 group-hover:border-white transition-colors">Read Story</span>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="text-center py-20 bg-white/5 rounded-2xl">
                  <p className="text-slate-500">No blog posts yet.</p>
               </div>
            )}
         </div>
      </section>
    </div>
  );

  const renderAbout = () => (
    <section className="py-24 relative min-h-screen animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div className="relative order-2 lg:order-1">
           <div className="inline-block px-4 py-1 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 text-xs font-bold uppercase tracking-wider mb-6">
              Our Story
           </div>
           <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">About <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-white">{profile.name}</span></h1>
           <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              We are bridging the gap between traditional storytelling and modern technology, creating a platform where every voice can be heard.
           </p>
           <div className="space-y-6 text-slate-400 leading-relaxed mb-10">
              <p>
                 {profile.name} started with a simple mission: to make Afrikaans audio content accessible, high-quality, and engaging for everyone. Using state-of-the-art AI, we bring stories to life with unprecedented speed and quality.
              </p>
              <p>
                 {profile.bio}
              </p>
           </div>
           
           <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
              <div>
                 <div className="text-4xl font-bold text-white mb-2">12k+</div>
                 <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Monthly Listeners</div>
              </div>
              <div>
                 <div className="text-4xl font-bold text-white mb-2">150+</div>
                 <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">Episodes Produced</div>
              </div>
           </div>
        </div>
        
        <div className="relative h-[600px] w-full order-1 lg:order-2">
           <div className="absolute top-0 right-0 w-4/5 h-full bg-[#111] rounded-3xl border border-white/10 overflow-hidden z-10 shadow-2xl rotate-3">
              <img src={profile.coverImage || "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?q=80&w=1000&auto=format&fit=crop"} className="w-full h-full object-cover opacity-90" />
           </div>
           <div className="absolute bottom-20 left-0 w-3/5 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 z-20 p-8 shadow-2xl -rotate-3">
              <div className="text-5xl font-bold text-[var(--accent)] mb-4 font-serif">"</div>
              <p className="text-white font-medium text-lg italic mb-6 leading-relaxed">Voice is the most powerful medium for human connection. We're just making it louder.</p>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold">{profile.name.charAt(0)}</div>
                 <div className="text-sm text-slate-400 font-bold">{profile.name}<br/><span className="font-normal text-xs text-slate-500">Creator</span></div>
              </div>
           </div>
        </div>
      </div>
    </section>
  );

  const renderEpisodes = () => {
    // Filter logic
    const filtered = publishedEpisodes.filter(e => 
        e.title.toLowerCase().includes(episodeSearch.toLowerCase()) || 
        e.description.toLowerCase().includes(episodeSearch.toLowerCase())
    );

    return (
        <section className="py-24 min-h-screen animate-in fade-in duration-500">
           <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-3xl mx-auto mb-20">
                 <h1 className="text-5xl md:text-6xl font-bold mb-6">Episodes</h1>
                 <p className="text-xl text-slate-400 mb-10">Explore our complete archive of stories, news, and conversations.</p>
                 
                 {/* Search Bar */}
                 <div className="relative max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search episodes..." 
                        value={episodeSearch}
                        onChange={(e) => setEpisodeSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-12 pr-6 text-white focus:outline-none focus:border-[var(--accent)] transition-colors shadow-lg"
                    />
                 </div>
              </div>
              
              <div className="flex flex-col gap-6">
                 {filtered.length > 0 ? filtered.map((ep, idx) => (
                    <div key={ep.id} className="group bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-8 hover:border-[var(--accent)]/30 transition-all hover:bg-white/10">
                       <div className="w-full md:w-56 aspect-square rounded-2xl bg-black/20 flex-shrink-0 overflow-hidden relative shadow-lg">
                          <img 
                            src={ep.metadata.coverArt || profile.coverImage || `https://source.unsplash.com/random/800x600?mic,studio&sig=${idx}`} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                             <button onClick={(e) => togglePlay(ep, e)} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black shadow-xl hover:scale-110 transition-transform">
                                {playingId === ep.id && isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                             </button>
                          </div>
                       </div>
                       <div className="flex-1 flex flex-col justify-center py-2">
                          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-3">
                             <span>Ep {ep.metadata.episode}</span>
                             <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                             <span>{ep.metadata.genre}</span>
                          </div>
                          <h2 
                            onClick={() => navigateTo('episode_detail', ep.id)}
                            className="text-3xl font-bold mb-4 hover:text-[var(--accent)] cursor-pointer transition-colors leading-tight"
                          >
                            {ep.title}
                          </h2>
                          <p className="text-slate-400 text-base line-clamp-2 mb-8 max-w-3xl leading-relaxed">
                             {ep.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 font-medium">
                             <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><Calendar className="w-4 h-4" /> {new Date(ep.createdAt).toLocaleDateString()}</span>
                             <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full"><Clock className="w-4 h-4" /> {Math.round((ep.duration || 0) / 60)} mins</span>
                             <button 
                               onClick={() => navigateTo('episode_detail', ep.id)}
                               className="ml-auto flex items-center gap-2 text-white hover:text-[var(--accent)] transition-colors font-bold group-hover:translate-x-1 duration-300"
                             >
                               Episode Details <ArrowRight className="w-4 h-4" />
                             </button>
                          </div>
                       </div>
                    </div>
                 )) : (
                    <div className="text-center py-32 bg-white/5 rounded-3xl border border-dashed border-white/10">
                       <Search className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                       <p className="text-slate-500 text-lg">No episodes found matching "{episodeSearch}".</p>
                    </div>
                 )}
              </div>
           </div>
        </section>
    );
  }

  const renderEpisodeDetail = () => {
    const ep = publishedEpisodes.find(p => p.id === detailId);
    if (!ep) return render404();

    const related = publishedEpisodes.filter(p => p.id !== ep.id).slice(0, 3);

    return (
      <section className="py-24 min-h-screen animate-in fade-in duration-500">
         <div className="max-w-5xl mx-auto px-6">
            <button onClick={() => navigateTo('episodes')} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-10 transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back to Episodes
            </button>
            
            <div className="mb-16">
               <div className="flex flex-col md:flex-row gap-10 items-start mb-12">
                  <div className="w-full md:w-80 aspect-square rounded-3xl bg-white/5 overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 relative">
                     <img 
                       src={ep.metadata.coverArt || profile.coverImage || "https://source.unsplash.com/random/800x600?mic"} 
                       className="w-full h-full object-cover" 
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="flex-1 text-center md:text-left pt-4">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold uppercase tracking-wider mb-6 border border-[var(--accent)]/30">
                        {ep.metadata.genre}
                     </div>
                     <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-[1.1]">{ep.title}</h1>
                     <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-slate-400 mb-10 font-medium">
                        <span className="flex items-center gap-2"><User className="w-4 h-4" /> {ep.metadata.author}</span>
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(ep.createdAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {Math.round((ep.duration || 0) / 60)} mins</span>
                     </div>
                     
                     <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                        <button 
                           onClick={() => togglePlay(ep)}
                           className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center gap-3 shadow-lg shadow-white/10"
                        >
                           {playingId === ep.id && isPlaying ? (
                              <><Pause className="w-5 h-5 fill-current" /> Pause Episode</>
                           ) : (
                              <><Play className="w-5 h-5 fill-current" /> Play Episode</>
                           )}
                        </button>
                        <button className="px-8 py-4 border border-white/20 rounded-full hover:bg-white/10 transition-colors font-bold">
                           Share
                        </button>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                   <div className="lg:col-span-2">
                       <h3 className="text-white font-bold text-2xl mb-6 border-b border-white/10 pb-4">Show Notes</h3>
                       <div className="prose prose-invert prose-lg max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                           {ep.description}
                           <br/><br/>
                           {ep.content}
                       </div>
                   </div>
                   <div className="space-y-8">
                       <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                           <h4 className="font-bold text-white mb-4">More from this Season</h4>
                           <div className="space-y-4">
                               {related.length > 0 ? related.map(rel => (
                                   <div key={rel.id} className="flex gap-4 group cursor-pointer" onClick={() => navigateTo('episode_detail', rel.id)}>
                                       <div className="w-16 h-16 rounded-lg bg-[#222] overflow-hidden flex-shrink-0">
                                            <img src={rel.metadata.coverArt || profile.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
                                       </div>
                                       <div>
                                           <div className="text-xs text-[var(--accent)] font-bold mb-1">Ep {rel.metadata.episode}</div>
                                           <div className="text-sm font-bold text-white line-clamp-2 group-hover:text-[var(--accent)] transition-colors">{rel.title}</div>
                                       </div>
                                   </div>
                               )) : (
                                   <p className="text-sm text-slate-500">No other episodes yet.</p>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
            </div>
         </div>
      </section>
    );
  };

  const renderBlog = () => {
    // Filter tags
    const tags = ['All', ...Array.from(new Set(posts.flatMap(b => b.tags)))];
    const filtered = blogCategory === 'All' ? posts : posts.filter(b => b.tags.includes(blogCategory));

    return (
     <section className="py-24 min-h-screen animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto px-6">
           <div className="text-center max-w-2xl mx-auto mb-16">
             <h1 className="text-5xl md:text-6xl font-bold mb-6">Our Blog</h1>
             <p className="text-xl text-slate-400 mb-10">Insights, updates, and stories from the world of Afrikaans audio.</p>
             
             {/* Category Filter */}
             <div className="flex flex-wrap justify-center gap-2">
                {tags.map(tag => (
                   <button
                     key={tag}
                     onClick={() => setBlogCategory(tag)}
                     className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${blogCategory === tag ? 'bg-white text-black' : 'bg-white/10 text-slate-400 hover:bg-white/20'}`}
                   >
                     {tag}
                   </button>
                ))}
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((post) => (
                 <div key={post.id} onClick={() => navigateTo('blog_detail', post.id)} className="group cursor-pointer bg-white/5 rounded-3xl border border-white/10 overflow-hidden hover:border-[var(--accent)]/30 transition-all flex flex-col h-full hover:-translate-y-1 duration-300 shadow-lg">
                    <div className="aspect-video bg-[#151515] overflow-hidden relative">
                       {post.coverImage ? (
                           <img src={post.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                       ) : (
                           <div className="w-full h-full flex items-center justify-center bg-slate-800"><FileText className="text-slate-600"/></div>
                       )}
                       <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                       <div className="flex gap-2 mb-4">
                          {post.tags.slice(0,2).map(tag => (
                             <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1 rounded-full">
                                {tag}
                             </span>
                          ))}
                       </div>
                       <h3 className="text-2xl font-bold mb-4 group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-tight">
                          {post.title}
                       </h3>
                       <p className="text-sm text-slate-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                          {post.excerpt}
                       </p>
                       <div className="flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-white/5 mt-auto">
                          <span className="font-bold text-slate-300 flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">{post.author.charAt(0)}</div>
                             {post.author}
                          </span>
                          <span>{post.date}</span>
                       </div>
                    </div>
                 </div>
              ))}
              {filtered.length === 0 && (
                  <div className="col-span-3 text-center py-20 bg-white/5 rounded-2xl">
                     <p className="text-slate-500">No posts in this category.</p>
                  </div>
              )}
           </div>
        </div>
     </section>
    );
  };

  const renderBlogDetail = () => {
    const post = posts.find(b => b.id === detailId);
    if (!post) return render404();

    const linkedEpisode = post.linkedEpisodeId ? publishedEpisodes.find(p => p.id === post.linkedEpisodeId) : null;

    return (
       <section className="py-24 min-h-screen animate-in fade-in duration-500">
          <div className="max-w-3xl mx-auto px-6">
             <button onClick={() => navigateTo('blog')} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white mb-12 transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back to Blog
             </button>

             <div className="mb-8 flex gap-3">
                {post.tags.map(tag => (
                   <span key={tag} className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] border border-[var(--accent)]/30 px-3 py-1.5 rounded-full">
                      {tag}
                   </span>
                ))}
             </div>
             
             <h1 className="text-4xl md:text-6xl font-bold mb-10 leading-[1.1]">
                {post.title}
             </h1>

             <div className="flex items-center gap-4 mb-12 pb-12 border-b border-white/10">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-lg">
                   {post.author.charAt(0)}
                </div>
                <div>
                   <div className="text-base font-bold text-white">{post.author}</div>
                   <div className="text-sm text-slate-500">{post.date} · 5 min read</div>
                </div>
             </div>
             
             {/* Linked Episode Card */}
             {linkedEpisode && (
                 <div className="mb-12 bg-white/5 rounded-2xl p-6 border border-[var(--accent)]/20 flex flex-col sm:flex-row gap-6 items-center">
                    <div className="w-24 h-24 rounded-xl bg-[#222] flex-shrink-0 overflow-hidden relative">
                         <img src={linkedEpisode.metadata.coverArt || profile.coverImage} className="w-full h-full object-cover"/>
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                             <Play className="w-8 h-8 text-white fill-current"/>
                         </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="text-xs text-[var(--accent)] font-bold uppercase mb-1">Listen to the Episode</div>
                        <h4 className="text-lg font-bold text-white mb-2">{linkedEpisode.title}</h4>
                        <div className="flex gap-4 justify-center sm:justify-start">
                            <button 
                                onClick={() => togglePlay(linkedEpisode)}
                                className="text-sm bg-white text-black font-bold px-4 py-2 rounded-full hover:bg-slate-200"
                            >
                                {playingId === linkedEpisode.id && isPlaying ? 'Pause' : 'Play Now'}
                            </button>
                            <button 
                                onClick={() => navigateTo('episode_detail', linkedEpisode.id)}
                                className="text-sm border border-white/20 text-white font-bold px-4 py-2 rounded-full hover:bg-white/10"
                            >
                                Details
                            </button>
                        </div>
                    </div>
                 </div>
             )}

             <div className="w-full aspect-video rounded-3xl overflow-hidden mb-16 bg-[#151515] border border-white/10 shadow-2xl">
                {post.coverImage ? (
                    <img src={post.coverImage} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800"><FileText className="w-16 h-16 text-slate-600"/></div>
                )}
             </div>

             <div 
               className="prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-white prose-a:text-[var(--accent)] prose-img:rounded-2xl"
               dangerouslySetInnerHTML={{ __html: post.content }}
             />
             
             {/* Share Footer */}
             <div className="mt-20 pt-10 border-t border-white/10">
                <p className="text-center text-slate-500 mb-6 font-medium">Share this article</p>
                <div className="flex justify-center gap-4">
                   <button className="p-3 rounded-full bg-white/5 hover:bg-white hover:text-black transition-all"><Twitter className="w-5 h-5"/></button>
                   <button className="p-3 rounded-full bg-white/5 hover:bg-white hover:text-black transition-all"><Facebook className="w-5 h-5"/></button>
                   <button className="p-3 rounded-full bg-white/5 hover:bg-white hover:text-black transition-all"><Linkedin className="w-5 h-5"/></button>
                </div>
             </div>
          </div>
       </section>
    );
  };

  const renderContact = () => (
     <section className="py-24 min-h-screen flex items-center animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-20">
           <div>
              <h1 className="text-6xl font-bold mb-8">Get in <span className="text-[var(--accent)]">Touch</span></h1>
              <p className="text-xl text-slate-300 mb-12 leading-relaxed">
                 Have a question about {profile.name} or want to collaborate? We'd love to hear from you.
              </p>
              
              <div className="space-y-8">
                 <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[var(--accent)]/50 transition-colors">
                       <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Email Us</div>
                       <div className="font-bold text-lg">hello@stemgolf.app</div>
                    </div>
                 </div>
                 <div className="flex items-center gap-6 group">
                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-[var(--accent)]/50 transition-colors">
                       <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <div className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Call Us</div>
                       <div className="font-bold text-lg">+27 (0) 21 123 4567</div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 lg:p-12 shadow-2xl">
              <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert("Message Sent Successfully!"); }}>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold ml-1 text-slate-400">First Name</label>
                       <input required type="text" className="w-full bg-[#151515] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-[var(--accent)] transition-colors text-white font-medium" placeholder="Jan" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold ml-1 text-slate-400">Last Name</label>
                       <input required type="text" className="w-full bg-[#151515] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-[var(--accent)] transition-colors text-white font-medium" placeholder="De Vries" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 text-slate-400">Email</label>
                    <input required type="email" className="w-full bg-[#151515] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-[var(--accent)] transition-colors text-white font-medium" placeholder="jan@example.com" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold ml-1 text-slate-400">Message</label>
                    <textarea required rows={4} className="w-full bg-[#151515] border border-white/10 rounded-xl px-5 py-4 focus:outline-none focus:border-[var(--accent)] transition-colors text-white font-medium resize-none" placeholder="Tell us more..." />
                 </div>
                 <button type="submit" className="w-full bg-white text-black font-bold py-5 rounded-xl hover:bg-slate-200 transition-colors text-lg">
                    Send Message
                 </button>
              </form>
           </div>
        </div>
     </section>
  );

  const render404 = () => (
     <section className="h-[80vh] flex flex-col items-center justify-center text-center px-6 animate-in zoom-in-95 duration-300">
        <AlertTriangle className="w-24 h-24 text-[var(--accent)] mb-8 opacity-80" />
        <h1 className="text-8xl font-bold mb-4">404</h1>
        <p className="text-2xl text-slate-400 mb-12">Oops! We couldn't find that page.</p>
        <button 
          onClick={() => navigateTo('home')}
          className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors"
        >
           Return Home
        </button>
     </section>
  );

  return (
    <div 
      className={`min-h-screen text-white ${fontClass} ${getThemeBackground()} selection:bg-[var(--accent)] selection:text-white transition-colors duration-500`}
      style={{ '--accent': accentColor } as React.CSSProperties}
    >
      <Navbar />

      <main>
         {currentView === 'home' && renderHome()}
         {currentView === 'about' && renderAbout()}
         {currentView === 'episodes' && renderEpisodes()}
         {currentView === 'episode_detail' && renderEpisodeDetail()}
         {currentView === 'blog' && renderBlog()}
         {currentView === 'blog_detail' && renderBlogDetail()}
         {currentView === 'contact' && renderContact()}
         {currentView === '404' && render404()}
      </main>

      <Footer />

      {/* Sticky Player Overlay */}
      <StickyPlayer />
    </div>
  );
};

export default PublicPage;