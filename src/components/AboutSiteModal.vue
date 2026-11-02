<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const closeRef = ref<HTMLButtonElement | null>(null)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('close')
}

watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      await nextTick()
      closeRef.value?.focus()
    }
  },
  { immediate: true },
)

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <transition name="about-fade">
      <div v-if="open" class="about-overlay" @click.self="emit('close')">
        <section class="about-modal" role="dialog" aria-modal="true" aria-labelledby="about-title">
          <button
            ref="closeRef"
            class="about-modal__close"
            type="button"
            aria-label="关闭关于本站"
            @click="emit('close')"
          >
            ×
          </button>

          <p class="eyebrow">HOW TO READ / 关于本站</p>
          <h2 id="about-title">这不是一份“看起来很像”的中医文案</h2>
          <p class="about-modal__lead">
            原型里的每一条内容都挂在来源上。经典原文、药典/标准、教材归纳分别标注；
            查不到确切出处的字段宁可不写。
          </p>

          <div class="about-principles">
            <article>
              <span class="about-principles__num">01</span>
              <div>
                <h3>原文与方解分开</h3>
                <p>“桂枝为君”不是《伤寒论》原文，而是后世方书归纳，页面会明确标成“后世方解”。</p>
              </div>
            </article>
            <article>
              <span class="about-principles__num">02</span>
              <div>
                <h3>穴位坐标离线预计算</h3>
                <p>3D 只读 JSON 坐标表，不在运行时把点贴到人体表面，换模型必须换坐标版本。</p>
              </div>
            </article>
            <article>
              <span class="about-principles__num">03</span>
              <div>
                <h3>方剂大方不画成乱麻</h3>
                <p>1～8 味用同心环；21 味以上默认按角色分组列表，全部展开，不折叠。</p>
              </div>
            </article>
          </div>

          <div class="about-modal__foot">
            <RouterLink class="text-link" to="/classics" @click="emit('close')">
              查看医家经典古籍 →
            </RouterLink>
            <span>鼠标悬停或点击页脚“关于本站”可再次打开。</span>
          </div>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.about-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(38, 33, 26, 0.46);
  backdrop-filter: blur(3px);
}

.about-modal {
  position: relative;
  width: min(760px, 100%);
  max-height: min(82vh, 760px);
  overflow: auto;
  padding: 32px 34px 26px;
  border: 1px solid var(--line-strong);
  border-radius: 18px;
  background: var(--paper);
  box-shadow: 0 24px 70px rgba(38, 33, 26, 0.28);
}

.about-modal__close {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 50%;
  background: transparent;
  color: var(--ink-soft);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}

.about-modal__close:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.about-modal h2 {
  margin: 4px 0 12px;
  padding-right: 32px;
  font-size: clamp(1.7rem, 4vw, 2.5rem);
  line-height: 1.25;
}

.about-modal__lead {
  max-width: 620px;
  color: var(--ink-soft);
  font-size: 0.88rem;
  line-height: 1.9;
}

.about-principles {
  display: grid;
  gap: 10px;
  margin-top: 20px;
}

.about-principles article {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 12px;
  padding: 13px 15px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.52);
}

.about-principles__num {
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.98rem;
}

.about-principles h3 {
  font-size: 0.96rem;
}

.about-principles p {
  margin-top: 3px;
  color: var(--ink-soft);
  font-size: 0.8rem;
  line-height: 1.75;
}

.about-modal__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.about-modal__foot .text-link {
  font-size: 0.84rem;
}

.about-modal__foot span {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.about-fade-enter-active,
.about-fade-leave-active {
  transition: opacity 0.18s ease;
}

.about-fade-enter-from,
.about-fade-leave-to {
  opacity: 0;
}

@media (max-width: 680px) {
  .about-overlay {
    padding: 12px;
  }

  .about-modal {
    padding: 26px 20px 20px;
  }

  .about-principles article {
    grid-template-columns: 30px minmax(0, 1fr);
    gap: 8px;
  }
}
</style>
