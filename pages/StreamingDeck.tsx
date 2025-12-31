
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Music, Volume2, Radio, Play, Square, Activity, Bell, AlertTriangle, Wifi, Cpu, Layers, MessageSquare, Clock, Settings, Maximize2 } from 'lucide-react';
import Button from '../components/Button';
import { generateJingle } from '../services/audioUtils';

// Types for the cart buttons
interface CartButton {
  id: string;
  label: string;
  color: string;
  type: 'news' | 'story' | 'upbeat';
  isPlaying: boolean;
  duration?: number; // mock duration in seconds
}

const StreamingDeck: React.FC = () => {
  // --- CLOCK & TIMERS ---
  const [time, setTime] = useState(new Date());
  const [broadcastDuration, setBroadcastDuration] = useState(0);
  
  // --- BROADCAST STATE ---
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(true); 
  
  // --- MIXER STATE ---
  const [volumes, setVolumes] = useState({
    mic: 0.85,
    sfx: 0.60,
    music: 0.40
  });

  // --- AUDIO REFS ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  
  // --- CARTS STATE ---
  const [carts, setCarts] = useState<CartButton[]>([
    { id: '1', label: 'News Intro', color: 'from-blue-600 to-blue-800', type: 'news', isPlaying: false, duration: 8 },
    { id: '2', label: 'Stinger', color: 'from-emerald-600 to-emerald-800', type: 'upbeat', isPlaying: false, duration: 3 },
    { id: '3', label: 'Drama Bed', color: 'from-purple-600 to-purple-800', type: 'story', isPlaying: false, duration: 15 },
    { id: '4', label: 'Breaking', color: 'from-red-600 to-red-800', type: 'news', isPlaying: false, duration: 5 },
    { id: '5', label: 'Laugh Track', color: 'from-yellow-600 to-yellow-800', type: 'upbeat', isPlaying: false, duration: 4 },
    { id: '6', label: 'Outro', color: 'from-slate-600 to-slate-800', type: 'upbeat', isPlaying: false, duration: 10 },
  ]);

  // --- EFFECTS ---
  useEffect(() => {
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Broadcast Timer Logic
  useEffect(() => {
    if (isOnAir) {
      timerRef.current = window.setInterval(() => {
        setBroadcastDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setBroadcastDuration(0);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOnAir]);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => { audioCtxRef.current?.close(); };
  }, []);

  // --- HANDLERS ---

  const handleVolumeChange = (channel: keyof typeof volumes, val: number) => {
    setVolumes(prev => ({ ...prev, [channel]: val }));
  };

  const playCart = async (cartId: string) => {
    const cart = carts.find(c => c.id === cartId);
    if (!cart || !audioCtxRef.current) return;

    setCarts(prev => prev.map(c => c.id === cartId ? { ...c, isPlaying: true } : c));

    try {
        const buffer = generateJingle(cart.type, audioCtxRef.current);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        const gain = audioCtxRef.current.createGain();
        gain.gain.value = volumes.sfx;
        source.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        source.start();
        
        // Auto-reset based on mock duration
        setTimeout(() => {
             setCarts(prev => prev.map(c => c.id === cartId ? { ...c, isPlaying: false } : c));
        }, cart.duration! * 1000);

    } catch (e) {
        console.error("Audio error", e);
        setCarts(prev => prev.map(c => c.id === cartId ? { ...c, isPlaying: false } : c));
    }
  };

  const formatDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- SUB-COMPONENTS ---

  const VUMeter = ({ level, active }: { level: number, active: boolean }) => {
    // Simulated fluctuating level based on static volume + random noise if active
    const [displayLevel, setDisplayLevel] = useState(0);
    
    useEffect(() => {
        if (!active) {
            setDisplayLevel(0);
            return;
        }
        const interval = setInterval(() => {
            // Random fluctuation around the volume setting
            const noise = (Math.random() * 0.2) - 0.1;
            const val = Math.max(0, Math.min(1, level + noise));
            setDisplayLevel(val);
        }, 100);
        return () => clearInterval(interval);
    }, [level, active]);

    return (
        <div className="flex flex-col gap-0.5 h-32 w-2 bg-black/50 rounded-full overflow-hidden p-[1px]">
            {[...Array(16)].map((_, i) => {
                const threshold = (15 - i) / 16;
                const isLit = displayLevel >= threshold;
                let color = 'bg-green-500';
                if (i < 3) color = 'bg-red-500';
                else if (i < 6) color = 'bg-yellow-500';
                
                return (
                    <div 
                        key={i} 
                        className={`flex-1 w-full rounded-[1px] transition-opacity duration-75 ${isLit ? color : 'bg-[#222]'} ${isLit ? 'opacity-100 shadow-[0_0_4px_rgba(255,255,255,0.5)]' : 'opacity-20'}`}
                    ></div>
                );
            })}
        </div>
    );
  };

  const SmartFader = ({ label, icon: Icon, value, onChange, active, onToggle }: { label: string, icon: any, value: number, onChange: (v: number) => void, active: boolean, onToggle?: () => void }) => (
    <div className="flex flex-col items-center h-full bg-[#131315] border border-[#27272a] rounded-2xl p-3 shadow-xl relative group">
       
       {/* Channel Header */}
       <div className="mb-4 w-full flex flex-col items-center gap-2">
          <button 
            onClick={onToggle}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-[#222] text-red-500 border border-red-900/30'}`}
          >
             <Icon className="w-4 h-4" />
          </button>
          <span className={`text-[10px] font-mono font-bold tracking-widest ${active ? 'text-green-500' : 'text-slate-600'}`}>
             {active ? 'ON' : 'MUTE'}
          </span>
       </div>
       
       {/* Fader Track Area */}
       <div className="flex-1 flex gap-3 w-full justify-center px-2">
          {/* Audio Meter */}
          <VUMeter level={value} active={active} />

          {/* Fader Rail */}
          <div className="relative w-12 bg-[#09090b] rounded-full border border-[#27272a]">
              {/* Center Line */}
              <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-[1px] bg-[#333]"></div>
              
              {/* dB marks */}
              <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[8px] text-slate-600 font-mono py-2 pr-1 select-none pointer-events-none">
                  <span>+10</span>
                  <span>0</span>
                  <span>-10</span>
                  <span>-∞</span>
              </div>

              {/* The Input */}
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ns-resize z-20 appearance-none"
                style={{ WebkitAppearance: 'slider-vertical' as any }} // Type casting for specific vendor property
              />
              
              {/* The Physical Fader Cap (Visual) */}
              <div 
                 className="absolute left-1/2 -translate-x-1/2 w-8 h-12 bg-gradient-to-b from-[#3f3f46] to-[#18181b] rounded-md shadow-2xl border-t border-white/20 pointer-events-none transition-all z-10 flex items-center justify-center"
                 style={{ bottom: `calc(${value * 80}% + 5px)` }} // Adjusted calculation
              >
                  <div className="w-full h-[2px] bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
              </div>
          </div>
       </div>

       {/* Label footer */}
       <div className="mt-3 text-center w-full bg-[#09090b] py-1 rounded border border-[#27272a]">
          <div className="font-mono font-bold text-white text-xs">{Math.round(value * 100)}%</div>
          <div className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{label}</div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#050505] overflow-hidden font-sans text-slate-200">
        
        {/* --- 1. THE BRIDGE (Top Bar) --- */}
        <div className="h-20 bg-[#09090b]/80 backdrop-blur-md border-b border-[#27272a] px-6 flex justify-between items-center z-50">
            {/* System Status */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 group">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                        <Wifi className="w-4 h-4 text-green-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-500 font-bold">Network</span>
                        <span className="text-xs font-mono text-green-400">EXCELLENT</span>
                    </div>
                </div>
                <div className="h-8 w-px bg-[#27272a]"></div>
                <div className="flex items-center gap-2 group">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 group-hover:border-slate-700 transition-colors">
                        <Cpu className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-500 font-bold">CPU Load</span>
                        <span className="text-xs font-mono text-blue-400">12%</span>
                    </div>
                </div>
            </div>

            {/* Central Clock & Status */}
            <div className="flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                <div className="text-right hidden xl:block">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Local Time</div>
                    <div className="text-3xl font-mono font-bold text-white leading-none tracking-tight">
                        {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                        <span className="text-sm text-slate-600 ml-1 align-top">{time.getSeconds().toString().padStart(2,'0')}</span>
                    </div>
                </div>

                <button 
                    onClick={() => setIsOnAir(!isOnAir)}
                    className={`relative w-48 h-14 rounded-full flex items-center justify-center gap-3 transition-all duration-500 border-4 shadow-2xl overflow-hidden group ${isOnAir ? 'bg-red-600 border-red-800 shadow-[0_0_50px_rgba(220,38,38,0.4)]' : 'bg-[#18181b] border-[#27272a] hover:border-slate-600'}`}
                >
                    {isOnAir && (
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)] animate-pulse"></div>
                    )}
                    <div className={`w-3 h-3 rounded-full ${isOnAir ? 'bg-white animate-ping' : 'bg-slate-600'}`}></div>
                    <span className={`text-xl font-bold tracking-widest uppercase ${isOnAir ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                        {isOnAir ? 'ON AIR' : 'GO LIVE'}
                    </span>
                </button>

                <div className="text-left hidden xl:block">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">Duration</div>
                    <div className={`text-3xl font-mono font-bold leading-none tracking-tight ${isOnAir ? 'text-red-500' : 'text-slate-600'}`}>
                        {formatDuration(broadcastDuration)}
                    </div>
                </div>
            </div>

            {/* Profile / Settings */}
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="sm" className="text-slate-400 border border-[#27272a] bg-[#09090b]"><Settings className="w-4 h-4"/></Button>
               <Button variant="ghost" size="sm" className="text-slate-400 border border-[#27272a] bg-[#09090b]"><Maximize2 className="w-4 h-4"/></Button>
            </div>
        </div>

        {/* --- 2. THE WORKSTATION (Main Content) --- */}
        <div className="flex-1 p-6 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
            
            {/* LEFT: MIXER (3 Cols) */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col gap-4 bg-[#09090b] rounded-3xl border border-[#27272a] p-5 shadow-2xl min-h-0">
                <div className="flex items-center justify-between mb-2 px-1">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                        <Settings className="w-3 h-3" /> Audio Mixer
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    </div>
                </div>
                <div className="flex-1 flex gap-4 min-h-0">
                    <div className="flex-1 h-full">
                        <SmartFader 
                            label="HOST MIC" 
                            icon={Mic} 
                            value={volumes.mic} 
                            onChange={(v) => handleVolumeChange('mic', v)} 
                            active={isMicActive}
                            onToggle={() => setIsMicActive(!isMicActive)}
                        />
                    </div>
                    <div className="flex-1 h-full">
                        <SmartFader 
                            label="MUSIC" 
                            icon={Music} 
                            value={volumes.music} 
                            onChange={(v) => handleVolumeChange('music', v)} 
                            active={true}
                        />
                    </div>
                    <div className="flex-1 h-full">
                        <SmartFader 
                            label="SFX" 
                            icon={Volume2} 
                            value={volumes.sfx} 
                            onChange={(v) => handleVolumeChange('sfx', v)} 
                            active={true}
                        />
                    </div>
                </div>
            </div>

            {/* MIDDLE: VISUALIZER & CARTS (6 Cols) */}
            <div className="col-span-12 md:col-span-8 lg:col-span-6 flex flex-col gap-6 min-h-0">
                
                {/* Waveform Visualizer */}
                <div className="h-32 bg-[#09090b] rounded-3xl border border-[#27272a] relative overflow-hidden flex items-center justify-center shadow-lg">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#09090b] to-[#09090b]"></div>
                    {/* Simulated Bars */}
                    <div className="flex items-end justify-center gap-1 h-16 w-full px-8 z-10 opacity-80">
                        {[...Array(40)].map((_, i) => (
                            <div 
                                key={i} 
                                className="w-1.5 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-sm transition-all duration-75"
                                style={{ 
                                    height: `${Math.max(10, Math.random() * (isOnAir ? 100 : 20))}%`,
                                    opacity: isOnAir ? 1 : 0.3 
                                }}
                            ></div>
                        ))}
                    </div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Activity className={`w-4 h-4 ${isOnAir ? 'text-blue-400' : 'text-slate-600'}`} />
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Master Output</span>
                    </div>
                </div>

                {/* Cart Wall */}
                <div className="flex-1 bg-[#09090b] rounded-3xl border border-[#27272a] p-6 shadow-2xl flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Smart Carts
                        </h3>
                        <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded bg-blue-900/20 text-blue-400 text-[10px] font-bold border border-blue-900/30">BANK A</span>
                            <span className="px-2 py-0.5 rounded bg-[#18181b] text-slate-500 text-[10px] font-bold border border-[#27272a]">BANK B</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
                        {carts.map(cart => (
                            <button
                                key={cart.id}
                                onClick={() => playCart(cart.id)}
                                className={`relative group rounded-xl overflow-hidden transition-all duration-100 active:scale-95 border-2 ${cart.isPlaying ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'border-transparent shadow-md'}`}
                            >
                                {/* Background Gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${cart.color} opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                                
                                {/* Progress Overlay */}
                                {cart.isPlaying && (
                                    <div 
                                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${cart.color} z-20 transition-all duration-1000 ease-linear`}
                                        style={{ width: '100%', transitionDuration: `${cart.duration}s` }}
                                    ></div>
                                )}

                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-2">
                                    <span className="text-2xl mb-1">{cart.type === 'news' ? '📰' : cart.type === 'upbeat' ? '🎵' : '🎭'}</span>
                                    <span className="font-bold text-white text-sm tracking-wide shadow-black drop-shadow-md">{cart.label}</span>
                                    <span className="text-[10px] font-mono text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">{cart.duration}s</span>
                                </div>
                                
                                {/* Gloss effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: DIRECTOR & COMMS (3 Cols) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 min-h-0">
                
                {/* Live Queue / Rundown */}
                <div className="flex-1 bg-[#09090b] rounded-3xl border border-[#27272a] p-5 shadow-2xl flex flex-col min-h-0 overflow-hidden">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Radio className="w-3 h-3" /> Run of Show
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto pr-1 space-y-0 relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[19px] top-2 bottom-0 w-0.5 bg-[#27272a]"></div>

                        {/* Items */}
                        <div className="relative pl-8 pb-6 group">
                            <div className="absolute left-[13px] top-1 w-3.5 h-3.5 bg-orange-600 rounded-full border-2 border-[#09090b] shadow-[0_0_10px_rgba(234,88,12,0.5)] z-10 animate-pulse"></div>
                            <div className="bg-[#18181b] p-3 rounded-xl border-l-2 border-orange-500 shadow-lg">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-orange-500 uppercase">On Air</span>
                                    <span className="text-[10px] font-mono text-slate-500">12:00</span>
                                </div>
                                <div className="text-sm font-bold text-white leading-tight">Intro Segment: Die Oggend Nuus</div>
                                <div className="mt-2 w-full bg-[#27272a] h-1 rounded-full overflow-hidden">
                                    <div className="bg-orange-500 h-full w-[45%]"></div>
                                </div>
                            </div>
                        </div>

                        <div className="relative pl-8 pb-6 opacity-60">
                            <div className="absolute left-[13px] top-1 w-3.5 h-3.5 bg-[#27272a] rounded-full border-2 border-[#09090b] z-10"></div>
                            <div className="bg-[#131315] p-3 rounded-xl border border-[#27272a]">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Next</span>
                                    <span className="text-[10px] font-mono text-slate-600">12:05</span>
                                </div>
                                <div className="text-sm font-medium text-slate-300">AD: Local Motors</div>
                            </div>
                        </div>

                        <div className="relative pl-8 pb-6 opacity-40">
                            <div className="absolute left-[13px] top-1 w-3.5 h-3.5 bg-[#27272a] rounded-full border-2 border-[#09090b] z-10"></div>
                            <div className="bg-[#131315] p-3 rounded-xl border border-[#27272a]">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Later</span>
                                    <span className="text-[10px] font-mono text-slate-600">12:07</span>
                                </div>
                                <div className="text-sm font-medium text-slate-300">Guest Interview: Sarie Marais</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comms */}
                <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-3xl p-5 shadow-lg">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                            <h4 className="font-bold text-yellow-500 text-xs uppercase tracking-wider mb-1">Producer Comms</h4>
                            <p className="text-xs text-yellow-100/80 leading-relaxed">
                                Guest "Sarie Marais" is on standby (Line 2). Mic check complete. Ready to patch in after the ad break.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>
  );
};

export default StreamingDeck;
