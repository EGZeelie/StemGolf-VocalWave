
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

const loadAudio = async (url: string, ctx: AudioContext): Promise<AudioBuffer> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await ctx.decodeAudioData(arrayBuffer);
};

// Generates a simple synthesized jingle so we don't rely on external assets
const generateJingle = (type: 'news' | 'story' | 'upbeat', ctx: BaseAudioContext): AudioBuffer => {
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

// Generates a synthetic impulse response for reverb
const generateImpulseResponse = (ctx: BaseAudioContext, duration: number, decay: number, type: 'room' | 'hall' | 'studio'): AudioBuffer => {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        let val = (Math.random() * 2 - 1) * Math.pow(1 - t / duration, decay);
        
        if (type === 'hall') val *= Math.cos(t * 10);
        else if (type === 'studio') val *= Math.pow(1 - t / duration, 3);
        
        left[i] = val;
        right[i] = val;
    }
    return impulse;
};

export const mixPodcastAudio = async (
  voiceBuffer: AudioBuffer,
  introType: 'news' | 'story' | 'upbeat' | 'none' | 'custom' = 'none',
  outroType: 'news' | 'story' | 'upbeat' | 'none' | 'custom' = 'none',
  customIntroUrl: string | undefined,
  customOutroUrl: string | undefined,
  speed: number = 1.0,
  introVolume: number = 0.5,
  outroVolume: number = 0.5,
  voiceVolume: number = 1.0,
  backgroundMusicUrl?: string,
  backgroundVolume: number = 0.1,
  eqSettings: EqualizerSettings = { low: 0, mid: 0, high: 0 },
  compression: boolean = false,
  reverb: 'none' | 'studio' | 'room' | 'hall' = 'none'
): Promise<AudioBuffer> => {
  const sampleRate = 24000;
  const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });

  // 1. Prepare all audio buffers
  let intro: AudioBuffer | null = null;
  let outro: AudioBuffer | null = null;
  let background: AudioBuffer | null = null;

  try {
    if (introType === 'custom' && customIntroUrl) intro = await loadAudio(customIntroUrl, tempCtx);
    // FIX: Do not call generateJingle for 'custom' type
    else if (introType !== 'none' && introType !== 'custom') intro = generateJingle(introType, tempCtx);

    if (outroType === 'custom' && customOutroUrl) outro = await loadAudio(customOutroUrl, tempCtx);
    // FIX: Do not call generateJingle for 'custom' type
    else if (outroType !== 'none' && outroType !== 'custom') outro = generateJingle(outroType, tempCtx);

    if (backgroundMusicUrl) background = await loadAudio(backgroundMusicUrl, tempCtx);
  } catch (err) {
    console.warn("Error loading custom audio", err);
  } finally {
    tempCtx.close();
  }

  // 2. Calculate Timelines
  const introDuration = intro ? intro.duration : 0;
  const voiceRealDuration = voiceBuffer.duration / speed;
  const outroDuration = outro ? outro.duration : 0;
  const introOverlap = intro ? Math.min(3.0, introDuration / 2) : 0; 
  const outroOverlap = outro ? Math.min(3.0, outroDuration / 2) : 0;
  const voiceStartTime = Math.max(0, introDuration - introOverlap);
  const outroStartTime = voiceStartTime + voiceRealDuration - outroOverlap;
  const totalDuration = Math.max(introDuration, voiceStartTime + voiceRealDuration, outroStartTime + outroDuration) + 1.0;

  const offlineCtx = new OfflineAudioContext(2, totalDuration * sampleRate, sampleRate);

  // --- Create Audio Nodes ---

  // Voice FX Chain
  const voiceSource = offlineCtx.createBufferSource();
  voiceSource.buffer = voiceBuffer;
  voiceSource.playbackRate.value = speed;
  
  const voiceGain = offlineCtx.createGain();
  voiceGain.gain.value = voiceVolume;

  const lowEQ = offlineCtx.createBiquadFilter();
  lowEQ.type = 'lowshelf'; lowEQ.frequency.value = 300; lowEQ.gain.value = eqSettings.low;
  const midEQ = offlineCtx.createBiquadFilter();
  midEQ.type = 'peaking'; midEQ.frequency.value = 1500; midEQ.Q.value = 1; midEQ.gain.value = eqSettings.mid;
  const highEQ = offlineCtx.createBiquadFilter();
  highEQ.type = 'highshelf'; highEQ.frequency.value = 5000; highEQ.gain.value = eqSettings.high;
  
  voiceSource.connect(voiceGain).connect(lowEQ).connect(midEQ).connect(highEQ);
  let lastVoiceNode: AudioNode = highEQ;

  if (compression) {
    const compressor = offlineCtx.createDynamicsCompressor();
    compressor.threshold.value = -24; compressor.knee.value = 30; compressor.ratio.value = 12;
    lastVoiceNode.connect(compressor);
    lastVoiceNode = compressor;
  }

  if (reverb !== 'none') {
    const reverbNode = offlineCtx.createConvolver();
    reverbNode.buffer = generateImpulseResponse(offlineCtx, 2, 2, reverb);
    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = 0.3;
    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 0.7;
    lastVoiceNode.connect(dryGain);
    lastVoiceNode.connect(reverbNode);
    reverbNode.connect(wetGain);
    dryGain.connect(offlineCtx.destination);
    wetGain.connect(offlineCtx.destination);
  } else {
    lastVoiceNode.connect(offlineCtx.destination);
  }
  
  // Schedule Voice
  voiceSource.start(voiceStartTime);

  // Schedule Intro
  if (intro) {
    const introSource = offlineCtx.createBufferSource();
    introSource.buffer = intro;
    const introGain = offlineCtx.createGain();
    introGain.gain.setValueAtTime(0, 0);
    introGain.gain.linearRampToValueAtTime(introVolume, 0.5);
    introGain.gain.setValueAtTime(introVolume, voiceStartTime);
    introGain.gain.linearRampToValueAtTime(0, introDuration);
    introSource.connect(introGain).connect(offlineCtx.destination);
    introSource.start(0);
  }

  // Schedule Outro
  if (outro) {
    const outroSource = offlineCtx.createBufferSource();
    outroSource.buffer = outro;
    const outroGain = offlineCtx.createGain();
    outroGain.gain.setValueAtTime(0, outroStartTime);
    outroGain.gain.linearRampToValueAtTime(outroVolume, outroStartTime + outroOverlap);
    outroGain.gain.setValueAtTime(outroVolume, outroStartTime + outroDuration - 3.0);
    outroGain.gain.linearRampToValueAtTime(0, outroStartTime + outroDuration);
    outroSource.connect(outroGain).connect(offlineCtx.destination);
    outroSource.start(outroStartTime);
  }

  // Schedule Background Music
  if (background) {
    const bgSource = offlineCtx.createBufferSource();
    bgSource.buffer = background;
    bgSource.loop = true;
    const bgGain = offlineCtx.createGain();
    bgGain.gain.value = 0;
    bgGain.gain.linearRampToValueAtTime(backgroundVolume, voiceStartTime + 1.0);
    bgGain.gain.setValueAtTime(backgroundVolume, outroStartTime);
    bgGain.gain.linearRampToValueAtTime(0, outroStartTime + outroOverlap);
    bgSource.connect(bgGain).connect(offlineCtx.destination);
    bgSource.start(voiceStartTime);
    bgSource.stop(outroStartTime + outroOverlap);
  }

  // Render
  return await offlineCtx.startRendering();
};
