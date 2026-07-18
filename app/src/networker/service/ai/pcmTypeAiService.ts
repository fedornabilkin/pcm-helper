import {createAiProxyAdapter} from "@/networker/service/ai/proxy/aiProxyAdapter";
import {checkFeatureAccess} from "@/core/composable/access/premiumAccess";

const PCM_TYPE_PROMPT = `
Ты помогаешь определить вероятный тип восприятия PCM по тексту человека.
Нужно выбрать ровно один из шести типов:

1. Логик, синий: факты, структура, вопросы кто/что/когда/где, анализ, план, критерии, компетентность.
2. Упорный, фиолетовый: мнение, ценности, принципы, доверие, долг, оценка, убежденность, справедливость.
3. Душевный, оранжевый: чувства, забота, тепло, отношения, комфорт, близость, гармония, поддержка.
4. Мечтатель, коричневый: воображение, ожидание, размышление, возможные варианты, внутренний мир, уединение.
5. Бунтарь, желтый: реакция нравится/не нравится, юмор, спонтанность, игра, эмоции момента, яркие оценки.
6. Деятель, красный: действие, шанс, результат, инициатива, риск, скорость, влияние, прямота.

Правила:
- Не выводи рассуждения, reasoning, chain-of-thought, JSON и служебные поля.
- Не объясняй ход анализа. Верни только готовый итог по шаблону ниже.
- Не ставь диагноз и не утверждай личность человека целиком.
- Анализируй только языковые маркеры данного текста.
- Если признаки смешаны, выбери наиболее вероятный тип и укажи альтернативу.
- Ответь кратко на русском языке строго по шаблону:

Тип: <один из шести типов>
Уверенность: <низкая|средняя|высокая>
Почему: <2-3 коротких признака из текста>
Альтернатива: <тип или "нет явной">
Резюме: <1-2 предложения, как лучше коммуницировать с этим человеком>
`.trim()

const POLLINATIONS_OPENAI_ENDPOINT = 'https://text.pollinations.ai/openai?referrer=pcm-helper'
const PUTER_SDK_URL = 'https://js.puter.com/v2/'

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (messages: Array<{ role: string; content: string }>, options?: Record<string, unknown>) => Promise<any>;
      };
    };
  }
}

export class PcmTypeAiService {
  private readonly proxyAdapter = createAiProxyAdapter()

  async detectType(text: string, clientRequestId?: string, clientId?: string): Promise<string> {
    if (!checkFeatureAccess('aiAnalysis').success) {
      throw new Error('AI-анализ доступен в Premium.')
    }

    const user = `Определи вероятный PCM-тип по тексту:\n\n${text}`

    try {
      if ((import.meta.env.VITE_AI_PROVIDER ?? 'pollinations') === 'puter') {
        return await this.detectTypeWithPuter(user)
      }

      const request = this.proxyAdapter.prepare({
        url: POLLINATIONS_OPENAI_ENDPOINT,
        init: {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          cache: 'no-store',
          body: JSON.stringify({
            messages: [
              {role: 'system', content: PCM_TYPE_PROMPT},
              {role: 'user', content: user},
            ],
            model: 'openai',
            seed: 42,
            temperature: 0.2,
            max_tokens: 450,
            max_completion_tokens: 450,
            reasoning_effort: 'low',
            jsonMode: false,
            referrer: 'pcm-helper',
            clientRequestId,
            clientId,
          }),
        },
      })
      const response = await fetch(request.url, request.init)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(this.createHttpErrorMessage(response.status, errorText))
      }

      const contentType = response.headers.get('content-type')
      const result = contentType?.includes('application/json')
        ? await this.extractTextFromJsonResponse(response)
        : await response.text()

      return result.trim() || 'ИИ не вернул резюме. Попробуйте уточнить текст.'
    } catch (error) {
      console.error(error)
      throw new Error(this.createConnectionErrorMessage(error))
    }
  }

  private createConnectionErrorMessage(error: unknown): string {
    if (error instanceof TypeError) {
      return 'Не удалось связаться с ИИ-сервисом. Проверьте CORS, доступность proxy endpoint и сертификат HTTPS, если используется самоподписанный сертификат.'
    }

    if (error instanceof Error) {
      return `Не удалось связаться с ИИ-сервисом: ${error.message}`
    }

    return 'Не удалось связаться с ИИ-сервисом.'
  }

  private createHttpErrorMessage(status: number, responseText: string): string {
    if (status === 429) {
      return 'Очередь ИИ-сервиса занята для IP proxy-сервера. Подождите 30-60 секунд и повторите запрос.'
    }

    return `AI service returned ${status}${responseText ? `: ${responseText}` : ''}`
  }

  private async detectTypeWithPuter(user: string): Promise<string> {
    await this.loadPuterSdk()

    if (!window.puter?.ai?.chat) {
      throw new Error('Puter AI SDK не загрузился.')
    }

    const response = await window.puter.ai.chat(
      [
        {role: 'system', content: PCM_TYPE_PROMPT},
        {role: 'user', content: user},
      ],
      {
        model: import.meta.env.VITE_PUTER_AI_MODEL ?? 'gpt-5-nano',
      },
    )

    return this.extractTextFromPuterResponse(response).trim() || 'ИИ не вернул резюме. Попробуйте уточнить текст.'
  }

  private async loadPuterSdk(): Promise<void> {
    if (window.puter?.ai?.chat) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${PUTER_SDK_URL}"]`)
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), {once: true})
        existingScript.addEventListener('error', () => reject(new Error('Не удалось загрузить Puter SDK.')), {once: true})
        return
      }

      const script = document.createElement('script')
      script.src = PUTER_SDK_URL
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Не удалось загрузить Puter SDK.'))
      document.head.appendChild(script)
    })
  }

  private extractTextFromPuterResponse(response: any): string {
    if (typeof response === 'string') {
      return response
    }

    const content = response?.message?.content ?? response?.text ?? response?.content

    if (Array.isArray(content)) {
      return content
        .map(item => item?.text ?? item?.content ?? '')
        .filter(Boolean)
        .join('\n')
    }

    return typeof content === 'string' ? content : String(response ?? '')
  }

  private async extractTextFromJsonResponse(response: Response): Promise<string> {
    const data = await response.json()
    const choice = data.choices?.[0]
    const message = choice?.message
    const text =
      message?.content ||
      data.content ||
      data.text ||
      data.message?.content

    if (!text && message?.reasoning) {
      if (choice?.finish_reason === 'length') {
        return 'ИИ начал рассуждать вместо итогового ответа и оборвал генерацию. Повторите запрос: теперь приложение просит сервис вернуть только короткий итог по шаблону.'
      }

      return 'ИИ вернул рассуждения без итогового ответа. Повторите запрос или сократите исходный текст.'
    }

    if (!text) {
      return 'ИИ не вернул итоговый текст. Повторите запрос или сократите исходный текст.'
    }

    if (typeof text === 'string' && text.startsWith('{') && text.includes('"reasoning_content"')) {
      try {
        const parsed = JSON.parse(text)
        return parsed.content || parsed.text || text
      } catch {
        return text
      }
    }

    return String(text)
  }
}
