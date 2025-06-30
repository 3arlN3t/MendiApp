import React, { useState, useEffect } from 'react';
import { MessageCircle, Settings, BarChart3, Users, Plus, Brain, Sparkles, Zap, ExternalLink } from 'lucide-react';
import { Button } from './components/ui/Button';
import { ChatMessage } from './components/chat/ChatMessage';
import { ChatInput } from './components/chat/ChatInput';
import { EmergencyBanner } from './components/chat/EmergencyBanner';
import { SettingsModal } from './components/settings/SettingsModal';
import { ConversationList } from './components/conversations/ConversationList';
import { MoodChart } from './components/analytics/MoodChart';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { useLocalStorage } from './hooks/useLocalStorage';
import { emotionalAnalysisService } from './services/emotionalAnalysis';
import { conversationMemoryService } from './services/conversationMemory';
import { crisisDetectionService } from './services/crisisDetection';
import { aiResponseService } from './services/aiResponseService';
import { User, Message, Conversation, AISettings, VoiceSettings, MoodTrend } from './types';
import { AI_PERSONALITIES, MOCK_CONVERSATIONS } from './data/constants';

function App() {
  const [activeView, setActiveView] = useState<'chat' | 'conversations' | 'analytics'>('chat');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyBanner, setShowEmergencyBanner] = useState(false);
  const [emergencyResources, setEmergencyResources] = useState<any[]>([]);

  // Local storage hooks
  const [user, setUser] = useLocalStorage<User | null>('mendi_user', null);
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('mendi_conversations', MOCK_CONVERSATIONS);
  const [aiSettings, setAiSettings] = useLocalStorage<AISettings>('mendi_ai_settings', {
    provider: 'mock',
    model: 'gpt-4o-mini',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: AI_PERSONALITIES.empathetic.systemPrompt
  });
  const [voiceSettings, setVoiceSettings] = useLocalStorage<VoiceSettings>('mendi_voice_settings', {
    enabled: true,
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
    vadThreshold: 0.1,
    noiseSuppressionEnabled: true
  });

  // Initialize user if not exists
  useEffect(() => {
    if (!user) {
      const newUser: User = {
        id: 'user-1',
        name: 'You',
        avatar: '',
        preferences: {
          theme: 'light',
          aiPersonality: 'empathetic',
          voiceEnabled: true,
          notifications: true,
          autoSave: true,
          fontSize: 'medium',
          colorScheme: 'purple'
        },
        profile: {
          communicationStyle: [],
          emotionalPatterns: [],
          topics: [],
          goals: [],
          triggers: [],
          preferredTone: 'empathetic'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setUser(newUser);
      conversationMemoryService.saveUser(newUser);
    }
  }, [user, setUser]);

  // Apply theme to document
  useEffect(() => {
    if (user?.preferences.theme) {
      const root = document.documentElement;
      
      if (user.preferences.theme === 'dark') {
        root.classList.add('dark');
      } else if (user.preferences.theme === 'light') {
        root.classList.remove('dark');
      } else if (user.preferences.theme === 'auto') {
        // Follow system preference
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // Listen for system theme changes
        const handleChange = (e: MediaQueryListEvent) => {
          if (e.matches) {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        };
        
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    }
  }, [user?.preferences.theme]);

  // Apply color scheme CSS variables
  useEffect(() => {
    if (user?.preferences.colorScheme) {
      const root = document.documentElement;
      const colorScheme = user.preferences.colorScheme;
      
      // Define color schemes
      const colorSchemes = {
        purple: {
          primary: '99, 102, 241', // indigo-500
          secondary: '139, 92, 246', // violet-500
          accent: '59, 130, 246', // blue-500
        },
        blue: {
          primary: '59, 130, 246', // blue-500
          secondary: '6, 182, 212', // cyan-500
          accent: '14, 165, 233', // sky-500
        },
        green: {
          primary: '16, 185, 129', // emerald-500
          secondary: '20, 184, 166', // teal-500
          accent: '34, 197, 94', // green-500
        },
        pink: {
          primary: '236, 72, 153', // pink-500
          secondary: '244, 63, 94', // rose-500
          accent: '251, 113, 133', // rose-400
        },
        orange: {
          primary: '249, 115, 22', // orange-500
          secondary: '245, 158, 11', // amber-500
          accent: '234, 179, 8', // yellow-500
        },
        slate: {
          primary: '100, 116, 139', // slate-500
          secondary: '107, 114, 128', // gray-500
          accent: '75, 85, 99', // gray-600
        }
      };
      
      const colors = colorSchemes[colorScheme as keyof typeof colorSchemes] || colorSchemes.purple;
      
      root.style.setProperty('--color-primary', colors.primary);
      root.style.setProperty('--color-secondary', colors.secondary);
      root.style.setProperty('--color-accent', colors.accent);
    }
  }, [user?.preferences.colorScheme]);

  // Apply font size
  useEffect(() => {
    if (user?.preferences.fontSize) {
      const root = document.documentElement;
      
      const fontSizes = {
        small: '14px',
        medium: '16px',
        large: '18px'
      };
      
      root.style.setProperty('--base-font-size', fontSizes[user.preferences.fontSize]);
    }
  }, [user?.preferences.fontSize]);

  // Configure services when settings change
  useEffect(() => {
    emotionalAnalysisService.setApiKey(aiSettings.apiKey);
    emotionalAnalysisService.setModel(aiSettings.model);
    
    aiResponseService.setApiKey(aiSettings.apiKey);
    aiResponseService.setModel(aiSettings.model);
    aiResponseService.updateSettings(aiSettings);
  }, [aiSettings]);

  // Update AI system prompt when user personality preference changes
  useEffect(() => {
    if (user?.preferences.aiPersonality) {
      const personality = AI_PERSONALITIES[user.preferences.aiPersonality];
      if (personality) {
        const updatedSettings = {
          ...aiSettings,
          systemPrompt: personality.systemPrompt
        };
        setAiSettings(updatedSettings);
        aiResponseService.updateSettings(updatedSettings);
      }
    }
  }, [user?.preferences.aiPersonality]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    setIsLoading(true);
    
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content,
      sender: 'user',
      timestamp: new Date()
    };

    // Check for crisis indicators
    const crisisCheck = crisisDetectionService.detectCrisis(content);
    if (crisisCheck.detected && crisisCheck.severity !== 'low') {
      setEmergencyResources(crisisDetectionService.getEmergencyResources(crisisCheck.category));
      setShowEmergencyBanner(true);
    }

    try {
      // Analyze emotion
      const emotionalAnalysis = await emotionalAnalysisService.analyzeEmotion(content);
      userMessage.emotions = emotionalAnalysis;

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Generate AI response using the new service
      await generateAIResponse(updatedMessages, crisisCheck);
      
    } catch (error) {
      console.error('Error processing message:', error);
      // Add basic message without emotion analysis
      setMessages(prev => [...prev, userMessage]);
      await generateAIResponse([...messages, userMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (messageHistory: Message[], crisisCheck?: any) => {
    try {
      // Use the new AI response service
      const responseContent = await aiResponseService.generateResponse(messageHistory, user, crisisCheck);

      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: responseContent,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Auto-save conversation if enabled
      if (user?.preferences.autoSave) {
        await saveCurrentConversation([...messageHistory, aiMessage]);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: "I'm here to listen and support you. Could you tell me more about what's on your mind?",
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, fallbackMessage]);
    }
  };

  const saveCurrentConversation = async (messageHistory: Message[]) => {
    if (!currentConversation && messageHistory.length < 2) return;

    const conversationData: Conversation = currentConversation || {
      id: `conv-${Date.now()}`,
      title: generateConversationTitle(messageHistory),
      messages: [],
      summary: '',
      tags: [],
      mood: 'neutral',
      topics: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      starred: false,
      archived: false
    };

    conversationData.messages = messageHistory;
    conversationData.summary = conversationMemoryService.generateSummary(conversationData);
    conversationData.updatedAt = new Date();

    // Extract mood from latest user message
    const latestUserMessage = messageHistory.filter(m => m.sender === 'user').pop();
    if (latestUserMessage?.emotions) {
      conversationData.mood = latestUserMessage.emotions.primary.name;
    }

    conversationMemoryService.saveConversation(conversationData);
    
    if (!currentConversation) {
      setCurrentConversation(conversationData);
    }

    // Update conversations list
    const updatedConversations = conversations.filter(c => c.id !== conversationData.id);
    setConversations([conversationData, ...updatedConversations]);

    // Update user profile
    if (user) {
      conversationMemoryService.updateUserProfile(messageHistory);
    }
  };

  const generateConversationTitle = (messages: Message[]): string => {
    const userMessages = messages.filter(m => m.sender === 'user');
    if (userMessages.length === 0) return 'New Conversation';
    
    const firstMessage = userMessages[0].content;
    const words = firstMessage.split(' ').slice(0, 6).join(' ');
    return words.length > 30 ? words.substring(0, 30) + '...' : words;
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setActiveView('chat');
  };

  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(conversation.messages);
    setActiveView('chat');
  };

  const deleteConversation = (id: string) => {
    conversationMemoryService.deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversation?.id === id) {
      startNewConversation();
    }
  };

  const toggleStarConversation = (id: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, starred: !c.starred } : c
    ));
  };

  const exportConversation = (conversation: Conversation) => {
    const data = {
      title: conversation.title,
      date: conversation.createdAt,
      messages: conversation.messages.map(m => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp,
        emotions: m.emotions
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    conversationMemoryService.saveUser(updatedUser);
  };

  // Generate mock mood data for analytics
  const generateMoodData = (): MoodTrend[] => {
    const data: MoodTrend[] = [];
    const emotions = ['happy', 'calm', 'anxious', 'sad', 'excited', 'frustrated'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date,
        mood: emotions[Math.floor(Math.random() * emotions.length)],
        intensity: Math.random() * 0.8 + 0.2,
        context: 'Sample mood data'
      });
    }
    return data;
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  // Get dynamic theme classes
  const getThemeClasses = () => {
    const isDark = user?.preferences.theme === 'dark' || 
      (user?.preferences.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    return {
      background: isDark 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100',
      headerBg: isDark 
        ? 'bg-slate-800/90 border-slate-700/50' 
        : 'bg-white/90 border-slate-200/50',
      cardBg: isDark 
        ? 'bg-slate-800/80 border-slate-700/20' 
        : 'bg-white/80 border-white/20',
      text: isDark ? 'text-white' : 'text-slate-900',
      textSecondary: isDark ? 'text-slate-300' : 'text-slate-600'
    };
  };

  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.background} transition-all duration-300`} style={{ fontSize: 'var(--base-font-size, 16px)' }}>
      {/* Header */}
      <header className={`${themeClasses.headerBg} backdrop-blur-xl border-b sticky top-0 z-40 shadow-sm transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{
                  background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`
                }}>
                  <Brain className="h-7 w-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${themeClasses.text}`} style={{
                  background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Mendi
                </h1>
                <p className={`text-sm font-medium ${themeClasses.textSecondary}`}>Your AI Emotional Companion</p>
              </div>
            </div>

            <nav className={`flex items-center gap-1 rounded-2xl p-1.5 ${themeClasses.cardBg} backdrop-blur-sm`}>
              <Button
                variant={activeView === 'chat' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('chat')}
                icon={MessageCircle}
                className="rounded-xl"
              >
                Chat
              </Button>
              <Button
                variant={activeView === 'conversations' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('conversations')}
                icon={Users}
                className="rounded-xl"
              >
                History
              </Button>
              <Button
                variant={activeView === 'analytics' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('analytics')}
                icon={BarChart3}
                className="rounded-xl"
              >
                Insights
              </Button>
              <div className={`w-px h-6 mx-1 ${themeClasses.textSecondary} opacity-30`}></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                icon={Settings}
                className="rounded-xl"
              >
                Settings
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'chat' && (
          <div className="max-w-4xl mx-auto">
            {/* Chat Container */}
            <div className={`${themeClasses.cardBg} backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border mb-6 transition-all duration-300`}>
              {/* Chat Header */}
              <div className="relative text-white p-8" style={{
                background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)), rgb(var(--color-accent)))`
              }}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      {currentConversation?.title || 'New Conversation'}
                    </h2>
                    <p className="text-white/90 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Share your thoughts in a safe, judgment-free space
                    </p>
                    {aiSettings.apiKey && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/80">
                        <Zap className="h-3 w-3" />
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        Enhanced AI Analysis Active
                      </div>
                    )}
                  </div>
                  {messages.length > 0 && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={startNewConversation} 
                      icon={Plus}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                    >
                      New Chat
                    </Button>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              {/* Emergency Banner */}
              {showEmergencyBanner && (
                <EmergencyBanner
                  resources={emergencyResources}
                  onClose={() => setShowEmergencyBanner(false)}
                />
              )}

              {/* Messages */}
              <div className={`h-[500px] overflow-y-auto transition-all duration-300 ${
                user?.preferences.theme === 'dark' 
                  ? 'bg-gradient-to-b from-slate-800/50 to-slate-900/50' 
                  : 'bg-gradient-to-b from-slate-50/50 to-white/50'
              }`}>
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-md">
                      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${themeClasses.cardBg}`}>
                        <MessageCircle className="h-10 w-10" style={{ color: `rgb(var(--color-primary))` }} />
                      </div>
                      <h3 className={`text-xl font-semibold mb-3 ${themeClasses.text}`}>Welcome to Mendi</h3>
                      <p className={`leading-relaxed ${themeClasses.textSecondary}`}>
                        I'm here to listen and support you through whatever you're experiencing. 
                        Share what's on your mind, and let's explore it together.
                      </p>
                      <div className={`flex items-center justify-center gap-2 mt-4 text-sm ${themeClasses.textSecondary}`}>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span>Ready to listen</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 p-4">
                    {messages.map((message) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        onSpeak={handleSpeak}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{
                            background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`
                          }}>
                            <LoadingSpinner size="sm" />
                          </div>
                          <div className={`${themeClasses.cardBg} backdrop-blur-sm shadow-xl border rounded-3xl rounded-bl-lg p-4`}>
                            <div className={`flex items-center gap-3 ${themeClasses.textSecondary}`}>
                              <LoadingSpinner size="sm" />
                              <span className="text-sm font-medium">Mendi is thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input - Separate from chat container */}
            <ChatInput 
              onSendMessage={handleSendMessage} 
              disabled={isLoading}
              onOpenSettings={() => setShowSettings(true)}
            />
          </div>
        )}

        {activeView === 'conversations' && (
          <ConversationList
            conversations={conversations}
            onSelectConversation={selectConversation}
            onDeleteConversation={deleteConversation}
            onToggleStar={toggleStarConversation}
            onExportConversation={exportConversation}
          />
        )}

        {activeView === 'analytics' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className={`text-4xl font-bold mb-4 ${themeClasses.text}`}>
                Your Emotional Journey
              </h2>
              <p className={`max-w-2xl mx-auto text-lg ${themeClasses.textSecondary}`}>
                Track your emotional patterns, mood trends, and personal growth over time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MoodChart data={generateMoodData()} />
              
              <div className={`${themeClasses.cardBg} backdrop-blur-xl p-8 rounded-3xl shadow-xl border transition-all duration-300`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 ${themeClasses.text}`}>
                  <Sparkles className="h-5 w-5" style={{ color: `rgb(var(--color-primary))` }} />
                  Recent Insights
                </h3>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl border" style={{
                    background: `linear-gradient(135deg, rgba(var(--color-primary), 0.1), rgba(var(--color-secondary), 0.1))`,
                    borderColor: `rgba(var(--color-primary), 0.2)`
                  }}>
                    <h4 className={`font-semibold mb-2 ${themeClasses.text}`}>Communication Pattern</h4>
                    <p className={`text-sm leading-relaxed ${themeClasses.textSecondary}`}>
                      You tend to be more emotionally expressive in the evenings, showing increased openness about personal challenges.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border" style={{
                    background: `linear-gradient(135deg, rgba(var(--color-secondary), 0.1), rgba(var(--color-accent), 0.1))`,
                    borderColor: `rgba(var(--color-secondary), 0.2)`
                  }}>
                    <h4 className={`font-semibold mb-2 ${themeClasses.text}`}>Growth Area</h4>
                    <p className={`text-sm leading-relaxed ${themeClasses.textSecondary}`}>
                      Your emotional awareness has improved 23% over the past month, particularly in recognizing anxiety triggers.
                    </p>
                  </div>
                  <div className="p-5 rounded-2xl border" style={{
                    background: `linear-gradient(135deg, rgba(var(--color-accent), 0.1), rgba(var(--color-primary), 0.1))`,
                    borderColor: `rgba(var(--color-accent), 0.2)`
                  }}>
                    <h4 className={`font-semibold mb-2 ${themeClasses.text}`}>Strength</h4>
                    <p className={`text-sm leading-relaxed ${themeClasses.textSecondary}`}>
                      You consistently demonstrate resilience and self-reflection in challenging situations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${themeClasses.cardBg} backdrop-blur-xl p-8 rounded-3xl shadow-xl text-center border transition-all duration-300`}>
                <div className="text-4xl font-bold mb-3" style={{
                  background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {conversations.length}
                </div>
                <div className={`font-medium ${themeClasses.textSecondary}`}>Total Conversations</div>
              </div>
              <div className={`${themeClasses.cardBg} backdrop-blur-xl p-8 rounded-3xl shadow-xl text-center border transition-all duration-300`}>
                <div className="text-4xl font-bold mb-3" style={{
                  background: `linear-gradient(135deg, rgb(var(--color-secondary)), rgb(var(--color-accent)))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {Math.round(conversations.reduce((sum, c) => sum + c.messages.length, 0) / conversations.length) || 0}
                </div>
                <div className={`font-medium ${themeClasses.textSecondary}`}>Avg Messages per Chat</div>
              </div>
              <div className={`${themeClasses.cardBg} backdrop-blur-xl p-8 rounded-3xl shadow-xl text-center border transition-all duration-300`}>
                <div className="text-4xl font-bold mb-3" style={{
                  background: `linear-gradient(135deg, rgb(var(--color-accent)), rgb(var(--color-primary)))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {conversations.filter(c => c.starred).length}
                </div>
                <div className={`font-medium ${themeClasses.textSecondary}`}>Starred Conversations</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Built with Bolt.new Badge */}
      <div className="fixed bottom-6 right-6 z-30">
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 backdrop-blur-xl border"
          style={{
            background: user?.preferences.theme === 'dark' 
              ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.9))'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
            borderColor: user?.preferences.theme === 'dark' 
              ? 'rgba(71, 85, 105, 0.3)'
              : 'rgba(203, 213, 225, 0.3)'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
              background: `linear-gradient(135deg, rgb(var(--color-primary)), rgb(var(--color-secondary)))`
            }}>
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className={`text-xs font-medium ${themeClasses.textSecondary} group-hover:opacity-80 transition-opacity`}>
                Built with
              </span>
              <span className={`text-sm font-bold ${themeClasses.text} group-hover:opacity-90 transition-opacity`}>
                Bolt.new
              </span>
            </div>
          </div>
          <ExternalLink className={`h-3.5 w-3.5 ${themeClasses.textSecondary} opacity-60 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5`} />
        </a>
      </div>

      {/* Settings Modal */}
      {user && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          user={user}
          onUpdateUser={updateUser}
          aiSettings={aiSettings}
          onUpdateAI={setAiSettings}
          voiceSettings={voiceSettings}
          onUpdateVoice={setVoiceSettings}
        />
      )}
    </div>
  );
}

export default App;