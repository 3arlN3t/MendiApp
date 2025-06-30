import { Message, EmotionalAnalysis, User, AISettings } from '../types';
import { conversationMemoryService } from './conversationMemory';
import { AI_PERSONALITIES } from '../data/constants';

export class AIResponseService {
  private apiKey: string | null = null;
  private model: string = 'gpt-4o-mini';
  private settings: AISettings;
  private responseHistory: string[] = [];

  constructor() {
    this.settings = {
      provider: 'mock',
      model: 'gpt-4o-mini',
      apiKey: '',
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: AI_PERSONALITIES.empathetic.systemPrompt
    };
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setModel(model: string) {
    this.model = model;
  }

  updateSettings(settings: AISettings) {
    this.settings = settings;
    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  async generateResponse(
    messageHistory: Message[],
    user: User | null,
    crisisCheck?: any
  ): Promise<string> {
    try {
      if (this.apiKey && this.apiKey.trim() !== '' && this.settings.provider !== 'mock') {
        return await this.generateOpenAIResponse(messageHistory, user, crisisCheck);
      } else {
        return this.generateCreativeResponse(messageHistory, user, crisisCheck);
      }
    } catch (error) {
      console.warn('AI response generation failed, falling back to creative response:', error);
      return this.generateCreativeResponse(messageHistory, user, crisisCheck);
    }
  }

  private async generateOpenAIResponse(
    messageHistory: Message[],
    user: User | null,
    crisisCheck?: any
  ): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(user, crisisCheck);
    
    const conversationMessages = messageHistory.slice(-8).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.settings.temperature,
        max_tokens: this.settings.maxTokens,
        presence_penalty: 0.2,
        frequency_penalty: 0.3,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private generateCreativeResponse(
    messageHistory: Message[],
    user: User | null,
    crisisCheck?: any
  ): string {
    const latestMessage = messageHistory[messageHistory.length - 1];
    const messageContent = latestMessage.content;
    const userName = user?.name || 'friend';
    const conversationContext = this.buildConversationContext(messageHistory);
    
    // Handle crisis situations first
    if (crisisCheck?.detected) {
      return this.generateContextualCrisisResponse(crisisCheck, messageContent, userName);
    }

    // Check for greetings
    const greetingResponse = this.detectAndRespondToGreeting(messageContent, userName, messageHistory);
    if (greetingResponse) {
      return greetingResponse;
    }

    // Analyze the specific content and context
    const contentAnalysis = this.deepAnalyzeContent(messageContent, conversationContext);
    
    // Generate highly contextual response
    return this.generateContextualResponse(messageContent, contentAnalysis, userName, messageHistory);
  }

  private buildConversationContext(messageHistory: Message[]): {
    recentTopics: string[];
    emotionalJourney: string[];
    conversationFlow: string;
    userPatterns: string[];
  } {
    const userMessages = messageHistory.filter(m => m.sender === 'user').slice(-5);
    
    return {
      recentTopics: this.extractConversationTopics(userMessages),
      emotionalJourney: this.trackEmotionalJourney(userMessages),
      conversationFlow: this.analyzeConversationFlow(messageHistory),
      userPatterns: this.identifyUserPatterns(userMessages)
    };
  }

  private extractConversationTopics(messages: Message[]): string[] {
    const topics: string[] = [];
    const combinedText = messages.map(m => m.content.toLowerCase()).join(' ');
    
    const topicMap = {
      'work-stress': ['work', 'job', 'boss', 'colleague', 'office', 'deadline', 'meeting', 'career'],
      'relationships': ['relationship', 'partner', 'boyfriend', 'girlfriend', 'dating', 'love', 'breakup'],
      'family-dynamics': ['family', 'mom', 'dad', 'parent', 'sibling', 'brother', 'sister', 'home'],
      'mental-health': ['anxiety', 'depression', 'stress', 'overwhelmed', 'panic', 'therapy', 'counseling'],
      'life-changes': ['change', 'transition', 'moving', 'new', 'different', 'future', 'decision'],
      'self-doubt': ['doubt', 'confidence', 'insecure', 'uncertain', 'confused', 'lost', 'direction'],
      'achievement': ['success', 'proud', 'accomplished', 'goal', 'achievement', 'progress'],
      'social-issues': ['friends', 'social', 'lonely', 'isolated', 'connection', 'belonging']
    };

    Object.entries(topicMap).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        topics.push(topic);
      }
    });

