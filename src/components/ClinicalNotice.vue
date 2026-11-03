<script setup lang="ts">
import { clinicalDisclaimer } from '@/data/clinical-methods'
</script>

<template>
  <aside class="clinical-notice" role="note">
    <span class="clinical-notice__mark">慎</span>
    <div>
      <strong>{{ clinicalDisclaimer.title }}</strong>
      <p>{{ clinicalDisclaimer.body }}</p>
    </div>
  </aside>
</template>

<style scoped>
.clinical-notice {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border: 1px solid rgba(163, 58, 43, 0.32);
  border-left: 4px solid var(--cinnabar);
  border-radius: 4px;
  background: rgba(163, 58, 43, 0.055);
}

.clinical-notice__mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border: 1px solid var(--cinnabar);
  border-radius: 50%;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.95rem;
}

.clinical-notice strong {
  display: block;
  margin-bottom: 3px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.98rem;
}

.clinical-notice p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.75;
}

@media (max-width: 640px) {
  .clinical-notice {
    padding: 14px;
  }
}
</style>
