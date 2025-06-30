import { CrisisKeyword, EmergencyResource } from '../types';

export const CRISIS_KEYWORDS: CrisisKeyword[] = [
  { keyword: 'suicide', severity: 'critical', category: 'suicide' },
  { keyword: 'kill myself', severity: 'critical', category: 'suicide' },
  { keyword: 'end it all', severity: 'high', category: 'suicide' },
  { keyword: 'self harm', severity: 'high', category: 'self-harm' },
  { keyword: 'hurt myself', severity: 'high', category: 'self-harm' },
  { keyword: 'cutting', severity: 'medium', category: 'self-harm' },
  { keyword: 'hopeless', severity: 'medium', category: 'mental-health' },
  { keyword: 'worthless', severity: 'medium', category: 'mental-health' },
  { keyword: 'panic attack', severity: 'medium', category: 'mental-health' },
];

export const EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    name: 'National Suicide Prevention Lifeline',
    phone: '988',
    text: '741741',
    website: 'https://suicidepreventionlifeline.org',
    description: '24/7 crisis support for suicide prevention',
    available24x7: true,
    country: 'US'
  },
  {
    name: 'Crisis Text Line',
    phone: '',
    text: '741741',
    website: 'https://crisistextline.org',
    description: 'Text HOME to 741741 for crisis support',
    available24x7: true,
    country: 'US'
  },
  {
    name: 'SAMHSA National Helpline',
    phone: '1-800-662-4357',
    website: 'https://samhsa.gov',
    description: 'Mental health and substance abuse treatment',
    available24x7: true,
    country: 'US'
  }
];

export const EMOTION_CATEGORIES = {
  joy: { color: '#10B981', icon: '😊' },
  sadness: { color: '#3B82F6', icon: '😢' },
  anger: { color: '#EF4444', icon: '😠' },
  fear: { color: '#8B5CF6', icon: '😰' },
  surprise: { color: '#F59E0B', icon: '😲' },
  disgust: { color: '#84CC16', icon: '🤢' },
  neutral: { color: '#6B7280', icon: '😐' }
};

export const AI_PERSONALITIES = {
  empathetic: {
    name: 'Empathetic',
    description: 'Warm, understanding, and emotionally supportive',
    systemPrompt: 'You are a warm, empathetic AI companion focused on emotional support and understanding.'
  },
  professional: {
    name: 'Professional',
    description: 'Clinical, structured, and therapeutically-oriented',
    systemPrompt: 'You are a professional therapeutic AI assistant providing structured emotional guidance.'
  },
  casual: {
    name: 'Casual',
    description: 'Friendly, conversational, and approachable',
    systemPrompt: 'You are a friendly, casual AI companion who talks like a supportive friend.'
  },
  analytical: {
    name: 'Analytical',
    description: 'Thoughtful, insightful, and pattern-focused',
    systemPrompt: 'You are an analytical AI companion focused on patterns, insights, and structured thinking.'
  }
};

export const MOCK_CONVERSATIONS = [
  {
    id: '1',
    title: 'Morning Anxiety Discussion',
    messages: [],
    summary: 'User discussed morning anxiety and work stress. Provided coping strategies.',
    tags: ['anxiety', 'work', 'coping'],
    mood: 'anxious',
    topics: ['work stress', 'morning routine'],
    createdAt: new Date('2024-01-15T08:30:00'),
    updatedAt: new Date('2024-01-15T09:15:00'),
    starred: true,
    archived: false
  },
  {
    id: '2',
    title: 'Relationship Concerns',
    messages: [],
    summary: 'Explored feelings about relationship changes and communication patterns.',
    tags: ['relationships', 'communication'],
    mood: 'confused',
    topics: ['relationships', 'communication'],
    createdAt: new Date('2024-01-14T19:20:00'),
    updatedAt: new Date('2024-01-14T20:05:00'),
    starred: false,
    archived: false
  }
];