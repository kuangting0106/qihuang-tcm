<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import CitationDrawer from '@/components/CitationDrawer.vue'
import AboutSiteModal from '@/components/AboutSiteModal.vue'
import { loadTcmData, useTcmData } from '@/composables/useTcmData'

const { data, loading, error } = useTcmData()
const router = useRouter()
const menuOpen = ref(false)
const aboutOpen = ref(false)
const isHome = computed(() => router.currentRoute.value.path === '/')
// 方剂、本草讲义改为按需 API；其他页面仍沿用整份 sample_data。
const needsFullData = computed(
  () => !/^\/(formulas|bencao)(\/|$)/.test(router.currentRoute.value.path),
)

function ensureData() {
  if (needsFullData.value) loadTcmData().catch(() => {})
}

onMounted(() => {
  router.isReady().then(ensureData)
})

watch(
  () => router.currentRoute.value.fullPath,
  () => {
    menuOpen.value = false
    aboutOpen.value = false
    ensureData()
  },
)

function retry() {
  window.location.reload()
}
</script>

<template>
  <a class="skip-link" href="#main">跳到正文</a>

  <div v-if="needsFullData && loading" class="app-state">
    <div class="seal-loader" aria-hidden="true">岐</div>
    <p>正在展开图卷…</p>
  </div>

  <div v-else-if="needsFullData && error" class="app-state app-state--error">
    <div class="seal-loader" aria-hidden="true">!</div>
    <h1>数据没有加载出来</h1>
    <p>{{ error }}</p>
    <button class="btn btn--primary" type="button" @click="retry">重新加载</button>
  </div>

  <template v-else>
    <header class="site-header">
      <div class="site-header__inner">
        <RouterLink class="brand" to="/" aria-label="岐黄图鉴首页">
          <span class="brand__seal" aria-hidden="true">岐</span>
          <span class="brand__text">
            <strong>岐黄图鉴</strong>
            <small>经络 · 本草 · 方剂</small>
          </span>
        </RouterLink>

        <template v-if="!isHome">
          <button
            class="menu-toggle"
            type="button"
            :aria-expanded="menuOpen"
            aria-label="打开导航"
            @click="menuOpen = !menuOpen"
          >
            <span></span><span></span><span></span>
          </button>

          <nav class="site-nav" :class="{ 'site-nav--open': menuOpen }" aria-label="主导航">
            <RouterLink to="/methods">治疗法门篇</RouterLink>
            <RouterLink to="/meridians/lung">经络图</RouterLink>
            <RouterLink to="/herbs">本草</RouterLink>
            <RouterLink to="/formulas">方剂</RouterLink>
            <RouterLink to="/exercises">古法锻炼</RouterLink>
            <RouterLink to="/classics">医家经典书籍</RouterLink>
            <RouterLink to="/cases">医案</RouterLink>
          </nav>
        </template>
      </div>
    </header>

    <main id="main" class="site-main">
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="footer-brand">
          <span class="brand__seal brand__seal--small" aria-hidden="true">岐</span>
          <div>
            <strong>岐黄图鉴</strong>
            <p>把经络、本草、方剂放在同一张可点击的知识地图上。</p>
          </div>
        </div>
        <div class="footer-links">
          <RouterLink to="/methods">治疗法门篇</RouterLink>
          <RouterLink to="/meridians/lung">经络图</RouterLink>
          <RouterLink to="/herbs">本草</RouterLink>
          <RouterLink to="/formulas">方剂</RouterLink>
          <RouterLink to="/exercises">古法锻炼</RouterLink>
          <RouterLink to="/lectures">名家讲堂</RouterLink>
          <RouterLink to="/processing">药材炮制</RouterLink>
          <RouterLink to="/classics">医家经典书籍</RouterLink>
          <RouterLink to="/cases">医案</RouterLink>
          <RouterLink to="/lab/formula-scale">布局演示</RouterLink>
          <button
            class="footer-about"
            type="button"
            aria-haspopup="dialog"
            :aria-expanded="aboutOpen"
            @mouseenter="aboutOpen = true"
            @click="aboutOpen = true"
            @focus="aboutOpen = true"
          >
            关于本站
          </button>
        </div>
      </div>
      <div class="footer-bottom">
        <span>内容版本 {{ data?.contentVersion }} · 样例数据</span>
        <span>{{ data?.disclaimer }}</span>
      </div>
    </footer>

    <AboutSiteModal :open="aboutOpen" @close="aboutOpen = false" />
    <CitationDrawer />
  </template>
</template>
