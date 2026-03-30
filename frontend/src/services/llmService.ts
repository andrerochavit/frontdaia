// LLM Service for Effie
export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'local' | 'mock';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generateResponse(
    userMessage: string,
    selectedPrinciple: string | null,
    onboardingData: { what_you_know: string; what_you_want: string; who_you_know: string; what_you_invest: string } | null,
    conversationHistory: Array<{ role: string, content: string }>,
    customSystemPrompt?: string,
    discProfile?: string | null
  ): Promise<LLMResponse> {

    const systemPrompt = customSystemPrompt || this.buildSystemPrompt(selectedPrinciple, onboardingData, discProfile ?? null);

    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(userMessage, systemPrompt, conversationHistory);
      case 'anthropic':
        return this.callAnthropic(userMessage, systemPrompt, conversationHistory);
      case 'gemini':
        return this.callGemini(userMessage, systemPrompt, conversationHistory);
      case 'local':
        return this.callLocalLLM(userMessage, systemPrompt);
      case 'mock':
        return this.mockResponse(userMessage, selectedPrinciple);
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
    }
  }

  private buildSystemPrompt(
    selectedPrinciple: string | null,
    onboardingData: { what_you_know: string; what_you_want: string; who_you_know: string; what_you_invest: string } | null,
    discProfile: string | null = null
  ): string {
    let prompt = `Você é o Effie, um mentor de empreendedorismo baseado no método Effectuation da Dra. Sarasvathy.

REGRAS DE ESTILO:
- Responda SEMPRE de forma curta e conversacional, como num chat (2-3 frases no máximo).
- NÃO faça listas longas, NÃO escreva parágrafos extensos.
- Faça UMA pergunta por vez ao final de cada resposta.
- Seja caloroso, como um amigo mentor. Use linguagem informal mas profissional.
- Responda em pt-BR.
- Não dê aconselhamento jurídico/contábil.

SEU OBJETIVO PRINCIPAL:
Construir o perfil Effectuation do empreendedor o mais rápido possível. Você precisa descobrir:
1. Quem ele é (background, identidade, história)
2. O que ele sabe (habilidades, expertise, experiência)
3. O que ele quer (objetivos, tipo de negócio, aspirações)
4. O que ele pode investir (tempo, dinheiro, recursos disponíveis)
5. Quem ele conhece (rede de contatos, parceiros potenciais, mentores)

ESTRATÉGIA: Identifique qual desses 5 pontos ainda falta informação e pergunte sobre ele de forma natural. Quando tiver os 5 completos, comece a ajudar a construir o MVP e validar a ideia de negócio.`;

    // Inject DISC profile context for personalization
    if (discProfile) {
      const discContext: Record<string, string> = {
        D: 'Perfil DISC: DOMINANTE. É direto, orientado a resultados, impaciente com detalhes excessivos. Seja objetivo, vá direto ao ponto, proponha ações concretas. Não enrole.',
        I: 'Perfil DISC: INFLUENTE. É comunicativo, entusiasta, valoriza relações. Seja caloroso, use exemplos inspiradores, valorize a rede de contatos dele.',
        S: 'Perfil DISC: ESTÁVEL. É pacífico, meticuloso, avesso a riscos súbitos. Seja tão delicado e estruturado, dê passos pequenos e seguros, reforce a confiança.',
        C: 'Perfil DISC: CONFORME. É analítico, preciso, quer dados e razões. Explique o "porquê" das coisas, traga exemplos com números ou pesquisas quando possível.',
      };
      if (discContext[discProfile]) {
        prompt += `\n\nPERFIL COMPORTAMENTAL DO EMPREENDEDOR: ${discContext[discProfile]}`;
      }
    }

    if (selectedPrinciple) {
      prompt += `\n\nFoco atual do usuário: princípio "${selectedPrinciple}". Direcione a conversa para esse princípio.`;
    }

    if (onboardingData) {
      const filled: string[] = [];
      const missing: string[] = [];
      if (onboardingData.what_you_know) filled.push(`Sabe: ${onboardingData.what_you_know}`);
      else missing.push("o que sabe fazer");
      if (onboardingData.what_you_want) filled.push(`Quer: ${onboardingData.what_you_want}`);
      else missing.push("o que quer construir");
      if (onboardingData.what_you_invest) filled.push(`Investe: ${onboardingData.what_you_invest}`);
      else missing.push("o que pode investir");
      if (onboardingData.who_you_know) filled.push(`Conhece: ${onboardingData.who_you_know}`);
      else missing.push("quem conhece");

      if (filled.length) prompt += `\n\nPERFIL JÁ COLETADO: ${filled.join('; ')}.`;
      if (missing.length) prompt += `\n\nAINDA FALTA DESCOBRIR: ${missing.join(', ')}. Priorize perguntar sobre isso!`;
    } else {
      prompt += `\n\nPERFIL VAZIO — comece se apresentando brevemente e perguntando quem é o empreendedor e o que ele faz.`;
    }

    return prompt;
  }

  private async callOpenAI(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string, content: string }>
  ): Promise<LLMResponse> {
    // Limit history to last 4 messages to minimize token usage
    const trimmedHistory = conversationHistory
      .slice(-4)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...trimmedHistory,
      { role: 'user' as const, content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4o-mini',
        messages,
        temperature: this.config.temperature ?? 0.7,
        max_tokens: this.config.maxTokens || 400,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      usage: data.usage
    };
  }

  private async callAnthropic(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string, content: string }>
  ): Promise<LLMResponse> {
    const messages = [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey!,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 500,
        system: systemPrompt,
        messages
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      usage: data.usage
    };

  }

  private async callGemini(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string, content: string }>
  ): Promise<LLMResponse> {
    // Build the conversation for Gemini
    const contents = [];

    // Add conversation history
    for (const msg of conversationHistory) {
      contents.push({
        parts: [{ text: msg.content }],
        role: msg.role === 'assistant' ? 'model' : 'user'
      });
    }

    // Add current user message
    contents.push({
      parts: [{ text: userMessage }],
      role: 'user'
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model || 'gemini-1.5-flash'}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: this.config.temperature || 0.7,
          maxOutputTokens: this.config.maxTokens || 500,
          topP: 0.8,
          topK: 10
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API Error:", errorData);
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }


    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data, null, 2));

    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini API candidates missing:", JSON.stringify(data, null, 2));
      throw new Error("Gemini API did not return any candidates");
    }

    const parts = data.candidates[0].content?.parts;
    if (!parts || parts.length === 0) {
      console.error("Gemini API content parts missing:", JSON.stringify(data, null, 2));
      throw new Error("Gemini API response has no content parts");
    }

    return {
      content: parts[0].text || ""
    };

  }

  private async callLocalLLM(userMessage: string, systemPrompt: string): Promise<LLMResponse> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'llama2:7b',
        prompt: `${systemPrompt}\n\nUser: ${userMessage}`,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.response
    };
  }

  private async mockResponse(userMessage: string, selectedPrinciple: string | null): Promise<LLMResponse> {
    // Fallback for development/testing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = [
      "Excelente pergunta! Vamos explorar isso usando os princípios da Effectuation...",
      "Baseado no seu perfil, posso sugerir algumas abordagens práticas...",
      "Isso é um ótimo exemplo de como aplicar o princípio que estamos focando...",
      "Vamos quebrar isso em passos práticos que você pode executar hoje..."
    ];

    return {
      content: responses[Math.floor(Math.random() * responses.length)]
    };
  }
}

// Export configured instances
export const createLLMService = (config: LLMConfig) => new LLMService(config);

// Default configuration — OpenAI / gpt-4o-mini (cheapest capable model for MVP)
export const defaultLLMConfig: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 200,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || (import.meta.env as any).OPENAI_API_KEY,
};
