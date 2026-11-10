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
      path: '/methods/acupuncture/tutorial/:chapterId?/:sectionId?',
      name: 'acupuncture-tutorial',
      component: () => import('@/views/AcupunctureTutorialView.vue'),
      meta: { title: '倪海厦针灸教程', section: 'methods' },
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
      path: '/herbs/rank/:key',
      name: 'herb-rank',
      component: () => import('@/views/HerbCollectionView.vue'),
      meta: { title: '三经药材', collectionKind: 'rank' },
    },
    {
      path: '/herbs/category/:key',
      name: 'herb-category',
      component: () => import('@/views/HerbCollectionView.vue'),
      meta: { title: '功效分类药材', collectionKind: 'category' },
    },
    {
      path: '/herbs/:id',
      name: 'herb-detail',
      component: () => import('@/views/HerbDetailView.vue'),
      meta: { title: '本草详情' },
    },
    {
      path: '/bencao',
      name: 'bencao-lectures',
      component: () => import('@/views/BencaoLecturesView.vue'),
      meta: { title: '神农本草经讲义' },
    },
    {
      path: '/bencao/dacheng',
      name: 'bencao-dacheng',
      component: () => import('@/views/BencaoDachengView.vue'),
      meta: { title: '本草大全' },
    },
    {
      path: '/bencao/dacheng/:id',
      name: 'bencao-dacheng-entry',
      component: () => import('@/views/BencaoDachengEntryView.vue'),
      meta: { title: '本草大全 · 药材' },
    },
    {
      path: '/bencao/:groupId',
      name: 'bencao-group',
      component: () => import('@/views/BencaoGroupView.vue'),
      meta: { title: '讲义目录' },
    },
    {
      path: '/bencao/:groupId/:entryId',
      name: 'bencao-entry',
      component: () => import('@/views/BencaoEntryView.vue'),
      meta: { title: '讲义正文' },
    },
    {
      path: '/formulas',
      name: 'formulas',
      component: () => import('@/views/FormulaListView.vue'),
      meta: { title: '方剂' },
    },
    {
      path: '/formulas/search',
      name: 'formula-search',
      component: () => import('@/views/FormulaCategoryView.vue'),
      meta: { title: '方剂检索' },
    },
    {
      path: '/formulas/source/:book/:chapter',
      name: 'formula-source',
      component: () => import('@/views/FormulaCategoryView.vue'),
      meta: { title: '方剂分类' },
    },
    {
      path: '/formulas/class/:key',
      name: 'formula-class',
      component: () => import('@/views/FormulaCategoryView.vue'),
      meta: { title: '方剂分类' },
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
      meta: { title: '医案', section: 'cases' },
    },
    {
      path: '/cases/all',
      name: 'cases-all',
      component: () => import('@/views/CaseCollectionView.vue'),
      meta: { title: '全部医案', section: 'cases' },
    },
    {
      path: '/cases/doctor/:doctor',
      name: 'cases-doctor',
      component: () => import('@/views/CaseCollectionView.vue'),
      meta: { title: '医家医案', section: 'cases' },
    },
    {
      path: '/cases/category/:category',
      name: 'cases-category',
      component: () => import('@/views/CaseCollectionView.vue'),
      meta: { title: '分类医案', section: 'cases' },
    },
    {
      path: '/cases/:id',
      name: 'case-detail',
      component: () => import('@/views/TopicDetailView.vue'),
      meta: { title: '医案 · 栏目', section: 'cases' },
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
      path: '/lectures',
      name: 'lectures',
      component: () => import('@/views/LecturesView.vue'),
      meta: { title: '名家讲堂' },
    },
    {
      path: '/lectures/li-ke',
      name: 'li-ke-outline',
      component: () => import('@/views/LiKeOutlineView.vue'),
      meta: { title: '李可医书经验提纲' },
    },
    {
      path: '/lectures/li-ke/:detailId',
      name: 'li-ke-detail',
      component: () => import('@/views/LiKeDetailView.vue'),
      meta: { title: '李可医书经验提纲 · 全文详解' },
    },
    {
      path: '/processing',
      name: 'processing',
      component: () => import('@/views/ProcessingView.vue'),
      meta: { title: '药材的炮制' },
    },
    {
      path: '/processing/book/:bookId',
      name: 'processing-book',
      component: () => import('@/views/ProcessingBookView.vue'),
      meta: { title: '古籍炮制目录' },
    },
    {
      path: '/processing/herb/:id',
      name: 'processing-herb',
      component: () => import('@/views/ProcessingHerbView.vue'),
      meta: { title: '古籍炮制药材' },
    },
    {
      path: '/first-aid/:id',
      name: 'first-aid-detail',
      component: () => import('@/views/FirstAidDetailView.vue'),
      meta: { title: '中医急救知识' },
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
      path: '/classics',
      name: 'classics',
      component: () => import('@/views/ClassicsView.vue'),
      meta: { title: '医家经典书籍' },
    },
    {
      path: '/classics/library',
      name: 'library',
      component: () => import('@/views/LibraryView.vue'),
      meta: { title: '医藏古籍' },
    },
    {
      path: '/classics/library/:bookId',
      name: 'library-book',
      component: () => import('@/views/LibraryBookView.vue'),
      meta: { title: '医藏书目' },
    },
    {
      path: '/classics/library/:bookId/:sectionId',
      name: 'library-section',
      component: () => import('@/views/LibrarySectionView.vue'),
      meta: { title: '医藏原文' },
    },
    {
      path: '/classics/citations/:workKey',
      name: 'classic-citations',
      component: () => import('@/views/ClassicCitationView.vue'),
      meta: { title: '引文索引' },
    },
    {
      path: '/classics/:bookId',
      name: 'classic-book',
      component: () => import('@/views/ClassicBookView.vue'),
      meta: { title: '古籍全文' },
    },
    {
      path: '/classics/:bookId/:chapterId',
      name: 'classic-chapter',
      component: () => import('@/views/ClassicChapterView.vue'),
      meta: { title: '古籍原文' },
    },
    {
      path: '/sources',
      redirect: '/classics',
    },
    {
      path: '/lab/formula-scale',
      name: 'lab-formula-scale',
      component: () => import('@/views/LabFormulaScaleView.vue'),
      meta: { title: '布局演示' },
    },
    {
      path: '/admin/notes',
      name: 'notes-admin',
      component: () => import('@/views/NotesAdminView.vue'),
      meta: { title: '标注管理' },
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
