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

export const RATE_OPTIONS = [
  0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 1, 1.1, 1.15, 1.2, 1.3, 1.4, 1.5, 2,
];

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

export interface SpeakResult {
  success: boolean;
  error?: string;
}

export function speak(
  text: string,
  settings: SpeechSettings,
  onEnd?: () => void,
): SpeakResult {
  if (typeof window === "undefined")
    return { success: false, error: "浏览器不支持语音合成" };

  const synth = window.speechSynthesis;

  if (!synth) {
    return { success: false, error: "浏览器不支持语音合成" };
  }

  // 等待声音加载完成
  const loadVoices = (): SpeechSynthesisVoice[] => {
    const voices = synth.getVoices();
    if (voices.length > 0) return voices;

    // 某些浏览器需要等待
    return [];
  };

  const availableVoices = loadVoices();

  // 如果声音未加载，尝试等待一小段时间
  if (availableVoices.length === 0) {
    return { success: false, error: "暂无可用声音，请等待或刷新页面后重试" };
  }

  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // 优先使用设置的声音
  if (settings.voiceURI) {
    const voiceObj = availableVoices.find(
      (v) => v.voiceURI === settings.voiceURI && v.localService,
    );
    if (voiceObj) {
      utterance.voice = voiceObj;
    } else {
      // 如果设置的声音不可用，使用第一个可用的中文声音
      const zhVoice = availableVoices.find((v) => v.lang.startsWith("zh-CN"));
      if (zhVoice) {
        utterance.voice = zhVoice;
      }
    }
  } else {
    // 没有设置声音时，使用第一个可用的中文声音
    const zhVoice = availableVoices.find((v) => v.lang.startsWith("zh-CN"));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }
  }

  utterance.lang = "zh-CN";
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;

  utterance.onerror = (event) => {
    console.log(
      `An error has occurred with the speech synthesis: ${event.error}`,
    );
    // interrupted 是因为调用了 synth.cancel()，这是正常行为，不需要报错
    if (event.error === "interrupted") return;

    const errorMessages: Record<string, string> = {
      "audio-busy": "音频设备被占用",
      "audio-hardware": "音频硬件不可用",
      "language-unavailable": "语言不支持",
      "voice-unavailable": "声音不可用",
      network: "网络错误",
      "synthesis-failed": "语音合成失败",
    };
    const errorMsg = errorMessages[event.error] || "播放出错";
    console.warn("Speech synthesis error:", errorMsg);
  };

  utterance.onpause = (event) => {
    const char = event.utterance.text.charAt(event.charIndex);
    console.log(
      `Speech paused at character ${event.charIndex} of "${event.utterance.text}", which is "${char}".`,
    );
  };

  utterance.onboundary = (event) => {
    console.log(
      `${event.name} boundary reached after ${event.elapsedTime} seconds.`,
    );
  };

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
  return { success: true };
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
