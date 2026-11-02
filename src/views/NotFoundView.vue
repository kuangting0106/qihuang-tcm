<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="page container">
    <div class="empty-state paper-panel not-found">
      <p class="eyebrow">404 / NOT FOUND</p>
      <h1>这一页没有收进图卷</h1>
      <p>可能是链接写错了，或者这个条目还没有收录。</p>
      <div class="not-found__actions">
        <RouterLink class="btn btn--primary" to="/">回首页</RouterLink>
        <RouterLink class="btn" to="/herbs">去本草</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  margin-top: 50px;
  padding: 80px 24px;
}

.not-found h1 {
  margin: 8px 0 10px;
  font-size: clamp(2rem, 4vw, 3rem);
}

.not-found__actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 22px;
}
</style>
