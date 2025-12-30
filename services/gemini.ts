import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decodeBase64Audio, audioBufferToWav } from "./audioUtils";

const API_KEY = process.env.API_KEY || ''; // Ensure this is set in your environment
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Models
const TEXT_MODEL = 'gemini-3-flash-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

// Helper to clean JSON string from markdown code blocks or extra text
const cleanJsonString = (str: string): string => {
  // Remove markdown code blocks if present
  let cleaned = str.replace(/```json/g, '').replace(/```/g, '');
  
  // Find the first '{' and last '}' to handle potential preamble/postamble
  const firstOpen = cleaned.indexOf('{');
  const lastClose = cleaned.lastIndexOf('}');
  
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    cleaned = cleaned.substring(firstOpen, lastClose + 1);
  }
  
  return cleaned.trim();
};

/**
 * Improves or generates Afrikaans script based on input.
 */
export const generateAfrikaansScript = async (
  prompt: string, 
  tone: 'formal' | 'conversational' | 'storytelling',
  length: 'short' | 'medium' | 'long' = 'medium',
  topics: string = '',
  hasCoHost: boolean = false
): Promise<string> => {
  if (!API_KEY) throw new Error("API Key missing");

  const toneInstruction = tone === 'formal' 
    ? 'Use formal, academic or news-broadcast standard Afrikaans.' 
    : tone === 'storytelling'
    ? 'Use expressive, descriptive Afrikaans suitable for a podcast story.'
    : 'Use casual, conversational Afrikaans suitable for a friendly radio host.';

  const lengthInstruction = length === 'short' 
    ? 'Keep the output concise (approx. 2-3 minutes speaking time).'
    : length === 'long'
    ? 'Create a detailed, in-depth script (approx. 10+ minutes speaking time).'
    : 'Aim for a standard podcast segment length (approx. 5 minutes speaking time).';

  const topicInstruction = topics 
    ? `Ensure the script specifically covers the following key topics: ${topics}.`
    : '';

  const speakerInstruction = hasCoHost 
    ? 'Write the script as a natural dialogue between two podcast hosts. Label the speakers as "Host" and "CoHost".'
    : 'Write the script for a single host.';

  const systemInstruction = `You are an expert Afrikaans scriptwriter for podcasts and radio. 
  Your goal is to take user input (which might be rough notes, English text, or an article) 
  and convert it into a natural-sounding Afrikaans script. 
  
  Style Guidelines:
  - ${toneInstruction}
  - ${lengthInstruction}
  - ${speakerInstruction}
  - Ensure correct grammar, idiom usage, and sentence structure for oral delivery.
  
  Content Requirements:
  - ${topicInstruction}
  
  Formatting:
  - ${hasCoHost ? 'Use "Host:" and "CoHost:" prefixes to indicate who is speaking.' : 'Do not use speaker labels for single speaker scripts.'}
  - You may insert [Pause] markers where appropriate for dramatic effect.
  - Do not use markdown formatting like bold or italics.
  - Return ONLY the script text.`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text || "Kon nie teks genereer nie.";
  } catch (error) {
    console.error("Script generation error:", error);
    throw error;
  }
};

/**
 * Generates an Afrikaans Blog Post based on a topic or transcript.
 */
export const generateBlogContent = async (
  topic: string,
  context: string = '', // e.g., a podcast transcript or rough notes
  tone: string = 'professional'
): Promise<{ title: string; content: string; excerpt: string; tags: string[] }> => {
  if (!API_KEY) throw new Error("API Key missing");

  const systemInstruction = `You are a professional Afrikaans content creator and blogger.
  Your task is to write a compelling blog post in Afrikaans.
  
  Output Format: JSON
  The response must be a valid JSON object with the following keys:
  - "title": A catchy Afrikaans title.
  - "content": The body of the blog post in HTML format (use <h2>, <p>, <ul>, <li>, <strong>).
  - "excerpt": A short summary (1-2 sentences) in Afrikaans.
  - "tags": An array of 3-5 relevant tags (in Afrikaans or English).
  
  Tone: ${tone}
  Language: Afrikaans (High quality, natural phrasing).
  `;

  const userPrompt = `Topic: ${topic}\n\nAdditional Context/Notes:\n${context}`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No text generated");

    // Clean and parse
    const cleanedJson = cleanJsonString(jsonText);
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("Blog generation error:", error);
    // Log the actual text that failed to parse for debugging
    if (error instanceof SyntaxError) {
       console.error("Failed JSON text:", error);
    }
    throw error;
  }
};

