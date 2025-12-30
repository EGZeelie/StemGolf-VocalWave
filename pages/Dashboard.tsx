import React from 'react';
import { PodcastProject, AppRoute } from '../types';
import { Plus, Mic, PlayCircle, Clock, ExternalLink, Play } from 'lucide-react';
import Button from '../components/Button';

interface DashboardProps {
  onNavigate: (route: AppRoute) => void;
  onEditProject: (project: PodcastProject) => void;
  projects: PodcastProject[];
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEditProject, projects }) => {
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

      {/* Stats Cards - Updated visual style */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="group bg-[#181818] rounded-lg border border-[#272727] overflow-hidden hover:border-orange-900/50 transition-all hover:shadow-lg hover:shadow-orange-900/10 cursor-pointer"
                onClick={() => onEditProject(project)}
              >
                <div className="aspect-square bg-[#222] relative overflow-hidden">
                  {project.metadata.coverArt ? (
                    <img src={project.metadata.coverArt} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={project.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                      <Mic className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
                     <div className="bg-orange-600 rounded-full p-3 text-white transform scale-90 group-hover:scale-100 transition-transform">
                        <Play className="w-6 h-6 fill-current" />
                     </div>
                  </div>
                  {project.distributionStatus === 'published' && (
                     <div className="absolute top-2 right-2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded">
                        LIVE
                     </div>
                  )}
                </div>
                <div className="p-4">
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
                className="group bg-[#121212] rounded-lg border border-[#272727] border-dashed hover:border-orange-500/50 flex flex-col items-center justify-center cursor-pointer min-h-[280px] transition-colors"
              >
                 <div className="w-12 h-12 rounded-full bg-[#1f1f1f] group-hover:bg-[#252525] flex items-center justify-center mb-3 transition-colors">
                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-orange-500" />
                 </div>
                 <span className="text-sm font-medium text-slate-400 group-hover:text-white">New Project</span>
              </div>
          </div>
        )}
      </section>

      {/* Recent Episodes Section (List View) */}
      <section>
         <div className="flex items-center justify-between mb-4 border-t border-[#272727] pt-8">
          <h2 className="text-xl font-bold text-white">Trending episodes today</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
           {projects.slice(0, 4).map(project => (
              <div key={project.id} className="bg-[#181818] hover:bg-[#1f1f1f] p-3 rounded-lg flex gap-4 transition-colors cursor-pointer border border-[#272727]" onClick={() => onEditProject(project)}>
                 <div className="w-20 h-20 bg-[#252525] rounded flex-shrink-0 overflow-hidden">
                    {project.metadata.coverArt ? (
                       <img src={project.metadata.coverArt} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center"><Mic className="w-8 h-8 text-slate-700" /></div>
                    )}
                 </div>
                 <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-white font-bold truncate">{project.title}</h4>
                    <p className="text-slate-500 text-sm truncate">{project.metadata.author}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <button className="bg-white text-black rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-200">
                          <Play className="w-2 h-2 fill-current" /> Play
                       </button>
                       <span className="text-slate-600 text-xs">{(Math.random() * 20 + 2).toFixed(0)}m 12s</span>
                    </div>
                 </div>
              </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;