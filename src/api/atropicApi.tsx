// atropicApi.ts
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

export async function chatWithClaude(messages: any[]): Promise<string> {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY não está configurada (mova as chamadas de IA para um backend).');
    }
    try {
        const { data } = await anthropicClient.post('/messages', {
            model: "claude-3-5-sonnet-latest",
            max_tokens: 1024,
            "messages": [
                {
                    role: "user",
                    content: messages
                }
            ],
            system: `Você é um assistente financeiro especializado em calcular e gerenciar recibos.
            Sempre analise o idioma e devolver os valores do json, no idioma do texto, mes tem que ser yyyy-MM e type tem que respeitatr o ingles do json.
            Sempre analise os dados fornecidos pelo usuário e responda **apenas** com um JSON no seguinte formato:
            json
            {
            "value": <valor_total>,
            "category": "<categoria_do_recibo>",
            "type": "<tipo_do_recibo>" // income ou expense sem minusculo
            "month": "<mês_do_recibo>"
            "description": "<descrição_do_recibo>"
            "referenceMonth": "<mês_de_referência_do_recibo>"
            }
            Se houver uma categoria, use o nome da categoria, se houver um tipo, use o nome do tipo.
            De Acordo com o recebido, analise se categoria que tem é de acordo com o tipo.
            Se a categoria não tiver no tipo, retorne nome da categoria referente ao documento / imagem, analise o conteudo
            Analise o input do ususario, e descreve se é income ou expense sempre.
            De acordo com o input do usuario veja ser a categoria nao é diferente das que tem atual, se for diferente retorne a categoria do usuario.
            indepedente do input do usuario sempre retorne a mesma estrutura json, mas sempre considere o input do usuario.
            }`
        });

        if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
            throw new Error('Resposta inválida da API');
        }

        const responseText = data.content
            .filter((block: any) => block.type === 'text')
            .map((block: any) => block.text)
            .join('\n');

        return responseText;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            throw new Error(`Erro na API: ${errorMessage}`);
        }
        throw new Error('Houve um problema ao processar sua solicitação');
    }
}