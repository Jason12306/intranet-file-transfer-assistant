import path from 'path'

export enum ResponseCodeEnum {
  success = 'success',
  error = 'error',
}

export const responseWrapper = (
  data?: any,
  code = ResponseCodeEnum.success
) => {
  return {
    code,
    data,
  }
}

export enum EnvEnum {
  dev = '0',
  prod = '1',
}

export const isProd = () => process.env.GLOBAL_IS_PACKAGED === EnvEnum.prod

export const isDev = () => process.env.GLOBAL_IS_PACKAGED === EnvEnum.dev
export const getRendererDir = () => {
  return isDev() ? path.resolve('src/renderer') : path.resolve('../renderer')
}
