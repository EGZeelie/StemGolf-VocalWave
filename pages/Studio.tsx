import React, { useState, useEffect, useRef } from 'react';
import { PodcastProject, GenerationStatus, ProductionSettings, Chapter, DistributionMetadata, CreatorProfile, BlogPost, Series, YoutubeMetadata } from '../types';
import Button from '../components/Button';
import { Wand2, Play, Pause, Download, Save, RefreshCw, Volume2, Music, Mic2, Layers, Sliders, Flag, Sparkles, ChevronDown, ChevronUp, Globe, Rss, Calendar, CheckCircle, AlertCircle, Share2, Upload, Image as ImageIcon, FolderOpen, Plus, Copy, Trash2, X, Search, ArrowUpDown, Link, Loader2, XCircle, FileText, ListMusic, Youtube, Video, SidebarClose, SidebarOpen, FileAudio, MoreVertical, Mic, Square, Type, Gauge, MonitorPlay } from 'lucide-react';
import { generateAfrikaansScript, synthesizeSpeech, generateImage, generateBlogContent, generateYoutubeMetadata } from '../services/gemini';
import { mixPodcastAudio, audioBufferToWav } from '../services/audioUtils';
import { generateRSSFeed, downloadRSS } from '../services/rssUtils';

interface StudioProps {
  initialProject?: PodcastProject | null;
  projects: PodcastProject[];
  seriesList: Series[];
  creatorProfile: CreatorProfile;
  onSave: (project: PodcastProject) => void;
  onSelectProject: (project: PodcastProject | null) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (project: PodcastProject) => void;
  onCreateBlogPost: (post: BlogPost) => void;
  onCreateSeries: (series: Series) => void;
}

