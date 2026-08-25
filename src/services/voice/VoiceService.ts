/**
 * Wazeer OS v2.1 — Voice Service
 * Handles voice recording (MediaRecorder), speech-to-text (Web Speech API),
 * and text-to-speech (SpeechSynthesis).
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type VoiceState = 'idle' | 'recording' | 'processing' | 'speaking';

export interface VoiceServiceCallbacks {
  onTranscriptReady: (text: string) => void;
  onStateChange: (state: VoiceState) => void;
  onError: (error: string) => void;
}

// ═══════════════════════════════════════════════════════════════════
// SPEECH RECOGNITION (STT)
// ═══════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const SpeechRecognition: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const webkitSpeechRecognition: any;

let recognition: any = null;
let isRecording = false;

export function isSTTSupported(): boolean {
  return typeof SpeechRecognition !== 'undefined' || typeof webkitSpeechRecognition !== 'undefined';
}

/**
 * Start listening to the microphone and transcribe speech to text.
 * Uses the Web Speech API (SpeechRecognition).
 * Supports Arabic (ar-EG) and English (en-US) — auto-detects based on language param.
 */
export function startListening(
  language: 'ar' | 'en' = 'ar',
  callbacks: VoiceServiceCallbacks,
): void {
  if (isRecording) {
    stopListening();
    return;
  }

  if (!isSTTSupported()) {
    callbacks.onError('المتصفح لا يدعم التعرف على الصوت. جرّب Chrome.');
    return;
  }

  const SpeechRecognitionCtor = SpeechRecognition || webkitSpeechRecognition;
  recognition = new SpeechRecognitionCtor();

  recognition.lang = language === 'ar' ? 'ar-EG' : 'en-US';
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = '';

  recognition.onstart = () => {
    isRecording = true;
    callbacks.onStateChange('recording');
  };

  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript + ' ';
      } else {
        interim += result[0].transcript;
      }
    }
    // Show interim results in the textarea via a special callback pattern
    if (interim) {
      callbacks.onStateChange('recording'); // Keep showing recording state
    }
  };

  recognition.onend = () => {
    isRecording = false;
    recognition = null;

    if (finalTranscript.trim()) {
      callbacks.onStateChange('processing');
      callbacks.onTranscriptReady(finalTranscript.trim());
    } else {
      callbacks.onStateChange('idle');
    }
  };

  recognition.onerror = (event: any) => {
    isRecording = false;
    recognition = null;

    if (event.error === 'no-speech') {
      callbacks.onStateChange('idle');
      return;
    }
    if (event.error === 'not-allowed') {
      callbacks.onError('يرجى السماح بالوصول إلى الميكروفون في إعدادات المتصفح.');
    } else {
      callbacks.onError(`خطأ في التعرف على الصوت: ${event.error}`);
    }
    callbacks.onStateChange('idle');
  };

  try {
    recognition.start();
  } catch (err) {
    callbacks.onError('فشل بدء التسجيل. تأكد أن الميكروفون متاح.');
    callbacks.onStateChange('idle');
  }
}

/** Stop the current speech recognition session. */
export function stopListening(): void {
  if (recognition && isRecording) {
    recognition.stop();
    isRecording = false;
  }
}

/** Check if currently recording. */
export function getIsRecording(): boolean {
  return isRecording;
}

// ═══════════════════════════════════════════════════════════════════
// TEXT-TO-SPEECH (TTS)
// ═══════════════════════════════════════════════════════════════════

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Speak text aloud using the Web Speech Synthesis API.
 * Strips markdown, code blocks, and task JSON before speaking.
 */
export function speak(
  text: string,
  language: 'ar' | 'en' = 'ar',
  gender: 'male' | 'female' = 'male',
  onEnd?: () => void,
): void {
  if (!isTTSSupported()) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Clean the text: remove code blocks, task JSON, markdown formatting
  let cleanText = text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/tasks_extracted:[\s\S]*?(?:\]|$)/g, '') // Remove task JSON
    .replace(/```[\w]*\n?/g, '') // Remove stray code fences
    .replace(/#{1,6}\s/g, '') // Remove headings
    .replace(/\*{1,2}(.*?)\*{1,2}/g, '$1') // Remove bold/italic
    .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
    .replace(/\[([\s\S]*?)\]\([^)]*\)/g, '$1') // Remove links, keep text
    .replace(/\n{2,}/g, '. ') // Replace multiple newlines with period
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = language === 'ar' ? 'ar-EG' : 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = gender === 'female' ? 1.2 : 0.9;
  utterance.volume = 1.0;

  // Try to find an appropriate voice
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = language === 'ar' ? 'ar' : 'en';
  const genderHint = gender === 'female' ? 'female' : 'male';

  const preferredVoice = voices.find((v) =>
    v.lang.startsWith(langPrefix) &&
    (v.name.toLowerCase().includes(genderHint) ||
     (gender === 'female' && (v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Hoda'))) ||
     (gender === 'male' && (v.name.includes('David') || v.name.includes('Mark') || v.name.includes('Wael')))
    ),
  );

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  } else {
    const fallbackVoice = voices.find((v) => v.lang.startsWith(langPrefix));
    if (fallbackVoice) utterance.voice = fallbackVoice;
  }

  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };

  utterance.onerror = () => {
    currentUtterance = null;
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

/** Stop TTS if currently speaking. */
export function stopSpeaking(): void {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/** Check if currently speaking. */
export function getIsSpeaking(): boolean {
  if (!isTTSSupported()) return false;
  return window.speechSynthesis.speaking;
}
