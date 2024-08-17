import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
// import initRouter from './router'
import 'normalize.css'
import './style.css'
import { checkIfInElectron } from './utils'
import { initAxios } from './api/http'
;(async function () {
  checkIfInElectron()

  await initAxios()

  const pinia = createPinia()

  const app = createApp(App)
  app.use(pinia)
  // app.use(initRouter())

  app.mount('#app')
})()
