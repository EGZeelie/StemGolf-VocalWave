// Utility to convert raw PCM data to a WAV Blob for playback/download
export const pcmToWav = (
  pcmData: Float32Array | Uint8Array,
  sampleRate: number = 24000,
  numChannels: number = 1
): Blob => {
  return audioBufferToWav(pcmData as unknown as AudioBuffer); 
};

export const decodeBase64Audio = async (base64String: string, audioContext: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64String);
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

// Generates a simple synthesized jingle so we don't rely on external assets
const generateJingle = (type: 'news' | 'story' | 'upbeat', ctx: BaseAudioContext): AudioBuffer => {
  const duration = 4; // seconds
  const buffer = ctx.createBuffer(2, ctx.sampleRate * duration, ctx.sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  // Simple additive synthesis
  for (let i = 0; i < buffer.length; i++) {
    const t = i / ctx.sampleRate;
    let val = 0;
    
    if (type === 'news') {
      // Fast, rhythmic pulses
      val = Math.sin(t * 440 * 2 * Math.PI) * Math.exp(-4 * (t % 0.5)); 
      val += Math.sin(t * 880 * 2 * Math.PI) * Math.exp(-8 * (t % 0.25)) * 0.5;
    } else if (type === 'story') {
      // Slow, sweeping pad
      val = Math.sin(t * 220 * 2 * Math.PI) * 0.5;
      val += Math.sin(t * 330 * 2 * Math.PI + t) * 0.3; // Slight detune
      val *= Math.min(t, 1) * Math.min(duration - t, 1); // Fade in/out
    } else {
      // Upbeat arpeggio
      const note = Math.floor(t * 8) % 4; // Change note every 1/8th sec
      const freq = 440 * [1, 1.25, 1.5, 2][note]; // Major chord
      val = Math.sin(i / ctx.sampleRate * freq * 2 * Math.PI) * 0.3;
    }
    
    left[i] = val;
    right[i] = val;
  }
  return buffer;
};

export const mixPodcastAudio = async (
  voiceBuffer: AudioBuffer,
  introType: 'news' | 'story' | 'upbeat' | 'none',
  outroType: 'news' | 'story' | 'upbeat' | 'none',
  speed: number = 1.0,
  introVolume: number = 0.5,
  outroVolume: number = 0.5,
  voiceVolume: number = 1.0
): Promise<AudioBuffer> => {
  // We use OfflineAudioContext to render the final mix faster than real-time
  const sampleRate = 24000;
  
  // Calculate roughly needed duration (will truncate later if needed, but OAC needs fixed length)
  const estimatedDuration = (voiceBuffer.duration / speed) + 10; 
  const offlineCtx = new OfflineAudioContext(2, estimatedDuration * sampleRate, sampleRate);

  // Helper to play buffer with volume
  const playTrack = (buffer: AudioBuffer, time: number, vol: number) => {
    const src = offlineCtx.createBufferSource();
    src.buffer = buffer;
    const gain = offlineCtx.createGain();
    gain.gain.value = vol;
    src.connect(gain);
    gain.connect(offlineCtx.destination);
    src.start(time);
  };

  // 1. Generate Jingles
  const intro = introType !== 'none' ? generateJingle(introType, offlineCtx) : null;
  const outro = outroType !== 'none' ? generateJingle(outroType, offlineCtx) : null;

  // 2. Schedule Intro
  let currentTime = 0;
  if (intro) {
    playTrack(intro, 0, introVolume);
    // Overlap voice with end of intro by 1.5 second
    currentTime += Math.max(0, intro.duration - 1.5); 
  }

  // 3. Schedule Voice
  const voiceSrc = offlineCtx.createBufferSource();
  voiceSrc.buffer = voiceBuffer;
  voiceSrc.playbackRate.value = speed; // Apply speed here physically
  
  // Apply voice volume
  const voiceGain = offlineCtx.createGain();
  voiceGain.gain.value = voiceVolume;
  
  voiceSrc.connect(voiceGain);
  voiceGain.connect(offlineCtx.destination);
  
  voiceSrc.start(currentTime);
  
  const voiceRealDuration = voiceBuffer.duration / speed;
  currentTime += voiceRealDuration;

  // 4. Schedule Outro
  if (outro) {
    // Overlap outro with end of voice by 1.0 second
    const startOutro = Math.max(0, currentTime - 1.0);
    playTrack(outro, startOutro, outroVolume);
  }

  // Render
  const renderedBuffer = await offlineCtx.startRendering();
  
  return renderedBuffer;
};