import { VoiceSettings } from '../types';

export class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private retryCount = 0;
  private maxRetries = 3;
  private settings: VoiceSettings;
  private onResult: ((text: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onStart: (() => void) | null = null;
  private onEnd: (() => void) | null = null;
  private supportedLanguages: string[] = [];

  constructor() {
    this.settings = {
      enabled: true,
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,
      vadThreshold: 0.1,
      noiseSuppressionEnabled: true
    };

    this.detectSupportedLanguages();
    this.initializeRecognition();
  }

  private detectSupportedLanguages(): void {
    // Common supported languages across browsers
    this.supportedLanguages = [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-NZ', 'en-ZA',
      'es-ES', 'es-MX', 'es-AR', 'es-CO', 'es-CL', 'es-PE', 'es-VE',
      'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH',
      'de-DE', 'de-AT', 'de-CH',
      'it-IT', 'it-CH',
      'pt-BR', 'pt-PT',
      'ru-RU',
      'ja-JP',
      'ko-KR',
      'zh-CN', 'zh-TW', 'zh-HK',
      'ar-SA', 'ar-EG',
      'hi-IN',
      'th-TH',
      'tr-TR',
      'pl-PL',
      'nl-NL', 'nl-BE',
      'sv-SE',
      'da-DK',
      'no-NO',
      'fi-FI',
      'cs-CZ',
      'sk-SK',
      'hu-HU',
      'ro-RO',
      'bg-BG',
      'hr-HR',
      'sl-SI',
      'et-EE',
      'lv-LV',
      'lt-LT',
      'mt-MT',
      'el-GR',
      'he-IL',
      'vi-VN',
      'id-ID',
      'ms-MY',
      'tl-PH',
      'uk-UA',
      'ca-ES',
      'eu-ES',
      'gl-ES'
    ];
  }

  private validateLanguage(language: string): string {
    // Check if the exact language is supported
    if (this.supportedLanguages.includes(language)) {
      return language;
    }

    // Try to find a fallback based on language code (e.g., 'en' from 'en-US')
    const languageCode = language.split('-')[0];
    const fallback = this.supportedLanguages.find(lang => lang.startsWith(languageCode));
    
    if (fallback) {
      console.warn(`Language ${language} not supported, falling back to ${fallback}`);
      return fallback;
    }

    // Ultimate fallback to English
    console.warn(`Language ${language} not supported, falling back to en-US`);
    return 'en-US';
  }

  private initializeRecognition(): void {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech Recognition not supported');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    if (this.recognition) {
      this.configureRecognition();
      this.setupEventListeners();
    }
  }

  private configureRecognition(): void {
    if (!this.recognition) return;

    // Validate and set language
    const validatedLanguage = this.validateLanguage(this.settings.language);
    this.settings.language = validatedLanguage;

    this.recognition.continuous = this.settings.continuous;
    this.recognition.interimResults = this.settings.interimResults;
    this.recognition.lang = validatedLanguage;
    this.recognition.maxAlternatives = this.settings.maxAlternatives;

    // Additional browser-specific configurations
    if ('webkitSpeechRecognition' in window) {
      // Chrome/Edge specific settings
      (this.recognition as any).serviceURI = undefined; // Use default service
    }
  }

  private setupEventListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.retryCount = 0;
      this.onStart?.();
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.onResult?.(finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      this.handleError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEnd?.();
    };
  }

  private handleError(error: string): void {
    console.warn('Speech recognition error:', error);
    
    // Handle specific error types
    switch (error) {
      case 'language-not-supported':
        // Try with fallback language
        const fallbackLanguage = this.validateLanguage('en-US');
        if (this.settings.language !== fallbackLanguage) {
          this.settings.language = fallbackLanguage;
          this.configureRecognition();
          this.onError?.(`Language not supported. Switched to ${fallbackLanguage}. Please try again.`);
          return;
        }
        this.onError?.('Speech recognition language not supported by your browser.');
        break;
        
      case 'network':
        this.onError?.('Network error. Please check your internet connection and try again.');
        break;
        
      case 'not-allowed':
        this.onError?.('Microphone access denied. Please allow microphone permissions and try again.');
        break;
        
      case 'no-speech':
        this.onError?.('No speech detected. Please speak clearly and try again.');
        break;
        
      case 'audio-capture':
        this.onError?.('Microphone not available. Please check your microphone and try again.');
        break;
        
      case 'service-not-allowed':
        this.onError?.('Speech recognition service not allowed. Please check your browser settings.');
        break;
        
      default:
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          setTimeout(() => {
            if (this.settings.enabled) {
              this.start();
            }
          }, 1000 * this.retryCount); // Exponential backoff
        } else {
          this.onError?.(`Speech recognition failed: ${error}. Please try refreshing the page.`);
        }
        break;
    }
  }

  start(): void {
    if (!this.recognition || !this.settings.enabled || this.isListening) return;

    // Reset retry count on manual start
    this.retryCount = 0;

    try {
      // Ensure language is validated before starting
      const validatedLanguage = this.validateLanguage(this.settings.language);
      if (this.recognition.lang !== validatedLanguage) {
        this.recognition.lang = validatedLanguage;
        this.settings.language = validatedLanguage;
      }
      
      this.recognition.start();
    } catch (error) {
      this.onError?.('Failed to start speech recognition. Please try again.');
    }
  }

  stop(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
    } catch (error) {
      console.warn('Error stopping recognition:', error);
    }
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    const oldLanguage = this.settings.language;
    this.settings = { ...this.settings, ...newSettings };
    
    // Validate new language if it changed
    if (newSettings.language && newSettings.language !== oldLanguage) {
      this.settings.language = this.validateLanguage(newSettings.language);
    }
    
    this.configureRecognition();
  }

  setCallbacks(callbacks: {
    onResult?: (text: string) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }): void {
    this.onResult = callbacks.onResult || null;
    this.onError = callbacks.onError || null;
    this.onStart = callbacks.onStart || null;
    this.onEnd = callbacks.onEnd || null;
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }

  getCurrentLanguage(): string {
    return this.settings.language;
  }

  static isSupported(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  getBrowserSpecificGuidance(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return 'Chrome users: Make sure microphone permissions are enabled. Click the microphone icon in the address bar if needed. Speech recognition works best with a stable internet connection.';
    } else if (userAgent.includes('Safari')) {
      return 'Safari users: Speech recognition may require manual permission. Check Safari preferences for microphone access. Some languages may have limited support.';
    } else if (userAgent.includes('Edge')) {
      return 'Edge users: Ensure microphone permissions are granted in Edge settings. Speech recognition requires an active internet connection.';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox users: Speech recognition support is limited. Consider using Chrome or Edge for the best experience.';
    } else {
      return 'Make sure your browser supports speech recognition and microphone permissions are enabled. Chrome and Edge provide the best speech recognition experience.';
    }
  }

  testLanguageSupport(language: string): { supported: boolean; fallback?: string } {
    if (this.supportedLanguages.includes(language)) {
      return { supported: true };
    }

    const languageCode = language.split('-')[0];
    const fallback = this.supportedLanguages.find(lang => lang.startsWith(languageCode));
    
    return {
      supported: false,
      fallback: fallback || 'en-US'
    };
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();