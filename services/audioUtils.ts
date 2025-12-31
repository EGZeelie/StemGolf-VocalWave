
import { EqualizerSettings } from "../types";

// Utility to convert raw PCM data to a WAV Blob for playback/download
export const pcmToWav = (
  pcmData: Float32Array | Uint8Array,
  sampleRate: number = 24000,
  numChannels: number = 1
): Blob => {
  return audioBufferToWav(pcmData as unknown as AudioBuffer); 
};

export const decodeBase64Audio = async (base64String: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  // Sanitize input to remove any whitespace that causes atob to fail
  const sanitizedString = base64String.replace(/\s/g, '');
  const binaryString = atob(sanitizedString);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const int16Data = new Int16Array(bytes.buffer);
  const float32Data = new Float32Array(int16Data.length);
  
  for (let i = 0; i < int16Data.length; i++) {
    float32Data[i] = int16Data[i] / 32768.0;
  }

  const buffer = audioContext.createBuffer(1, float32Data.length, 24000); // 24kHz is standard for Gemini Flash TTS
  buffer.getChannelData(0).set(float32Data);
  return buffer;
};

export const audioBufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferOut = new ArrayBuffer(length);
  const view = new DataView(bufferOut);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i));

  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos])); 
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; 
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([bufferOut], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
};

// --- AUDIO MIXING & GENERATION ---

const loadAudio = async (url: string): Promise<AudioBuffer> => {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
};

// Procedural Impulse Response for Reverb (Simulates a room)
const generateImpulseResponse = (ctx: BaseAudioContext, duration: number, decay: number) => {
  const length = ctx.sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    // Exponential decay noise
    const n = i / length;
    const val = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    left[i] = val;
    right[i] = val;
  }
  return impulse;
};

// Generates a simple synthesized jingle so we don't rely on external assets
export const generateJingle = (type: 'news' | 'story' | 'upbeat', ctx: BaseAudioContext): AudioBuffer => {
  const duration = 8; // Increased duration for better transitions (was 4)
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Simple additive synthesis
  for (let i = 0; i < buffer.length; i++) {
    const t = i / ctx.sampleRate;
    let val = 0;
    
    if (type === 'news') {
      // Fast, rhythmic pulses, news ticker style
      val = Math.sin(t * 440 * 2 * Math.PI) * Math.exp(-4 * (t % 0.5)); 
      val += Math.sin(t * 880 * 2 * Math.PI) * Math.exp(-8 * (t % 0.25)) * 0.3;
      // Add a bass pulse
      val += Math.sin(t * 110 * 2 * Math.PI) * 0.4;
    } else if (type === 'story') {
      // Slow, sweeping pad, atmospheric
      val = Math.sin(t * 220 * 2 * Math.PI) * 0.5;
      val += Math.sin(t * 330 * 2 * Math.PI + t) * 0.3; // Slight detune
      // Add some slow modulation
      val *= (0.8 + 0.2 * Math.sin(t * 0.5 * 2 * Math.PI)); 
    } else {
      // Upbeat arpeggio, funky
      const beat = t * 4; // 120 BPM approx
      const note = Math.floor(beat) % 4; // Change note every beat
      const subBeat = Math.floor(t * 16) % 4;
      const freq = 440 * [1, 1.25, 1.5, 2][note]; // Major chord
      val = Math.sin(i / ctx.sampleRate * freq * 2 * Math.PI) * 0.3;
      if (subBeat === 0) val += 0.2; // Kick drum simulation
    }
    
    left[i] = val;
    right[i] = val;
  }
  return buffer;
};

