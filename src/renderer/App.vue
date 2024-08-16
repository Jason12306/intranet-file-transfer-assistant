<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { downloadFile, getFiles, uploadFiles } from './api/http'
import type { AxiosProgressEvent } from 'axios'
import dirLogo from '@/assets/imgs/dir.svg'
import fileLogo from '@/assets/imgs/file.svg'
import { Button as AButton, UploadProps, message } from 'ant-design-vue'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons-vue'
import { progres2Display } from './utils'
import { selectDir } from './electron-api'

const [messageApi, contextHolder] = message.useMessage()

const selectedFiles = ref<File[]>([])

const disabled = computed(
  () => !(selectedFiles.value && selectedFiles.value.length)
)

const selectFile = (evt: any) => {
  // const target = evt.target as HTMLInputElement
  console.log(evt)

  const files: File[] = evt.files

  if (!files) {
    return
  }
  selectedFiles.value = files
  // selectedFiles.value.push(...Array.from(files))
}
const uploadProgress = ref(0)
const isUploading = computed(
  () => !(uploadProgress.value === 0 || uploadProgress.value === 1)
)
// start upload
const handleUpload = async () => {
  if (disabled.value) return
  const formdata = new FormData()
  for (const file of selectedFiles.value) {
    formdata.append('jasonfiles', file, file.name)
    formdata.append('storagedir', storageDir.value)
  }

  await uploadFiles(formdata, (evt: AxiosProgressEvent) => {
    console.log(evt.progress)
    uploadProgress.value = evt.progress || 0
  })

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

const fetchFiles = async (formdata?: { dest?: string }) => {
  if (!formdata?.dest) {
    formdata = {
      dest: storageDir.value,
    }
  }
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

  fetchFiles({ dest: storageDir.value + dirname })
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
// 提交到git  跨平台
// download file
const handleDownloadFile = async (f: DisplayFile) => {
  const dest = storageDir.value + f.name
  const data = await downloadFile({ dest }, (evt) => {
    console.log(evt.progress)
    f.downloadProgressDisplay = progres2Display(evt.progress)
  })
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

onMounted(async () => {
  const { storageDir } = await fetchFiles()

  defaultStorageDir.value = storageDir
})

const editDir = async () => {
  defaultStorageDir.value = await selectDir()
  storageDir.value = defaultStorageDir.value
  fetchFiles()
}
</script>

<template>
  <context-holder />
  <header class="header draggable">
    <h1>内网文件传输助手</h1>
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
        <a-button type="text" @click="editDir">修改</a-button>
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

    <h3 class="storage-dir">当前目录：{{ storageDir }}</h3>
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

<style>
.draggable {
  -webkit-app-region: drag;
}
body {
  height: 100vh;
}

.is-dir {
  cursor: pointer;
  text-decoration: underline;
  &:active {
    color: red;
  }
}

.is-not-dir .filename {
  /* margin-left: 28px; */
}

.file-list {
  display: flex;
  margin: 0.5rem 0;
  gap: 16px 8px;
  align-items: center;
}

.download {
  text-decoration: underline;
  color: blue;
  margin-left: 1rem;
  cursor: pointer;
}

.header,
.content {
  padding: 0 16px;
}

.header h1 {
  margin: 0;
  padding: 1rem;
}

.content,
.header {
  max-width: 750px;
  margin: 0 auto;
}

.upload-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.upload-dragger {
  width: 100%;
  margin-bottom: 0.5rem;
}

.storage-dir {
  word-break: break-all;
}
ul {
  padding: 0;
}
</style>
