import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: 96, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页' },
    },
    {
      path: '/methods',
      name: 'methods',
      component: () => import('@/views/TopicIndexView.vue'),
      meta: { title: '治疗法门篇', section: 'methods' },
    },
    {
      path: '/methods/:id',
      name: 'method-detail',
      component: () => import('@/views/TopicDetailView.vue'),
      meta: { title: '治疗法门篇 · 栏目', section: 'methods' },
    },
    {
      path: '/herbs',
      name: 'herbs',
      component: () => import('@/views/HerbListView.vue'),
      meta: { title: '本草' },
    },
    {
      path: '/herbs/:id',
      name: 'herb-detail',
      component: () => import('@/views/HerbDetailView.vue'),
      meta: { title: '本草详情' },
    },
    {
      path: '/formulas',
      name: 'formulas',
      component: () => import('@/views/FormulaListView.vue'),
      meta: { title: '方剂' },
    },
    {
      path: '/formulas/:id',
      name: 'formula-detail',
      component: () => import('@/views/FormulaDetailView.vue'),
      meta: { title: '方剂详情' },
    },
    {
      path: '/cases',
      name: 'cases',
      component: () => import('@/views/TopicIndexView.vue'),
      meta: { title: '案列篇', section: 'cases' },
    },
    {
      path: '/cases/:id',
      name: 'case-detail',
      component: () => import('@/views/TopicDetailView.vue'),
      meta: { title: '案列篇 · 栏目', section: 'cases' },
    },
    {
      path: '/exercises',
      name: 'exercises',
      component: () => import('@/views/ExercisesView.vue'),
      meta: { title: '古法锻炼' },
    },
    {
      path: '/exercises/:id',
      name: 'exercise-detail',
      component: () => import('@/views/ExerciseDetailView.vue'),
      meta: { title: '古法锻炼 · 收藏页' },
    },
    {
      path: '/meridians',
      redirect: '/meridians/lung',
    },
    {
      path: '/meridians/:id',
      name: 'meridian',
      component: () => import('@/views/MeridianView.vue'),
      meta: { title: '经络图' },
    },
    {
      path: '/sources',
      name: 'sources',
      component: () => import('@/views/SourcesView.vue'),
      meta: { title: '出处索引' },
    },
    {
      path: '/lab/formula-scale',
      name: 'lab-formula-scale',
      component: () => import('@/views/LabFormulaScaleView.vue'),
      meta: { title: '布局演示' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '未找到' },
    },
  ],
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : ''
  document.title = title ? `${title} · 岐黄图鉴` : '岐黄图鉴 · 中医知识可视化'
})

export default router