export const mixPodcastAudio = async (
  voiceBuffer: AudioBuffer,
  introType: 'news' | 'story' | 'upbeat' | 'none' | 'custom',
  outroType: 'news' | 'story' | 'upbeat' | 'none' | 'custom',
  customIntroUrl: string | undefined,
  customOutroUrl: string | undefined,
  speed: number = 1.0,
  introVolume: number = 0.5,
  outroVolume: number = 0.5,
  voiceVolume: number = 1.0,
  // New Params
  backgroundUrl: string | undefined = undefined,
  backgroundVolume: number = 0.1,
  eqSettings: EqualizerSettings = { low: 0, mid: 0, high: 0 },
  useCompression: boolean = false,
  reverbType: 'none' | 'studio' | 'room' | 'hall' = 'none'
): Promise<AudioBuffer> => {
  const sampleRate = 24000;
  
  // 1. Prepare buffers
  let intro: AudioBuffer | null = null;
  let outro: AudioBuffer | null = null;
  let background: AudioBuffer | null = null;

  // Use a temporary context to generate/decode jingles if needed
  const tempCtx = new OfflineAudioContext(1, 1, sampleRate);

  try {
    const promises = [];
    if (introType === 'custom' && customIntroUrl) {
        promises.push(loadAudio(customIntroUrl).then(b => intro = b));
    } else if (introType !== 'none' && introType !== 'custom') {
        intro = generateJingle(introType as 'news'|'story'|'upbeat', tempCtx);
    }

    if (outroType === 'custom' && customOutroUrl) {
        promises.push(loadAudio(customOutroUrl).then(b => outro = b));
    } else if (outroType !== 'none' && outroType !== 'custom') {
        outro = generateJingle(outroType as 'news'|'story'|'upbeat', tempCtx);
    }

    if (backgroundUrl) {
        promises.push(loadAudio(backgroundUrl).then(b => background = b));
    }

    await Promise.all(promises);

  } catch (err) {
      console.warn("Error loading custom audio", err);
  }

  // 2. Calculate Timelines
  const introDuration = intro ? intro.duration : 0;
  const voiceRealDuration = voiceBuffer.duration / speed;
  const outroDuration = outro ? outro.duration : 0;

  const introOverlap = intro ? Math.min(3.0, introDuration / 2) : 0; 
  const outroOverlap = outro ? Math.min(3.0, outroDuration / 2) : 0;

  const voiceStartTime = Math.max(0, introDuration - introOverlap);
  const outroStartTime = voiceStartTime + voiceRealDuration - outroOverlap;
  
  const totalDuration = Math.max(
      introDuration,
      voiceStartTime + voiceRealDuration,
      outroStartTime + outroDuration
  ) + 1.0; 

  const offlineCtx = new OfflineAudioContext(2, totalDuration * sampleRate, sampleRate);

  // --- PROCESSING CHAIN FACTORY ---
  const createVoiceChain = (sourceNode: AudioBufferSourceNode, destination: AudioNode) => {
      let currentNode: AudioNode = sourceNode;

      // 1. EQ
      if (eqSettings.low !== 0 || eqSettings.mid !== 0 || eqSettings.high !== 0) {
          const lowShelf = offlineCtx.createBiquadFilter();
          lowShelf.type = 'lowshelf';
          lowShelf.frequency.value = 100;
          lowShelf.gain.value = eqSettings.low;

          const midPeaking = offlineCtx.createBiquadFilter();
          midPeaking.type = 'peaking';
          midPeaking.frequency.value = 1000;
          midPeaking.Q.value = 1;
          midPeaking.gain.value = eqSettings.mid;

          const highShelf = offlineCtx.createBiquadFilter();
          highShelf.type = 'highshelf';
          highShelf.frequency.value = 4000;
          highShelf.gain.value = eqSettings.high;

          currentNode.connect(lowShelf);
          lowShelf.connect(midPeaking);
          midPeaking.connect(highShelf);
          currentNode = highShelf;
      }

      // 2. Compression
      if (useCompression) {
          const compressor = offlineCtx.createDynamicsCompressor();
          compressor.threshold.value = -24;
          compressor.knee.value = 30;
          compressor.ratio.value = 12;
          compressor.attack.value = 0.003;
          compressor.release.value = 0.25;
          
          // Makeup gain
          const makeup = offlineCtx.createGain();
          makeup.gain.value = 1.5;

          currentNode.connect(compressor);
          compressor.connect(makeup);
          currentNode = makeup;
      }

      // 3. Reverb
      if (reverbType !== 'none') {
          const convolver = offlineCtx.createConvolver();
          // Generate appropriate impulse response based on preset
          let duration = 1.0;
          let decay = 2.0;
          
          if (reverbType === 'room') { duration = 0.8; decay = 4.0; }
          if (reverbType === 'studio') { duration = 0.3; decay = 8.0; }
          if (reverbType === 'hall') { duration = 2.5; decay = 2.0; }

          convolver.buffer = generateImpulseResponse(offlineCtx, duration, decay);
          
          const reverbGain = offlineCtx.createGain();
          reverbGain.gain.value = 0.2; // Wet mix
          
          const dryGain = offlineCtx.createGain();
          dryGain.gain.value = 0.8; // Dry mix

          currentNode.connect(convolver);
          convolver.connect(reverbGain);
          currentNode.connect(dryGain);
          
          const merger = offlineCtx.createGain();
          reverbGain.connect(merger);
          dryGain.connect(merger);
          
          currentNode = merger;
      }

      // 4. Volume
      const volumeNode = offlineCtx.createGain();
      volumeNode.gain.value = voiceVolume;
      currentNode.connect(volumeNode);
      currentNode = volumeNode;

      currentNode.connect(destination);
  };

  // --- SCHEDULE TRACKS ---

  // 1. Intro
  if (intro) {
      const src = offlineCtx.createBufferSource();
      src.buffer = intro;
      const gain = offlineCtx.createGain();
      
      // Fade In/Out
      gain.gain.setValueAtTime(0, 0);
      gain.gain.linearRampToValueAtTime(introVolume, 0.5);
      gain.gain.setValueAtTime(introVolume, introDuration - introOverlap);
      gain.gain.linearRampToValueAtTime(0, introDuration); // Fade completely out

      src.connect(gain);
      gain.connect(offlineCtx.destination);
      src.start(0);
  }

  // 2. Voice (Processed)
  const voiceSrc = offlineCtx.createBufferSource();
  voiceSrc.buffer = voiceBuffer;
  voiceSrc.playbackRate.value = speed;
  createVoiceChain(voiceSrc, offlineCtx.destination);
  voiceSrc.start(voiceStartTime);

  // 3. Background Bed
  if (background) {
      // Loop the background audio to fill the space between intro and outro
      // Or just cover the whole duration at low volume
      const bgSrc = offlineCtx.createBufferSource();
      bgSrc.buffer = background;
      bgSrc.loop = true;
      
      const bgGain = offlineCtx.createGain();
      
      // Ducking Logic: 
      // Start silent during intro
      bgGain.gain.setValueAtTime(0, 0);
      // Fade in after intro
      bgGain.gain.linearRampToValueAtTime(backgroundVolume, voiceStartTime);
      // Fade out before outro
      bgGain.gain.setValueAtTime(backgroundVolume, outroStartTime);
      bgGain.gain.linearRampToValueAtTime(0, totalDuration);

      bgSrc.connect(bgGain);
      bgGain.connect(offlineCtx.destination);
      bgSrc.start(0);
      bgSrc.stop(totalDuration);
  }

  // 4. Outro
  if (outro) {
      const src = offlineCtx.createBufferSource();
      src.buffer = outro;
      const gain = offlineCtx.createGain();
      
      // Fade In
      gain.gain.setValueAtTime(0, outroStartTime);
      gain.gain.linearRampToValueAtTime(outroVolume, outroStartTime + 2.0);
      
      // Fade Out at very end
      const outroEnd = outroStartTime + outroDuration;
      gain.gain.setValueAtTime(outroVolume, outroEnd - 3.0);
      gain.gain.linearRampToValueAtTime(0, outroEnd);

      src.connect(gain);
      gain.connect(offlineCtx.destination);
      src.start(outroStartTime);
  }

  // Render
  return await offlineCtx.startRendering();
};
