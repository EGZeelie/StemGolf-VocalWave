
import React, { useState } from 'react';
import { Mic2, LayoutDashboard, Settings, Menu, X, Globe, BarChart3, Search, User, Zap, Radio, HelpCircle, FileText, LogOut, ShieldAlert } from 'lucide-react';
import { AppRoute, CreatorProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  profile?: CreatorProfile;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentRoute, onNavigate, profile, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple name fallback
  const displayName = profile?.name || 'Guest User';
  const displayInitials = displayName.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const isAdmin = profile?.role === 'admin';

  // If we are on the public page, render a simplified layout
  if (currentRoute === AppRoute.PUBLIC_PAGE) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {children}
      </div>
    );
  }

  const navItems = [
    { id: AppRoute.DASHBOARD, label: 'Discover / Dashboard', icon: LayoutDashboard },
    { id: AppRoute.STUDIO, label: 'Studio (Your Podcasts)', icon: Mic2, badge: 'New' },
    { id: AppRoute.BLOG_EDITOR, label: 'Blog & Articles', icon: FileText, badge: 'AI' },
    { id: AppRoute.ANALYTICS, label: 'Analytics', icon: BarChart3 },
    { id: AppRoute.CREATOR_SETTINGS, label: 'Creator Page', icon: Globe },
  ];

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#121212] border-r border-[#272727]">
        <div className="p-5 flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="text-lg font-bold tracking-tight text-white">StemGolf</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
           <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Library</div>
           <nav className="space-y-1 mb-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors border-l-2 ${
                  currentRoute === item.id 
                    ? 'border-orange-500 bg-[#1f1f1f] text-white' 
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center gap-3">
                   <item.icon className={`w-4 h-4 ${currentRoute === item.id ? 'text-orange-500' : 'text-slate-500'}`} />
                   {item.label}
                </div>
                {item.badge && (
                   <span className={`text-[10px] text-white px-1.5 py-0.5 rounded font-bold ${item.badge === 'AI' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                      {item.badge}
                   </span>
                )}
              </button>
            ))}
          </nav>

          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">For Podcasters</div>
          <nav className="space-y-1 mb-6">
             <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-[#181818] border-l-2 border-transparent">
                <Radio className="w-4 h-4 text-slate-500" />
                Distribution
             </button>
             <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-[#181818] border-l-2 border-transparent">
                <Zap className="w-4 h-4 text-slate-500" />
                Monetization
             </button>
          </nav>
          
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform</div>
          <nav className="space-y-1">
             <button 
                onClick={() => onNavigate(AppRoute.SETTINGS)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-[#181818] border-l-2 border-transparent ${currentRoute === AppRoute.SETTINGS ? 'text-white' : ''}`}
             >
                <Settings className="w-4 h-4 text-slate-500" />
                Settings
             </button>
             {isAdmin && (
                 <button 
                    onClick={() => onNavigate(AppRoute.ADMIN)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/10 border-l-2 border-transparent ${currentRoute === AppRoute.ADMIN ? 'border-red-500 bg-red-900/10 text-red-300' : ''}`}
                 >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Panel
                 </button>
             )}
             <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-[#181818] border-l-2 border-transparent">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                Help & Support
             </button>
          </nav>
        </div>

        <div className="p-4 border-t border-[#272727]">
          {/* User Profile */}
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-white border border-slate-600 flex-shrink-0">
                {displayInitials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{isAdmin ? 'Administrator' : 'Pro Plan'}</p>
              </div>
            </div>
            {onLogout && (
               <button onClick={onLogout} className="p-2 text-slate-500 hover:text-white hover:bg-[#1f1f1f] rounded-lg transition-colors" title="Sign Out">
                 <LogOut className="w-4 h-4" />
               </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f0f0f]">
          
          {/* Header */}
          <header className="h-16 border-b border-[#272727] flex items-center justify-between px-6 bg-[#121212]">
             <div className="md:hidden flex items-center gap-2">
               <div className="w-7 h-7 bg-orange-600 rounded flex items-center justify-center text-white font-bold">S</div>
               <span className="font-bold text-white">StemGolf</span>
             </div>

             {/* Search Bar */}
             <div className="flex-1 max-w-2xl mx-auto px-4 hidden md:block">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search projects, scripts, or analytics..." 
                    className="w-full bg-[#1f1f1f] border border-[#333] text-slate-200 text-sm rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 placeholder-slate-600"
                  />
               </div>
             </div>

             <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-slate-400 hover:text-white md:hidden"
                >
                  {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
             </div>
          </header>

          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 bg-[#121212] z-50 pt-20 px-4">
              <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 text-slate-400"
              >
                  <X />
              </button>
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-4 text-base font-medium rounded-lg border ${
                      currentRoute === item.id 
                        ? 'bg-[#1f1f1f] border-orange-500 text-white' 
                        : 'bg-transparent border-[#333] text-slate-400'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                {isAdmin && (
                    <button
                        onClick={() => {
                            onNavigate(AppRoute.ADMIN);
                            setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-4 text-base font-medium rounded-lg border bg-red-900/10 border-red-900 text-red-400 mt-2"
                    >
                        <ShieldAlert className="w-5 h-5" />
                        Admin Panel
                    </button>
                )}
                {onLogout && (
                   <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-4 text-base font-medium rounded-lg border bg-transparent border-[#333] text-red-400 mt-4"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                )}
              </nav>
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6 md:p-8 custom-scrollbar">
            {children}
          </main>
      </div>
    </div>
  );
};

export default Layout;
