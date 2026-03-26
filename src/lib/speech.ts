export interface SpeechSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  voiceURI: "",
  rate: 0.5,
  pitch: 1,
  volume: 1,
};

export const RATE_OPTIONS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.15, 1.2, 1.3, 1.4, 1.5, 2];

export const VOLUME_OPTIONS = [0.1, 0.3, 0.5, 0.8, 1, 1.2, 1.5, 1.8, 2];

export function formatRate(rate: number): string {
  if (rate < 1) {
    return `${rate}x 降速`;
  } else if (rate === 1) {
    return "1.0x (默认语速)";
  } else {
    return `${rate}x 加速`;
  }
}

export function formatVolume(volume: number): string {
  const percent = Math.round(volume * 100);
  if (volume < 1) {
    return `${percent}% 降低音量`;
  } else if (volume === 1) {
    return "100% (默认音量)";
  } else if (volume === 2) {
    return "200% 提升音量 (可能破音)";
  } else {
    return `${percent}% 提升音量`;
  }
}

let onSpeechEndCallback: (() => void) | null = null;

export function speak(text: string, settings: SpeechSettings, onEnd?: () => void) {
  if (typeof window === "undefined") return;
  
  const synth = window.speechSynthesis;
  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  if (settings.voiceURI) {
    const allVoices = synth.getVoices();
    const voiceObj = allVoices.find(v => v.voiceURI === settings.voiceURI);
    if (voiceObj) {
      utterance.voice = voiceObj;
    }
  }
  
  utterance.lang = "zh-CN";
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  
  if (onEnd) {
    onSpeechEndCallback = onEnd;
    utterance.onend = () => {
      if (onSpeechEndCallback) {
        onSpeechEndCallback();
        onSpeechEndCallback = null;
      }
    };
  }
  
  synth.speak(utterance);
}

export function pauseSpeech() {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (synth.speaking) {
    synth.pause();
  }
}

export function resumeSpeech() {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  if (synth.paused) {
    synth.resume();
  }
}

export function stopSpeech() {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  synth.cancel();
}

export function loadSpeechSettings(): SpeechSettings {
  if (typeof window === "undefined") return DEFAULT_SPEECH_SETTINGS;
  
  const stored = localStorage.getItem("speechSettings");
  if (stored) {
    try {
      return { ...DEFAULT_SPEECH_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_SPEECH_SETTINGS;
    }
  }
  return DEFAULT_SPEECH_SETTINGS;
}

export function saveSpeechSettings(settings: SpeechSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem("speechSettings", JSON.stringify(settings));
}
