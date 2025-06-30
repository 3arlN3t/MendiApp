import { User, Conversation, Message, UserProfile, EmotionalPattern } from '../types';

export class ConversationMemoryService {
  private storageKey = 'mendi_memory';

  saveUser(user: User): void {
    localStorage.setItem(`${this.storageKey}_user`, JSON.stringify(user));
  }

  getUser(): User | null {
    const stored = localStorage.getItem(`${this.storageKey}_user`);
    return stored ? JSON.parse(stored) : null;
  }

  saveConversation(conversation: Conversation): void {
    const conversations = this.getConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index >= 0) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem(`${this.storageKey}_conversations`, JSON.stringify(conversations));
  }

  getConversations(): Conversation[] {
    const stored = localStorage.getItem(`${this.storageKey}_conversations`);
    return stored ? JSON.parse(stored) : [];
  }

  getConversation(id: string): Conversation | null {
    const conversations = this.getConversations();
    return conversations.find(c => c.id === id) || null;
  }

  deleteConversation(id: string): void {
    const conversations = this.getConversations().filter(c => c.id !== id);
    localStorage.setItem(`${this.storageKey}_conversations`, JSON.stringify(conversations));
  }

  updateUserProfile(messages: Message[]): UserProfile {
    const user = this.getUser();
    if (!user) return this.createDefaultProfile();

    // Analyze communication patterns
    const userMessages = messages.filter(m => m.sender === 'user');
    const communicationStyle = this.analyzeCommunicationStyle(userMessages);
    const emotionalPatterns = this.analyzeEmotionalPatterns(userMessages);
    const topics = this.extractTopics(userMessages);

    const updatedProfile: UserProfile = {
      ...user.profile,
      communicationStyle,
      emotionalPatterns,
      topics: [...new Set([...user.profile.topics, ...topics])].slice(0, 20), // Keep top 20
    };

    this.saveUser({ ...user, profile: updatedProfile, updatedAt: new Date() });
    return updatedProfile;
  }

  private createDefaultProfile(): UserProfile {
    return {
      communicationStyle: [],
      emotionalPatterns: [],
      topics: [],
      goals: [],
      triggers: [],
      preferredTone: 'empathetic'
    };
  }

  private analyzeCommunicationStyle(messages: Message[]): string[] {
    const styles: string[] = [];
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    const averageLength = totalLength / messages.length;

    if (averageLength > 200) styles.push('detailed');
    else if (averageLength < 50) styles.push('concise');
    
    const questionCount = messages.filter(m => m.content.includes('?')).length;
    if (questionCount / messages.length > 0.3) styles.push('inquisitive');

    const emotionalWords = messages.filter(m => 
      /feel|feeling|emotion|mood|sad|happy|angry|excited/i.test(m.content)
    ).length;
    if (emotionalWords / messages.length > 0.2) styles.push('emotionally-expressive');

    return styles;
  }

  private analyzeEmotionalPatterns(messages: Message[]): EmotionalPattern[] {
    const patterns: { [key: string]: EmotionalPattern } = {};

    messages.forEach(message => {
      if (message.emotions) {
        const emotion = message.emotions.primary.name;
        if (!patterns[emotion]) {
          patterns[emotion] = {
            emotion,
            frequency: 0,
            triggers: [],
            contexts: [],
            trends: []
          };
        }
        patterns[emotion].frequency++;
        patterns[emotion].trends.push({
          date: message.timestamp,
          intensity: message.emotions.intensity
        });
      }
    });

    return Object.values(patterns);
  }

  private extractTopics(messages: Message[]): string[] {
    const topicKeywords = {
      'work': ['work', 'job', 'career', 'boss', 'colleague', 'office', 'meeting'],
      'relationships': ['relationship', 'partner', 'friend', 'family', 'love', 'dating'],
      'health': ['health', 'doctor', 'medicine', 'exercise', 'diet', 'sleep'],
      'anxiety': ['anxiety', 'anxious', 'worry', 'stress', 'nervous', 'panic'],
      'depression': ['depression', 'depressed', 'sad', 'down', 'hopeless'],
      'goals': ['goal', 'dream', 'ambition', 'plan', 'future', 'achieve'],
      'finance': ['money', 'budget', 'debt', 'savings', 'financial', 'income']
    };

    const topicCounts: { [key: string]: number } = {};
    const combinedText = messages.map(m => m.content.toLowerCase()).join(' ');

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      topicCounts[topic] = keywords.reduce((count, keyword) => {
        return count + (combinedText.match(new RegExp(keyword, 'g')) || []).length;
      }, 0);
    });

    return Object.entries(topicCounts)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([topic]) => topic);
  }

  generateSummary(conversation: Conversation): string {
    const userMessages = conversation.messages.filter(m => m.sender === 'user');
    const topics = this.extractTopics(userMessages);
    const emotions = conversation.messages
      .filter(m => m.emotions)
      .map(m => m.emotions!.primary.name);
    
    const dominantEmotion = emotions.length > 0 
      ? emotions.reduce((a, b, _, arr) => 
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        )
      : 'neutral';

    return `Discussed ${topics.slice(0, 3).join(', ')} with a predominantly ${dominantEmotion} mood. ${userMessages.length} user messages exchanged.`;
  }

  getContextForResponse(conversationId: string): string {
    const conversation = this.getConversation(conversationId);
    const user = this.getUser();
    
    if (!conversation || !user) return '';

    const recentMessages = conversation.messages.slice(-5);
    const userProfile = user.profile;
    
    return `
      User Profile: Communication style: ${userProfile.communicationStyle.join(', ')}. 
      Recent topics: ${userProfile.topics.slice(0, 5).join(', ')}.
      Conversation context: ${recentMessages.map(m => 
        `${m.sender}: ${m.content.substring(0, 100)}`
      ).join(' | ')}
    `.trim();
  }
}

export const conversationMemoryService = new ConversationMemoryService();