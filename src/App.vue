<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import CitationDrawer from '@/components/CitationDrawer.vue'
import { loadTcmData, useTcmData } from '@/composables/useTcmData'

const { data, loading, error } = useTcmData()
const route = useRoute()
const menuOpen = ref(false)

onMounted(() => {
  loadTcmData().catch(() => {})
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

function retry() {
  window.location.reload()
}
</script>

<template>
  <a class="skip-link" href="#main">跳到正文</a>

  <div v-if="loading" class="app-state">
    <div class="seal-loader" aria-hidden="true">岐</div>
    <p>正在展开图卷…</p>
  </div>

  <div v-else-if="error" class="app-state app-state--error">
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
          <RouterLink to="/cases">案列篇</RouterLink>
          <RouterLink to="/exercises">古法锻炼</RouterLink>
          <RouterLink to="/sources">出处索引</RouterLink>
        </nav>
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
          <RouterLink to="/cases">案列篇</RouterLink>
          <RouterLink to="/exercises">古法锻炼</RouterLink>
          <RouterLink to="/sources">出处索引</RouterLink>
          <RouterLink to="/lab/formula-scale">布局演示</RouterLink>
        </div>
      </div>
      <div class="footer-bottom">
        <span>内容版本 {{ data?.contentVersion }} · 样例数据</span>
        <span>{{ data?.disclaimer }}</span>
      </div>
    </footer>

    <CitationDrawer />
  </template>
</template>
