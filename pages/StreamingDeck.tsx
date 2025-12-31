
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Music, Volume2, Radio, Play, Square, Activity, Bell, AlertTriangle, Info } from 'lucide-react';
import Button from '../components/Button';
import { generateJingle } from '../services/audioUtils';

// Types for the cart buttons
interface CartButton {
  id: string;
  label: string;
  color: string;
  type: 'news' | 'story' | 'upbeat';
  isPlaying: boolean;
}

const StreamingDeck: React.FC = () => {
  // --- CLOCK STATE ---
  const [time, setTime] = useState(new Date());
  
  // --- BROADCAST STATE ---
  const [isOnAir, setIsOnAir] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  
  // --- MIXER STATE ---
  const [volumes, setVolumes] = useState({
    mic: 1.0,
    sfx: 0.8,
    music: 0.6
  });

  // --- AUDIO REFS ---
  // We keep a dedicated audio context for the deck
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // --- CARTS STATE ---
  const [carts, setCarts] = useState<CartButton[]>([
    { id: '1', label: 'News Intro', color: 'bg-blue-600', type: 'news', isPlaying: false },
    { id: '2', label: 'Jingle 1', color: 'bg-green-600', type: 'upbeat', isPlaying: false },
    { id: '3', label: 'Drama Stab', color: 'bg-purple-600', type: 'story', isPlaying: false },
    { id: '4', label: 'Breaking', color: 'bg-red-600', type: 'news', isPlaying: false },
    { id: '5', label: 'Bed', color: 'bg-orange-600', type: 'story', isPlaying: false },
    { id: '6', label: 'Outro', color: 'bg-slate-600', type: 'upbeat', isPlaying: false },
  ]);

  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Init Audio Context on mount
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
        audioCtxRef.current?.close();
    };
  }, []);

  // --- HANDLERS ---

  const handleVolumeChange = (channel: keyof typeof volumes, val: number) => {
    setVolumes(prev => ({ ...prev, [channel]: val }));
  };

  const playCart = async (cartId: string) => {
    const cart = carts.find(c => c.id === cartId);
    if (!cart || !audioCtxRef.current) return;

    // Visual feedback
    setCarts(prev => prev.map(c => c.id === cartId ? { ...c, isPlaying: true } : c));

    try {
        // Generate Jingle Buffer
        const buffer = generateJingle(cart.type, audioCtxRef.current);
        
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        
        const gain = audioCtxRef.current.createGain();
        gain.gain.value = volumes.sfx;
        
        source.connect(gain);
        gain.connect(audioCtxRef.current.destination);
        
        source.start();
        
        source.onended = () => {
            setCarts(prev => prev.map(c => c.id === cartId ? { ...c, isPlaying: false } : c));
        };
    } catch (e) {
        console.error("Audio error", e);
        setCarts(prev => prev.map(c => c.id === cartId ? { ...c, isPlaying: false } : c));
    }
  };

  // --- COMPONENTS ---

  // Vertical Fader Component
  const Fader = ({ label, icon: Icon, value, onChange, active = true }: { label: string, icon: any, value: number, onChange: (v: number) => void, active?: boolean }) => (
    <div className="flex flex-col items-center h-full bg-[#181818] p-4 rounded-xl border border-[#333] relative group">
       <div className={`p-2 rounded-full mb-4 transition-colors ${active ? 'bg-green-500/20 text-green-500' : 'bg-[#222] text-slate-500'}`}>
          <Icon className="w-6 h-6" />
       </div>
       
       <div className="flex-1 w-12 bg-[#121212] rounded-full relative flex justify-center py-2 border border-[#222]">
          {/* Track Fill */}
          <div 
            className={`absolute bottom-2 w-2 rounded-full transition-all ${active ? 'bg-orange-600' : 'bg-slate-700'}`}
            style={{ height: `calc(${value * 85}% + 10px)` }}
          ></div>
          
          {/* Input Range (Rotated) */}
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 h-12 w-48 opacity-0 cursor-pointer z-10"
          />
          
          {/* Thumb Visual */}
          <div 
             className="absolute w-8 h-4 bg-white rounded shadow-lg border border-slate-300 pointer-events-none transition-all"
             style={{ bottom: `${value * 85}%` }}
          ></div>
       </div>

       <div className="mt-4 text-center">
          <div className="font-bold text-white text-sm">{Math.round(value * 100)}%</div>
          <div className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">{label}</div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0f0f0f] overflow-hidden">
        
        {/* Top Header / Clock Bar */}
        <div className="bg-[#121212] border-b border-[#272727] p-4 flex justify-between items-center shadow-lg z-10">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Studio Time</span>
                    <span className="text-3xl font-mono font-bold text-white tracking-tight leading-none">
                        {time.toLocaleTimeString([], { hour12: false })}
                    </span>
                </div>
                <div className="h-8 w-px bg-[#333] mx-2"></div>
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOnAir ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                    <span className={`text-sm font-bold uppercase tracking-wider ${isOnAir ? 'text-red-500' : 'text-slate-500'}`}>
                        {isOnAir ? 'LIVE ON AIR' : 'OFF AIR'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button 
                    onClick={() => setIsOnAir(!isOnAir)}
                    className={`px-8 py-3 font-bold text-lg rounded-full transition-all shadow-lg ${isOnAir ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' : 'bg-[#222] text-slate-400 hover:text-white border border-[#333]'}`}
                >
                    {isOnAir ? 'STOP BROADCAST' : 'GO LIVE'}
                </Button>
            </div>
        </div>

        {/* Main Deck Area */}
        <div className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
            
            {/* Left: Mixer (3 Cols) */}
            <div className="col-span-12 md:col-span-4 lg:col-span-3 flex gap-4 h-full">
                <div className="flex-1 h-full">
                    <Fader 
                        label="MIC 1" 
                        icon={Mic} 
                        value={volumes.mic} 
                        onChange={(v) => handleVolumeChange('mic', v)} 
                        active={isMicActive}
                    />
                    <div className="mt-2">
                        <button 
                            onClick={() => setIsMicActive(!isMicActive)}
                            className={`w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider border transition-colors ${isMicActive ? 'bg-red-900/30 text-red-400 border-red-900' : 'bg-[#181818] text-slate-500 border-[#333]'}`}
                        >
                            {isMicActive ? 'MUTE' : 'UNMUTE'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 h-full">
                    <Fader label="MUSIC" icon={Music} value={volumes.music} onChange={(v) => handleVolumeChange('music', v)} />
                </div>
                <div className="flex-1 h-full">
                    <Fader label="SFX" icon={Volume2} value={volumes.sfx} onChange={(v) => handleVolumeChange('sfx', v)} />
                </div>
            </div>

            {/* Middle: Carts / Soundboard (6 Cols) */}
            <div className="col-span-12 md:col-span-8 lg:col-span-6 bg-[#181818] rounded-xl border border-[#272727] p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-orange-500" /> Soundboard Carts
                    </h3>
                    <span className="text-xs text-slate-500 uppercase font-bold">Bank A</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 flex-1">
                    {carts.map(cart => (
                        <button
                            key={cart.id}
                            onClick={() => playCart(cart.id)}
                            className={`relative rounded-xl flex flex-col items-center justify-center p-4 transition-all active:scale-95 border-b-4 ${cart.color} ${cart.isPlaying ? 'opacity-100 translate-y-1 border-b-0 shadow-inner' : 'opacity-80 hover:opacity-100 border-black/20 shadow-lg'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-xl"></div>
                            <span className="text-white font-bold text-lg shadow-black drop-shadow-md z-10">{cart.label}</span>
                            <span className="text-white/60 text-xs font-medium uppercase mt-1 z-10">{cart.isPlaying ? 'Playing...' : 'Ready'}</span>
                        </button>
                    ))}
                </div>
                
                <div className="mt-6 p-4 bg-[#121212] rounded-lg border border-[#272727] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-slate-400">System Output</span>
                    </div>
                    {/* Fake VU Meter */}
                    <div className="flex gap-1">
                        {[...Array(12)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-1.5 h-6 rounded-sm ${i < 8 ? 'bg-green-500' : i < 10 ? 'bg-yellow-500' : 'bg-red-500'} ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-30'}`}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Playlist / Queue (3 Cols) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
                <div className="bg-[#181818] rounded-xl border border-[#272727] p-4 flex-1 overflow-hidden flex flex-col">
                    <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Live Queue
                    </h3>
                    <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Mock Playlist Items */}
                        <div className="bg-[#222] p-3 rounded-lg border-l-4 border-orange-500">
                            <div className="text-xs text-orange-500 font-bold mb-0.5">NOW PLAYING</div>
                            <div className="text-white font-medium text-sm truncate">Ep 42: Die Oggend Nuus</div>
                            <div className="text-xs text-slate-500">04:20 / 12:00</div>
                        </div>
                        <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#333] opacity-60">
                            <div className="text-xs text-slate-500 font-bold mb-0.5">NEXT</div>
                            <div className="text-slate-300 font-medium text-sm truncate">Ad: Local Motors</div>
                            <div className="text-xs text-slate-500">00:30</div>
                        </div>
                        <div className="bg-[#1f1f1f] p-3 rounded-lg border border-[#333] opacity-60">
                            <div className="text-xs text-slate-500 font-bold mb-0.5">LATER</div>
                            <div className="text-slate-300 font-medium text-sm truncate">Song: Kaptein (Remix)</div>
                            <div className="text-xs text-slate-500">03:45</div>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-yellow-500 text-sm">Producer Note</h4>
                            <p className="text-xs text-yellow-200/70 mt-1 leading-relaxed">
                                Guest "Sarie Marais" is waiting in the green room. Ready to connect on line 2.
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
