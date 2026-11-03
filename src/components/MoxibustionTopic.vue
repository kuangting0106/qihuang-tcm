<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import moxibustion from '@/data/moxibustion.json'

const activeId = ref(moxibustion.sections[0]?.id ?? '')
const activeSection = computed(
  () => moxibustion.sections.find((section) => section.id === activeId.value) ?? moxibustion.sections[0],
)

let observer: IntersectionObserver | null = null

onMounted(() => {
  const targets = moxibustion.sections
    .map((section) => document.getElementById(section.id))
    .filter((element): element is HTMLElement => Boolean(element))
  if (!targets.length) return

  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible?.target.id) activeId.value = visible.target.id
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: [0.1, 0.35, 0.6] },
  )
  targets.forEach((target) => observer?.observe(target))
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <section class="moxa">
    <div class="moxa-warning" role="note">
      <span class="moxa-warning__mark">慎</span>
      <div>
        <strong>{{ moxibustion.warning.title }}</strong>
        <p>{{ moxibustion.warning.body }}</p>
      </div>
    </div>

    <header class="moxa-hero">
      <div class="moxa-hero__copy">
        <p class="eyebrow">MOXIBUSTION / 灸法节录</p>
        <h2>灸的时机与四种灸法</h2>
        <p class="moxa-hero__lede">
          从“为什么要灸”到隔姜、隔盐、隔蒜、米粒四法，再到热症与禁灸部位。文字节录自倪海厦《人纪·针灸教程》第一章，只收与灸有关的段落。
        </p>
        <div class="moxa-hero__source">
          <span>{{ moxibustion.source.work }}</span>
          <span>{{ moxibustion.source.chapter }}</span>
          <span>页 {{ moxibustion.source.pages }}</span>
        </div>
      </div>
      <dl class="moxa-facts">
        <div v-for="fact in moxibustion.facts" :key="fact.label">
          <dt>{{ fact.label }}</dt>
          <dd>{{ fact.value }}</dd>
        </div>
      </dl>
    </header>

    <div class="moxa-layout">
      <aside class="moxa-nav" aria-label="灸法页内目录">
        <p class="moxa-nav__title">本页目录</p>
        <a
          v-for="section in moxibustion.sections"
          :key="section.id"
          :href="`#${section.id}`"
          :class="{ 'is-active': activeId === section.id }"
          @click="activeId = section.id"
        >
          <span class="moxa-nav__no">{{ section.no }}</span>
          <span class="moxa-nav__label">{{ section.title }}</span>
          <small>{{ section.page }} 页</small>
        </a>
        <RouterLink class="moxa-nav__link" to="/methods/acupuncture/tutorial/chapter-1/s1">
          进入完整针灸教程 →
        </RouterLink>
      </aside>

      <article class="moxa-body">
        <section
          v-for="section in moxibustion.sections"
          :id="section.id"
          :key="section.id"
          class="moxa-section"
          :class="{ 'moxa-section--caution': section.id === 'caution' }"
        >
          <header class="moxa-section__head">
            <span class="moxa-section__no">{{ section.no }}</span>
            <div class="moxa-section__titles">
              <p class="eyebrow">{{ section.id === 'caution' ? 'CONTRAINDICATIONS / 宜忌' : 'METHOD / 灸法' }}</p>
              <h3>{{ section.title }}</h3>
              <p>{{ section.subtitle }}</p>
            </div>
            <span class="moxa-section__page">页 {{ section.page }}</span>
          </header>

          <p v-if="section.lead" class="moxa-section__lead">{{ section.lead }}</p>

          <div class="moxa-reading">
            <p v-for="(paragraph, index) in section.paragraphs" :key="index">{{ paragraph }}</p>
          </div>
        </section>

        <footer class="moxa-source">
          <p class="eyebrow">SOURCE / 出处</p>
          <p>{{ moxibustion.source.note }}</p>
          <p class="moxa-source__locator">
            {{ moxibustion.source.work }} · {{ moxibustion.source.chapter }} · 页
            {{ moxibustion.source.pages }}
          </p>
          <RouterLink class="text-link" to="/methods/acupuncture/tutorial/chapter-1/s1">
            对照教程上下文阅读 →
          </RouterLink>
        </footer>
      </article>
    </div>

    <p class="moxa-current">
      当前阅读：<strong>{{ activeSection?.title }}</strong>
      <span v-if="activeSection"> · 第 {{ activeSection.no }} 节</span>
    </p>
  </section>
