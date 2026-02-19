import type { AIAnalysis } from '../types/security';
import { validateAIResponse } from '../utils/validators';

export class ResponseParser {
  parseAIResponse(responseText: string): AIAnalysis {
    try {
      const cleanedText = this.extractJSON(responseText);
      const parsed = JSON.parse(cleanedText);
      return validateAIResponse(parsed);
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    if (text.includes('```json')) {
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
    }

    if (text.includes('```')) {
      const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        return codeBlockMatch[1];
      }
    }

    return text.trim();
  }
}
