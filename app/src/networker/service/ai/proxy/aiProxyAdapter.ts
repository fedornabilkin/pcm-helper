export interface AiProxyRequest {
  url: string;
  init: RequestInit;
}

export interface AiProxyAdapter {
  prepare(request: AiProxyRequest): AiProxyRequest;
}

export class DirectAiProxyAdapter implements AiProxyAdapter {
  prepare(request: AiProxyRequest): AiProxyRequest {
    return request
  }
}

export class CorsShAiProxyAdapter implements AiProxyAdapter {
  constructor(private readonly apiKey: string) {}

  prepare(request: AiProxyRequest): AiProxyRequest {
    if (!this.apiKey) {
      throw new Error('Не настроен ключ CORS.SH: задайте VITE_CORS_SH_API_KEY.')
    }

    return {
      url: `https://proxy.cors.sh/${request.url}`,
      init: {
        ...request.init,
        headers: {
          ...(request.init.headers ?? {}),
          'x-cors-api-key': this.apiKey,
        },
      },
    }
  }
}

export class ViteDevAiProxyAdapter implements AiProxyAdapter {
  constructor(private readonly localEndpoint: string) {}

  prepare(request: AiProxyRequest): AiProxyRequest {
    return {
      url: this.localEndpoint,
      init: request.init,
    }
  }
}

export class SameOriginAiProxyAdapter implements AiProxyAdapter {
  prepare(request: AiProxyRequest): AiProxyRequest {
    return {
      url: '/api/ai/pollinations',
      init: request.init,
    }
  }
}

export class CustomEndpointAiProxyAdapter implements AiProxyAdapter {
  constructor(private readonly endpoint: string) {}

  prepare(request: AiProxyRequest): AiProxyRequest {
    if (!this.endpoint) {
      throw new Error('Не настроен AI endpoint: задайте VITE_AI_PROXY_ENDPOINT.')
    }

    return {
      url: this.endpoint,
      init: request.init,
    }
  }
}

export const createAiProxyAdapter = (): AiProxyAdapter => {
  const provider = import.meta.env.VITE_AI_PROXY_PROVIDER ?? 'same-origin'

  if (provider === 'direct') {
    return new DirectAiProxyAdapter()
  }

  if (provider === 'same-origin') {
    return new SameOriginAiProxyAdapter()
  }

  if (provider === 'vite-dev') {
    return new ViteDevAiProxyAdapter('/api/ai/pollinations')
  }

  if (provider === 'custom-endpoint') {
    return new CustomEndpointAiProxyAdapter(import.meta.env.VITE_AI_PROXY_ENDPOINT ?? '')
  }

  if (provider === 'cors-sh') {
    return new CorsShAiProxyAdapter(import.meta.env.VITE_CORS_SH_API_KEY ?? '')
  }

  throw new Error(`Неизвестный AI proxy provider: ${provider}`)
}
