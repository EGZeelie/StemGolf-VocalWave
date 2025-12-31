
import React, { useEffect, useState } from 'react';
import { PodcastProject, AppRoute } from '../types';
import { Plus, Mic, PlayCircle, Clock, ExternalLink, Play, TrendingUp, ArrowUpRight, Search, RefreshCw, ChevronDown } from 'lucide-react';
import Button from '../components/Button';

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
  onEditProject: (project: PodcastProject) => void;
  projects: PodcastProject[];
}

interface Trend {
  title: string;
  volume: string;
  category: string;
  growth: string;
}

const MOCK_TRENDS: Trend[] = [
  { title: "Springbokke vs All Blacks", volume: "200K+", category: "Sports", growth: "+500%" },
  { title: "KykNET Verslag", volume: "20K+", category: "Entertainment", growth: "+50%" },
  { title: "Beurtkrag Skedule", volume: "100K+", category: "News", growth: "+120%" },
  { title: "Steve Hofmeyr", volume: "10K+", category: "Music", growth: "+20%" },
  { title: "Bitcoin Prys", volume: "50K+", category: "Finance", growth: "+80%" }
];

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEditProject, projects }) => {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trendRange, setTrendRange] = useState('1d');

  useEffect(() => {
    // Simulate fetching trends
    setTrends(MOCK_TRENDS);
  }, []);

  const handleRefreshTrends = () => {
    setIsRefreshing(true);
    // Simulate network delay and data update
    setTimeout(() => {
        // Shuffle trends to simulate change
        const shuffled = [...MOCK_TRENDS].sort(() => 0.5 - Math.random());
        setTrends(shuffled);
        setIsRefreshing(false);
    }, 800);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setTrendRange(e.target.value);
      handleRefreshTrends();
  };

  const handleUseTrend = (trend: Trend) => {
    const draftProject: PodcastProject = {
      id: `proj_${Date.now()}`,
      title: trend.title,
      description: `Podcast episode about ${trend.title}.`,
      content: `[Topic: ${trend.title}]\n\n`,
      createdAt: Date.now(),
      voice: 'Fenrir',
      tone: 'conversational',
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
        author: 'Host',
        genre: trend.category,
        season: 1,
        episode: 1,
        type: 'full',
        explicit: false,
      },
      distributionStatus: 'draft'
    };
    onEditProject(draftProject);
  };

  return (
    <div className="space-y-10">
      
      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 border-b border-[#272727] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, Jan</h1>
          <p className="text-slate-400">Manage your Afrikaans audio projects and distribution.</p>
        </div>
        <div className="flex gap-3">
           <Button onClick={() => onNavigate(AppRoute.CREATOR_SETTINGS)} variant="secondary">
            Manage Page <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
          <Button onClick={() => onNavigate(AppRoute.STUDIO)} size="md">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column (2/3) */}
        <div className="lg:col-span-2 space-y-10">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#181818] p-5 rounded-lg border border-[#272727] hover:border-[#333] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#222] text-orange-500 rounded-lg">
                    <Mic className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</p>
                    <p className="text-2xl font-bold text-white">{projects.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#181818] p-5 rounded-lg border border-[#272727] hover:border-[#333] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#222] text-blue-500 rounded-lg">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Generated</p>
                    <p className="text-2xl font-bold text-white">4.2 hrs</p>
                  </div>
                </div>
              </div>
               <div className="bg-[#181818] p-5 rounded-lg border border-[#272727] hover:border-[#333] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#222] text-green-500 rounded-lg">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Listens</p>
                    <p className="text-2xl font-bold text-white">1.2k</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Projects Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Your Projects</h2>
                <Button variant="ghost" size="sm">See All</Button>
              </div>
              
              {projects.length === 0 ? (
                <div className="bg-[#181818] rounded-xl border border-[#272727] p-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-[#222] rounded-full flex items-center justify-center mb-4">
                    <Mic className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-white font-medium">No projects yet</h3>
                  <p className="text-slate-500 text-sm mt-1 mb-6">Start creating your first Afrikaans podcast.</p>
                  <Button variant="primary" onClick={() => onNavigate(AppRoute.STUDIO)}>Start Creating</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {projects.slice(0, 4).map((project) => (
                    <div 
                      key={project.id} 
                      className="group bg-[#181818] rounded-lg border border-[#272727] overflow-hidden hover:border-orange-900/50 transition-all hover:shadow-lg hover:shadow-orange-900/10 cursor-pointer flex"
                      onClick={() => onEditProject(project)}
                    >
                      <div className="w-24 bg-[#222] relative overflow-hidden flex-shrink-0">
                        {project.metadata.coverArt ? (
                          <img src={project.metadata.coverArt} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={project.title} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                            <Mic className="w-8 h-8 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 min-w-0">
                        <h3 className="text-white font-bold truncate mb-1">{project.title}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-3">{project.description || 'No description provided.'}</p>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="bg-[#222] px-2 py-1 rounded capitalize">{project.tone}</span>
                          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* "New Project" Card */}
                   <div 
                      onClick={() => onNavigate(AppRoute.STUDIO)}
                      className="group bg-[#121212] rounded-lg border border-[#272727] border-dashed hover:border-orange-500/50 flex flex-col items-center justify-center cursor-pointer min-h-[120px] transition-colors"
                    >
                       <div className="w-10 h-10 rounded-full bg-[#1f1f1f] group-hover:bg-[#252525] flex items-center justify-center mb-2 transition-colors">
                          <Plus className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                       </div>
                       <span className="text-xs font-medium text-slate-400 group-hover:text-white">New Project</span>
                    </div>
                </div>
              )}
            </section>
        </div>

        {/* Sidebar Column (1/3) */}
        <div className="space-y-8">
            {/* Google Trends Widget */}
            <div className="bg-[#181818] rounded-xl border border-[#272727] overflow-hidden">
                <div className="p-4 border-b border-[#272727] bg-[#1f1f1f] flex justify-between items-center">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" /> Google Trends
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select 
                                value={trendRange}
                                onChange={handleRangeChange}
                                className="appearance-none bg-[#121212] border border-[#333] text-[10px] text-slate-400 pl-2 pr-6 py-1 rounded focus:border-blue-500 focus:outline-none cursor-pointer hover:border-slate-500 transition-colors"
                            >
                                <option value="1d">ZA • 1 Day</option>
                                <option value="3d">ZA • 3 Days</option>
                                <option value="7d">ZA • Week</option>
                                <option value="30d">ZA • Month</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-slate-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                        <button 
                            onClick={handleRefreshTrends} 
                            className={`p-1 hover:bg-[#333] rounded text-slate-400 hover:text-white transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                            title="Refresh Trends"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                <div className="p-4">
                    {isRefreshing ? (
                        <div className="py-8 text-center flex flex-col items-center justify-center text-slate-500 space-y-2">
                            <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Updating trends...</span>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs text-slate-500 mb-4">Trending searches in South Africa for the last {trendRange === '1d' ? '24 hours' : trendRange === '3d' ? '3 days' : trendRange === '7d' ? '7 days' : '30 days'}. Click to create an episode.</p>
                            <div className="space-y-3">
                                {trends.map((trend, i) => (
                                    <div key={i} className="group flex items-center justify-between p-2 rounded-lg hover:bg-[#222] transition-colors border border-transparent hover:border-[#333]">
                                        <div className="min-w-0 flex-1 mr-3">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-sm text-slate-200 truncate">{trend.title}</span>
                                                <span className="text-[10px] text-green-500 font-bold bg-green-900/20 px-1.5 rounded">{trend.growth}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                                <span>{trend.volume} searches</span>
                                                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                                <span>{trend.category}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleUseTrend(trend)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md"
                                            title="Create Episode from Trend"
                                        >
                                            <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-3 border-t border-[#272727] text-center">
                                <a href="https://trends.google.com/trends/trendingsearches/daily?geo=ZA" target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 hover:text-white flex items-center justify-center gap-1">
                                    View more on Google Trends <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Trending Episodes List */}
            <div>
               <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Top Performing</h2>
              </div>
              <div className="space-y-3">
                 {projects.slice(0, 3).map(project => (
                    <div key={project.id} className="bg-[#181818] hover:bg-[#1f1f1f] p-3 rounded-lg flex gap-3 transition-colors cursor-pointer border border-[#272727]" onClick={() => onEditProject(project)}>
                       <div className="w-12 h-12 bg-[#252525] rounded flex-shrink-0 overflow-hidden">
                          {project.metadata.coverArt ? (
                             <img src={project.metadata.coverArt} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center"><Mic className="w-5 h-5 text-slate-700" /></div>
                          )}
                       </div>
                       <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h4 className="text-white text-sm font-bold truncate">{project.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs text-slate-500 flex items-center gap-1"><PlayCircle className="w-3 h-3" /> 1.2k</span>
                             <span className="text-slate-600 text-[10px]">|</span>
                             <span className="text-slate-500 text-[10px]">{(Math.random() * 20 + 2).toFixed(0)}m</span>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
