import { CRISIS_KEYWORDS, EMERGENCY_RESOURCES } from '../data/constants';
import { CrisisKeyword, EmergencyResource } from '../types';

export class CrisisDetectionService {
  detectCrisis(text: string): { detected: boolean; severity: string; keywords: string[]; category: string } {
    const lowerText = text.toLowerCase();
    const detectedKeywords: { keyword: string; severity: string; category: string }[] = [];

    CRISIS_KEYWORDS.forEach(({ keyword, severity, category }) => {
      if (lowerText.includes(keyword.toLowerCase())) {
        detectedKeywords.push({ keyword, severity, category });
      }
    });

    if (detectedKeywords.length === 0) {
      return { detected: false, severity: 'none', keywords: [], category: 'none' };
    }

    // Determine highest severity
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const highestSeverity = detectedKeywords.reduce((max, curr) => 
      severityLevels[curr.severity as keyof typeof severityLevels] > 
      severityLevels[max.severity as keyof typeof severityLevels] ? curr : max
    );

    return {
      detected: true,
      severity: highestSeverity.severity,
      keywords: detectedKeywords.map(k => k.keyword),
      category: highestSeverity.category
    };
  }

  getEmergencyResources(category?: string): EmergencyResource[] {
    if (!category) return EMERGENCY_RESOURCES;
    
    // For now, return all resources. In a real app, you'd filter by category/location
    return EMERGENCY_RESOURCES;
  }

  generateCrisisResponse(severity: string, category: string): string {
    const baseMessage = "I'm concerned about what you've shared. Your wellbeing is important, and there are people who want to help.";
    
    switch (severity) {
      case 'critical':
        return `${baseMessage} Please reach out to a crisis helpline immediately. If you're in immediate danger, please call emergency services (911).`;
      case 'high':
        return `${baseMessage} I strongly encourage you to speak with a mental health professional or crisis counselor.`;
      case 'medium':
        return `${baseMessage} Consider talking to someone you trust or a mental health professional about these feelings.`;
      default:
        return `${baseMessage} Remember that seeking help is a sign of strength, not weakness.`;
    }
  }

  shouldShowEmergencyBanner(severity: string): boolean {
    return ['high', 'critical'].includes(severity);
  }
}

export const crisisDetectionService = new CrisisDetectionService();