<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useCitationDrawer, closeCitations } from '@/composables/useCitationDrawer'
import { useTcmData } from '@/composables/useTcmData'
import { fetchSources } from '@/composables/useSourceApi'
import type { Citation } from '@/types/tcm'

const state = useCitationDrawer()
const { citationsById } = useTcmData()
const closeButton = ref<HTMLButtonElement | null>(null)

const citations = computed<Citation[]>(() =>
  state.ids.map((id) => citationsById.value.get(id)).filter((x): x is Citation => !!x),
)

const typeLabels: Record<string, string> = {
  classic: '经典原文',
  standard: '标准/药典',
  textbook: '教材归纳',
  image: '图片',
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeCitations()
}

watch(
  () => state.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      const missing = state.ids.filter((id) => !citationsById.value.get(id)?.quote)
      if (missing.length) void fetchSources(missing).catch(() => {})
      window.addEventListener('keydown', onKeydown)
      await nextTick()
      closeButton.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
    }
  },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="state.open" class="drawer-backdrop" @click.self="closeCitations">
        <section class="citation-drawer" role="dialog" aria-modal="true" aria-labelledby="citation-title">
          <header class="citation-drawer__head">
            <div>
              <p class="eyebrow">SOURCE / 出处</p>
              <h2 id="citation-title">{{ state.title }}</h2>
              <p class="muted">共 {{ citations.length }} 条来源。原文、标准与后世方解分开标注。</p>
            </div>
            <button ref="closeButton" class="icon-btn" type="button" aria-label="关闭" @click="closeCitations">
              ×
            </button>
          </header>

          <div class="citation-drawer__body">
            <article v-for="(c, index) in citations" :key="c.id" class="citation-card">
              <div class="citation-card__top">
                <span class="citation-type" :class="`citation-type--${c.type}`">
                  {{ typeLabels[c.type] ?? c.type }}
                </span>
                <span class="citation-card__index">[{{ index + 1 }}]</span>
              </div>
              <h3>{{ c.work }}</h3>
              <p v-if="c.parentWork" class="citation-card__parent">
                属张仲景《{{ c.parentWork }}》· {{ c.work }}部分
              </p>
              <p class="citation-card__meta">
                <span v-if="c.author">{{ c.author }}</span>
                <span v-if="c.edition">{{ c.edition }}</span>
                <span v-if="c.publisher">{{ c.publisher }}</span>
                <span v-if="c.year">{{ c.year }}</span>
              </p>
              <p class="citation-card__locator">{{ c.locator }}</p>
              <blockquote v-if="c.quote" class="citation-quote">{{ c.quote }}</blockquote>
              <p v-else class="citation-card__note">本条为依据该来源归纳，未附逐字原文。</p>
              <p v-if="c.parentNote" class="citation-card__note">{{ c.parentNote }}</p>
              <p v-if="c.note" class="citation-card__note">{{ c.note }}</p>
              <a v-if="c.url" class="text-link" :href="c.url" target="_blank" rel="noreferrer">查看来源</a>
            </article>
          </div>

          <footer class="citation-drawer__foot">
            <span>仅供学习，不构成诊疗建议。</span>
            <button class="btn btn--ghost" type="button" @click="closeCitations">关闭</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
