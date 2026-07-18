import {fileURLToPath, URL} from 'node:url'
import {defineConfig, loadEnv} from 'vite'
import vue from '@vitejs/plugin-vue'
import {visualizer} from 'rollup-plugin-visualizer'
import {WebSocket, WebSocketServer} from 'ws'

const POLLINATIONS_PROXY_PATH = '/api/ai/pollinations'
const AI_QUEUE_WS_PATH = '/ws/ai/queue'
const POLLINATIONS_OPENAI_URL = 'https://text.pollinations.ai/openai?referrer=pcm-helper'

const readRequestBody = async (request) => {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  return Buffer.concat(chunks).toString('utf8')
}

const sendTextResponse = (response, statusCode, contentType, body) => {
  response.statusCode = statusCode
  response.setHeader('Content-Type', contentType)
  response.end(body)
}

const proxyPollinationsRequest = (targetUrl) => async (request, response) => {
  if (request.method !== 'POST') {
    sendTextResponse(response, 405, 'text/plain; charset=utf-8', 'Method Not Allowed')
    return
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: await readRequestBody(request),
    })

    sendTextResponse(
      response,
      upstreamResponse.status,
      upstreamResponse.headers.get('content-type') || 'text/plain; charset=utf-8',
      await upstreamResponse.text(),
    )
  } catch (error) {
    sendTextResponse(
      response,
      502,
      'text/plain; charset=utf-8',
      error instanceof Error ? error.message : 'AI proxy request failed',
    )
  }
}

const pollinationsAiProxyPlugin = (targetUrl) => ({
  name: 'pollinations-ai-proxy',
  configureServer(server) {
    server.middlewares.use(POLLINATIONS_PROXY_PATH, proxyPollinationsRequest(targetUrl))
  },
})

const aiQueueWebSocketRelayPlugin = (targetUrl, rejectUnauthorized) => ({
  name: 'ai-queue-websocket-relay',
  configureServer(server) {
    if (!server.httpServer || !targetUrl) {
      return
    }

    const localServer = new WebSocketServer({noServer: true})

    server.httpServer.on('upgrade', (request, socket, head) => {
      if (!request.url?.startsWith(AI_QUEUE_WS_PATH)) {
        return
      }

      localServer.handleUpgrade(request, socket, head, (clientSocket) => {
        const upstreamSocket = new WebSocket(targetUrl, {rejectUnauthorized})

        const sendClientStatus = (payload) => {
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(JSON.stringify(payload))
          }
        }

        upstreamSocket.on('open', () => {
          sendClientStatus({type: 'connection', connected: true})
        })

        upstreamSocket.on('message', (data) => {
          if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(data.toString())
          }
        })

        upstreamSocket.on('error', (error) => {
          sendClientStatus({
            type: 'connection',
            connected: false,
            error: error instanceof Error ? error.message : 'Queue websocket error',
          })
        })

        upstreamSocket.on('close', () => {
          sendClientStatus({type: 'connection', connected: false})
          clientSocket.close()
        })

        clientSocket.on('message', (data) => {
          if (upstreamSocket.readyState === WebSocket.OPEN) {
            upstreamSocket.send(data.toString())
          }
        })

        clientSocket.on('close', () => {
          upstreamSocket.close()
        })
      })
    })
  },
})

export default defineConfig(({mode, command}) => {
  const env = loadEnv(mode, process.cwd(), '')
  const aiProxyTargetUrl = env.VITE_AI_PROXY_TARGET_ENDPOINT || POLLINATIONS_OPENAI_URL
  const aiQueueWebSocketTargetUrl = env.VITE_AI_QUEUE_WS_TARGET_ENDPOINT || ''
  const rejectUnauthorized = env.VITE_AI_PROXY_REJECT_UNAUTHORIZED !== 'false'
  const devProxyPlugins = command === 'serve'
    ? [
      pollinationsAiProxyPlugin(aiProxyTargetUrl),
      aiQueueWebSocketRelayPlugin(aiQueueWebSocketTargetUrl, rejectUnauthorized),
    ]
    : []
  const bundleAnalyzerPlugins = mode === 'analyze'
    ? [visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
      open: false,
    })]
    : []

  if (command === 'serve' && !rejectUnauthorized) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  return {
    plugins: [
      vue(),
      ...devProxyPlugins,
      ...bundleAnalyzerPlugins,
    ],
    server: {
      host: true,
      port: 5176,
      strictPort: true,
      watch: {
        usePolling: true,
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
