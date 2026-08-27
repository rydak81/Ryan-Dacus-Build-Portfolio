/**
 * AI provider abstraction. Anthropic (official SDK) or OpenAI (REST),
 * selected by AI_PROVIDER. All AI usage in JobSignal is explanatory —
 * scores, dates, and verification facts are computed deterministically
 * before AI ever sees them.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface AiClient {
  complete(opts: { system: string; prompt: string; maxTokens?: number }): Promise<string>;
}

class AnthropicClient implements AiClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete({ system, prompt, maxTokens = 1024 }: Parameters<AiClient['complete']>[0]): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
    if (response.stop_reason === 'refusal') {
      throw new Error('AI provider declined the request');
    }
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
  }
}

class OpenAiClient implements AiClient {
  constructor(
    private apiKey: string,
    private model: string,
  ) {}

  async complete({ system, prompt, maxTokens = 1024 }: Parameters<AiClient['complete']>[0]): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_completion_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API returned ${res.status}`);
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? '';
  }
}

let cached: AiClient | null | undefined;

/** Returns null when no provider is configured — callers must degrade gracefully. */
export function getAiClient(): AiClient | null {
  if (cached !== undefined) return cached;
  const provider = process.env.AI_PROVIDER;
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    cached = new AnthropicClient(
      process.env.ANTHROPIC_API_KEY,
      process.env.ANTHROPIC_MODEL ?? 'claude-opus-5',
    );
  } else if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    cached = new OpenAiClient(process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL ?? 'gpt-4o');
  } else {
    cached = null;
  }
  return cached;
}