const Studio: React.FC<StudioProps> = ({ 
  initialProject, 
  projects,
  seriesList,
  creatorProfile,
  onSave,
  onSelectProject,
  onDeleteProject,
  onDuplicateProject,
  onCreateBlogPost,
  onCreateSeries
}) => {
  // UI State
  const [isProjectListOpen, setIsProjectListOpen] = useState(true); // Default open for better discovery
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  
  // Series Creation State
  const [isCreatingSeries, setIsCreatingSeries] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');
  const [newSeriesCover, setNewSeriesCover] = useState('');
  const seriesCoverInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingSeriesCover, setIsGeneratingSeriesCover] = useState(false);

  // Project State
  const [title, setTitle] = useState(initialProject?.title || 'Nuwe Episode');
  const [content, setContent] = useState(initialProject?.content || '');
  const [tone, setTone] = useState<'formal' | 'conversational' | 'storytelling'>(initialProject?.tone || 'conversational');
  const [voice, setVoice] = useState(initialProject?.voice || 'Fenrir');
  const [chapters, setChapters] = useState<Chapter[]>(initialProject?.chapters || []);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(initialProject?.seriesId || '');
  const [youtubeMeta, setYoutubeMeta] = useState<YoutubeMetadata | undefined>(initialProject?.youtubeMetadata);
  
  // Metadata State
  const [metadata, setMetadata] = useState<DistributionMetadata>(initialProject?.metadata || {
    author: creatorProfile.name || 'My Podcast',
    genre: 'Society & Culture',
    season: 1,
    episode: 1,
    type: 'full',
    explicit: false,
    publishDate: '',
  });

  const [distStatus, setDistStatus] = useState<'draft' | 'scheduled' | 'published' | 'failed'>(initialProject?.distributionStatus || 'draft');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialProject?.platforms || []);
  const [autoGenBlog, setAutoGenBlog] = useState(false);
  
  // Publishing Status Map (Granular tracking)
  const [platformStatusMap, setPlatformStatusMap] = useState<Record<string, 'idle' | 'pending' | 'success' | 'error'>>({});

  // AI Gen State (Script)
  const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [scriptTopics, setScriptTopics] = useState('');
  const [showAiOptions, setShowAiOptions] = useState(false);

  // AI Gen State (Image)
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Production State
  const [prodSettings, setProdSettings] = useState<ProductionSettings>(initialProject?.productionSettings || {
    introMusic: 'none',
    outroMusic: 'none',
    playbackSpeed: 1.0,
    pitch: 0,
    introVolume: 0.5,
    outroVolume: 0.5,
    voiceVolume: 1.0
  });

  // Custom Audio Upload Refs
  const introUploadRef = useRef<HTMLInputElement>(null);
  const outroUploadRef = useRef<HTMLInputElement>(null);

  // System State
  const [activeTab, setActiveTab] = useState<'script' | 'recording' | 'production' | 'distribution'>('script');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  
  // Audio State
  const [audioUrl, setAudioUrl] = useState<string | null>(initialProject?.audioUrl || null);
  const [rawVoiceBuffer, setRawVoiceBuffer] = useState<AudioBuffer | null>(null); // Store raw voice for remixing
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const projectId = useRef(initialProject?.id || `proj_${Date.now()}`);

  // Recording & Teleprompter State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [prompterSpeed, setPrompterSpeed] = useState(1); // 0 (stop) to 5 (fast)
  const [prompterFontSize, setPrompterFontSize] = useState(24);
  const [isPrompterPlaying, setIsPrompterPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const prompterRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  // Sync state with initialProject prop changes (switching projects)
  useEffect(() => {
    if (initialProject) {
      setTitle(initialProject.title);
      setContent(initialProject.content);
      setTone(initialProject.tone);
      setVoice(initialProject.voice);
      setChapters(initialProject.chapters);
      setMetadata(initialProject.metadata);
      setDistStatus(initialProject.distributionStatus);
      setSelectedPlatforms(initialProject.platforms || []);
      setSelectedSeriesId(initialProject.seriesId || '');
      setYoutubeMeta(initialProject.youtubeMetadata);
      setProdSettings({
        ...initialProject.productionSettings,
        introVolume: initialProject.productionSettings.introVolume ?? 0.5,
        outroVolume: initialProject.productionSettings.outroVolume ?? 0.5,
        voiceVolume: initialProject.productionSettings.voiceVolume ?? 1.0
      });
      setAudioUrl(initialProject.audioUrl || null);
      projectId.current = initialProject.id;
      setRawVoiceBuffer(null); 
      setPlatformStatusMap({}); // Reset status map on load
      setAutoGenBlog(false);
    } else {
      // Reset for New Project
      setTitle('Nuwe Episode');
      setContent('');
      setTone('conversational');
      setVoice('Fenrir');
      setChapters([]);
      setSelectedSeriesId('');
      setYoutubeMeta(undefined);
      setMetadata({
        author: creatorProfile.name || 'My Podcast',
        genre: 'Society & Culture',
        season: 1,
        episode: 1,
        type: 'full',
        explicit: false,
        publishDate: '',
      });
      setDistStatus('draft');
      setSelectedPlatforms([]);
      setProdSettings({
        introMusic: 'none',
        outroMusic: 'none',
        playbackSpeed: 1.0,
        pitch: 0,
        introVolume: 0.5,
        outroVolume: 0.5,
        voiceVolume: 1.0
      });
      setAudioUrl(null);
      setRawVoiceBuffer(null);
      setPlatformStatusMap({});
      setAutoGenBlog(false);
      projectId.current = `proj_${Date.now()}`;
    }
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    // Reset Recording State
    setRecordedBlob(null);
    setIsRecording(false);
  }, [initialProject, creatorProfile.name]);

  // Filter and Sort Projects
  const filteredProjects = projects
    .filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || p.distributionStatus === filterStatus;
        return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return b.createdAt - a.createdAt; 
      } else {
        return a.title.localeCompare(b.title); 
      }
    });

  // --- Handlers ---
  const handleProjectSelect = (p: PodcastProject | null) => {
     onSelectProject(p);
     // On mobile, close drawer on select. On desktop, keep it open for easy switching.
     if (window.innerWidth < 1024) {
        setIsProjectListOpen(false);
     }
  };

  const handleGenerateScript = async () => {
    const hasContent = content.trim().length > 0;
    const hasTopics = scriptTopics.trim().length > 0;

    if (!hasContent && !hasTopics) {
      alert("Please write some rough content or enter topics to generate a script.");
      return;
    }

    setStatus('generating_script');
    try {
      const promptToUse = hasContent ? content : `Write a script about: ${scriptTopics}`;
      const improvedScript = await generateAfrikaansScript(promptToUse, tone, scriptLength, scriptTopics);
      setContent(improvedScript);
      setStatus('idle');
      setShowAiOptions(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate script. Please check your API key and connection.");
      setStatus('error');
    }
  };

  const handleSynthesize = async () => {
    if (!content.trim()) return;
    setStatus('synthesizing_audio');
    try {
      const result = await synthesizeSpeech(content, voice);
      setRawVoiceBuffer(result.buffer); 
      await performMix(result.buffer);
      setStatus('ready');
    } catch (e) {
      alert("Failed to synthesize audio.");
      setStatus('error');
    }
  };

  const performMix = async (bufferToMix: AudioBuffer | null = rawVoiceBuffer) => {
    if (!bufferToMix) return;
    setStatus('mixing');
    try {
      const mixedBuffer = await mixPodcastAudio(
        bufferToMix,
        prodSettings.introMusic || 'none',
        prodSettings.outroMusic || 'none',
        prodSettings.introAudioUrl,
        prodSettings.outroAudioUrl,
        prodSettings.playbackSpeed,
        prodSettings.introVolume ?? 0.5,
        prodSettings.outroVolume ?? 0.5,
        prodSettings.voiceVolume ?? 1.0
      );
      
      const wavBlob = audioBufferToWav(mixedBuffer);
      const newUrl = URL.createObjectURL(wavBlob);
      setAudioUrl(newUrl);
      setStatus('ready');
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  useEffect(() => {
    if (status === 'ready' && rawVoiceBuffer) {
      const timer = setTimeout(() => {
        performMix(rawVoiceBuffer);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [prodSettings.introMusic, prodSettings.outroMusic, prodSettings.introAudioUrl, prodSettings.outroAudioUrl, prodSettings.playbackSpeed, prodSettings.introVolume, prodSettings.outroVolume, prodSettings.voiceVolume]);

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = () => {
    onSave({
      id: projectId.current,
      title,
      description: content.slice(0, 100) + '...',
      content,
      audioUrl: audioUrl || undefined,
      createdAt: initialProject?.createdAt || Date.now(),
      duration: rawVoiceBuffer?.duration,
      voice,
      tone,
      productionSettings: prodSettings,
      chapters,
      metadata,
      distributionStatus: distStatus,
      platforms: selectedPlatforms,
      seriesId: selectedSeriesId || undefined,
      youtubeMetadata: youtubeMeta
    });
    alert("Projek gestoor!");
  };

  // Intro/Outro Upload Handlers
  const handleAudioUpload = (type: 'intro' | 'outro', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProdSettings(prev => ({
          ...prev,
          [type === 'intro' ? 'introMusic' : 'outroMusic']: 'custom',
          [type === 'intro' ? 'introAudioUrl' : 'outroAudioUrl']: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSeriesCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSeriesCover(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateSeriesCover = async () => {
      if (!newSeriesTitle) return alert("Please enter a series title first.");
      setIsGeneratingSeriesCover(true);
      try {
          const img = await generateImage(`${newSeriesTitle} podcast cover art, minimal, professional`, "1:1");
          setNewSeriesCover(img);
      } catch (e) {
          alert("Generation failed. Check API key.");
      } finally {
          setIsGeneratingSeriesCover(false);
      }
  };

  const handleSaveNewSeries = () => {
    if(!newSeriesTitle.trim()) return;
    const newSeries: Series = {
      id: `series_${Date.now()}`,
      title: newSeriesTitle,
      description: newSeriesDesc,
      coverImage: newSeriesCover || undefined,
      createdAt: Date.now()
    };
    onCreateSeries(newSeries);
    setSelectedSeriesId(newSeries.id);
    setIsCreatingSeries(false);
    setNewSeriesTitle('');
    setNewSeriesDesc('');
    setNewSeriesCover('');
  };

  const handleGenerateYoutubeAssets = async () => {
    setStatus('generating_youtube');
    try {
        const ytMeta = await generateYoutubeMetadata(title, content);
        
        const thumbnailPrompt = `YouTube thumbnail for podcast about: ${title}. High quality, 4k, vivid colors, engaging.`;
        const thumbnail = await generateImage(thumbnailPrompt, "16:9");

        setYoutubeMeta({
            title: ytMeta.title,
            description: ytMeta.description,
            tags: ytMeta.tags,
            thumbnailUrl: thumbnail,
            privacyStatus: 'public'
        });
        
        // Reset specific platform status if regenerating
        setPlatformStatusMap(prev => ({ ...prev, youtube: 'idle' }));
    } catch (error) {
        console.error("YouTube gen failed", error);
        alert("Failed to generate YouTube assets.");
    } finally {
        setStatus('idle');
    }
  };

  const handlePublish = async () => {
    if (!audioUrl) return alert("Please generate audio before publishing.");
    if (selectedPlatforms.length === 0) return alert("Please select at least one platform.");
    
    setStatus('publishing');
    
    // Initialize granular status
    const initialMap: Record<string, 'pending' | 'success' | 'error'> = {};
    selectedPlatforms.forEach(p => initialMap[p] = 'pending');
    setPlatformStatusMap(initialMap);

    // Handle Youtube Special Generation
    if (selectedPlatforms.includes('youtube')) {
        // If the user hasn't generated metadata manually yet, try to do it now
        if (!youtubeMeta) {
            setStatus('generating_youtube');
            try {
                // 1. Generate Metadata
                const ytMeta = await generateYoutubeMetadata(title, content);
                
                // 2. Generate Thumbnail (16:9)
                const thumbnailPrompt = `YouTube thumbnail for podcast about: ${title}. High quality, 4k, vivid colors, engaging.`;
                const thumbnail = await generateImage(thumbnailPrompt, "16:9");

                setYoutubeMeta({
                    title: ytMeta.title,
                    description: ytMeta.description,
                    tags: ytMeta.tags,
                    thumbnailUrl: thumbnail,
                    privacyStatus: 'public'
                });
                
                // Mark youtube as done
                setPlatformStatusMap(prev => ({ ...prev, youtube: 'success' }));
            } catch (error) {
                console.error("YouTube gen failed", error);
                setPlatformStatusMap(prev => ({ ...prev, youtube: 'error' }));
            }
        } else {
             // Already have meta, just mark as ready
             setPlatformStatusMap(prev => ({ ...prev, youtube: 'success' }));
        }
        setStatus('publishing'); // Revert back to finish others
    }

    // Simulate publishing to other platforms
    for (const platform of selectedPlatforms) {
        if (platform === 'youtube') continue; // Already handled
        await new Promise(r => setTimeout(r, 1000));
        setPlatformStatusMap(prev => ({ ...prev, [platform]: 'success' }));
    }
    
    // Auto Generate Blog Post if enabled
    if (autoGenBlog && content.trim()) {
      try {
         const blogData = await generateBlogContent(title, content, tone);
         const newPost: BlogPost = {
            id: `post_${Date.now()}`,
            title: blogData.title,
            excerpt: blogData.excerpt,
            content: blogData.content,
            author: metadata.author,
            date: new Date().toLocaleDateString(),
            createdAt: Date.now(),
            tags: blogData.tags,
            status: 'draft',
            coverImage: metadata.coverArt,
            linkedEpisodeId: projectId.current
         };
         onCreateBlogPost(newPost);
         console.log("Blog post auto-generated");
      } catch (error) {
         console.error("Failed to auto-generate blog post", error);
         alert("Warning: Podcast published, but blog generation failed.");
      }
    }
    
    await new Promise(r => setTimeout(r, 500));

    setDistStatus(metadata.publishDate ? 'scheduled' : 'published');
    setStatus('idle');
    
    handleSave(); // Save final state
    
    if (window.confirm("Publishing Successful! Would you like to download your RSS feed and distribution assets now?")) {
        const fullProject = {
          id: projectId.current,
          title,
          description: content.slice(0, 100) + '...',
          content,
          createdAt: initialProject?.createdAt || Date.now(),
          duration: rawVoiceBuffer?.duration,
          voice,
          tone,
          productionSettings: prodSettings,
          chapters,
          metadata,
          distributionStatus: 'published',
          seriesId: selectedSeriesId || undefined,
          youtubeMetadata: youtubeMeta // Assuming state is updated, though useRef/handleSave handles it
        } as PodcastProject;
        
        const rssXml = generateRSSFeed(fullProject, 5000000); // Mock size
        downloadRSS(rssXml, 'feed.xml');
    }
  };

  const togglePlatform = (id: string, isConnected: boolean) => {
    // If user selects youtube, we don't strictly require connection for the generation part, 
    // but in a real app we would. We'll allow it for the demo to show generation.
    if (!isConnected && id !== 'youtube') {
        alert("Please connect this platform in your Creator Settings first.");
        return;
    }
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(prev => prev.filter(p => p !== id));
      setPlatformStatusMap(prev => { const n = {...prev}; delete n[id]; return n; });
    } else {
      setSelectedPlatforms(prev => [...prev, id]);
      setPlatformStatusMap(prev => ({...prev, [id]: 'idle'}));
    }
  };

  const insertChapter = () => {
    const name = prompt("Chapter Name:");
    if (name) {
      setContent(prev => prev + `\n\n[Chapter: ${name}]\n`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMetadata({ ...metadata, coverArt: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    try {
      const base64Image = await generateImage(imagePrompt, "1:1");
      setMetadata({ ...metadata, coverArt: base64Image });
      setIsGeneratingImage(false);
      setShowImageGen(false);
    } catch (e) {
      alert("Failed to generate image. Please check API key.");
      setIsGeneratingImage(false);
    }
  };

  // --- RECORDING & TELEPROMPTER LOGIC ---

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      setIsPrompterPlaying(true); // Auto-start prompter

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

    } catch (e) {
      console.error("Recording error:", e);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPrompterPlaying(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const saveRecordingToProject = async () => {
    if (!recordedBlob) return;
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const arrayBuffer = await recordedBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Use this recording as the main voice track
        setRawVoiceBuffer(audioBuffer);
        
        // Auto-mix it
        await performMix(audioBuffer);
        
        alert("Recording saved! It is now the main voice track for this project. Check 'Production' tab to mix.");
        setActiveTab('production');
    } catch (e) {
        console.error("Error saving recording", e);
        alert("Failed to process recording.");
    }
  };

  // Teleprompter Loop
  useEffect(() => {
    if (isPrompterPlaying && prompterRef.current) {
        scrollIntervalRef.current = setInterval(() => {
             if (prompterRef.current) {
                 prompterRef.current.scrollTop += prompterSpeed;
             }
        }, 30);
    } else {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
    return () => {
        if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    }
  }, [isPrompterPlaying, prompterSpeed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Define Platform Configs with Connection Logic
  const PLATFORMS = [
    { 
        id: 'spotify', 
        name: 'Spotify', 
        color: 'border-green-600 bg-green-900/10', 
        iconColor: 'bg-green-600 border-green-600',
        isConnected: !!creatorProfile.links.spotify
    },
    { 
        id: 'apple', 
        name: 'Apple Podcasts', 
        color: 'border-purple-600 bg-purple-900/10', 
        iconColor: 'bg-purple-600 border-purple-600',
        isConnected: !!creatorProfile.links.apple
    },
    {
        id: 'youtube',
        name: 'YouTube',
        color: 'border-red-600 bg-red-900/10',
        iconColor: 'bg-red-600 border-red-600',
        isConnected: true // Always allowed for generation demo
    },
    { 
        id: 'rss', 
        name: 'Direct RSS Feed', 
        color: 'border-orange-600 bg-orange-900/10', 
        iconColor: 'bg-orange-600 border-orange-600',
        isConnected: true // RSS is always available
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex relative bg-[#0f0f0f]">
      
      {/* 1. PROJECT SIDEBAR (Collapsible on Mobile, Persistent on Desktop) */}
      
      {/* Mobile Overlay */}
      {isProjectListOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
          onClick={() => setIsProjectListOpen(false)}
        ></div>
      )}

      {/* Sidebar Content */}
      <div 
        className={`absolute top-0 bottom-0 left-0 z-40 w-80 bg-[#121212] border-r border-[#272727] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:static lg:shadow-none ${isProjectListOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}
      >
         <div className="p-4 border-b border-[#272727] flex items-center justify-between bg-[#181818]">
           <h3 className="font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-orange-500" /> Projects
              <span className="text-xs text-slate-500 font-normal">({projects.length})</span>
           </h3>
           <button onClick={() => setIsProjectListOpen(false)} className="lg:hidden p-1 rounded hover:bg-[#272727] text-slate-400">
             <X className="w-5 h-5" />
           </button>
         </div>

         {/* Search & Sort Controls */}
         <div className="p-3 border-b border-[#272727] space-y-2 bg-[#181818]">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search projects..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1f1f1f] border border-[#333] text-sm rounded-lg pl-9 pr-2 py-2 text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
            </div>
            <div className="flex items-center gap-2">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="flex-1 bg-[#1f1f1f] border border-[#333] text-slate-300 text-xs rounded py-1.5 px-2 focus:ring-0 cursor-pointer"
                >
                    <option value="all">All Status</option>
                    <option value="draft">Drafts</option>
                    <option value="published">Published</option>
                    <option value="scheduled">Scheduled</option>
                </select>
                <div className="flex items-center gap-1 bg-[#1f1f1f] border border-[#333] rounded px-2 py-1.5">
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as 'date' | 'title')}
                    className="bg-transparent border-none text-slate-300 focus:ring-0 p-0 text-xs cursor-pointer w-20"
                    >
                        <option value="date">Date</option>
                        <option value="title">Name</option>
                    </select>
                </div>
            </div>
         </div>

         <div className="p-3 flex-1 overflow-hidden flex flex-col">
            <button 
              onClick={() => handleProjectSelect(null)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold mb-4 flex-shrink-0 transition-all shadow-lg shadow-orange-900/20"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
            <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pb-4">
              {filteredProjects.map(p => {
                const isActive = initialProject?.id === p.id;
                return (
                  <div 
                    key={p.id} 
                    className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${isActive ? 'bg-[#1f1f1f] border-orange-600' : 'bg-[#121212] border-[#272727] hover:bg-[#181818] hover:border-[#444]'}`}
                    onClick={() => handleProjectSelect(p)}
                  >
                     <div className="flex justify-between items-start mb-2">
                       <h4 className={`font-semibold text-sm truncate pr-6 ${isActive ? 'text-white' : 'text-slate-300'}`}>{p.title}</h4>
                       <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#181818] rounded-md shadow-sm">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDuplicateProject(p); }}
                            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded" 
                            title="Duplicate Project"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded" 
                            title="Delete Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                       </div>
                     </div>
                     
                     <div className="flex items-center justify-between">
                       <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${
                             p.distributionStatus === 'published' 
                               ? 'bg-green-900/20 text-green-400 border-green-800' 
                               : p.distributionStatus === 'scheduled'
                               ? 'bg-blue-900/20 text-blue-400 border-blue-800'
                               : 'bg-[#222] text-slate-400 border-slate-700'
                           }`}>
                          {p.distributionStatus}
                       </span>
                       <span className="text-[10px] text-slate-500">
                          {new Date(p.createdAt).toLocaleDateString()}
                       </span>
                     </div>
                     {p.duration && (
                        <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center gap-1">
                           <Volume2 className="w-3 h-3" />
                           {Math.floor(p.duration / 60)}:{Math.floor(p.duration % 60).toString().padStart(2, '0')}
                        </div>
                     )}
                  </div>
                );
              })}
              {filteredProjects.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-[#272727] rounded-xl">
                  <p className="text-slate-500 text-sm">
                    {projects.length === 0 ? "No projects yet." : "No matches found."}
                  </p>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#0f0f0f]">
        
        {/* Top Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[#181818] p-4 border-b border-[#272727]">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsProjectListOpen(!isProjectListOpen)}
              className={`text-slate-400 border border-[#333] ${isProjectListOpen ? 'bg-[#222] text-white' : ''}`}
              title={isProjectListOpen ? "Close Project List" : "Open Project List"}
            >
              {isProjectListOpen ? <SidebarClose className="w-5 h-5"/> : <SidebarOpen className="w-5 h-5"/>}
            </Button>
            <div className="flex-1">
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border-none font-bold text-xl text-white focus:ring-0 w-full placeholder-slate-600"
                placeholder="Episode Title..."
              />
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#0f0f0f] p-1 rounded-lg overflow-x-auto border border-[#272727]">
            <button
              onClick={() => setActiveTab('script')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'script' ? 'bg-[#222] text-orange-500 shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
              <Mic2 className="w-4 h-4" /> Script
            </button>
            <button
              onClick={() => setActiveTab('recording')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'recording' ? 'bg-[#222] text-red-500 shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
              <Mic className="w-4 h-4" /> Recording
            </button>
            <button
              onClick={() => setActiveTab('production')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'production' ? 'bg-[#222] text-orange-500 shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
              <Sliders className="w-4 h-4" /> Production
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'distribution' ? 'bg-[#222] text-orange-500 shadow-sm' : 'text-slate-500 hover:text-white'}`}
            >
              <Share2 className="w-4 h-4" /> Publish
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            {activeTab !== 'distribution' && (
              <Button variant="primary" onClick={() => setActiveTab(activeTab === 'script' ? 'recording' : activeTab === 'recording' ? 'production' : 'distribution')}>
                  Next <Play className="w-3 h-3 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden p-6">
          
          {/* MAIN COLUMN (Editor) */}
          <div className="flex-1 flex flex-col bg-[#181818] rounded-xl border border-[#272727] overflow-hidden">
            
            {activeTab === 'script' && (
              <>
                <div className="border-b border-[#272727] flex flex-col bg-[#1f1f1f] transition-all duration-300">
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <select 
                          value={tone}
                          onChange={(e) => setTone(e.target.value as any)}
                          className="text-sm bg-[#121212] text-slate-200 border-[#333] rounded-md py-1.5 focus:border-orange-500 focus:ring-orange-500"
                        >
                          <option value="conversational">Conversational</option>
                          <option value="formal">Formal / News</option>
                          <option value="storytelling">Storytelling</option>
                        </select>
                        <select 
                          value={voice}
                          onChange={(e) => setVoice(e.target.value)}
                          className="text-sm bg-[#121212] text-slate-200 border-[#333] rounded-md py-1.5 focus:border-orange-500 focus:ring-orange-500"
                        >
                          <option value="Fenrir">Fenrir (M)</option>
                          <option value="Kore">Kore (F)</option>
                          <option value="Puck">Puck (M)</option>
                          <option value="Zephyr">Zephyr (F)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={insertChapter} title="Insert Chapter Marker">
                          <Flag className="w-4 h-4 mr-1" /> Chapter
                        </Button>
                        <button 
                          onClick={() => setShowAiOptions(!showAiOptions)}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${showAiOptions ? 'bg-purple-900/30 text-purple-300 border border-purple-800' : 'text-slate-400 hover:bg-[#2a2a2a]'}`}
                        >
                          <Sparkles className="w-4 h-4" />
                          AI Tools
                          {showAiOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    </div>
                  </div>

                  {/* Collapsible AI Options Panel */}
                  {showAiOptions && (
                      <div className="p-4 bg-purple-900/10 border-t border-[#333] grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Length</label>
                            <div className="flex gap-2">
                              {(['short', 'medium', 'long'] as const).map(l => (
                                <button
                                  key={l}
                                  onClick={() => setScriptLength(l)}
                                  className={`flex-1 py-1.5 px-3 rounded text-sm capitalize border ${scriptLength === l ? 'bg-[#2a2a2a] border-purple-500 text-purple-300 shadow-sm' : 'bg-transparent border-[#333] text-slate-400 hover:border-slate-500'}`}
                                >
                                  {l}
                                </button>
                              ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Focus Topics</label>
                            <input 
                              type="text"
                              value={scriptTopics}
                              onChange={(e) => setScriptTopics(e.target.value)}
                              placeholder="e.g. rugby, weather, politics..."
                              className="w-full text-sm bg-[#121212] text-white rounded-md border-[#333] focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                          <Button 
                              size="sm" 
                              onClick={handleGenerateScript}
                              isLoading={status === 'generating_script'}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Wand2 className="w-4 h-4 mr-2" />
                              Generate / Polish Script
                            </Button>
                        </div>
                      </div>
                  )}
                </div>
                <textarea
                  className="flex-1 w-full p-6 resize-none focus:outline-none bg-[#181818] text-slate-200 leading-relaxed text-lg font-serif"
                  placeholder="Write your podcast script here in Afrikaans, or paste an article..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </>
            )}

            {activeTab === 'recording' && (
              <div className="flex flex-col h-full">
                 {/* Prompter View */}
                 <div className="flex-1 relative overflow-hidden bg-black flex flex-col items-center">
                    <div 
                      ref={prompterRef}
                      className="w-full h-full overflow-y-auto px-12 py-32 text-center hide-scrollbar scroll-smooth"
                    >
                        <p 
                          className="font-bold text-white leading-relaxed max-w-3xl mx-auto whitespace-pre-wrap transition-all"
                          style={{ fontSize: `${prompterFontSize}px` }}
                        >
                          {content || "No script content available. Switch to Script tab to add text."}
                        </p>
                        <div className="h-[50vh]"></div> {/* Bottom padding for scrolling */}
                    </div>
                    
                    {/* Read Line Indicator */}
                    <div className="absolute top-1/3 left-0 right-0 flex items-center pointer-events-none opacity-50">
                        <div className="h-px bg-red-500 w-16"></div>
                        <div className="flex-1 border-t border-dashed border-red-500/50"></div>
                        <div className="h-px bg-red-500 w-16"></div>
                    </div>
                 </div>

                 {/* Recording Controls */}
                 <div className="bg-[#121212] border-t border-[#272727] p-4">
                    <div className="flex items-center justify-between gap-6">
                        
                        {/* Teleprompter Settings */}
                        <div className="flex items-center gap-6">
                           <div className="space-y-1 w-32">
                              <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                <Type className="w-3 h-3" /> Size: {prompterFontSize}px
                              </label>
                              <input 
                                type="range" min="16" max="64" 
                                value={prompterFontSize} 
                                onChange={e => setPrompterFontSize(Number(e.target.value))}
                                className="w-full accent-slate-500 h-1 bg-[#333] rounded-lg appearance-none"
                              />
                           </div>
                           <div className="space-y-1 w-32">
                              <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                <Gauge className="w-3 h-3" /> Scroll Speed: {prompterSpeed}
                              </label>
                              <input 
                                type="range" min="0" max="5" step="0.5"
                                value={prompterSpeed} 
                                onChange={e => setPrompterSpeed(Number(e.target.value))}
                                className="w-full accent-slate-500 h-1 bg-[#333] rounded-lg appearance-none"
                              />
                           </div>
                           <button 
                             onClick={() => setIsPrompterPlaying(!isPrompterPlaying)}
                             className={`p-2 rounded-full border ${isPrompterPlaying ? 'bg-blue-900/20 text-blue-400 border-blue-800' : 'bg-[#1f1f1f] text-slate-400 border-[#333]'}`}
                             title={isPrompterPlaying ? "Pause Scroll" : "Start Auto-Scroll"}
                           >
                              {isPrompterPlaying ? <Pause className="w-5 h-5" /> : <MonitorPlay className="w-5 h-5" />}
                           </button>
                        </div>

                        {/* Record Buttons */}
                        <div className="flex items-center gap-4">
                            <div className="font-mono text-xl text-white w-16 text-center">
                               {formatTime(recordingTime)}
                            </div>
                            
                            {!isRecording ? (
                              <button 
                                onClick={startRecording}
                                className="w-14 h-14 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-900/20 transition-transform hover:scale-105"
                                title="Start Recording"
                              >
                                <Mic className="w-6 h-6 fill-current" />
                              </button>
                            ) : (
                              <button 
                                onClick={stopRecording}
                                className="w-14 h-14 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center text-white shadow-lg animate-pulse"
                                title="Stop Recording"
                              >
                                <Square className="w-6 h-6 fill-current" />
                              </button>
                            )}
                        </div>

                        {/* Save Action */}
                        <div className="w-64 flex justify-end">
                           {recordedBlob && !isRecording && (
                             <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <audio src={URL.createObjectURL(recordedBlob)} controls className="h-8 w-32" />
                                <Button size="sm" onClick={saveRecordingToProject} className="whitespace-nowrap">
                                  Use Recording
                                </Button>
                             </div>
                           )}
                        </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'production' && (
              <div className="p-8 space-y-8 overflow-y-auto">
                  {/* ... Production content unchanged ... */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Music className="w-5 h-5 text-orange-600" /> Audio Mixing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-slate-400">Intro Music</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['none', 'news', 'story', 'upbeat'].map(t => (
                              <button
                                key={t}
                                onClick={() => setProdSettings(s => ({...s, introMusic: t as any}))}
                                className={`px-3 py-2 text-sm rounded border capitalize ${prodSettings.introMusic === t ? 'bg-[#1f1f1f] border-orange-500 text-orange-500' : 'bg-[#121212] border-[#333] text-slate-400'}`}
                              >
                                {t}
                              </button>
                            ))}
                            {/* Custom Intro Upload Button */}
                            <button
                                onClick={() => setProdSettings(s => ({...s, introMusic: 'custom'}))}
                                className={`px-3 py-2 text-sm rounded border flex items-center justify-center gap-1 ${prodSettings.introMusic === 'custom' ? 'bg-[#1f1f1f] border-orange-500 text-orange-500' : 'bg-[#121212] border-[#333] text-slate-400'}`}
                              >
                                <Upload className="w-3 h-3" /> Custom
                              </button>
                          </div>
                          
                          {/* Show Upload Input if Custom */}
                          {prodSettings.introMusic === 'custom' && (
                             <div className="mt-2 bg-[#1f1f1f] p-3 rounded-lg border border-[#333]">
                                <div className="flex items-center gap-3">
                                   <Button size="sm" variant="secondary" onClick={() => introUploadRef.current?.click()}>
                                      <FileAudio className="w-3 h-3 mr-2" /> Select File
                                   </Button>
                                   <span className="text-xs text-slate-400 truncate max-w-[150px]">
                                      {prodSettings.introAudioUrl ? "File loaded" : "No file selected"}
                                   </span>
                                </div>
                                <input ref={introUploadRef} type="file" className="hidden" accept="audio/*" onChange={(e) => handleAudioUpload('intro', e)} />
                                <p className="text-[10px] text-slate-500 mt-2">Max length recommended: 15s. Supports MP3/WAV.</p>
                             </div>
                          )}

                          {prodSettings.introMusic !== 'none' && (
                            <div className="mt-2">
                              <label className="text-xs font-medium text-slate-500 flex justify-between mb-1">
                                  Intro Volume <span>{Math.round((prodSettings.introVolume || 0.5) * 100)}%</span>
                              </label>
                              <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.1"
                                value={prodSettings.introVolume || 0.5}
                                onChange={(e) => setProdSettings(s => ({...s, introVolume: parseFloat(e.target.value)}))}
                                className="w-full accent-orange-600 bg-[#333] rounded-lg appearance-none h-1.5 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-slate-400">Outro Music</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['none', 'news', 'story', 'upbeat'].map(t => (
                              <button
                                key={t}
                                onClick={() => setProdSettings(s => ({...s, outroMusic: t as any}))}
                                className={`px-3 py-2 text-sm rounded border capitalize ${prodSettings.outroMusic === t ? 'bg-[#1f1f1f] border-orange-500 text-orange-500' : 'bg-[#121212] border-[#333] text-slate-400'}`}
                              >
                                {t}
                              </button>
                            ))}
                            {/* Custom Outro Upload Button */}
                            <button
                                onClick={() => setProdSettings(s => ({...s, outroMusic: 'custom'}))}
                                className={`px-3 py-2 text-sm rounded border flex items-center justify-center gap-1 ${prodSettings.outroMusic === 'custom' ? 'bg-[#1f1f1f] border-orange-500 text-orange-500' : 'bg-[#121212] border-[#333] text-slate-400'}`}
                              >
                                <Upload className="w-3 h-3" /> Custom
                              </button>
                          </div>

                           {/* Show Upload Input if Custom */}
                           {prodSettings.outroMusic === 'custom' && (
                             <div className="mt-2 bg-[#1f1f1f] p-3 rounded-lg border border-[#333]">
                                <div className="flex items-center gap-3">
                                   <Button size="sm" variant="secondary" onClick={() => outroUploadRef.current?.click()}>
                                      <FileAudio className="w-3 h-3 mr-2" /> Select File
                                   </Button>
                                   <span className="text-xs text-slate-400 truncate max-w-[150px]">
                                      {prodSettings.outroAudioUrl ? "File loaded" : "No file selected"}
                                   </span>
                                </div>
                                <input ref={outroUploadRef} type="file" className="hidden" accept="audio/*" onChange={(e) => handleAudioUpload('outro', e)} />
                                <p className="text-[10px] text-slate-500 mt-2">Max length recommended: 15s. Supports MP3/WAV.</p>
                             </div>
                          )}

                          {prodSettings.outroMusic !== 'none' && (
                            <div className="mt-2">
                              <label className="text-xs font-medium text-slate-500 flex justify-between mb-1">
                                  Outro Volume <span>{Math.round((prodSettings.outroVolume || 0.5) * 100)}%</span>
                              </label>
                              <input 
                                type="range" 
                                min="0.1" 
                                max="1.0" 
                                step="0.1"
                                value={prodSettings.outroVolume || 0.5}
                                onChange={(e) => setProdSettings(s => ({...s, outroVolume: parseFloat(e.target.value)}))}
                                className="w-full accent-orange-600 bg-[#333] rounded-lg appearance-none h-1.5 cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <div className="max-w-md">
                          <label className="text-sm font-medium text-slate-400 flex justify-between">
                            Voice Volume
                            <span>{Math.round((prodSettings.voiceVolume ?? 1.0) * 100)}%</span>
                          </label>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="2.0" 
                            step="0.1"
                            value={prodSettings.voiceVolume ?? 1.0}
                            onChange={(e) => setProdSettings(s => ({...s, voiceVolume: parseFloat(e.target.value)}))}
                            className="w-full mt-2 accent-orange-600 bg-[#333] rounded-lg appearance-none h-2 cursor-pointer"
                          />
                        </div>
                    </div>
                  </div>

                  <div className="border-t border-[#272727] pt-8">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-orange-600" /> Playback Control
                    </h3>
                    <div className="max-w-md space-y-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                              <label className="text-sm font-medium text-slate-400">Speed ({prodSettings.playbackSpeed}x)</label>
                          </div>
                          <input 
                            type="range" 
                            min="0.5" 
                            max="1.5" 
                            step="0.1"
                            value={prodSettings.playbackSpeed}
                            onChange={(e) => setProdSettings(s => ({...s, playbackSpeed: parseFloat(e.target.value)}))}
                            className="w-full accent-orange-600 bg-[#333] rounded-lg appearance-none h-2 cursor-pointer"
                          />
                          <p className="text-xs text-slate-500">Note: Changing speed requires re-rendering the mix.</p>
                        </div>
                    </div>
                  </div>

                  {status === 'mixing' && (
                    <div className="text-center py-8 text-orange-500 animate-pulse">
                      Rendering Audio Mix...
                    </div>
                  )}
              </div>
            )}

            {activeTab === 'distribution' && (
              <div className="p-8 space-y-8 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Col: Metadata */}
                    <div className="space-y-6">
                        
                        {/* Cover Art Section */}
                        <div className="space-y-4 mb-6">
                          <label className="block text-sm font-medium text-slate-400">Episode Cover Art</label>
                          <div className="flex items-start gap-4">
                            <div className="w-32 h-32 bg-[#121212] rounded-lg border border-[#333] flex items-center justify-center overflow-hidden relative group">
                              {metadata.coverArt ? (
                                <img src={metadata.coverArt} className="w-full h-full object-cover" alt="Cover Art" />
                              ) : (
                                <ImageIcon className="text-slate-600 w-8 h-8" />
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex gap-2 flex-wrap">
                                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                                  <Upload className="w-4 h-4 mr-2" /> Upload
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => { setShowImageGen(!showImageGen); setImagePrompt(title + ' podcast cover art'); }}>
                                  <Sparkles className="w-4 h-4 mr-2" /> Generate AI
                                </Button>
                              </div>
                              <p className="text-xs text-slate-500">Supported: JPG, PNG. Recommended: Square (1:1).</p>
                              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>
                          </div>
                          
                          {showImageGen && (
                            <div className="p-3 bg-purple-900/10 rounded-lg border border-purple-800 animate-in fade-in slide-in-from-top-1">
                              <label className="block text-xs font-semibold text-purple-300 mb-1">AI Image Prompt</label>
                              <div className="flex gap-2">
                                <input 
                                  value={imagePrompt} 
                                  onChange={e => setImagePrompt(e.target.value)}
                                  className="flex-1 text-sm bg-[#121212] text-white border-purple-800 rounded-md focus:border-purple-500 focus:ring-purple-500" 
                                />
                                <Button size="sm" onClick={handleGenerateImage} isLoading={isGeneratingImage} className="bg-purple-600 hover:bg-purple-700 text-white">
                                  Create
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-white flex items-center gap-2 border-t border-[#333] pt-6">
                          <Rss className="w-5 h-5 text-orange-600" /> Episode Metadata
                        </h3>

                        {/* Series Selection */}
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-1">Series</label>
                          <div className="flex gap-2">
                            <select 
                              value={selectedSeriesId}
                              onChange={(e) => setSelectedSeriesId(e.target.value)}
                              className="flex-1 bg-[#121212] text-white rounded-md border-[#333] shadow-sm focus:border-orange-500 focus:ring-orange-500"
                            >
                              <option value="">-- No Series (Standalone) --</option>
                              {seriesList.map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                              ))}
                            </select>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setIsCreatingSeries(true)}
                              title="Create New Series"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* New Series Modal/Form */}
                        {isCreatingSeries && (
                          <div className="p-4 bg-[#1f1f1f] border border-[#333] rounded-lg animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                              <ListMusic className="w-4 h-4" /> New Series
                            </h4>
                            <div className="space-y-4">
                              {/* Cover Image Input */}
                              <div className="flex items-start gap-4">
                                  <div className="w-20 h-20 bg-[#121212] rounded-lg border border-[#333] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                      {newSeriesCover ? (
                                          <img src={newSeriesCover} className="w-full h-full object-cover" />
                                      ) : (
                                          <ImageIcon className="w-8 h-8 text-slate-700" />
                                      )}
                                  </div>
                                  <div className="space-y-2">
                                      <label className="block text-xs text-slate-400">Series Cover (Optional)</label>
                                      <div className="flex gap-2">
                                          <Button size="sm" variant="secondary" onClick={() => seriesCoverInputRef.current?.click()}>
                                              <Upload className="w-3 h-3 mr-1" /> Upload
                                          </Button>
                                          <Button size="sm" variant="secondary" onClick={handleGenerateSeriesCover} isLoading={isGeneratingSeriesCover} disabled={!newSeriesTitle}>
                                              <Sparkles className="w-3 h-3 mr-1" /> AI Gen
                                          </Button>
                                          <input ref={seriesCoverInputRef} type="file" className="hidden" accept="image/*" onChange={handleSeriesCoverUpload} />
                                      </div>
                                  </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Series Title</label>
                                <input 
                                  type="text"
                                  value={newSeriesTitle}
                                  onChange={(e) => setNewSeriesTitle(e.target.value)}
                                  className="w-full text-sm bg-[#121212] border border-[#333] rounded-md text-white px-2 py-1.5 focus:border-orange-500"
                                  placeholder="e.g. Tech Talk Daily"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Description (Optional)</label>
                                <textarea 
                                  value={newSeriesDesc}
                                  onChange={(e) => setNewSeriesDesc(e.target.value)}
                                  rows={2}
                                  className="w-full text-sm bg-[#121212] border border-[#333] rounded-md text-white px-2 py-1.5 focus:border-orange-500 resize-none"
                                />
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <Button size="sm" variant="ghost" onClick={() => setIsCreatingSeries(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveNewSeries} disabled={!newSeriesTitle.trim()}>Create Series</Button>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-400">Author / Host</label>
                              <input 
                                type="text" 
                                value={metadata.author}
                                onChange={e => setMetadata({...metadata, author: e.target.value})}
                                className="mt-1 w-full bg-[#121212] text-white rounded-md border-[#333] shadow-sm focus:border-orange-500 focus:ring-orange-500"
                              />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-400">Season</label>
                                <input 
                                    type="number" 
                                    value={metadata.season}
                                    onChange={e => setMetadata({...metadata, season: parseInt(e.target.value)})}
                                    className="mt-1 w-full bg-[#121212] text-white rounded-md border-[#333] shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-400">Episode</label>
                                <input 
                                    type="number" 
                                    value={metadata.episode}
                                    onChange={e => setMetadata({...metadata, episode: parseInt(e.target.value)})}
                                    className="mt-1 w-full bg-[#121212] text-white rounded-md border-[#333] shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                />
                              </div>
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-slate-400">Episode Type</label>
                              <select
                                value={metadata.type}
                                onChange={e => setMetadata({...metadata, type: e.target.value as any})}
                                className="mt-1 w-full bg-[#121212] text-white rounded-md border-[#333] shadow-sm focus:border-orange-500 focus:ring-orange-500"
                              >
                                <option value="full">Full Episode</option>
                                <option value="trailer">Trailer</option>
                                <option value="bonus">Bonus</option>
                              </select>
                          </div>
                          
                          <div className="flex items-center gap-2 pt-2">
                              <input 
                                type="checkbox" 
                                id="explicit"
                                checked={metadata.explicit}
                                onChange={e => setMetadata({...metadata, explicit: e.target.checked})}
                                className="rounded border-[#333] bg-[#121212] text-orange-600 focus:ring-orange-500"
                              />
                              <label htmlFor="explicit" className="text-sm text-slate-400">Contains Explicit Content</label>
                          </div>
                        </div>
                    </div>

                    {/* Right Col: Distribution & Scheduling */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Globe className="w-5 h-5 text-orange-600" /> Distribution Channels
                        </h3>

                        <div className="space-y-3">
                          {PLATFORMS.map(platform => {
                              const isSelected = selectedPlatforms.includes(platform.id);
                              const pStatus = platformStatusMap[platform.id] || 'idle';
                              
                              return (
                              <div 
                                key={platform.id}
                                onClick={() => togglePlatform(platform.id, platform.isConnected)}
                                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? platform.color : 'border-[#333] hover:bg-[#1f1f1f] bg-[#121212]'}`}
                              >
                                  <div className="flex items-center gap-4">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? platform.iconColor : 'border-slate-500'}`}>
                                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">{platform.name}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          {platform.isConnected ? (
                                            <span className="text-[10px] text-green-400 flex items-center gap-1"><Link className="w-3 h-3" /> Connected</span>
                                          ) : platform.id === 'youtube' ? (
                                              <span className="text-[10px] text-green-400 flex items-center gap-1"><Link className="w-3 h-3" /> Enabled</span>
                                          ) : (
                                            <span className="text-[10px] text-slate-500 flex items-center gap-1"><Link className="w-3 h-3" /> Not Configured</span>
                                          )}
                                        </div>
                                    </div>
                                  </div>
                                  
                                  {/* Status Indicator */}
                                  {isSelected && (
                                    <div className="flex items-center">
                                        {pStatus === 'pending' && <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />}
                                        {pStatus === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                        {pStatus === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
                                    </div>
                                  )}
                              </div>
                              );
                          })}
                        </div>

                        {/* Youtube Metadata Display (if generated) */}
                        {selectedPlatforms.includes('youtube') && (
                            <div className="bg-[#181818] border border-red-900/30 rounded-xl p-6 mt-6 animate-in fade-in">
                                <div className="flex items-center justify-between mb-4">
                                     <h4 className="flex items-center gap-2 text-sm font-bold text-white">
                                        <Youtube className="w-5 h-5 text-red-500"/> YouTube Optimization
                                    </h4>
                                    <div className="flex gap-2">
                                        {youtubeMeta && (
                                            <Button size="sm" variant="ghost" onClick={() => {
                                                const text = `${youtubeMeta.title}\n\n${youtubeMeta.description}\n\nTags: ${youtubeMeta.tags.join(', ')}`;
                                                copyToClipboard(text);
                                            }}>
                                                <Copy className="w-3 h-3 mr-2" /> Copy All
                                            </Button>
                                        )}
                                        <Button size="sm" variant="secondary" onClick={handleGenerateYoutubeAssets} isLoading={status === 'generating_youtube'}>
                                            {youtubeMeta ? <><RefreshCw className="w-3 h-3 mr-2"/> Regenerate</> : <><Sparkles className="w-3 h-3 mr-2"/> Generate Assets</>}
                                        </Button>
                                    </div>
                                </div>

                                {!youtubeMeta ? (
                                    <div className="text-center py-8 border border-dashed border-[#333] rounded-lg bg-[#1f1f1f]/50">
                                        <p className="text-slate-400 text-sm mb-3">Generate SEO-optimized title, description, tags and thumbnail from your script.</p>
                                        <Button size="sm" onClick={handleGenerateYoutubeAssets}>Generate Now</Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Editable Fields */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase">Thumbnail</label>
                                                <div className="aspect-video bg-[#222] rounded-lg overflow-hidden relative group border border-[#333]">
                                                     {youtubeMeta.thumbnailUrl ? (
                                                        <img src={youtubeMeta.thumbnailUrl} className="w-full h-full object-cover" />
                                                     ) : <div className="w-full h-full flex items-center justify-center"><Video className="text-slate-500"/></div>}
                                                </div>
                                                {youtubeMeta.thumbnailUrl && (
                                                    <a href={youtubeMeta.thumbnailUrl} download="thumbnail.png" className="text-xs text-blue-400 hover:text-blue-300 block text-center mt-1">
                                                        Download Image
                                                    </a>
                                                )}
                                                <div className="pt-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Privacy</label>
                                                    <select 
                                                        value={youtubeMeta.privacyStatus}
                                                        onChange={(e) => setYoutubeMeta({...youtubeMeta, privacyStatus: e.target.value as any})}
                                                        className="w-full bg-[#121212] border border-[#333] rounded-md px-2 py-1.5 text-xs text-white focus:border-red-500"
                                                    >
                                                        <option value="public">Public</option>
                                                        <option value="unlisted">Unlisted</option>
                                                        <option value="private">Private</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-4">
                                                <div className="relative">
                                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Video Title</label>
                                                    <div className="flex gap-2">
                                                        <input 
                                                            value={youtubeMeta.title}
                                                            onChange={(e) => setYoutubeMeta({...youtubeMeta, title: e.target.value})}
                                                            className="flex-1 bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:border-red-500"
                                                        />
                                                        <button onClick={() => copyToClipboard(youtubeMeta.title)} className="p-2 hover:bg-[#222] rounded text-slate-400 hover:text-white" title="Copy Title"><Copy className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                                                     <div className="flex gap-2 items-start">
                                                         <textarea 
                                                            value={youtubeMeta.description}
                                                            onChange={(e) => setYoutubeMeta({...youtubeMeta, description: e.target.value})}
                                                            rows={5}
                                                            className="flex-1 bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-white focus:border-red-500 resize-none"
                                                        />
                                                        <button onClick={() => copyToClipboard(youtubeMeta.description)} className="p-2 hover:bg-[#222] rounded text-slate-400 hover:text-white" title="Copy Description"><Copy className="w-4 h-4" /></button>
                                                     </div>
                                                </div>
                                                <div className="relative">
                                                     <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tags (Comma Separated)</label>
                                                     <div className="flex gap-2">
                                                         <input 
                                                            value={youtubeMeta.tags.join(', ')}
                                                            onChange={(e) => setYoutubeMeta({...youtubeMeta, tags: e.target.value.split(',').map(t => t.trim())})}
                                                            className="flex-1 bg-[#121212] border border-[#333] rounded-md px-3 py-2 text-sm text-slate-300 focus:border-red-500"
                                                        />
                                                        <button onClick={() => copyToClipboard(youtubeMeta.tags.join(', '))} className="p-2 hover:bg-[#222] rounded text-slate-400 hover:text-white" title="Copy Tags"><Copy className="w-4 h-4" /></button>
                                                     </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 border-t border-[#333]">
                          <h4 className="text-sm font-medium text-slate-400 mb-2">Schedule Publishing</h4>
                          <div className="flex gap-2">
                              <input 
                                type="datetime-local" 
                                value={metadata.publishDate}
                                onChange={e => setMetadata({...metadata, publishDate: e.target.value})}
                                className="w-full text-sm bg-[#121212] text-white rounded-md border-[#333] focus:border-orange-500 focus:ring-orange-500"
                              />
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                              {metadata.publishDate ? 'Episode will be released automatically at this time.' : 'Episode will be published immediately.'}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[#333]">
                            <div className="flex items-center justify-between">
                              <div>
                                  <h4 className="text-sm font-medium text-slate-400">Content Repurposing</h4>
                                  <p className="text-xs text-slate-500">Automatically create a blog post draft from script.</p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <label className="flex items-center cursor-pointer">
                                      <input 
                                          type="checkbox"
                                          checked={autoGenBlog}
                                          onChange={(e) => setAutoGenBlog(e.target.checked)}
                                          className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-[#333] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 relative"></div>
                                  </label>
                              </div>
                            </div>
                        </div>
                    </div>
                  </div>

                  {/* Publish Action Area */}
                  <div className="mt-8 pt-8 border-t border-[#333] flex flex-col items-center justify-center text-center">
                    {distStatus === 'published' ? (
                        <div className="bg-green-900/20 border border-green-800 rounded-xl p-6 w-full max-w-lg">
                          <div className="mx-auto w-12 h-12 bg-green-800/50 text-green-400 rounded-full flex items-center justify-center mb-3">
                              <CheckCircle className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-bold text-green-400">Published Successfully!</h3>
                          <p className="text-green-300 mt-1 mb-4">Your episode is now live on selected platforms.</p>
                          <Button variant="secondary" onClick={() => setDistStatus('draft')}>Publish Update</Button>
                        </div>
                    ) : distStatus === 'scheduled' ? (
                        <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6 w-full max-w-lg">
                          <div className="mx-auto w-12 h-12 bg-blue-800/50 text-blue-400 rounded-full flex items-center justify-center mb-3">
                              <Calendar className="w-6 h-6" />
                          </div>
                          <h3 className="text-xl font-bold text-blue-400">Scheduled for Release</h3>
                          <p className="text-blue-300 mt-1 mb-4">Scheduled for: {new Date(metadata.publishDate || '').toLocaleString()}</p>
                          <Button variant="secondary" onClick={() => setDistStatus('draft')}>Cancel Schedule</Button>
                        </div>
                    ) : (
                      <div className="w-full max-w-lg space-y-4">
                          {!audioUrl && (
                            <div className="flex items-center gap-2 text-amber-500 bg-amber-900/20 p-3 rounded-lg text-sm mb-2 border border-amber-800">
                                <AlertCircle className="w-4 h-4" />
                                Audio must be generated before publishing.
                            </div>
                          )}
                          <Button 
                            size="lg" 
                            className="w-full text-lg py-4 shadow-lg shadow-orange-900/10"
                            disabled={!audioUrl || selectedPlatforms.length === 0}
                            isLoading={status === 'publishing' || status === 'generating_youtube'}
                            onClick={handlePublish}
                          >
                            {status === 'generating_youtube' ? 'Generating YouTube Assets...' : status === 'publishing' ? 'Distributing to Platforms...' : 'Publish Episode Now'}
                          </Button>
                          <p className="text-xs text-slate-500">
                            By publishing, you confirm that you own all rights to the content.
                          </p>
                      </div>
                    )}
                  </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: PREVIEW & EXPORT */}
          <div className="lg:w-80 flex flex-col gap-6">
            {/* ... Output content unchanged ... */}
            <div className="bg-[#181818] rounded-xl border border-[#272727] p-6 flex flex-col h-full">
                <h3 className="font-semibold text-white mb-6">Final Output</h3>
                
                <div className="flex-1 bg-black rounded-xl p-6 relative flex flex-col items-center justify-center text-center text-white mb-6 overflow-hidden border border-[#333]">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] to-black"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-center gap-1 opacity-20 px-4">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className={`w-full bg-orange-500 rounded-t-sm transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                      ))}
                    </div>

                    <div className="z-10 relative">
                      {audioUrl ? (
                        <>
                          <button 
                            onClick={togglePlayback}
                            className="w-16 h-16 bg-orange-600 hover:bg-orange-500 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-105 shadow-xl shadow-orange-900/20"
                          >
                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                          </button>
                          <div className="text-sm font-medium text-slate-300">
                            {Math.floor((audioRef.current?.duration || 0) / 60)}:
                            {Math.floor((audioRef.current?.duration || 0) % 60).toString().padStart(2, '0')}
                          </div>
                        </>
                      ) : (
                        <div className="text-slate-600 text-sm">
                          No audio generated yet
                        </div>
                      )}
                    </div>
                    
                    <audio 
                      ref={audioRef} 
                      src={audioUrl || undefined} 
                      onEnded={() => setIsPlaying(false)}
                      onTimeUpdate={() => { /* Force re-render for time if needed */ }}
                    />
                </div>

                <div className="space-y-3">
                  {!rawVoiceBuffer ? (
                    <Button 
                      className="w-full" 
                      onClick={handleSynthesize} 
                      isLoading={status === 'synthesizing_audio'}
                      disabled={!content.trim()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generate AI Audio
                    </Button>
                  ) : (
                    <Button 
                        className="w-full" 
                        onClick={handleSynthesize} 
                        variant="secondary"
                        isLoading={status === 'synthesizing_audio'}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-Generate Voice
                      </Button>
                  )}

                  <a 
                    href={audioUrl || '#'} 
                    download={`${title.replace(/\s+/g, '_')}.wav`}
                    className={`flex items-center justify-center w-full px-4 py-2 rounded-lg font-medium transition-colors ${!audioUrl ? 'bg-[#222] text-slate-600 cursor-not-allowed' : 'bg-white text-black hover:bg-slate-200'}`}
                    onClick={(e) => !audioUrl && e.preventDefault()}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export WAV
                  </a>
                  <p className="text-xs text-center text-slate-500">High Quality 24kHz WAV</p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Studio;