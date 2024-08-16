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
import { getRendererDir, isProd, responseWrapper } from './utils'
import { bodyParser } from '@koa/bodyparser'
import { app } from 'electron'

const defaultDest = app.getPath('documents') + '/'
// const defaultDest = app.getPath('downloads') + '/sso/'

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
      const files: multer.File[] = ctx.files?.jasonfiles
      if (!files) {
        ctx.body = 'not upload files'
        return
      }
      for (const f of Array.from(files)) {
        let filename = path.resolve(
          defaultDest,
          Buffer.from(f.originalname, 'latin1').toString('utf8')
        )

        filename = handleExistsFile(filename)

        fs.writeFileSync(filename, f.buffer)
      }
      ctx.body = '上传完成'
    }
  )

  // 文件列表
  router.post('/', (ctx) => {
    const { dest } = ctx.request.body
    const realDest = dest || defaultDest
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

  // 下载文件
  router.post('/download', (ctx) => {
    const { dest } = ctx.request.body
    const file = fs.readFileSync(dest)

    ctx.body = file
  })

  app.use(router.routes())
}

export const run = async () => {
  const app = new Koa()

  app.use(cors())
  app.use(bodyParser())

  if (isProd()) {
    Static(getRendererDir())
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
