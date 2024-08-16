import axios from 'axios'
import type { AxiosProgressEvent } from 'axios'
import injectedConfig from '../injected-config.json'

const http = axios.create({
  baseURL: injectedConfig.baseUrl,
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

export const uploadFiles = (
  data: FormData,
  onUploadProgress?: (evt: AxiosProgressEvent) => void
) =>
  http.post('/upload-multiple-files', data, {
    onUploadProgress,
  })

export const getFiles = (data?: { dest?: string }) => http.post('/', data)
export const downloadFile = (
  data?: { dest?: string },
  onDownloadProgress?: (evt: AxiosProgressEvent) => void
) =>
  http.post<null, Blob>('/download', data, {
    responseType: 'blob',
    onDownloadProgress,
  })