/**
 * Generates YouTube metadata (Title, Description, Tags, Keywords).
 */
export const generateYoutubeMetadata = async (
  title: string,
  scriptContent: string
): Promise<{ title: string; description: string; tags: string[] }> => {
  if (!API_KEY) throw new Error("API Key missing");

  const systemInstruction = `You are a YouTube SEO expert.
  Generate optimized metadata for a video podcast episode.
  The video is in Afrikaans but metadata can be a mix of Afrikaans and English for reach.
  
  Output Format: JSON
  - "title": A click-worthy, SEO-optimized YouTube title (max 100 chars).
  - "description": A compelling video description (approx 200 words) including a hook, summary, and call to action.
  - "tags": An array of 15-20 high-ranking tags/keywords (comma separated strings in the array).
  `;

  const userPrompt = `Podcast Title: ${title}\n\nScript/Content Summary:\n${scriptContent.slice(0, 3000)}`;

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No metadata generated");

    const cleanedJson = cleanJsonString(jsonText);
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("YouTube metadata generation error:", error);
    throw error;
  }
};

/**
 * Synthesizes speech from text using Gemini TTS.
 */
export const synthesizeSpeech = async (
  text: string, 
  voiceName: string = 'Kore',
  coHostVoiceName?: string
): Promise<{ audioUrl: string; duration: number; buffer: AudioBuffer }> => {
  if (!API_KEY) throw new Error("API Key missing");

  // Remove [Pause] markers or similar for TTS if model doesn't support them natively as silence.
  // Gemini TTS usually handles punctuation well. Let's strip explicit bracket markers to avoid it reading "Bracket Pause Bracket".
  // Truncate text to avoid 500 errors on long inputs (approx 4000 chars safety limit)
  let cleanText = text.replace(/\[.*?\]/g, ' ... ').trim();
  if (cleanText.length > 4000) {
      console.warn("Text truncated to 4000 characters for TTS stability.");
      cleanText = cleanText.slice(0, 4000);
  }

  if (!cleanText) throw new Error("Text is empty");

  // Prepare Config
  let config: any = {
    responseModalities: [Modality.AUDIO],
  };

  // If a Co-Host is selected and not 'none', use Multi-Speaker config
  if (coHostVoiceName && coHostVoiceName !== 'none') {
      config.speechConfig = {
          multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                  {
                      speaker: 'Host',
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
                  },
                  {
                      speaker: 'CoHost',
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: coHostVoiceName } }
                  }
              ]
          }
      };
  } else {
      // Single Speaker Config
      config.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
      };
  }

  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: cleanText }] }],
      config: config,
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data received from Gemini. Response might be empty.");
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeBase64Audio(base64Audio, audioContext);
    const wavBlob = audioBufferToWav(audioBuffer);
    const audioUrl = URL.createObjectURL(wavBlob);

    return {
      audioUrl,
      duration: audioBuffer.duration,
      buffer: audioBuffer
    };

  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
};

/**
 * Generates an image for podcast cover art or thumbnails using Gemini Flash Image.
 * aspectRatio supports "1:1" (default), "16:9", "4:3", etc.
 */
export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  if (!API_KEY) throw new Error("API Key missing");

  // Map common string requests to supported ratios if strictly needed, 
  // but Gemini API usually takes "1:1", "16:9" directly.
  
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio as any // Casting to any to avoid strict type checks if SDK types lag
        }
      }
    });

    // Find the part containing the image data
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    
    if (part && part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
    
    throw new Error("No image generated or invalid response format");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};