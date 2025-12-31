
import React, { useState } from 'react';
import { Users, HardDrive, DollarSign, Activity, Search, ShieldAlert, UserX, UserCheck, MoreVertical, ToggleLeft, ToggleRight, Trash2, ExternalLink } from 'lucide-react';
import Button from '../components/Button';

interface UserRow {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  status: 'active' | 'banned';
  lastActive: string;
  usage: string;
}

const MOCK_USERS: UserRow[] = [
  { id: '1', name: 'Jan De Vries', email: 'jan@example.com', plan: 'pro', status: 'active', lastActive: '2 mins ago', usage: '4.2 hrs' },
  { id: '2', name: 'Sarie Marais', email: 'sarie@test.co.za', plan: 'free', status: 'active', lastActive: '1 day ago', usage: '0.5 hrs' },
  { id: '3', name: 'Piet Pompies', email: 'piet@spam.com', plan: 'free', status: 'banned', lastActive: '30 days ago', usage: '0 hrs' },
  { id: '4', name: 'Thabo Mbeki', email: 'thabo@news.za', plan: 'pro', status: 'active', lastActive: '5 hours ago', usage: '12 hrs' },
  { id: '5', name: 'Admin User', email: 'admin@stemgolf.app', plan: 'pro', status: 'active', lastActive: 'Just now', usage: 'N/A' },
];

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'settings'>('overview');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
    <div className="bg-[#181818] p-5 rounded-xl border border-[#272727] flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center pb-6 border-b border-[#272727]">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Admin Console
          </h1>
          <p className="text-slate-400 mt-1">System wide controls and user management.</p>
        </div>
        <div className="flex gap-2">
           <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${maintenanceMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-green-900/30 text-green-400 border border-green-800'}`}>
              <div className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              System {maintenanceMode ? 'Maintenance' : 'Operational'}
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#121212] p-1 rounded-lg w-fit border border-[#272727]">
        {(['overview', 'users', 'content', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-all ${activeTab === tab ? 'bg-[#222] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value="1,245" color="text-blue-500 bg-blue-500" />
              <StatCard icon={HardDrive} label="Storage Used" value="452 GB" color="text-orange-500 bg-orange-500" />
              <StatCard icon={DollarSign} label="MRR (Est)" value="$12.4k" color="text-green-500 bg-green-500" />
              <StatCard icon={Activity} label="Active Jobs" value="8" color="text-purple-500 bg-purple-500" />
            </div>

            <div className="bg-[#181818] p-6 rounded-xl border border-[#272727]">
                <h3 className="text-lg font-bold text-white mb-4">System Health</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Database Latency</span>
                        <span className="text-green-400 font-mono">12ms</span>
                    </div>
                    <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden"><div className="bg-green-500 h-full w-[20%]"></div></div>
                    
                    <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-slate-400">Audio Processing Queue</span>
                        <span className="text-yellow-400 font-mono">8 Jobs Pending</span>
                    </div>
                    <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full w-[40%]"></div></div>

                    <div className="flex items-center justify-between text-sm pt-2">
                        <span className="text-slate-400">Storage Capacity (S3)</span>
                        <span className="text-slate-200 font-mono">45%</span>
                    </div>
                    <div className="w-full bg-[#222] h-1.5 rounded-full overflow-hidden"><div className="bg-blue-500 h-full w-[45%]"></div></div>
                </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-[#181818] border border-[#272727] rounded-xl overflow-hidden animate-in fade-in">
             <div className="p-4 border-b border-[#272727] flex justify-between items-center bg-[#1f1f1f]">
                <h3 className="font-bold text-white">Registered Users</h3>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-[#121212] border border-[#333] rounded-full py-1.5 pl-9 pr-3 text-sm text-white focus:border-orange-500"
                    />
                </div>
             </div>
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-[#181818] border-b border-[#272727]">
                    <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Plan</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Last Active</th>
                        <th className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#272727]">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-[#222]">
                            <td className="px-6 py-4">
                                <div className="font-medium text-white">{user.name}</div>
                                <div className="text-slate-500 text-xs">{user.email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${user.plan === 'pro' ? 'bg-yellow-900/20 text-yellow-500 border border-yellow-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                    {user.plan}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                    {user.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-mono text-xs">{user.lastActive}</td>
                            <td className="px-6 py-4 flex gap-2">
                                <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white" title="View Details">
                                    <ExternalLink className="w-4 h-4" />
                                </button>
                                {user.status === 'active' ? (
                                    <button className="p-1.5 hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500" title="Ban User">
                                        <UserX className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button className="p-1.5 hover:bg-green-900/20 rounded text-slate-400 hover:text-green-500" title="Unban User">
                                        <UserCheck className="w-4 h-4" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'content' && (
            <div className="bg-[#181818] border border-[#272727] rounded-xl p-8 text-center animate-in fade-in">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white">Content Moderation</h3>
                <p className="text-slate-400 mb-6">Review flagged content and podcasts.</p>
                <div className="bg-[#222] p-4 rounded-lg inline-block text-slate-500 text-sm border border-[#333]">
                    No content flagged for review.
                </div>
            </div>
        )}

        {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl animate-in fade-in">
                <div className="bg-[#181818] border border-[#272727] rounded-xl p-6">
                    <h3 className="font-bold text-white mb-4">Global Configuration</h3>
                    <div className="flex items-center justify-between py-4 border-b border-[#272727]">
                        <div>
                            <div className="font-medium text-slate-200">Maintenance Mode</div>
                            <div className="text-xs text-slate-500">Disables login and creation for non-admins.</div>
                        </div>
                        <button 
                            onClick={() => setMaintenanceMode(!maintenanceMode)}
                            className={`text-2xl transition-colors ${maintenanceMode ? 'text-red-500' : 'text-slate-600'}`}
                        >
                            {maintenanceMode ? <ToggleRight className="w-10 h-10 fill-current opacity-20" /> : <ToggleLeft className="w-10 h-10" />}
                        </button>
                    </div>
                    <div className="flex items-center justify-between py-4">
                        <div>
                            <div className="font-medium text-slate-200">Allow New Registrations</div>
                            <div className="text-xs text-slate-500">Public sign-up availability.</div>
                        </div>
                        <button className="text-2xl text-green-500">
                            <ToggleRight className="w-10 h-10 fill-current opacity-20" />
                        </button>
                    </div>
                </div>

                <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6">
                    <h3 className="font-bold text-red-400 mb-4">Danger Zone</h3>
                    <Button variant="danger" onClick={() => alert("This would clear the cache.")}>
                        <Trash2 className="w-4 h-4 mr-2" /> Clear System Cache
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
