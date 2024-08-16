import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
// import initRouter from './router'
import 'normalize.css'
const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
// app.use(initRouter())

app.mount('#app')
