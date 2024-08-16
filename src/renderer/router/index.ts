import { createRouter, createWebHistory } from 'vue-router'

export default () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [],
  })

  // 全局导航守卫
  router.beforeEach((to, from) => {
    return true
  })
  return router
}
