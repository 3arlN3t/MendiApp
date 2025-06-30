import { useState, useEffect, useCallback } from 'react';
import { voiceRecognitionService } from '../services/voiceRecognition';
import { VoiceSettings } from '../types';

export function useVoiceRecognition(settings?: Partial<VoiceSettings>) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(voiceRecognitionService.constructor.isSupported());
    
    if (settings) {
      voiceRecognitionService.updateSettings(settings);
    }

    voiceRecognitionService.setCallbacks({
      onResult: (text) => {
        setTranscript(text);
      },
      onError: (errorMessage) => {
        setError(errorMessage);
        setIsListening(false);
      },
      onStart: () => {
        setIsListening(true);
        setError(null);
      },
      onEnd: () => {  
        setIsListening(false);
      }
    });
  }, [settings]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    setError(null);
    setTranscript('');
    voiceRecognitionService.start();
  }, [isSupported]);

  const stopListening = useCallback(() => {
    voiceRecognitionService.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    browserGuidance: voiceRecognitionService.getBrowserSpecificGuidance()
  };
}