<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import {
  downloadFile,
  getFiles,
  uploadFiles,
  updateDest,
  getDest,
} from './api/http'
import type { AxiosProgressEvent } from 'axios'
import dirLogo from '@/assets/imgs/dir.svg'
import fileLogo from '@/assets/imgs/file.svg'
import appLogo from '@/assets/imgs/local-network.svg'
import { Button as AButton, UploadProps, message } from 'ant-design-vue'
import {
  UploadOutlined,
  InboxOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue'
import {
  progres2Display,
  inElectron,
  withElectron,
  getUrlQueryParams,
} from './utils'
import { selectDir } from './electron-api'

const localUrl = location.origin
const [messageApi, contextHolder] = message.useMessage()

const selectedFiles = ref<File[]>([])

const disabled = computed(
  () => !(selectedFiles.value && selectedFiles.value.length)
)

const uploadProgress = ref(0)
const isUploading = computed(
  () => !(uploadProgress.value === 0 || uploadProgress.value === 1)
)
// start upload

const sliceSize = 256 * 1024 * 1024
// const sliceSize = (256 * 1024 * 1024) / 20

const sliceUpload = async (file: File) => {
  let chunkNo = 0
  const totalChunk = Math.ceil(file.size / sliceSize)

  while (chunkNo < totalChunk) {
    const formdata = new FormData()

    const s = chunkNo * sliceSize
    const e = (chunkNo + 1) * sliceSize

    const fileSlice = new File([file.slice(s, e)], file.name)
    formdata.append('jasonfiles', fileSlice)

    formdata.append('chunkNo', (chunkNo + 1).toString())
    formdata.append('totalChunk', totalChunk.toString())

    const data = await uploadFiles(formdata, (evt: AxiosProgressEvent) => {
      uploadProgress.value =
        ((evt.progress || 0) * fileSlice.size + chunkNo * sliceSize) / file.size
    })

    if (data.code !== 'success') {
      messageApi.error(data.data)
      throw data.data
    }
    chunkNo++
  }
}

const handleUpload = async () => {
  if (disabled.value) return

  for (const file of selectedFiles.value) {
    await sliceUpload(file)
  }

  // await uploadFiles(formdata, (evt: AxiosProgressEvent) => {
  //   console.log(evt.progress)
  //   uploadProgress.value = evt.progress || 0
  // })

  messageApi.success('上传完成')
  selectedFiles.value.length = 0
  fetchFiles()
}

interface DisplayFile {
  isDir: boolean
  name: string
  downloadProgressDisplay?: string
}

const displayFiles = ref<DisplayFile[]>([])
const storageDir = ref('')

const fetchFiles = async (formdata?: { root?: string; dest?: string }) => {
  // if (!formdata?.dest) {
  //   formdata = {
  //     dest: storageDir.value,
  //   }
  // }
  const { data } = await getFiles(formdata)

  displayFiles.value = (data.list as DisplayFile[]).sort(
    (f1, f2) => -Number(f1.isDir) + Number(f2.isDir)
  )
  storageDir.value = data.storageDir
  return {
    storageDir: storageDir.value,
  }
}

const dirPathMap = ref<string[]>([])
const hasPreviousLevel = computed(() => !!dirPathMap.value.length)

// go to dir
const toDir = async (f: DisplayFile) => {
  if (!f.isDir) return

  const dirname = f.name + '/'

  dirPathMap.value.push(dirname)

  fetchFiles({ root: storageDir.value, dest: dirname })
}

const goback = () => {
  if (hasPreviousLevel.value) {
    const lastDirName = dirPathMap.value[dirPathMap.value.length - 1]
    const lastIndex = storageDir.value.lastIndexOf(lastDirName)
    const backpath = storageDir.value.substring(0, lastIndex)

    dirPathMap.value.splice(dirPathMap.value.length - 1, 1)
    fetchFiles({ dest: backpath })
  }
}
// download file
const handleDownloadFile = async (f: DisplayFile) => {
  const data = await downloadFile(
    { root: storageDir.value, dest: f.name },
    (evt) => {
      console.log(evt.progress)
      f.downloadProgressDisplay = progres2Display(evt.progress)
    }
  )
  downloadFileByBlob(data, f.name)
  f.downloadProgressDisplay = undefined
}

function downloadFileByBlob(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = fileName || 'defaultName'
  link.style.display = 'none'
  link.href = blobUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const selectedFilesName = computed(() => selectedFiles.value.map((f) => f.name))

const beforeUpload = (file: File) => {
  const index = selectedFilesName.value.indexOf(file.name)
  if (index !== -1) {
    messageApi.warning(`文件 ${file.name} 已选择`)
    return false
  }

  selectedFiles.value = [...(selectedFiles.value || []), file]
  return false
}

const handleRemove = (file: File) => {
  const index = selectedFiles.value.indexOf(file)
  const newFileList = selectedFiles.value.slice()
  newFileList.splice(index, 1)
  selectedFiles.value = newFileList
}

const defaultStorageDir = ref('')

const LS_STORAGE_DIR = 'storageDir'
onMounted(async () => {
  const cachedStorageDir = withElectron(
    () => window.localStorage.getItem(LS_STORAGE_DIR) || undefined
  )

  inElectron && updateDest({ dest: cachedStorageDir })

  const { storageDir } = await fetchFiles({ dest: cachedStorageDir })

  defaultStorageDir.value = storageDir
})

const updateLocalDir = async (newDir: string) => {
  defaultStorageDir.value = newDir
  storageDir.value = defaultStorageDir.value
  fetchFiles({ root: storageDir.value })
  withElectron(() =>
    window.localStorage.setItem(LS_STORAGE_DIR, storageDir.value)
  )
}

const editDir = async () => {
  const dir = await selectDir()
  dir && updateLocalDir(dir)
  updateDest({ dest: storageDir.value })
}

const getNewDir = async () => {
  const { data } = await getDest()
  updateLocalDir(data)
}
</script>

<template>
  <context-holder />
  <header class="header draggable">
    <div class="flex align-center">
      <img :src="appLogo" width="26" alt="内网文件传输助手" />
      <h1>内网文件传输助手</h1>
    </div>
    <p class="tips">使用其它设备浏览器打开：{{ localUrl }}</p>
  </header>
  <section class="content">
    <div class="upload-area">
      <a-upload-dragger
        :file-list="selectedFiles"
        :multiple="true"
        :before-upload="beforeUpload"
        class="upload-dragger"
        @remove="handleRemove"
      >
        <p class="ant-upload-drag-icon">
          <inbox-outlined></inbox-outlined>
        </p>
        <p class="ant-upload-text">点击或拖拽文件进行上传</p>
      </a-upload-dragger>

      <p>
        存储目录：{{ defaultStorageDir }}
        <a-button v-if="inElectron" type="link" @click="editDir">修改</a-button>
        <a-button v-else type="link" @click="getNewDir">
          <redo-outlined />
          刷新
        </a-button>
      </p>
      <a-button
        v-if="isUploading"
        type="primary"
        size="large"
        :loading="isUploading"
      >
        上传中{{ (uploadProgress * 100).toFixed(0) }}%
      </a-button>
      <a-button
        v-else
        type="primary"
        size="large"
        :disabled="disabled"
        @click="handleUpload"
      >
        <upload-outlined></upload-outlined>
        开始上传
      </a-button>
    </div>
    <!-- <input type="file" multiple @change="selectFile" /> -->

    <div class="flex align-center">
      <h3 class="storage-dir">当前目录：{{ storageDir }}</h3>
      <a-button type="link" @click="fetchFiles">
        <redo-outlined />
        刷新
      </a-button>
    </div>
    <ul>
      <li v-if="hasPreviousLevel" class="is-dir" @click="goback">[上级目录]</li>
      <li
        v-for="f in displayFiles"
        :key="f.name"
        class="file-list"
        :class="f.isDir ? 'is-dir' : 'is-not-dir'"
        @click="toDir(f)"
      >
        <img v-if="f.isDir" :src="dirLogo" width="20" />
        <img v-else :src="fileLogo" width="20" />
        <div class="filename">
          <span>{{ f.name }}</span>
          <a
            v-if="!f.isDir && !f.downloadProgressDisplay"
            class="download"
            @click="handleDownloadFile(f)"
          >
            下载
          </a>

          <a v-if="f.downloadProgressDisplay">
            下载中...{{ f.downloadProgressDisplay }}
          </a>
        </div>
      </li>
    </ul>
  </section>
</template>
