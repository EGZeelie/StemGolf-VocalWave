
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
  voiceVolume: number = 1.0
): Promise<AudioBuffer> => {
  const sampleRate = 24000;
  
  // 1. Prepare buffers
  let intro: AudioBuffer | null = null;
  let outro: AudioBuffer | null = null;

  // Use a temporary context to generate/decode jingles if needed
  const tempCtx = new OfflineAudioContext(1, 1, sampleRate);

  try {
    if (introType === 'custom' && customIntroUrl) {
        intro = await loadAudio(customIntroUrl);
    } else if (introType !== 'none' && introType !== 'custom') {
        intro = generateJingle(introType as 'news'|'story'|'upbeat', tempCtx);
    }

    if (outroType === 'custom' && customOutroUrl) {
        outro = await loadAudio(customOutroUrl);
    } else if (outroType !== 'none' && outroType !== 'custom') {
        outro = generateJingle(outroType as 'news'|'story'|'upbeat', tempCtx);
    }
  } catch (err) {
      console.warn("Error loading custom audio", err);
  }

  // 2. Calculate Timelines & Overlaps
  const introDuration = intro ? intro.duration : 0;
  const voiceRealDuration = voiceBuffer.duration / speed;
  const outroDuration = outro ? outro.duration : 0;

  // We want the intro music to duck under the voice for a bit, or fade out.
  // Overlap: The amount of time the voice overlaps with the END of the intro
  const introOverlap = intro ? Math.min(3.0, introDuration / 2) : 0; 
  
  // Overlap: The amount of time the outro overlaps with the END of the voice
  const outroOverlap = outro ? Math.min(3.0, outroDuration / 2) : 0;

  const voiceStartTime = Math.max(0, introDuration - introOverlap);
  const outroStartTime = voiceStartTime + voiceRealDuration - outroOverlap;
  
  const totalDuration = Math.max(
      introDuration,
      voiceStartTime + voiceRealDuration,
      outroStartTime + outroDuration
  ) + 1.0; // +1s Safety buffer

  const offlineCtx = new OfflineAudioContext(2, totalDuration * sampleRate, sampleRate);

  // Helper to schedule buffer with fades
  const scheduleTrack = (
      buffer: AudioBuffer, 
      startTime: number, 
      maxVol: number, 
      fadeInDuration: number = 0, 
      fadeOutDuration: number = 0, 
      playbackRate: number = 1.0
  ) => {
      const src = offlineCtx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = playbackRate;
      
      const gain = offlineCtx.createGain();
      
      // Calculate real duration of the clip in the timeline
      const clipDuration = buffer.duration / playbackRate;
      const endTime = startTime + clipDuration;

      // Initial Volume
      if (fadeInDuration > 0) {
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(maxVol, Math.min(endTime, startTime + fadeInDuration));
      } else {
          gain.gain.setValueAtTime(maxVol, startTime);
      }

      // Fade Out
      if (fadeOutDuration > 0) {
          // Ensure we don't start fading out before we finish fading in if clip is super short
          const fadeOutStart = Math.max(startTime + fadeInDuration, endTime - fadeOutDuration);
          gain.gain.setValueAtTime(maxVol, fadeOutStart);
          gain.gain.linearRampToValueAtTime(0, endTime);
      } else {
          gain.gain.setValueAtTime(maxVol, endTime - 0.01);
          gain.gain.linearRampToValueAtTime(0, endTime); // Tiny fade to avoid click
      }

      src.connect(gain);
      gain.connect(offlineCtx.destination);
      src.start(startTime);
  };

  // --- SCHEDULE TRACKS ---

  // 1. Intro
  if (intro) {
      // Intro starts at 0. Fades in quickly (0.5s). Fades out slowly under the voice (introOverlap).
      scheduleTrack(intro, 0, introVolume, 0.5, introOverlap);
  }

  // 2. Voice
  // Voice starts at voiceStartTime. Tiny fade edges to prevent clicks.
  scheduleTrack(voiceBuffer, voiceStartTime, voiceVolume, 0.1, 0.1, speed);

  // 3. Outro
  if (outro) {
      // Outro starts at outroStartTime. Fades in slowly under the voice (outroOverlap). Fades out at end (3s).
      scheduleTrack(outro, outroStartTime, outroVolume, outroOverlap, 3.0);
  }

  // Render
  return await offlineCtx.startRendering();
};