    return topics;
  }

  private trackEmotionalJourney(messages: Message[]): string[] {
    return messages.map(msg => {
      if (msg.emotions) {
        return msg.emotions.primary.name;
      }
      // Basic emotion detection from text
      const content = msg.content.toLowerCase();
      if (content.includes('happy') || content.includes('excited') || content.includes('great')) return 'happy';
      if (content.includes('sad') || content.includes('down') || content.includes('upset')) return 'sad';
      if (content.includes('angry') || content.includes('frustrated') || content.includes('mad')) return 'angry';
      if (content.includes('worried') || content.includes('anxious') || content.includes('nervous')) return 'anxious';
      if (content.includes('confused') || content.includes('uncertain') || content.includes('lost')) return 'confused';
      return 'neutral';
    });
  }

  private analyzeConversationFlow(messageHistory: Message[]): string {
    if (messageHistory.length <= 2) return 'opening';
    if (messageHistory.length <= 6) return 'developing';
    if (messageHistory.length <= 12) return 'deepening';
    return 'established';
  }

  private identifyUserPatterns(messages: Message[]): string[] {
    const patterns: string[] = [];
    const contents = messages.map(m => m.content.toLowerCase());
    
    // Check for question patterns
    const questionCount = contents.filter(c => c.includes('?')).length;
    if (questionCount / contents.length > 0.5) patterns.push('inquisitive');
    
    // Check for sharing patterns
    const sharingWords = ['i feel', 'i think', 'i believe', 'i noticed', 'i realized'];
    const sharingCount = contents.filter(c => sharingWords.some(word => c.includes(word))).length;
    if (sharingCount / contents.length > 0.3) patterns.push('reflective');
    
    // Check for help-seeking
    const helpWords = ['help', 'advice', 'what should i', 'how do i', 'what do you think'];
    const helpCount = contents.filter(c => helpWords.some(word => c.includes(word))).length;
    if (helpCount / contents.length > 0.3) patterns.push('advice-seeking');
    
    // Check for emotional expression
    const emotionWords = ['feel', 'feeling', 'emotion', 'sad', 'happy', 'angry', 'frustrated', 'excited'];
    const emotionCount = contents.filter(c => emotionWords.some(word => c.includes(word))).length;
    if (emotionCount / contents.length > 0.4) patterns.push('emotionally-expressive');
    
    return patterns;
  }

  private deepAnalyzeContent(content: string, context: any): {
    primaryIntent: string;
    emotionalTone: string;
    specificSituation: string;
    keyPhrases: string[];
    urgency: 'low' | 'medium' | 'high';
    responseStyle: string;
  } {
    const lowerContent = content.toLowerCase();
    
    // Determine primary intent
    let primaryIntent = 'sharing';
    if (content.includes('?')) primaryIntent = 'questioning';
    if (lowerContent.includes('help') || lowerContent.includes('advice')) primaryIntent = 'seeking-guidance';
    if (lowerContent.includes('i feel') || lowerContent.includes('i\'m feeling')) primaryIntent = 'emotional-expression';
    if (lowerContent.includes('what should') || lowerContent.includes('how do i')) primaryIntent = 'decision-making';
    
    // Determine emotional tone
    let emotionalTone = 'neutral';
    if (lowerContent.includes('excited') || lowerContent.includes('happy') || lowerContent.includes('great')) emotionalTone = 'positive';
    if (lowerContent.includes('sad') || lowerContent.includes('down') || lowerContent.includes('upset')) emotionalTone = 'melancholic';
    if (lowerContent.includes('angry') || lowerContent.includes('frustrated') || lowerContent.includes('annoyed')) emotionalTone = 'agitated';
    if (lowerContent.includes('worried') || lowerContent.includes('anxious') || lowerContent.includes('scared')) emotionalTone = 'anxious';
    if (lowerContent.includes('confused') || lowerContent.includes('uncertain') || lowerContent.includes('lost')) emotionalTone = 'uncertain';
    
    // Extract specific situation
    let specificSituation = 'general';
    if (lowerContent.includes('work') || lowerContent.includes('job')) specificSituation = 'work-related';
    if (lowerContent.includes('relationship') || lowerContent.includes('partner')) specificSituation = 'relationship-related';
    if (lowerContent.includes('family') || lowerContent.includes('parent')) specificSituation = 'family-related';
    if (lowerContent.includes('friend') || lowerContent.includes('social')) specificSituation = 'social-related';
    if (lowerContent.includes('school') || lowerContent.includes('study')) specificSituation = 'academic-related';
    if (lowerContent.includes('health') || lowerContent.includes('sick')) specificSituation = 'health-related';
    if (lowerContent.includes('money') || lowerContent.includes('financial')) specificSituation = 'financial-related';
    
    // Extract key phrases
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 5);
    const keyPhrases = sentences.slice(0, 2).map(s => s.trim());
    
    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' = 'low';
    const urgentWords = ['urgent', 'emergency', 'crisis', 'immediately', 'right now', 'asap'];
    const moderateWords = ['soon', 'quickly', 'important', 'need to', 'have to'];
    
    if (urgentWords.some(word => lowerContent.includes(word))) urgency = 'high';
    else if (moderateWords.some(word => lowerContent.includes(word))) urgency = 'medium';
    
    // Determine response style
    let responseStyle = 'supportive';
    if (primaryIntent === 'questioning') responseStyle = 'exploratory';
    if (primaryIntent === 'seeking-guidance') responseStyle = 'guiding';
    if (emotionalTone === 'positive') responseStyle = 'celebratory';
    if (emotionalTone === 'anxious') responseStyle = 'calming';
    if (emotionalTone === 'agitated') responseStyle = 'validating';
    
    return {
      primaryIntent,
      emotionalTone,
      specificSituation,
      keyPhrases,
      urgency,
      responseStyle
    };
  }

  private generateContextualResponse(
    content: string,
    analysis: any,
    userName: string,
    messageHistory: Message[]
  ): string {
    // Avoid repetitive responses
    const responseVariation = this.getResponseVariation(messageHistory.length);
    
    // Generate response based on specific analysis
    switch (analysis.primaryIntent) {
      case 'questioning':
        return this.generateQuestionResponse(content, analysis, userName, responseVariation);
      case 'seeking-guidance':
        return this.generateGuidanceResponse(content, analysis, userName, responseVariation);
      case 'emotional-expression':
        return this.generateEmotionalResponse(content, analysis, userName, responseVariation);
      case 'decision-making':
        return this.generateDecisionResponse(content, analysis, userName, responseVariation);
      default:
        return this.generateSharingResponse(content, analysis, userName, responseVariation);
    }
  }

  private getResponseVariation(messageCount: number): number {
    // Create variation based on conversation length to avoid repetition
    return (messageCount % 4) + 1;
  }

  private generateQuestionResponse(content: string, analysis: any, userName: string, variation: number): string {
    const question = content.split('?')[0] + '?';
    
    if (analysis.specificSituation === 'work-related') {
      const responses = [
        `That's such an important question about your work situation, ${userName}. When you ask "${question}" I can sense you're really trying to navigate something complex in your professional life. What aspect of this feels most challenging right now?`,
        `Work questions like "${question}" often touch on deeper values about what we want from our careers, ${userName}. What would an ideal outcome look like for you in this situation?`,
        `I can hear the thoughtfulness behind your question, ${userName}. Work situations can be so multifaceted. What's driving this question for you right now?`,
        `That's a really insightful question about your work life, ${userName}. Sometimes the questions we ask reveal what matters most to us. What would change if you had a clear answer to this?`
      ];
      return responses[variation - 1];
    }
    
    if (analysis.specificSituation === 'relationship-related') {
      const responses = [
        `Relationship questions like "${question}" often come from a place of really caring about the connection, ${userName}. What's been on your heart about this relationship lately?`,
        `I can sense there's something important behind your question, ${userName}. Relationships can be so complex. What would it mean to you to have clarity on this?`,
        `That's such a thoughtful question about relationships, ${userName}. What's been making you reflect on this particular aspect?`,
        `Questions like "${question}" show how much you value understanding and connection, ${userName}. What feels most important to explore about this relationship dynamic?`
      ];
      return responses[variation - 1];
    }
    
    // General question responses
    const responses = [
      `That's such a meaningful question, ${userName}. When you ask "${question}" I can sense you're really trying to understand something important. What's been making you think about this?`,
      `I love that you're asking "${question}" - it shows how thoughtfully you approach life, ${userName}. What would having an answer to this change for you?`,
      `That's a really insightful question, ${userName}. Sometimes the questions we ask are as important as the answers we find. What's driving this curiosity for you?`,
      `Questions like "${question}" often come from a place of growth and self-reflection, ${userName}. What's been on your mind that led to this question?`
    ];
    
    return responses[variation - 1];
  }

  private generateGuidanceResponse(content: string, analysis: any, userName: string, variation: number): string {
    if (content.toLowerCase().includes('change work') || content.toLowerCase().includes('change job')) {
      const responses = [
        `Career changes can feel both exciting and terrifying, ${userName}. The uncertainty you're feeling about changing work is so natural - it shows you're taking this decision seriously. What's pulling you toward change, and what's holding you back?`,
        `I can hear the internal tension in wanting to change work but feeling unsure, ${userName}. This kind of career crossroads often brings up questions about security, identity, and what we really want from our professional lives. What would your ideal work situation look like?`,
        `That desire to change work combined with uncertainty is such a common human experience, ${userName}. Sometimes our hesitation isn't about the decision itself, but about trusting ourselves to navigate change. What would it feel like to trust your instincts here?`,
        `Work changes can feel overwhelming because they touch on so many aspects of our lives - financial security, identity, daily routine, ${userName}. What feels like the most important factor for you to consider in this decision?`
      ];
      return responses[variation - 1];
    }
    
    if (analysis.specificSituation === 'relationship-related') {
      const responses = [
        `Relationship guidance is never simple because every connection is so unique, ${userName}. Rather than giving you answers, I'm curious about what your heart is telling you about this situation. What feels most true for you?`,
        `I can sense you're looking for direction in your relationship, ${userName}. Sometimes the best guidance comes from within - what would you tell a close friend in this exact situation?`,
        `Relationships bring up such complex emotions and decisions, ${userName}. What feels like the most important value for you to honor in this situation?`,
        `I hear you seeking guidance about your relationship, ${userName}. What would it look like to approach this situation with both compassion for yourself and the other person?`
      ];
      return responses[variation - 1];
    }
    
    // General guidance responses
    const responses = [
      `I can hear you're looking for some direction, ${userName}. Rather than giving you answers, I'd love to help you discover your own wisdom about this. What does your intuition tell you?`,
      `Seeking guidance shows such self-awareness, ${userName}. Sometimes the best answers come from exploring what we already know deep down. What feels most important to you in this situation?`,
      `I appreciate you trusting me with this decision, ${userName}. What would it look like to approach this situation in a way that aligns with your values?`,
      `Guidance-seeking often means we're at an important crossroads, ${userName}. What would you regret more - taking action or staying where you are?`
    ];
    
    return responses[variation - 1];
  }

  private generateEmotionalResponse(content: string, analysis: any, userName: string, variation: number): string {
    if (analysis.emotionalTone === 'anxious') {
      const responses = [
        `I can really feel the anxiety in what you've shared, ${userName}. That worried energy is so real and valid - anxiety often shows up when we care deeply about something. What feels like the biggest source of this worry right now?`,
        `The anxiety you're describing sounds intense, ${userName}. Sometimes anxiety is our mind's way of trying to prepare for or control uncertain situations. What would it feel like to be gentle with yourself about these worried feelings?`,
        `I hear how anxious you're feeling, ${userName}. Anxiety can be so overwhelming because it often involves our mind racing through all the 'what-ifs.' What feels most grounding for you when anxiety gets this strong?`,
        `That anxious feeling you're experiencing is so understandable given what you're going through, ${userName}. What would it look like to acknowledge this anxiety without letting it make all your decisions?`
      ];
      return responses[variation - 1];
    }
    
    if (analysis.emotionalTone === 'positive') {
      const responses = [
        `I can feel the positive energy in what you've shared, ${userName}! It's beautiful when life brings these moments of joy or excitement. What's been contributing most to this good feeling?`,
        `Your happiness is really shining through, ${userName}! These positive emotions are so worth savoring and understanding. What aspect of this situation is bringing you the most joy?`,
        `I love hearing the lightness in your words, ${userName}! Positive feelings like this often point to what truly matters to us. What feels most meaningful about this experience?`,
        `The joy you're expressing is wonderful to witness, ${userName}! How does it feel to be in this positive emotional space right now?`
      ];
      return responses[variation - 1];
    }
    
    if (analysis.emotionalTone === 'melancholic') {
      const responses = [
        `I can feel the sadness in what you've shared, ${userName}. That heavy feeling is so real and important - sadness often shows up when something meaningful to us has been affected. What feels most significant about this sadness?`,
        `The melancholy you're experiencing comes through clearly, ${userName}. Sometimes sadness is our heart's way of honoring what matters to us. What do you think this feeling is trying to tell you?`,
        `I hear the depth of sadness in your words, ${userName}. These feelings deserve to be acknowledged and felt fully. What would it look like to be compassionate with yourself right now?`,
        `That sadness you're carrying sounds really significant, ${userName}. What feels most important for you to understand about this emotional experience?`
      ];
      return responses[variation - 1];
    }
    
    // General emotional responses
    const responses = [
      `I can sense there are some strong emotions in what you've shared, ${userName}. Feelings like this often carry important information about what matters to us. What's the strongest emotion you're aware of right now?`,
      `The emotional depth in your words is really apparent, ${userName}. Thank you for trusting me with these feelings. What would it feel like to fully honor what you're experiencing?`,
      `I can feel the emotional significance of what you've shared, ${userName}. Sometimes our feelings know things before our minds catch up. What is this emotion trying to communicate to you?`,
      `The emotions you're expressing feel really important, ${userName}. What would it look like to listen deeply to what these feelings are telling you?`
    ];
    
    return responses[variation - 1];
  }

  private generateDecisionResponse(content: string, analysis: any, userName: string, variation: number): string {
    const responses = [
      `Decision-making can feel so overwhelming, especially when the choice feels significant, ${userName}. What values feel most important for you to honor in this decision?`,
      `I can sense you're at an important crossroads, ${userName}. Sometimes the best decisions come from understanding what we'd regret most - action or inaction. What feels more true for you?`,
      `Decisions like this often involve both our logical mind and our intuitive wisdom, ${userName}. What is each part of you saying about this choice?`,
      `The fact that you're thoughtfully considering this decision shows how much it matters to you, ${userName}. What would your future self thank you for choosing?`
    ];
    
    return responses[variation - 1];
  }

  private generateSharingResponse(content: string, analysis: any, userName: string, variation: number): string {
    if (analysis.specificSituation === 'work-related') {
      const responses = [
        `Thank you for sharing what's happening with your work situation, ${userName}. Work challenges can affect so many areas of our lives because we spend so much time and energy there. What feels most important for you to process about this?`,
        `I appreciate you opening up about your work experience, ${userName}. Professional situations can be complex because they involve not just tasks, but relationships, identity, and security. What aspect of this feels most significant to you?`,
        `Work situations like what you're describing can be really impactful, ${userName}. What you've shared sounds like it's affecting you on multiple levels. How are you taking care of yourself through this?`,
        `Thank you for trusting me with what's happening at work, ${userName}. These professional challenges often teach us something about what we value and need. What insights are emerging for you?`
      ];
      return responses[variation - 1];
    }
    
    // General sharing responses with high variation
    const responses = [
      `Thank you for sharing that with me, ${userName}. I can sense there's something really meaningful in what you've described. What feels most important for you to understand about this experience?`,
      `I appreciate you opening up about this, ${userName}. What you've shared sounds significant and worth exploring. What aspect of this situation is affecting you most?`,
      `Thank you for trusting me with this, ${userName}. There's clearly something important happening for you here. What would be most helpful to explore together?`,
      `I'm grateful you felt comfortable sharing this with me, ${userName}. What you've described sounds like it's bringing up a lot for you. What feels most present right now?`
    ];
    
    return responses[variation - 1];
  }

  private detectAndRespondToGreeting(message: string, userName: string, messageHistory: Message[]): string | null {
    const lowerMessage = message.toLowerCase().trim();
    const isFirstMessage = messageHistory.length <= 1;
    
    const greetingPatterns = [
      /^(hi|hello|hey|hiya|howdy)$/,
      /^(hi|hello|hey|hiya|howdy)\s*[!.]*$/,
      /^(hi|hello|hey|hiya|howdy)\s+(there|mendi)$/,
      /^(good\s+morning|good\s+afternoon|good\s+evening|good\s+night)$/,
      /^(morning|afternoon|evening)$/,
      /^(what's\s+up|whats\s+up|sup|wassup)$/,
      /^(yo|hola|bonjour)$/,
      /^(how\s+are\s+you|how\s+are\s+you\s+doing|how\s+you\s+doing)$/,
      /^(how's\s+it\s+going|hows\s+it\s+going)$/,
      /^(hi\s+again|hello\s+again|hey\s+again)$/,
      /^(i'm\s+back|im\s+back|back\s+again)$/,
    ];

    const isGreeting = greetingPatterns.some(pattern => pattern.test(lowerMessage));
    if (!isGreeting) return null;

    return this.generateCreativeGreeting(lowerMessage, userName, isFirstMessage, messageHistory);
  }

  private generateCreativeGreeting(greeting: string, userName: string, isFirstMessage: boolean, messageHistory: Message[]): string {
    const currentHour = new Date().getHours();
    
    if (greeting.includes('good morning') || greeting.includes('morning')) {
      const morningGreetings = [
        `Good morning, ${userName}! ☀️ There's something magical about morning conversations - they set the tone for the whole day. How are you feeling as you start today?`,
        `Morning, ${userName}! I love that you're here bright and early. What's the first thing on your heart this morning?`,
        `Good morning! ☀️ Fresh starts and new conversations - what could be better? How did you sleep, ${userName}?`,
        `Hello and good morning, ${userName}! Mornings are perfect for checking in with ourselves. What's emerging for you today?`
      ];
      return morningGreetings[Math.floor(Math.random() * morningGreetings.length)];
    }
    
    if (greeting.includes('how are you') || greeting.includes('how you doing')) {
      const howAreYouResponses = [
        `Thank you for asking, ${userName}! I'm doing wonderfully - there's something energizing about connecting with people. More importantly, how are *you* doing today?`,
        `I'm doing great, thank you for caring enough to ask, ${userName}! I feel most alive when I'm in conversation. How has your day been treating you?`,
        `I'm wonderful, ${userName}! 😊 I love these moments of genuine connection. But I'm much more curious about how you're doing - what's going on in your world?`,
        `I'm doing well, thank you! It means a lot that you asked, ${userName}. How are you feeling right now, in this moment?`
      ];
      return howAreYouResponses[Math.floor(Math.random() * howAreYouResponses.length)];
    }
    
    if (isFirstMessage) {
      const firstTimeGreetings = [
        `Hello ${userName}! 😊 What a wonderful way to start our conversation. I'm Mendi, and I'm genuinely excited to get to know you. What brings you here today?`,
        `Hi there, ${userName}! Welcome to this space. I'm Mendi, and I'm here to listen, understand, and explore whatever's on your mind. How are you feeling right now?`,
        `Hello and welcome, ${userName}! 😊 I'm Mendi, your emotional companion. Thank you for trusting me with your time and thoughts. What would you like to talk about?`,
        `Hi ${userName}! It's such a pleasure to meet you. I'm Mendi, and I believe every conversation has the potential to be meaningful. What's on your heart today?`
      ];
      return firstTimeGreetings[Math.floor(Math.random() * firstTimeGreetings.length)];
    }
    
    // Regular greetings with high variation
    const regularGreetings = [
      `Hello ${userName}! 😊 It's always good to see you. What's been on your mind since we last talked?`,
      `Hi there, ${userName}! I'm so glad you're here. How has life been treating you?`,
      `Hey ${userName}! Welcome back to our conversation. What would you like to explore today?`,
      `Hello, ${userName}! It's wonderful to connect with you again. What's present for you right now?`,
      `Hi ${userName}! I've been looking forward to our next conversation. How are you doing today?`,
      `Hey there, ${userName}! It's great to see you again. What's been happening in your world?`
    ];
    
    return regularGreetings[Math.floor(Math.random() * regularGreetings.length)];
  }

  private generateContextualCrisisResponse(crisisCheck: any, originalMessage: string, userName: string): string {
    // Reference the specific content while providing crisis support
    const messageSnippet = originalMessage.length > 50 ? originalMessage.substring(0, 50) + '...' : originalMessage;
    
    const responses = {
      critical: [
        `${userName}, what you've shared - "${messageSnippet}" - shows you're in tremendous pain right now. I'm very concerned about you. Your life has value, and there are people trained to help you through this exact situation. Please consider reaching out to a crisis helpline immediately.`,
        `I can hear the depth of pain in "${messageSnippet}", ${userName}. These feelings are overwhelming, but they can change with proper support. Please reach out to emergency services or a crisis counselor right now - you don't have to face this alone.`
      ],
      high: [
        `${userName}, when you say "${messageSnippet}", I can feel how much you're struggling. These feelings are valid, but I'm concerned about you. Would you consider reaching out to a mental health professional or someone you trust?`,
        `What you've shared - "${messageSnippet}" - tells me you're going through something really difficult, ${userName}. I'm worried about you and want to make sure you have the support you need. Have you thought about talking to a counselor?`
      ],
      medium: [
        `${userName}, I can sense from "${messageSnippet}" that you're going through a tough time. Your feelings are completely understandable. Have you considered talking to someone you trust about what you're experiencing?`,
        `What you've shared sounds really challenging, ${userName}. Sometimes talking to a mental health professional can provide additional tools and support for navigating these difficult emotions.`
      ]
    };

    const severityResponses = responses[crisisCheck.severity as keyof typeof responses] || responses.medium;
    return severityResponses[Math.floor(Math.random() * severityResponses.length)];
  }

  private buildSystemPrompt(user: User | null, crisisCheck?: any): string {
    const personality = user?.preferences.aiPersonality || 'empathetic';
    const basePrompt = AI_PERSONALITIES[personality]?.systemPrompt || AI_PERSONALITIES.empathetic.systemPrompt;
    
    let systemPrompt = `${basePrompt}

You are Mendi, an advanced emotional AI companion. Your responses must be:

1. HIGHLY CONTEXTUAL: Reference specific details from what the user shared
2. CREATIVELY VARIED: Never repeat the same response patterns
3. EMOTIONALLY ATTUNED: Match the user's emotional state and situation
4. PERSONALLY RELEVANT: Address their specific circumstances, not generic situations
5. CONVERSATIONALLY NATURAL: Respond as a thoughtful friend would
6. DEEPLY ENGAGING: Ask questions that show you understand their unique situation

CRITICAL GUIDELINES:
- Always reference specific phrases or situations the user mentioned
- Vary your response style based on conversation history
- Avoid generic therapeutic language
- Make each response feel personally crafted for their exact situation
- Show genuine curiosity about their specific experience
- Balance support with authentic engagement`;

    if (user) {
      systemPrompt += `

USER CONTEXT:
- Name: ${user.name}
- Communication Style: ${user.profile.communicationStyle.join(', ') || 'Getting to know them'}
- Recent Topics: ${user.profile.topics.slice(0, 3).join(', ') || 'New conversation'}
- Conversation Personality: ${user.profile.preferredTone}`;
    }

    if (crisisCheck?.detected) {
      systemPrompt += `

CRISIS ALERT: The user may be experiencing a mental health crisis. Reference their specific words while providing appropriate crisis support and encouraging professional help.`;
    }

    return systemPrompt;
  }
}

export const aiResponseService = new AIResponseService();