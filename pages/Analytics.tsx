import React, { useState } from 'react';
import Button from '../components/Button';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, AlertCircle, Smartphone, Monitor, Globe, Info, Lightbulb, ArrowUpRight } from 'lucide-react';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex items-center ml-1.5">
    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 bg-[#222] text-white text-xs leading-relaxed rounded-lg shadow-xl border border-[#333] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#222]"></div>
    </div>
  </div>
);

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'earnings'>('overview');
  const [isEmbeddedMode, setIsEmbeddedMode] = useState(false);

  // This URL would come from the creator's configuration in a real no-code setup (e.g., Softr URL)
  const embedUrl = "https://example.softr.app/embed/analytics";

  if (isEmbeddedMode) {
    return (
      <div className="h-full flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
            <div className="flex items-center gap-2">
               <span className="text-xs text-slate-400 bg-[#1f1f1f] px-2 py-1 rounded border border-[#333]">No-Code Mode Active</span>
               <Button size="sm" variant="secondary" onClick={() => setIsEmbeddedMode(false)}>View Demo Data</Button>
            </div>
         </div>
         <div className="flex-1 bg-[#181818] border border-[#272727] rounded-xl overflow-hidden shadow-sm relative">
            <div className="absolute inset-0 flex items-center justify-center flex-col p-8 text-center bg-[#121212]">
               <BarChart3 className="w-16 h-16 text-[#333] mb-4" />
               <h3 className="text-lg font-semibold text-slate-300">Connect your Softr Dashboard</h3>
               <p className="text-slate-500 max-w-md mt-2 mb-6">
                  Integrate your Airtable & Softr stack to view live analytics here.
                  This iframe would load: <span className="font-mono text-xs bg-[#222] px-1 rounded text-slate-400">{embedUrl}</span>
               </p>
               <Button onClick={() => setIsEmbeddedMode(false)}>Back to Simulation</Button>
            </div>
         </div>
      </div>
    );
  }

  // --- MOCK DATA FOR VISUALIZATION ---

  const KPIS = [
    { 
      label: 'Total Streams', 
      value: '12,450', 
      change: '+12%', 
      icon: BarChart3, 
      color: 'text-blue-400', 
      bg: 'bg-blue-900/20',
      desc: 'The total number of times your episodes have been played for at least 60 seconds.'
    },
    { 
      label: 'Est. Revenue (ZAR)', 
      value: 'R 4,200', 
      change: '+8%', 
      icon: DollarSign, 
      color: 'text-green-400', 
      bg: 'bg-green-900/20',
      desc: 'Estimated earnings from ads and sponsorships based on your current CPM (Cost Per Mille) rates.' 
    },
    { 
      label: 'Avg. Listen Time', 
      value: '14:20', 
      change: '-2%', 
      icon: TrendingUp, 
      color: 'text-purple-400', 
      bg: 'bg-purple-900/20',
      desc: 'The average duration a listener stays engaged with an episode before dropping off.' 
    },
    { 
      label: 'Unique Listeners', 
      value: '3,840', 
      change: '+15%', 
      icon: Users, 
      color: 'text-orange-400', 
      bg: 'bg-orange-900/20',
      desc: 'The estimated number of individual people (devices) listening to your podcast.'
    },
  ];

  const REVENUE_INSIGHTS = [
    {
      title: 'High Retention Opportunity',
      description: 'Your episodes have an 85% completion rate. You can safely add a mid-roll ad slot without losing listeners.',
      potential: 'Est. +R500/mo',
      color: 'bg-emerald-900/20 border-emerald-800 text-emerald-400'
    },
    {
      title: 'Sponsorship Target: B2B',
      description: '18% of your listeners are on Desktop. This is high for podcasts and valuable for business software sponsors.',
      potential: 'High Value',
      color: 'bg-blue-900/20 border-blue-800 text-blue-400'
    }
  ];

  const PLATFORMS = [
    { name: 'Spotify', percent: 65, color: 'bg-green-500' },
    { name: 'Apple Podcasts', percent: 25, color: 'bg-purple-500' },
    { name: 'Web / RSS', percent: 10, color: 'bg-orange-500' },
  ];

  const TRANSACTIONS = [
    { id: 'TX102', date: '2023-10-15', source: 'Spotify Ad Revenue', amount: 'R 1,250.00', status: 'Paid' },
    { id: 'TX103', date: '2023-10-22', source: 'Sponsorship (Local Motors)', amount: 'R 2,500.00', status: 'Pending' },
    { id: 'TX104', date: '2023-10-28', source: 'Listener Support', amount: 'R 450.00', status: 'Paid' },
  ];

  const DAILY_STREAMS = [450, 520, 480, 600, 750, 810, 690]; // Last 7 days

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-white">Performance & Earnings</h1>
           <p className="text-slate-400">Track your podcast's growth and monetization.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex bg-[#181818] rounded-lg border border-[#333] p-1">
              <button 
                onClick={() => setTimeRange('7d')} 
                className={`px-3 py-1 text-xs font-medium rounded ${timeRange === '7d' ? 'bg-[#333] text-white' : 'text-slate-500'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeRange('30d')} 
                className={`px-3 py-1 text-xs font-medium rounded ${timeRange === '30d' ? 'bg-[#333] text-white' : 'text-slate-500'}`}
              >
                30 Days
              </button>
              <button 
                onClick={() => setTimeRange('all')} 
                className={`px-3 py-1 text-xs font-medium rounded ${timeRange === 'all' ? 'bg-[#333] text-white' : 'text-slate-500'}`}
              >
                All Time
              </button>
           </div>
           <Button variant="secondary" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export CSV
           </Button>
           <Button variant="ghost" size="sm" onClick={() => setIsEmbeddedMode(true)} className="text-slate-400">
              Configure Connect
           </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         {KPIS.map((kpi, idx) => (
            <div key={idx} className="bg-[#181818] p-5 rounded-xl border border-[#272727] shadow-sm relative group/card">
               <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-lg ${kpi.bg}`}>
                     <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.change.startsWith('+') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                     {kpi.change}
                  </span>
               </div>
               <div className="space-y-1">
                  <p className="text-slate-400 text-sm font-medium flex items-center">
                    {kpi.label}
                    <Tooltip text={kpi.desc} />
                  </p>
                  <p className="text-2xl font-bold text-white">{kpi.value}</p>
               </div>
            </div>
         ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-[#272727]">
         <div className="flex gap-6">
            <button 
               onClick={() => setActiveTab('overview')}
               className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'overview' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
               Overview
            </button>
            <button 
               onClick={() => setActiveTab('audience')}
               className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'audience' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
               Audience Insights
            </button>
            <button 
               onClick={() => setActiveTab('earnings')}
               className={`pb-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'earnings' ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
               Revenue & Payouts
            </button>
         </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* Main Chart Area (Spans 2 cols) */}
         <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
               <div className="bg-[#181818] p-6 rounded-xl border border-[#272727] shadow-sm">
                  <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                     Growth Trend
                     <Tooltip text="Daily listeners across all platforms over the selected period." />
                  </h3>
                  <div className="h-64 flex items-end justify-between gap-2">
                     {DAILY_STREAMS.map((val, i) => (
                        <div key={i} className="w-full bg-[#222] rounded-t-md relative group hover:bg-[#2a2a2a] transition-colors">
                           <div 
                              className="absolute bottom-0 left-0 right-0 bg-orange-600 rounded-t-md opacity-80 group-hover:opacity-100 transition-all"
                              style={{ height: `${(val / 1000) * 100}%` }}
                           ></div>
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#333] text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-[#444]">
                              {val}
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-between mt-4 text-xs text-slate-500">
                     <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
               </div>
            )}

            {activeTab === 'audience' && (
               <div className="bg-[#181818] p-6 rounded-xl border border-[#272727] shadow-sm">
                  <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
                     <Globe className="w-5 h-5 text-slate-500" /> Geographic Distribution
                     <Tooltip text="Where your listeners are located based on their IP address." />
                  </h3>
                  <div className="bg-[#121212] rounded-lg h-64 flex items-center justify-center border border-[#222] relative overflow-hidden">
                     {/* Placeholder for map */}
                     <div className="absolute inset-0 opacity-10 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-cover bg-center invert"></div>
                     <div className="z-10 grid grid-cols-2 gap-8 text-center">
                        <div>
                           <div className="text-2xl font-bold text-white">78%</div>
                           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">South Africa</div>
                        </div>
                        <div>
                           <div className="text-2xl font-bold text-white">12%</div>
                           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Namibia</div>
                        </div>
                        <div>
                           <div className="text-2xl font-bold text-white">5%</div>
                           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">UK</div>
                        </div>
                        <div>
                           <div className="text-2xl font-bold text-white">5%</div>
                           <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Australia</div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'earnings' && (
               <div className="bg-[#181818] rounded-xl border border-[#272727] shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-[#272727] flex justify-between items-center">
                     <h3 className="font-semibold text-white flex items-center gap-2">
                       Transaction History
                       <Tooltip text="A log of all payouts and pending earnings from various monetization sources." />
                     </h3>
                     <Button size="sm" variant="secondary">Request Payout</Button>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                        <thead className="bg-[#1f1f1f] text-slate-400 font-medium">
                           <tr>
                              <th className="px-6 py-3">Date</th>
                              <th className="px-6 py-3">Source</th>
                              <th className="px-6 py-3 text-right">Amount</th>
                              <th className="px-6 py-3">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[#272727]">
                           {TRANSACTIONS.map(tx => (
                              <tr key={tx.id} className="hover:bg-[#1f1f1f]">
                                 <td className="px-6 py-4 text-slate-400">{tx.date}</td>
                                 <td className="px-6 py-4 text-white font-medium">{tx.source}</td>
                                 <td className="px-6 py-4 text-right text-white">{tx.amount}</td>
                                 <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tx.status === 'Paid' ? 'bg-green-900/20 text-green-400' : 'bg-amber-900/20 text-amber-400'}`}>
                                       {tx.status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            )}
         </div>

         {/* Sidebar Stats (1 col) */}
         <div className="space-y-6">
            
            {/* Revenue Insights Section */}
            <div className="bg-gradient-to-b from-[#181818] to-orange-900/10 p-6 rounded-xl border border-[#272727] shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Lightbulb className="w-16 h-16 text-orange-600" />
               </div>
               <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-orange-600" /> Revenue Insights
               </h3>
               <div className="space-y-4 relative z-10">
                  {REVENUE_INSIGHTS.map((insight, idx) => (
                     <div key={idx} className={`p-3 rounded-lg border ${insight.color} text-sm`}>
                        <div className="flex justify-between items-start mb-1">
                           <span className="font-bold">{insight.title}</span>
                           <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <p className="mb-2 opacity-90">{insight.description}</p>
                        <div className="inline-block bg-white/10 px-2 py-0.5 rounded text-xs font-semibold">
                           Potential: {insight.potential}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#181818] p-6 rounded-xl border border-[#272727] shadow-sm">
               <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                 Platform Breakdown
                 <Tooltip text="Percentage of total listening time by platform." />
               </h3>
               <div className="space-y-4">
                  {PLATFORMS.map(p => (
                     <div key={p.name}>
                        <div className="flex justify-between text-sm mb-1">
                           <span className="text-slate-400">{p.name}</span>
                           <span className="font-medium text-white">{p.percent}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                           <div className={`h-full ${p.color}`} style={{ width: `${p.percent}%` }}></div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#181818] p-6 rounded-xl border border-[#272727] shadow-sm">
               <h3 className="font-semibold text-white mb-4">Device Usage</h3>
               <div className="flex items-center justify-around py-4">
                  <div className="text-center">
                     <div className="w-12 h-12 bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Smartphone className="w-6 h-6" />
                     </div>
                     <span className="text-2xl font-bold text-white block">82%</span>
                     <span className="text-xs text-slate-500">Mobile</span>
                  </div>
                  <div className="h-12 w-px bg-[#333]"></div>
                  <div className="text-center">
                     <div className="w-12 h-12 bg-[#222] text-slate-400 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Monitor className="w-6 h-6" />
                     </div>
                     <span className="text-2xl font-bold text-white block">18%</span>
                     <span className="text-xs text-slate-500">Desktop</span>
                  </div>
               </div>
            </div>
            
            <div className="bg-[#121212] text-slate-400 p-5 rounded-xl text-sm border border-[#272727]">
               <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Data Sources
               </h4>
               <p className="mb-3 opacity-80">
                  Data is aggregated from Spotify for Podcasters, Apple Connect, and RSS logs via Airtable.
               </p>
               <div className="text-xs bg-[#181818] p-2 rounded border border-[#333]">
                  Last updated: 45 mins ago
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default Analytics;