</template>

<style scoped>
.moxa {
  display: grid;
  gap: 26px;
  min-width: 0;
}

.moxa-warning {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border: 1px solid rgba(163, 58, 43, 0.35);
  border-left: 4px solid var(--cinnabar);
  border-radius: 4px;
  background: rgba(163, 58, 43, 0.06);
}

.moxa-warning__mark {
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

.moxa-warning strong {
  display: block;
  margin-bottom: 3px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 0.98rem;
}

.moxa-warning p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.88rem;
  line-height: 1.75;
}

.moxa-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
  gap: 34px;
  overflow: hidden;
  padding: 36px 38px;
  border-radius: 6px;
  background:
    radial-gradient(circle at 88% 12%, rgba(176, 138, 74, 0.28), transparent 34%),
    linear-gradient(135deg, #1d2b26 0%, #294842 58%, #315b53 100%);
  color: #f4efe4;
}

.moxa-hero::after {
  content: '灸';
  position: absolute;
  right: 18px;
  bottom: -38px;
  color: rgba(244, 239, 228, 0.055);
  font-family: var(--serif);
  font-size: 13rem;
  line-height: 1;
  pointer-events: none;
}

.moxa-hero .eyebrow {
  color: #d8bc87;
}

.moxa-hero h2 {
  margin: 10px 0 14px;
  color: #fbf7ee;
  font-family: var(--serif);
  font-size: clamp(1.9rem, 3.4vw, 2.8rem);
  font-weight: 500;
  letter-spacing: 0.04em;
}

.moxa-hero__lede {
  max-width: 62ch;
  margin: 0;
  color: rgba(244, 239, 228, 0.82);
  font-size: 0.95rem;
  line-height: 1.9;
}

.moxa-hero__source {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 22px;
  color: rgba(244, 239, 228, 0.68);
  font-size: 0.78rem;
  letter-spacing: 0.04em;
}

.moxa-hero__source span + span::before {
  content: '/';
  margin-right: 18px;
  color: rgba(216, 188, 135, 0.5);
}

.moxa-facts {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  gap: 0;
  margin: 0;
  border-left: 1px solid rgba(216, 188, 135, 0.28);
}

.moxa-facts > div {
  padding: 12px 0 12px 22px;
  border-bottom: 1px solid rgba(216, 188, 135, 0.16);
}

.moxa-facts > div:last-child {
  border-bottom: 0;
}

.moxa-facts dt {
  margin-bottom: 4px;
  color: rgba(216, 188, 135, 0.8);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

.moxa-facts dd {
  margin: 0;
  color: #fbf7ee;
  font-family: var(--serif);
  font-size: 1rem;
  line-height: 1.55;
}

.moxa-layout {
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr);
  gap: 26px;
  align-items: start;
  min-width: 0;
}

.moxa-nav {
  position: sticky;
  top: calc(var(--header-h) + 18px);
  display: grid;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.72);
}

.moxa-nav__title {
  margin: 0;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-faint);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
}

