import { getUrlQueryParams } from '@/utils'
import axios from 'axios'
import type { AxiosInstance, AxiosProgressEvent } from 'axios'

let http: AxiosInstance

export const initAxios = async () => {
  // const { apiUrl } = await window.electronAPI.getConfig()
  const api = getUrlQueryParams('api')
  http = axios.create({
    baseURL: import.meta.env.PROD ? location.origin + '/api' : api,
  })

  http.interceptors.response.use(
    function (response) {
      // Any status code that lie within the range of 2xx cause this function to trigger
      // Do something with response data
      return response.data
    },
    function (error) {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      // Do something with response error
      return Promise.reject(error)
    }
  )
}

export const uploadFiles = (
  data: FormData,
  onUploadProgress?: (evt: AxiosProgressEvent) => void
) =>
  http.post('/upload-multiple-files', data, {
    onUploadProgress,
  })

export const getConfig = () => http.get('/config')

export const getFiles = (data?: { dest?: string }) =>
  http.post('/file-list', data)

export const updateDest = (data?: { dest?: string }) =>
  http.post('/update-dest', data)

export const getDest = () => http.get('/cur-dest')

export const downloadFile = (
  data?: { root?: string; dest?: string },
  onDownloadProgress?: (evt: AxiosProgressEvent) => void
) =>
  http.post<null, Blob>('/download', data, {
    responseType: 'blob',
    onDownloadProgress,
  })
