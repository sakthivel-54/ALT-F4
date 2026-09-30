/**
 * Voice Assistant engine utilizing browser Web Speech API (SpeechRecognition & SpeechSynthesis)
 */

export interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export class VoiceAssistant {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private ttsEnabled = false;

  private onTranscriptCallback?: (transcript: string, isFinal: boolean) => void;
  private onStateChangeCallback?: (isListening: boolean) => void;
  private onErrorCallback?: (errorMsg: string) => void;

  constructor() {
    this.initSpeechRecognition();
    this.initSpeechSynthesis();
  }

  private initSpeechRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChangeCallback?.(true);
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          this.onTranscriptCallback?.(currentText, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        // Auto restart if continuous mode is still enabled
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            this.isListening = false;
            this.onStateChangeCallback?.(false);
          }
        } else {
          this.onStateChangeCallback?.(false);
        }
      };
    }
  }

  private initSpeechSynthesis(): void {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  public isSupported(): { stt: boolean; tts: boolean } {
    return {
      stt: Boolean(this.recognition),
      tts: Boolean(this.synthesis),
    };
  }

  public startListening(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onStateChange: (isListening: boolean) => void,
    onError?: (errorMsg: string) => void
  ): void {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser.');
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.onStateChangeCallback = onStateChange;
    this.onErrorCallback = onError;

    try {
      this.isListening = true;
      this.recognition.start();
    } catch {
      // Already running or starting
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.onStateChangeCallback?.(false);
  }

  public setTtsEnabled(enabled: boolean): void {
    this.ttsEnabled = enabled;
    if (!enabled && this.synthesis) {
      this.synthesis.cancel();
    }
  }

  public toggleTts(): boolean {
    this.ttsEnabled = !this.ttsEnabled;
    if (!this.ttsEnabled && this.synthesis) {
      this.synthesis.cancel();
    }
    return this.ttsEnabled;
  }

  public isTtsEnabled(): boolean {
    return this.ttsEnabled;
  }

  public speak(text: string, onEnd?: () => void): void {
    if (!this.ttsEnabled || !this.synthesis) {
      onEnd?.();
      return;
    }

    // Strip markdown formatting for clear audio output
    const cleanText = text
      .replace(/[\#\*\_\`\-\>] /g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\n+/g, ' ')
      .replace(/---/g, '');

    this.synthesis.cancel(); // Cancel active utterance

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.includes('en') &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Jenny') ||
          v.name.includes('David'))
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
    }

    this.synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}
