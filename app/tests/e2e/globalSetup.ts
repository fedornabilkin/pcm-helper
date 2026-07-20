import {createServer, type ViteDevServer} from 'vite'

export default async (): Promise<() => Promise<void>> => {
  const server: ViteDevServer = await createServer({
    configFile: 'vite.config.mjs',
    server: {
      host: '127.0.0.1',
      port: 5177,
      strictPort: true,
    },
  })

  await server.listen()

  return async (): Promise<void> => {
    await server.close()
  }
}
