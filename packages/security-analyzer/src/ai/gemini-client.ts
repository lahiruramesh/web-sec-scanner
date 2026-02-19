import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'models/gemini-2.5-flash') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async analyze(prompt: string, retries = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: this.model });
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
      } catch (error: any) {
        const isRateLimit = error?.message?.includes('429') || error?.message?.includes('quota');
        const isLastAttempt = attempt === retries;

        if (isRateLimit && !isLastAttempt) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await this.sleep(backoffMs);
          continue;
        }

        throw new Error(`Gemini API error: ${error.message}`);
      }
    }

    throw new Error('Failed to get response from Gemini API after retries');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
