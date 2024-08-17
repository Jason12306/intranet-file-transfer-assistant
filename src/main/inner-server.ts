// 内部服务器
import Koa from 'koa'
import portfinder from 'portfinder'
import Router from '@koa/router'
import Static from 'koa-static'
import ip from 'ip'
import multer from '@koa/multer'
import cors from '@koa/cors'
import fs from 'fs'
import path from 'path'
import {
  ResponseCodeEnum,
  getRendererDir,
  isProd,
  responseWrapper,
} from './utils'
import { bodyParser } from '@koa/bodyparser'
import { app } from 'electron'
import proxy from 'koa-proxies'

let defaultDest = path.resolve(app.getPath('documents'))

const setDefaultDest = (newDest: string) => {
  defaultDest = newDest
}

const handleExistsFile = (filename: string) => {
  if (fs.existsSync(filename)) {
    const extname = path.extname(filename)
    const basename = path.basename(filename)
    const name = basename.replace(extname, '')

    filename = `${defaultDest}${name}(1)${extname}`
    filename = handleExistsFile(filename)
  }

  return filename
}

const filtedFilename = ['.DS_Store']
const routerPrefix = '/api'

const initRouter = (app: Koa<Koa.DefaultState, Koa.DefaultContext>) => {
  const router = new Router({
    prefix: routerPrefix,
  })

  const upload = multer()

  // 上传文件
  router.post(
    '/upload-multiple-files',
    upload.fields([
      {
        name: 'jasonfiles',
      },
    ]),
    (ctx) => {
      // console.log('ctx.request.file', ctx.request.files)
      // console.log('ctx.file', ctx.files)
      // console.log('ctx.request.body', ctx.request.body)
      const { chunkNo, totalChunk } = ctx.request.body
      const chunkNoNum = Number(chunkNo)
      const totalChunkNum = Number(totalChunk)
      const files: multer.File[] = ctx.files?.jasonfiles
      if (!files) {
        ctx.body = 'not upload files'
        return
      }
      for (const f of Array.from(files)) {
        const filename = path.resolve(
          defaultDest,
          Buffer.from(f.originalname, 'latin1').toString('utf8')
        )

        if (chunkNoNum === 1 && fs.existsSync(filename)) {
          ctx.body = responseWrapper('存在重名文件', ResponseCodeEnum.error)
          return
        }

        // filename = handleExistsFile(filename)

        if (totalChunkNum !== 1) {
          // filename = filename + '.chunk.' + chunkNoNum
        }

        fs.appendFileSync(filename, f.buffer)
      }

      ctx.body = responseWrapper('上传完成')
    }
  )

  // 文件列表
  router.post('/file-list', (ctx) => {
    const { root, dest } = ctx.request.body
    const realDest = path.resolve(root || defaultDest, dest || '')
    const files = fs.readdirSync(realDest)

    ctx.body = responseWrapper({
      storageDir: realDest,
      list: files
        .filter((f) => f !== '.DS_Store')
        .map((f) => {
          const state = fs.lstatSync(path.resolve(realDest, f))
          return {
            name: f,
            isDir: state.isDirectory(),
          }
        }),
    })
  })

  // 更新根目录
  router.post('/update-dest', (ctx) => {
    const { dest } = ctx.request.body
    setDefaultDest(dest || defaultDest)
    ctx.body = responseWrapper()
  })

  // 获取根目录
  router.get('/cur-dest', (ctx) => {
    ctx.body = responseWrapper(defaultDest)
  })

  // 下载文件
  router.post('/download', (ctx) => {
    const { dest, root } = ctx.request.body
    const realDest = path.resolve(root || defaultDest, dest || '')
    const file = fs.readFileSync(realDest)

    ctx.body = file
  })

  app.use(router.routes())
}

export const run = async () => {
  const app = new Koa()

  app.use(cors())
  app.use(bodyParser())

  if (isProd()) {
    app.use(Static(getRendererDir()))
  } else {
    const p = getRendererDir()
    app.use(Static(p))
    // dev
    // app.use(
    //   proxy('/assistant', {
    //     target: process.env.CLIENT_URL,
    //   })
    // )
  }

  initRouter(app)

  const port = await portfinder.getPortPromise({
    startPort: 9028,
    port: 9028,
  })

  app.listen(port)

  const ipAddr = ip.address()
  const localUrl = `http://${ipAddr}:${port}`
  console.log(`service is runing at ${localUrl}`)

  return {
    localUrl,
    apiUrl: localUrl + routerPrefix,
    host: ipAddr,
    port,
  }
}