.moxa-nav a {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  padding: 11px 14px;
  border-left: 2px solid transparent;
  color: var(--ink-soft);
  text-decoration: none;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.moxa-nav a:hover {
  background: rgba(47, 93, 87, 0.06);
}

.moxa-nav a.is-active {
  border-left-color: var(--cinnabar);
  background: rgba(163, 58, 43, 0.055);
  color: var(--ink);
}

.moxa-nav__no {
  color: var(--gold);
  font-family: var(--serif);
  font-size: 0.78rem;
}

.moxa-nav__label {
  font-family: var(--serif);
  font-size: 0.9rem;
}

.moxa-nav a small {
  color: var(--ink-faint);
  font-size: 0.68rem;
}

.moxa-nav__link {
  display: block;
  margin-top: 4px;
  padding: 13px 16px;
  border-top: 1px solid var(--line);
  color: var(--jade);
  font-size: 0.8rem;
  white-space: nowrap;
  text-decoration: none;
}

.moxa-nav__link:hover {
  color: var(--cinnabar);
}

.moxa-body {
  display: grid;
  gap: 22px;
  min-width: 0;
}

.moxa-section {
  scroll-margin-top: calc(var(--header-h) + 20px);
  padding: 28px 30px 30px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.9), rgba(247, 242, 231, 0.72)),
    var(--paper);
}

.moxa-section--caution {
  border-color: rgba(163, 58, 43, 0.28);
  background:
    linear-gradient(180deg, rgba(255, 250, 246, 0.94), rgba(248, 238, 232, 0.7)),
    var(--paper);
}

.moxa-section__head {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}

.moxa-section__no {
  color: rgba(176, 138, 74, 0.55);
  font-family: var(--serif);
  font-size: 2.4rem;
  line-height: 0.9;
}

.moxa-section__titles h3 {
  margin: 5px 0 6px;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.55rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.moxa-section__titles > p:last-child {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.84rem;
  line-height: 1.65;
}

.moxa-section__page {
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: 2px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  white-space: nowrap;
}

.moxa-section__lead {
  margin: 18px 0 0;
  padding: 12px 16px;
  border-left: 2px solid var(--gold);
  background: rgba(176, 138, 74, 0.06);
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 0.94rem;
  line-height: 1.8;
}

.moxa-reading {
  margin-top: 18px;
}

.moxa-reading p {
  margin: 0 0 1em;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 1.02rem;
  line-height: 2.05;
  text-align: justify;
  text-indent: 2em;
}

.moxa-reading p:last-child {
  margin-bottom: 0;
}

.moxa-source {
  padding: 22px 24px;
  border: 1px dashed var(--line);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.55);
}

.moxa-source p {
  margin: 0 0 8px;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.8;
}

.moxa-source__locator {
  color: var(--ink-faint) !important;
  font-size: 0.78rem !important;
}

.moxa-source .text-link {
  font-size: 0.84rem;
}

.moxa-current {
  margin: 0;
  color: var(--ink-faint);
  font-size: 0.76rem;
  text-align: right;
}

.moxa-current strong {
  color: var(--jade);
  font-weight: 500;
}

@media (max-width: 980px) {
  .moxa-hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
    padding: 30px;
  }

  .moxa-facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-top: 1px solid rgba(216, 188, 135, 0.22);
    border-left: 0;
  }

  .moxa-facts > div {
    padding: 12px 16px 12px 0;
  }

  .moxa-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .moxa-nav {
    position: static;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .moxa-nav__title,
  .moxa-nav__link {
    grid-column: 1 / -1;
  }

  .moxa-nav a {
    border-left: 0;
    border-bottom: 2px solid transparent;
  }

  .moxa-nav a.is-active {
    border-bottom-color: var(--cinnabar);
  }
}

@media (max-width: 640px) {
  .moxa {
    gap: 18px;
  }

  .moxa-warning {
    padding: 14px;
  }

  .moxa-hero {
    padding: 24px 20px;
  }

  .moxa-facts {
    grid-template-columns: minmax(0, 1fr);
  }

  .moxa-nav {
    grid-template-columns: minmax(0, 1fr);
  }

  .moxa-section {
    padding: 20px 18px 22px;
  }

  .moxa-section__head {
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 10px;
  }

  .moxa-section__page {
    grid-column: 2;
    justify-self: start;
  }

  .moxa-section__no {
    font-size: 2rem;
  }

  .moxa-section__titles h3 {
    font-size: 1.35rem;
  }

  .moxa-reading p {
    font-size: 0.98rem;
  }

  .moxa-current {
    text-align: left;
  }
}
</style>
