import React from 'react';
import { CreatorProfile, AppRoute } from '../types';
import Button from '../components/Button';
import { Globe, ArrowRight, ExternalLink, Lock, CreditCard, Layout, Type, Check, AlertCircle } from 'lucide-react';

interface CreatorSettingsProps {
  profile: CreatorProfile;
  onUpdate: (profile: CreatorProfile) => void;
  onNavigate: (route: AppRoute) => void;
}

const COLORS = [
  { name: 'StemGolf Orange', value: '#ea580c' },
  { name: 'Royal Blue', value: '#2563eb' },
  { name: 'Forest Green', value: '#16a34a' },
  { name: 'Berry Purple', value: '#9333ea' },
  { name: 'Slate Dark', value: '#1e293b' },
];

const THEMES = [
  { id: 'classic', name: 'Classic', desc: 'Colored header with clean white list.' },
  { id: 'minimal', name: 'Minimal', desc: 'Simple, modern, whitespace focused.' },
  { id: 'bold', name: 'Bold', desc: 'Immersive full-color background.' },
];

const CreatorSettings: React.FC<CreatorSettingsProps> = ({ profile, onUpdate, onNavigate }) => {
  const handleChange = (field: keyof CreatorProfile, value: any) => {
    onUpdate({ ...profile, [field]: value });
  };

  const handleLinkChange = (key: keyof CreatorProfile['links'], value: string) => {
    onUpdate({ 
      ...profile, 
      links: { ...profile.links, [key]: value } 
    });
  };

  const ConnectionBadge = ({ isConnected }: { isConnected: boolean }) => (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ml-auto transition-colors ${isConnected ? 'bg-green-900/20 text-green-400 border border-green-800' : 'bg-[#222] text-slate-500 border border-[#333]'}`}>
      {isConnected ? (
        <>
          <Check className="w-3 h-3" /> Connected
        </>
      ) : (
        <>
          <AlertCircle className="w-3 h-3" /> Not Connected
        </>
      )}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Creator Page Setup</h1>
          <p className="text-slate-400">Customize your public podcast landing page.</p>
        </div>
        <Button onClick={() => onNavigate(AppRoute.PUBLIC_PAGE)} variant="secondary">
          Preview Page <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#181818] rounded-xl shadow-sm border border-[#272727] overflow-hidden">
            <div className="p-6 border-b border-[#272727] bg-[#1f1f1f] flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold transition-colors"
                style={{ backgroundColor: profile.brandColor }}
              >
                {profile.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-white">Profile Preview</h3>
                <p className="text-sm text-slate-400">stemgolf.app/p/{profile.slug}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Podcast / Creator Name</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-[#121212] text-white rounded-md border-[#333] shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">URL Slug</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[#333] bg-[#222] text-slate-500 text-sm">
                      stemgolf.app/p/
                    </span>
                    <input 
                      type="text" 
                      value={profile.slug}
                      onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="flex-1 bg-[#121212] text-white rounded-r-md border-[#333] focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Bio / Description</label>
                <textarea 
                  value={profile.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  rows={3}
                  className="w-full bg-[#121212] text-white rounded-md border-[#333] shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  placeholder="Tell listeners what your podcast is about..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Brand Color</label>
                <div className="flex gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleChange('brandColor', c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${profile.brandColor === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t border-[#272727] pt-6">
                <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Social & Streaming Links</h3>
                <div className="space-y-4">
                    <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#272727]">
                      <div className="flex justify-between items-center mb-2">
                         <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" className="w-5 h-5" alt="Spotify" />
                           Spotify
                         </label>
                         <ConnectionBadge isConnected={!!profile.links.spotify} />
                      </div>
                      <input 
                          type="text" 
                          value={profile.links.spotify || ''}
                          onChange={(e) => handleLinkChange('spotify', e.target.value)}
                          placeholder="https://open.spotify.com/..."
                          className="w-full text-sm bg-[#121212] text-white rounded-md border-[#333] focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#272727]">
                      <div className="flex justify-between items-center mb-2">
                         <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                           <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Podcasts_%28iOS%29.svg" className="w-5 h-5" alt="Apple" />
                           Apple Podcasts
                         </label>
                         <ConnectionBadge isConnected={!!profile.links.apple} />
                      </div>
                      <input 
                          type="text" 
                          value={profile.links.apple || ''}
                          onChange={(e) => handleLinkChange('apple', e.target.value)}
                          placeholder="https://podcasts.apple.com/..."
                          className="w-full text-sm bg-[#121212] text-white rounded-md border-[#333] focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>

                    <div className="bg-[#1f1f1f] p-4 rounded-lg border border-[#272727]">
                      <div className="flex justify-between items-center mb-2">
                         <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                           <Globe className="w-5 h-5 text-slate-500" />
                           Website
                         </label>
                         <ConnectionBadge isConnected={!!profile.links.website} />
                      </div>
                      <input 
                          type="text" 
                          value={profile.links.website || ''}
                          onChange={(e) => handleLinkChange('website', e.target.value)}
                          placeholder="https://..."
                          className="w-full text-sm bg-[#121212] text-white rounded-md border-[#333] focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1f1f1f] px-6 py-4 flex justify-end border-t border-[#272727]">
              <Button onClick={() => alert("Profile Saved!")}>Save Changes</Button>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-[#181818] rounded-xl shadow-sm border border-[#272727] overflow-hidden">
             <div className="p-4 border-b border-[#272727]">
               <h3 className="font-semibold text-white flex items-center gap-2">
                 <Layout className="w-4 h-4 text-orange-600" /> Page Appearance
               </h3>
             </div>
             <div className="p-6 space-y-6">
                <div className="space-y-3">
                   <label className="text-sm font-medium text-slate-400">Layout Theme</label>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {THEMES.map(theme => (
                        <div 
                          key={theme.id}
                          onClick={() => handleChange('theme', theme.id)}
                          className={`cursor-pointer rounded-lg border p-4 text-center transition-all ${profile.theme === theme.id ? 'border-orange-500 bg-orange-900/10 ring-1 ring-orange-500' : 'border-[#333] hover:border-[#555] bg-[#121212]'}`}
                        >
                           <div className="text-sm font-semibold text-white">{theme.name}</div>
                           <div className="text-xs text-slate-500 mt-1">{theme.desc}</div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-sm font-medium text-slate-400 flex items-center gap-2">
                      <Type className="w-4 h-4" /> Font Style
                   </label>
                   <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                           type="radio" 
                           name="font" 
                           checked={profile.font === 'modern' || !profile.font}
                           onChange={() => handleChange('font', 'modern')}
                           className="bg-[#121212] border-[#333] text-orange-600 focus:ring-orange-500"
                         />
                         <span className="font-sans text-sm text-slate-300">Modern (Sans)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                           type="radio" 
                           name="font" 
                           checked={profile.font === 'serif'}
                           onChange={() => handleChange('font', 'serif')}
                           className="bg-[#121212] border-[#333] text-orange-600 focus:ring-orange-500"
                         />
                         <span className="font-serif text-sm text-slate-300">Classic (Serif)</span>
                      </label>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Col: Pro Features */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-slate-900 to-black rounded-xl shadow-lg border border-slate-700 text-white p-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-orange-600/5"></div>
               <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                     <div className="p-1 bg-yellow-400 rounded text-slate-900">
                        <Lock className="w-4 h-4" />
                     </div>
                     <h3 className="font-bold">Pro Features</h3>
                  </div>
                  <p className="text-slate-300 text-sm mb-6">Upgrade to unlock custom domains, white-labeling, and advanced analytics.</p>
                  
                  <div className="space-y-4">
                     <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                        <label className="flex justify-between items-center mb-1 text-sm font-medium text-slate-200">
                           Custom Domain
                           <span className="text-[10px] uppercase bg-yellow-400/20 text-yellow-300 px-1.5 rounded">Pro</span>
                        </label>
                        <div className="flex gap-2">
                           <input 
                             disabled 
                             placeholder="podcast.yourdomain.com"
                             className="bg-slate-800 border-slate-600 rounded px-2 py-1 text-xs w-full text-slate-400 cursor-not-allowed"
                           />
                        </div>
                     </div>

                     <div className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-200">
                           Remove Branding
                        </label>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] uppercase bg-yellow-400/20 text-yellow-300 px-1.5 rounded">Pro</span>
                           <div className="w-8 h-4 bg-slate-600 rounded-full relative opacity-50 cursor-not-allowed">
                              <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                           </div>
                        </div>
                     </div>

                     <Button className="w-full bg-white text-slate-900 hover:bg-slate-200 border-none font-bold">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                     </Button>
                  </div>
               </div>
           </div>

           <div className="bg-[#181818] rounded-xl shadow-sm border border-[#272727] p-6">
              <h3 className="font-semibold text-white mb-2">Tips for Growth</h3>
              <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                 <li>Share your page link on social media bio.</li>
                 <li>Keep your bio short and punchy.</li>
                 <li>Use consistent brand colors.</li>
                 <li>Publish episodes regularly.</li>
              </ul>
           </div>
        </div>

      </div>
    </div>
  );
};

export default CreatorSettings;