import { EmotionalAnalysis, Emotion } from '../types';

export class EmotionalAnalysisService {
  private apiKey: string | null = null;
  private model: string = 'gpt-4o-mini';

  setApiKey(key: string) {
    this.apiKey = key;
  }

  setModel(model: string) {
    this.model = model;
  }

  async analyzeEmotion(text: string): Promise<EmotionalAnalysis> {
    try {
      if (this.apiKey) {
        return await this.analyzeWithOpenAI(text);
      } else {
        return this.basicEmotionalAnalysis(text);
      }
    } catch (error) {
      console.warn('Advanced analysis failed, falling back to basic analysis:', error);
      return this.basicEmotionalAnalysis(text);
    }
  }

  private async analyzeWithOpenAI(text: string): Promise<EmotionalAnalysis> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert emotional analyst. Analyze the emotional content of messages and return a JSON response with this exact structure:
{
  "primary": {
    "name": "emotion_name",
    "category": "joy|sadness|anger|fear|surprise|disgust|neutral",
    "intensity": 0.0-1.0,
    "description": "brief description"
  },
  "secondary": {
    "name": "emotion_name",
    "category": "joy|sadness|anger|fear|surprise|disgust|neutral", 
    "intensity": 0.0-1.0,
    "description": "brief description"
  },
  "intensity": 0.0-1.0,
  "confidence": 0.0-1.0,
  "context": "contextual analysis"
}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return {
      primary: analysis.primary,
      secondary: analysis.secondary,
      intensity: analysis.intensity,
      confidence: analysis.confidence,
      context: analysis.context,
      timestamp: new Date()
    };
  }

  private basicEmotionalAnalysis(text: string): EmotionalAnalysis {
    const emotionKeywords = {
      joy: ['happy', 'excited', 'joyful', 'pleased', 'delighted', 'cheerful', 'glad', 'thrilled'],
      sadness: ['sad', 'depressed', 'down', 'upset', 'disappointed', 'heartbroken', 'gloomy'],
      anger: ['angry', 'furious', 'mad', 'annoyed', 'frustrated', 'irritated', 'enraged'],
      fear: ['scared', 'afraid', 'anxious', 'worried', 'nervous', 'terrified', 'panic'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished', 'stunned', 'bewildered'],
      disgust: ['disgusted', 'revolted', 'repulsed', 'sick', 'nauseated', 'appalled']
    };

    const lowercaseText = text.toLowerCase();
    const scores: { [key: string]: number } = {};

    // Calculate emotion scores based on keyword matches
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      scores[emotion] = keywords.reduce((score, keyword) => {
        const matches = (lowercaseText.match(new RegExp(keyword, 'g')) || []).length;
        return score + matches;
      }, 0);
    });

    // Find primary emotion
    const primaryEmotion = Object.entries(scores).reduce((a, b) => 
      a[1] > b[1] ? a : b
    );

    // Find secondary emotion
    const secondaryEntries = Object.entries(scores).filter(([key]) => key !== primaryEmotion[0]);
    const secondaryEmotion = secondaryEntries.length > 0 
      ? secondaryEntries.reduce((a, b) => a[1] > b[1] ? a : b)
      : null;

    const totalWords = text.split(' ').length;
    const intensity = Math.min(primaryEmotion[1] / totalWords * 10, 1);

    return {
      primary: {
        name: primaryEmotion[0],
        category: primaryEmotion[0] as any,
        intensity: intensity,
        description: `Detected ${primaryEmotion[0]} with ${primaryEmotion[1]} keyword matches`
      },
      secondary: secondaryEmotion ? {
        name: secondaryEmotion[0],
        category: secondaryEmotion[0] as any, 
        intensity: Math.min(secondaryEmotion[1] / totalWords * 10, 1),
        description: `Secondary emotion with ${secondaryEmotion[1]} keyword matches`
      } : undefined,
      intensity: intensity,
      confidence: intensity > 0 ? 0.6 : 0.3, // Lower confidence for basic analysis
      context: 'Basic keyword-based analysis',
      timestamp: new Date()
    };
  }
}

export const emotionalAnalysisService = new EmotionalAnalysisService();