
import React, { useState } from 'react';
import { CreatorProfile } from '../types';
import Button from '../components/Button';
import { User, Shield, CreditCard, Bell, Lock, Mail, Globe, Save } from 'lucide-react';

interface SettingsProps {
  profile: CreatorProfile;
  onUpdateProfile: (profile: CreatorProfile) => void;
}

const Settings: React.FC<SettingsProps> = ({ profile, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'preferences'>('account');
  const [name, setName] = useState(profile.name);
  
  // Mock State
  const [email, setEmail] = useState('jan@stemgolf.app');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [browserNotifs, setBrowserNotifs] = useState(false);

  const handleSaveAccount = () => {
    onUpdateProfile({ ...profile, name });
    alert("Account details saved.");
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account, billing, and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="md:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'account' ? 'bg-[#222] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-[#181818]'}`}
          >
            <User className="w-4 h-4" /> Account
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'billing' ? 'bg-[#222] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-[#181818]'}`}
          >
            <CreditCard className="w-4 h-4" /> Billing & Plan
          </button>
          <button 
            onClick={() => setActiveTab('preferences')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'preferences' ? 'bg-[#222] text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-[#181818]'}`}
          >
            <Bell className="w-4 h-4" /> Preferences
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-[#181818] border border-[#272727] rounded-xl p-6 md:p-8">
          
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-[#272727] pb-4">Profile Details</h3>
                <div className="grid grid-cols-1 gap-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Display Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-white focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
                    <div className="relative">
                      <input 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 pl-10 text-white focus:ring-orange-500 focus:border-orange-500"
                      />
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-[#272727] pb-4">Security</h3>
                <div className="grid grid-cols-1 gap-6 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-white focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-white focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#272727] flex justify-end">
                <Button onClick={handleSaveAccount}>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-[#272727] pb-4">Current Plan</h3>
                <div className="bg-[#121212] rounded-xl p-6 border border-[#333] flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl font-bold text-white capitalize">{profile.plan} Plan</span>
                      {profile.plan === 'pro' && (
                        <span className="bg-yellow-900/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded border border-yellow-800">ACTIVE</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">Billed monthly. Next billing date: Oct 24, 2025</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">R 299<span className="text-sm font-normal text-slate-500">/mo</span></div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-[#272727] pb-4">Payment Method</h3>
                <div className="flex items-center gap-4 p-4 border border-[#333] rounded-lg bg-[#121212]">
                  <div className="w-12 h-8 bg-slate-700 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                  <div>
                    <p className="text-white font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-slate-500">Expires 12/28</p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto text-slate-400 hover:text-white">Update</Button>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-[#272727] pb-4">Billing History</h3>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-[#1f1f1f]">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#272727]">
                    <tr>
                      <td className="px-4 py-3 text-white">Sep 24, 2025</td>
                      <td className="px-4 py-3 text-white">R 299.00</td>
                      <td className="px-4 py-3 text-right"><button className="text-orange-500 hover:underline">Download</button></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-white">Aug 24, 2025</td>
                      <td className="px-4 py-3 text-white">R 299.00</td>
                      <td className="px-4 py-3 text-right"><button className="text-orange-500 hover:underline">Download</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-[#272727] pb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-[#333]">
                    <div>
                      <div className="font-medium text-white">Email Notifications</div>
                      <div className="text-xs text-slate-500">Receive weekly digests and major updates.</div>
                    </div>
                    <button 
                      onClick={() => setEmailNotifs(!emailNotifs)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${emailNotifs ? 'bg-orange-600' : 'bg-[#333]'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailNotifs ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#121212] rounded-lg border border-[#333]">
                    <div>
                      <div className="font-medium text-white">Browser Push Notifications</div>
                      <div className="text-xs text-slate-500">Get notified when audio generation completes.</div>
                    </div>
                    <button 
                      onClick={() => setBrowserNotifs(!browserNotifs)}
                      className={`w-12 h-6 rounded-full relative transition-colors ${browserNotifs ? 'bg-orange-600' : 'bg-[#333]'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${browserNotifs ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6 border-b border-[#272727] pb-4">Region & Language</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Interface Language</label>
                    <select className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-white">
                      <option>English (UK)</option>
                      <option>Afrikaans</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Timezone</label>
                    <select className="w-full bg-[#121212] border border-[#333] rounded-lg px-4 py-2 text-white">
                      <option>(GMT+02:00) Johannesburg</option>
                      <option>(GMT+00:00) London</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
