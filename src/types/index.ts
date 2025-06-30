export interface User {
  id: string;
  name: string;
  avatar: string;
  preferences: UserPreferences;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  aiPersonality: 'empathetic' | 'professional' | 'casual' | 'analytical';
  voiceEnabled: boolean;
  notifications: boolean;
  autoSave: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorScheme: string;
}

export interface UserProfile {
  communicationStyle: string[];
  emotionalPatterns: EmotionalPattern[];
  topics: string[];
  goals: string[];
  triggers: string[];
  preferredTone: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  emotions?: EmotionalAnalysis;
  audioData?: ArrayBuffer;
  metadata?: MessageMetadata;
}

export interface EmotionalAnalysis {
  primary: Emotion;
  secondary?: Emotion;
  intensity: number;
  confidence: number;
  context: string;
  timestamp: Date;
}

export interface Emotion {
  name: string;
  category: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust' | 'neutral';
  intensity: number;
  description: string;
}

export interface EmotionalPattern {
  emotion: string;
  frequency: number;
  triggers: string[];
  contexts: string[];
  trends: { date: Date; intensity: number }[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  summary: string;
  tags: string[];
  mood: string;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
  starred: boolean;
  archived: boolean;
}

export interface MessageMetadata {
  wordCount: number;
  sentiment: number;
  keywords: string[];
  duration?: number;
}

export interface VoiceSettings {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  vadThreshold: number;
  noiseSuppressionEnabled: boolean;
}

export interface AISettings {
  provider: 'openai' | 'mock';
  model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-3.5-turbo';
  apiKey: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

export interface AnalyticsData {
  moodTrends: MoodTrend[];
  emotionalPatterns: EmotionalPattern[];
  conversationStats: ConversationStats;
  growthMetrics: GrowthMetric[];
  weeklyInsights: WeeklyInsight[];
}

export interface MoodTrend {
  date: Date;
  mood: string;
  intensity: number;
  context: string;
}

export interface ConversationStats {
  total: number;
  thisWeek: number;
  averageLength: number;
  topTopics: { topic: string; count: number }[];
  engagementScore: number;
}

export interface GrowthMetric {
  metric: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface WeeklyInsight {
  week: Date;
  summary: string;
  improvements: string[];
  challenges: string[];
  recommendations: string[];
}

export interface CrisisKeyword {
  keyword: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'self-harm' | 'suicide' | 'violence' | 'substance' | 'mental-health';
}

export interface EmergencyResource {
  name: string;
  phone: string;
  text?: string;
  website: string;
  description: string;
  available24x7: boolean;
  country: string;
}