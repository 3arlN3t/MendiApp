import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2, Sparkles, Volume2, Settings, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { User } from '../../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onOpenSettings?: () => void;
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Type how you're feeling or what's on your mind...",
  onOpenSettings
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [isJournalMode, setIsJournalMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Get user preferences for theming
  const [user] = useLocalStorage<User | null>('mendi_user', null);
  
  const {
    isListening,
    transcript,
    error: voiceError,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceRecognition();

  useEffect(() => {
    if (transcript) {
      setMessage(prev => prev + (prev ? ' ' : '') + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isComposing) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoiceRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTextToSpeech = () => {
    if (!message.trim()) return;
    
    if (isSpeaking) {
      // Stop speaking
      speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        speechSynthesis.speak(utterance);
      }
    }
  };

  const toggleJournalMode = () => {
    setIsJournalMode(!isJournalMode);
    if (!isJournalMode) {
      // Entering journal mode - expand textarea and change placeholder
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const journalPlaceholder = "Start your journal entry... Write freely about your thoughts, feelings, and experiences. This is your safe space to reflect and explore.";
  const currentPlaceholder = isJournalMode ? journalPlaceholder : placeholder;

  // Get theme classes
  const isDark = user?.preferences.theme === 'dark' || 
    (user?.preferences.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const themeClasses = {
    cardBg: isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50',
    inputBg: isDark ? 'bg-slate-700/80 border-slate-600/50' : 'bg-slate-50/80 border-slate-200/50',
    inputFocusBg: isDark ? 'focus-within:bg-slate-600/90' : 'focus-within:bg-white/90',
    text: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-300' : 'text-slate-500',
    placeholder: isDark ? 'placeholder-slate-400' : 'placeholder-slate-500',
    bannerBg: isDark ? 'bg-slate-700/90 border-slate-600' : 'bg-white/90 border-slate-200'
  };

  return (
    <div className="relative">
      {/* Voice Error Banner */}
      {voiceError && (
        <div className="absolute bottom-full left-0 right-0 mb-3 mx-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm shadow-lg backdrop-blur-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              {voiceError}
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Listening Banner */}
      {isListening && (
        <div className="absolute bottom-full left-0 right-0 mb-3 mx-4">
          <div className={`${themeClasses.bannerBg} border rounded-2xl p-4 shadow-lg backdrop-blur-sm`} style={{
            background: isDark 
              ? `linear-gradient(135deg, rgba(var(--color-primary), 0.2), rgba(var(--color-secondary), 0.2))`
              : `linear-gradient(135deg, rgba(var(--color-primary), 0.1), rgba(var(--color-secondary), 0.1))`,
            borderColor: `rgba(var(--color-primary), 0.3)`
          }}>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: `rgb(var(--color-primary))` }}></div>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse delay-75" style={{ backgroundColor: `rgba(var(--color-primary), 0.7)` }}></div>
                <div className="w-1 h-1 rounded-full animate-pulse delay-150" style={{ backgroundColor: `rgba(var(--color-primary), 0.5)` }}></div>
              </div>
              <span className={`font-medium text-sm ${themeClasses.text}`}>Listening... Speak now</span>
              <Sparkles className="h-4 w-4 animate-pulse" style={{ color: `rgb(var(--color-primary))` }} />
            </div>
          </div>
        </div>
      )}

      {/* Journal Mode Banner */}
      {isJournalMode && (
        <div className="absolute bottom-full left-0 right-0 mb-3 mx-4">
          <div className={`${themeClasses.bannerBg} border rounded-2xl p-4 shadow-lg backdrop-blur-sm`} style={{
            background: isDark 
              ? `linear-gradient(135deg, rgba(var(--color-secondary), 0.2), rgba(var(--color-accent), 0.2))`
              : `linear-gradient(135deg, rgba(var(--color-secondary), 0.1), rgba(var(--color-accent), 0.1))`,
            borderColor: `rgba(var(--color-secondary), 0.3)`
          }}>
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="h-4 w-4" style={{ color: `rgb(var(--color-secondary))` }} />
              <span className={`font-medium text-sm ${themeClasses.text}`}>Journal Mode Active - Write freely and expressively</span>
              <Sparkles className="h-4 w-4" style={{ color: `rgb(var(--color-secondary))` }} />
            </div>
          </div>
        </div>
      )}

      {/* Speaking Banner */}
      {isSpeaking && (
        <div className="absolute bottom-full left-0 right-0 mb-3 mx-4">
          <div className={`${themeClasses.bannerBg} border rounded-2xl p-4 shadow-lg backdrop-blur-sm`} style={{
            background: isDark 
              ? `linear-gradient(135deg, rgba(var(--color-accent), 0.2), rgba(var(--color-primary), 0.2))`
              : `linear-gradient(135deg, rgba(var(--color-accent), 0.1), rgba(var(--color-primary), 0.1))`,
            borderColor: `rgba(var(--color-accent), 0.3)`
          }}>
            <div className="flex items-center justify-center gap-3">
              <Volume2 className="h-4 w-4 animate-pulse" style={{ color: `rgb(var(--color-accent))` }} />
              <span className={`font-medium text-sm ${themeClasses.text}`}>Speaking your message...</span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: `rgb(var(--color-accent))` }}></div>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse delay-75" style={{ backgroundColor: `rgba(var(--color-accent), 0.7)` }}></div>
                <div className="w-2 h-2 rounded-full animate-pulse delay-150" style={{ backgroundColor: `rgba(var(--color-accent), 0.5)` }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`${themeClasses.cardBg} backdrop-blur-xl border rounded-3xl shadow-xl p-6 theme-transition`}>
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          {/* Main Input Area */}
          <div className="flex-1 relative">
            <div className={`relative ${themeClasses.inputBg} rounded-2xl border ${themeClasses.inputFocusBg} transition-all duration-200 theme-transition ${
              isJournalMode ? 'border-amber-300 bg-amber-50/50 dark:border-amber-600 dark:bg-amber-900/20' : ''
            }`} style={{
              borderColor: isJournalMode ? `rgba(var(--color-secondary), 0.5)` : undefined
            }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                placeholder={currentPlaceholder}
                disabled={disabled}
                rows={isJournalMode ? 4 : 1}
                className={`w-full resize-none bg-transparent px-6 py-4 pr-16 ${themeClasses.text} ${themeClasses.placeholder} focus:outline-none disabled:opacity-50 overflow-y-auto text-[15px] leading-relaxed theme-transition ${
                  isJournalMode ? 'min-h-[120px] max-h-[200px]' : 'max-h-[120px]'
                }`}
                style={{ fontSize: 'var(--base-font-size, 16px)' }}
              />
              
              {/* Send Button - Inside Input */}
              <button
                type="submit"
                disabled={!message.trim() || disabled || isComposing}
                className={`absolute right-3 top-4 p-2.5 rounded-xl transition-all duration-200 theme-transition ${
                  message.trim() && !disabled && !isComposing
                    ? 'text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    : `${isDark ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-400'} cursor-not-allowed`
                }`}
                style={message.trim() && !disabled && !isComposing ? {
                  background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`
                } : {}}
              >
                {disabled ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Helper Text */}
            <div className="flex items-center justify-between mt-3 px-2">
              <span className={`text-xs ${themeClasses.textSecondary}`} style={{ fontSize: 'calc(var(--base-font-size, 16px) * 0.75)' }}>
                {isJournalMode ? 'Journal mode - Express yourself freely' : 'Press Enter to send, Shift+Enter for new line'}
              </span>
              <div className={`flex items-center gap-1 text-xs ${themeClasses.textSecondary}`} style={{ fontSize: 'calc(var(--base-font-size, 16px) * 0.75)' }}>
                <span className={message.length > 1800 ? 'text-amber-600 font-medium dark:text-amber-400' : ''}>{message.length}</span>
                <span>/</span>
                <span>2000</span>
              </div>
            </div>
          </div>
        </form>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
          {/* Voice Input Button */}
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoiceRecognition}
              disabled={disabled}
              className={`group relative p-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-white ${
                isListening ? 'scale-110' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`,
                ...(isListening && { animation: 'pulse 2s infinite' })
              }}
              title={isListening ? 'Stop recording' : 'Start voice input'}
            >
              <div className="relative">
                {isListening ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
                {isListening && (
                  <div className="absolute -inset-2 rounded-2xl border-2 border-white/30 animate-ping"></div>
                )}
              </div>
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className={`${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg`}>
                  {isListening ? 'Stop Recording' : 'Voice Input'}
                </div>
              </div>
            </button>
          )}

          {/* Text to Speech Button */}
          <button
            type="button"
            onClick={handleTextToSpeech}
            disabled={!message.trim() || disabled}
            className={`group relative p-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
              isSpeaking ? 'scale-110 animate-pulse' : ''
            } ${
              message.trim() && !disabled
                ? 'text-white'
                : `${isDark ? 'bg-slate-600 text-slate-400' : 'bg-slate-200 text-slate-400'} cursor-not-allowed`
            }`}
            style={message.trim() && !disabled ? {
              background: `linear-gradient(135deg, rgb(var(--color-secondary)), rgb(var(--color-accent)))`
            } : {}}
            title={isSpeaking ? 'Stop speaking' : 'Read message aloud'}
          >
            <Volume2 className="h-5 w-5" />
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className={`${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg`}>
                {isSpeaking ? 'Stop Speaking' : 'Read Aloud'}
              </div>
            </div>
          </button>

          {/* Journal Mode Button */}
          <button
            type="button"
            onClick={toggleJournalMode}
            className={`group relative p-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-white ${
              isJournalMode ? 'scale-110' : ''
            }`}
            style={{
              background: `linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-primary)))`
            }}
            title={isJournalMode ? 'Exit journal mode' : 'Enter journal mode'}
          >
            <BookOpen className="h-5 w-5" />
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className={`${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg`}>
                {isJournalMode ? 'Exit Journal' : 'Journal Mode'}
              </div>
            </div>
          </button>

          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="group relative p-4 rounded-2xl text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            style={{
              background: `linear-gradient(135deg, rgba(var(--color-primary), 0.8), rgba(var(--color-secondary), 0.8))`
            }}
            title="Open settings"
          >
            <Settings className="h-5 w-5" />
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div className={`${isDark ? 'bg-slate-700' : 'bg-slate-800'} text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg`}>
                Settings
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}