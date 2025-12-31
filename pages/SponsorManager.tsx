
import React, { useState, useRef } from 'react';
import { Sponsor } from '../types';
import Button from '../components/Button';
import { Megaphone, Plus, Search, Tag, Globe, CheckCircle, XCircle, Upload, Trash2, Edit2, BadgeDollarSign, FileText } from 'lucide-react';

interface SponsorManagerProps {
  sponsors: Sponsor[];
  onSave: (sponsor: Sponsor) => void;
  onDelete: (id: string) => void;
}

const SponsorManager: React.FC<SponsorManagerProps> = ({ sponsors, onSave, onDelete }) => {
  const [view, setView] = useState<'list' | 'edit'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSponsor, setEditingSponsor] = useState<Partial<Sponsor>>({});
  
  // Refs for upload
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Filter
  const filteredSponsors = sponsors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.promoCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (sponsor?: Sponsor) => {
    if (sponsor) {
        setEditingSponsor({ ...sponsor });
    } else {
        setEditingSponsor({
            id: `sponsor_${Date.now()}`,
            isActive: true,
            createdAt: Date.now()
        });
    }
    setView('edit');
  };

  const handleSave = () => {
    if (!editingSponsor.name || !editingSponsor.promoCode) {
        alert("Name and Promo Code are required.");
        return;
    }
    onSave(editingSponsor as Sponsor);
    setView('list');
    setEditingSponsor({});
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingSponsor(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleActive = (sponsor: Sponsor) => {
      onSave({ ...sponsor, isActive: !sponsor.isActive });
  };

  if (view === 'edit') {
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Megaphone className="w-6 h-6 text-orange-600" />
                      {editingSponsor.id && sponsors.find(s => s.id === editingSponsor.id) ? 'Edit Sponsor' : 'Add New Sponsor'}
                  </h1>
                  <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setView('list')}>Cancel</Button>
                      <Button onClick={handleSave}>Save Sponsor</Button>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Logo & Basic Info */}
                  <div className="space-y-6">
                      <div className="bg-[#181818] p-6 rounded-xl border border-[#272727]">
                          <label className="block text-sm font-medium text-slate-400 mb-2">Sponsor Logo</label>
                          <div 
                            className="aspect-square bg-[#121212] rounded-lg border-2 border-dashed border-[#333] flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 transition-colors relative overflow-hidden group"
                            onClick={() => logoInputRef.current?.click()}
                          >
                              {editingSponsor.logoUrl ? (
                                  <img src={editingSponsor.logoUrl} className="w-full h-full object-contain p-4" />
                              ) : (
                                  <div className="text-center p-4">
                                      <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                      <span className="text-xs text-slate-500">Click to upload</span>
                                  </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <span className="text-white text-xs font-bold">Change Logo</span>
                              </div>
                          </div>
                          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </div>

                      <div className="bg-[#181818] p-6 rounded-xl border border-[#272727] space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Company Name *</label>
                              <input 
                                type="text" 
                                value={editingSponsor.name || ''} 
                                onChange={e => setEditingSponsor({...editingSponsor, name: e.target.value})}
                                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white focus:border-orange-500"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Tagline</label>
                              <input 
                                type="text" 
                                value={editingSponsor.tagline || ''} 
                                onChange={e => setEditingSponsor({...editingSponsor, tagline: e.target.value})}
                                placeholder="e.g. The future of sound"
                                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white focus:border-orange-500"
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Website URL</label>
                              <div className="relative">
                                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    value={editingSponsor.websiteUrl || ''} 
                                    onChange={e => setEditingSponsor({...editingSponsor, websiteUrl: e.target.value})}
                                    placeholder="https://..."
                                    className="w-full bg-[#121212] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-white focus:border-orange-500"
                                />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Middle: Deal & Product Info */}
                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-[#181818] p-6 rounded-xl border border-[#272727]">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <BadgeDollarSign className="w-5 h-5 text-green-500" /> The Deal
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Promo Code *</label>
                                  <input 
                                    type="text" 
                                    value={editingSponsor.promoCode || ''} 
                                    onChange={e => setEditingSponsor({...editingSponsor, promoCode: e.target.value})}
                                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white font-mono font-bold tracking-wider focus:border-green-500"
                                  />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Offer Title</label>
                                  <input 
                                    type="text" 
                                    value={editingSponsor.offerTitle || ''} 
                                    onChange={e => setEditingSponsor({...editingSponsor, offerTitle: e.target.value})}
                                    placeholder="e.g. Get 20% Off Your First Order"
                                    className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white focus:border-green-500"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Product / Service Description</label>
                              <textarea 
                                rows={4}
                                value={editingSponsor.description || ''}
                                onChange={e => setEditingSponsor({...editingSponsor, description: e.target.value})}
                                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-white focus:border-orange-500"
                                placeholder="Describe what they sell and why listeners should care..."
                              />
                          </div>
                      </div>

                      <div className="bg-[#181818] p-6 rounded-xl border border-[#272727]">
                          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" /> Fine Print
                          </h3>
                          <div>
                              <label className="block text-sm font-medium text-slate-400 mb-1">Terms & Conditions</label>
                              <textarea 
                                rows={6}
                                value={editingSponsor.termsAndConditions || ''}
                                onChange={e => setEditingSponsor({...editingSponsor, termsAndConditions: e.target.value})}
                                className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-slate-300 text-sm focus:border-orange-500 font-mono"
                                placeholder="- Valid for new customers only&#10;- Expires Dec 31, 2025&#10;- Cannot be combined with other offers"
                              />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-[#272727] pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Program Sponsors</h1>
          <p className="text-slate-400">Manage active partnerships, promo codes, and terms for your listeners.</p>
        </div>
        <Button onClick={() => handleEdit()}>
          <Plus className="w-4 h-4 mr-2" /> Add Sponsor
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search sponsors..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#181818] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-orange-500"
                />
          </div>
      </div>

      {filteredSponsors.length === 0 ? (
          <div className="text-center py-20 bg-[#181818] rounded-xl border border-[#272727] border-dashed">
              <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-white font-medium">No sponsors yet</h3>
              <p className="text-slate-500 text-sm mt-1">Add your first program partner to start monetizing.</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSponsors.map(sponsor => (
                  <div key={sponsor.id} className={`bg-[#181818] border rounded-xl overflow-hidden group transition-all ${sponsor.isActive ? 'border-[#333] hover:border-orange-500/50' : 'border-[#272727] opacity-60'}`}>
                      <div className="p-5 flex items-start justify-between">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center overflow-hidden">
                                  {sponsor.logoUrl ? (
                                      <img src={sponsor.logoUrl} alt={sponsor.name} className="max-w-full max-h-full" />
                                  ) : (
                                      <Tag className="text-black w-6 h-6" />
                                  )}
                              </div>
                              <div>
                                  <h3 className="font-bold text-white text-lg">{sponsor.name}</h3>
                                  <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${sponsor.isActive ? 'bg-green-900/30 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
                                      {sponsor.isActive ? 'Active' : 'Inactive'}
                                  </div>
                              </div>
                          </div>
                          <div className="flex gap-1">
                              <button onClick={() => handleEdit(sponsor)} className="p-2 text-slate-400 hover:text-white hover:bg-[#222] rounded-lg transition-colors">
                                  <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDelete(sponsor.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                      
                      <div className="px-5 pb-5">
                          <div className="bg-[#222] rounded-lg p-3 mb-4">
                              <div className="text-xs text-slate-500 uppercase font-bold mb-1">Current Offer</div>
                              <div className="text-white font-medium">{sponsor.offerTitle}</div>
                              <div className="mt-2 flex items-center justify-between bg-black/30 rounded px-2 py-1 border border-white/5">
                                  <code className="text-orange-500 font-mono font-bold">{sponsor.promoCode}</code>
                                  <span className="text-[10px] text-slate-600">PROMO CODE</span>
                              </div>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-[#272727] pt-4">
                              <span className="text-xs text-slate-500 font-mono">Added: {new Date(sponsor.createdAt).toLocaleDateString()}</span>
                              <button 
                                onClick={() => handleToggleActive(sponsor)}
                                className={`text-xs font-bold flex items-center gap-1 ${sponsor.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                              >
                                  {sponsor.isActive ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                                  {sponsor.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default SponsorManager;
