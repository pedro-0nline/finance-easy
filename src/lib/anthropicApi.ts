import axios from 'axios';
import { ANTHROPIC_API_KEY } from '../config';

interface ContentBlock {
    type: "text" | "image";
    text?: string;
    source?: {
        type: "base64";
        media_type: string;
        data: string;
    };
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: ContentBlock[];
}

const anthropicClient = axios.create({
    baseURL: 'https://api.anthropic.com/v1',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
    }
});

export async function chatWithClaude(messages: ContentBlock[]): Promise<string> {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY não está configurada (mova as chamadas de IA para um backend).');
    }
    try {
        const { data } = await anthropicClient.post('/messages', {
            model: "claude-3-sonnet-20240229",
            max_tokens: 1024,
            messages: [{
                role: "user",
                content: messages
            }],
            system: `Você é um analista financeiro especializado em analisar dados financeiros e fornecer insights acionáveis.
            Analise os dados fornecidos e retorne APENAS um JSON válido com exatamente os seguintes campos, sem nenhum texto adicional:
            {
              "spendingTrend": "string com descrição da tendência de gastos",
              "spendingTrendType": "positive, negative ou neutral",
              "trend": "up, down ou stable",
              "categoryInsight": "string com insight sobre distribuição de categorias",
              "recommendations": "string com recomendações específicas baseadas nos dados"
            }
            
            Regras importantes:
            1. Retorne APENAS o JSON, sem nenhum texto antes ou depois
            2. Não use quebras de linha dentro das strings
            3. Use apenas aspas duplas para as strings
            4. Mantenha as recomendações práticas e específicas
            5. Use o idioma português para todas as strings
            6. Foque em identificar padrões e fornecer sugestões úteis
            7. Não inclua caracteres de controle ou formatação especial nas strings`
        });

        if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
            throw new Error('Resposta inválida da API');
        }

        const responseText = data.content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('')
            .trim();

        // Validate JSON before returning
        try {
            JSON.parse(responseText);
            return responseText;
        } catch (jsonError) {
            throw new Error('Resposta não é um JSON válido');
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            throw new Error(`Erro na API: ${errorMessage}`);
        }
        throw error;
    }
}