import { createServer } from 'vite'
import { exec } from 'child_process'
import { resolve } from 'path'

;(async () => {
  const server = await createServer({
    configFile: resolve(process.cwd(), 'vite.config.ts'),
  })

  await server.listen()
  server.printUrls()
  process.env.CLIENT_URL = server.resolvedUrls.local[0]
  const childProcess = exec('electron .')
  // 进程关闭，则关闭本地服务器
  childProcess.on('close', () => {
    server.close()
  })
})()
