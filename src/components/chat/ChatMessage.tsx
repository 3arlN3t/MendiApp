import React from 'react';
import { format } from 'date-fns';
import { User, Bot, Volume2, Sparkles, Copy, Heart } from 'lucide-react';
import { Message } from '../../types';
import { EMOTION_CATEGORIES } from '../../data/constants';

interface ChatMessageProps {
  message: Message;
  onSpeak?: (text: string) => void;
}

export function ChatMessage({ message, onSpeak }: ChatMessageProps) {
  const isUser = message.sender === 'user';
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div className={`group flex gap-4 p-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 group-hover:scale-105 ${
        isUser 
          ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 text-white' 
          : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
      }`}>
        {isUser ? <User className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </div>
      
      <div className={`flex-1 max-w-3xl ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble */}
        <div className={`relative inline-block max-w-full ${isUser ? 'ml-auto' : 'mr-auto'}`}>
          <div className={`p-6 rounded-3xl shadow-lg transition-all duration-200 group-hover:shadow-xl ${
            isUser 
              ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 text-white rounded-br-lg' 
              : 'bg-white/95 backdrop-blur-sm border border-slate-200/50 text-slate-800 rounded-bl-lg'
          }`}>
            <p className="whitespace-pre-wrap leading-relaxed text-[15px] font-medium">
              {message.content}
            </p>
            
            {/* Emotion Analysis */}
            {message.emotions && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-3 text-sm opacity-90">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-medium">Detected emotion:</span>
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                    <span className="text-lg">{EMOTION_CATEGORIES[message.emotions.primary.category]?.icon}</span>
                    <span className="capitalize font-medium">{message.emotions.primary.name}</span>
                    <span className="text-xs opacity-75 bg-white/20 px-2 py-0.5 rounded-full">
                      {Math.round(message.emotions.intensity * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Actions */}
          <div className={`absolute top-2 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
            isUser ? '-left-12' : '-right-12'
          }`}>
            <div className="flex flex-col gap-1">
              {!isUser && onSpeak && (
                <button
                  onClick={() => onSpeak(message.content)}
                  className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg hover:bg-slate-50 hover:scale-105 transition-all duration-200 text-slate-600 border border-slate-200/50"
                  title="Speak message"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
              
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg hover:bg-slate-50 hover:scale-105 transition-all duration-200 text-slate-600 border border-slate-200/50"
                title="Copy message"
              >
                <Copy className="h-4 w-4" />
              </button>
              
              {!isUser && (
                <button
                  className="p-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg hover:bg-slate-50 hover:scale-105 transition-all duration-200 text-slate-600 border border-slate-200/50"
                  title="Like message"
                >
                  <Heart className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className={`flex items-center gap-3 mt-3 text-xs text-slate-500 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}>
          <span className="font-medium bg-slate-100/80 px-3 py-1 rounded-full backdrop-blur-sm">
            {format(message.timestamp, 'HH:mm')}
          </span>
        </div>
      </div>
    </div>
  );
}