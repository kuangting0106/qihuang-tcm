<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import ClinicalNotice from '@/components/ClinicalNotice.vue'
import { treatmentPrinciples, type TreatmentGroup } from '@/data/clinical-methods'

const groupOrder: TreatmentGroup[] = ['总纲', '先后', '湿与饮', '实邪', '站内互证']

const groupIntro: Record<TreatmentGroup, string> = {
  总纲: '先分虚实，再谈攻补。',
  先后: '决定先治哪里、后治哪里。',
  湿与饮: '湿、水、饮要给出路，也要顾阳气。',
  实邪: '该排的排出去，但不要只攻不补。',
  站内互证: '从现有经典与讲义中补几条可对照的治则。',
}

const groups = computed(() =>
  groupOrder.map((group) => ({
    group,
    description: groupIntro[group],
    items: treatmentPrinciples.filter((item) => item.group === group),
  })),
)

const core = computed(() => treatmentPrinciples.find((item) => item.id === 'deficiency-excess'))
</script>

<template>
  <section class="principles">
    <ClinicalNotice />

    <header class="principles-hero">
      <div class="principles-hero__copy">
        <p class="eyebrow">TREATMENT / 治法顺序</p>
        <h2>治疗法门</h2>
        <blockquote>人不会因虚而死，却会因实而亡。</blockquote>
        <p class="principles-hero__lede">
          这里的“实”，指该排出的东西排不出去：邪、痰水、食积、瘀血、燥屎、肿块，甚至癌等滞留体内，日久形成阻塞。
          这句话是经验总结，不是绝对规律；虚实夹杂时，不能只看到虚，却放过实。
        </p>
      </div>
      <div class="principles-hero__badge">
        <span>经验总结</span>
        <strong>非处方</strong>
        <small>具体用药需辨证</small>
      </div>
    </header>

    <section v-if="core" class="core paper-panel">
      <div class="core__head">
        <p class="eyebrow">CORE / 虚实总纲</p>
        <h3>{{ core.title }}</h3>
        <p>{{ core.body }}</p>
      </div>
      <div class="core__grid">
        <article>
          <span class="core__tag core__tag--excess">实</span>
          <h4>该排的排不出去</h4>
          <p>邪、痰、水、食、瘀、燥屎、肿块、癌等滞留，久了阻塞气机。</p>
        </article>
        <article>
          <span class="core__tag core__tag--deficiency">虚</span>
          <h4>该有的不足</h4>
          <p>气、血、津液、阳气不足；但虚证也可能同时夹实。</p>
        </article>
        <article>
          <span class="core__tag core__tag--method">法</span>
          <h4>攻补兼施</h4>
          <p>实则攻之，虚则补之；虚实夹杂时，顾护胃气与津液。</p>
        </article>
      </div>
    </section>

    <section v-for="group in groups" :id="`group-${group.group}`" :key="group.group" class="principle-group">
      <header class="principle-group__head">
        <span class="principle-group__line"></span>
        <div>
          <p class="eyebrow">{{ group.group }}</p>
          <h3>{{ group.description }}</h3>
        </div>
      </header>

      <div class="principle-grid">
        <article v-for="item in group.items" :key="item.id" class="principle-card">
          <div class="principle-card__top">
            <span class="principle-card__group">{{ item.group }}</span>
            <span v-if="item.source" class="principle-card__source-tag">{{ item.source }}</span>
          </div>
          <h4>{{ item.title }}</h4>
          <p>{{ item.body }}</p>
          <ul v-if="item.points?.length">
            <li v-for="point in item.points" :key="point">{{ point }}</li>
          </ul>
          <RouterLink v-if="item.href" class="principle-card__link" :to="item.href">
            对照原文 →
          </RouterLink>
        </article>
      </div>
    </section>

    <footer class="principles-foot paper-panel">
      <div>
        <p class="eyebrow">HOW TO READ / 读法</p>
        <h3>这是决策顺序，不是一套固定处方</h3>
      </div>
      <div>
        <p>
          先辨虚实、表里、寒热、急缓，再决定先解表、先救急、先祛湿、先攻实，还是攻补兼施。
          每一条都要回到具体的人、具体的证与具体的出处；不要按一句话对号入座。
        </p>
        <p class="principles-foot__links">
          <RouterLink class="text-link" to="/methods/ten-questions">回到看诊十问 →</RouterLink>
          <RouterLink class="text-link" to="/classics/shanghan-nihaixia">读《伤寒论》讲义 →</RouterLink>
        </p>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.principles {
  display: grid;
  gap: 24px;
  min-width: 0;
}

.principles-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  gap: 30px;
  align-items: center;
  overflow: hidden;
  padding: 34px 36px;
  border-radius: 6px;
  background:
    radial-gradient(circle at 90% 10%, rgba(176, 138, 74, 0.24), transparent 34%),
    linear-gradient(135deg, #1d2b26 0%, #294842 58%, #315b53 100%);
  color: #f4efe4;
}

.principles-hero::after {
  content: '治';
  position: absolute;
  right: 24px;
  bottom: -46px;
  color: rgba(244, 239, 228, 0.05);
  font-family: var(--serif);
  font-size: 12rem;
  line-height: 1;
  pointer-events: none;
}

.principles-hero .eyebrow {
  color: #d8bc87;
}

.principles-hero h2 {
  margin: 8px 0 16px;
  color: #fbf7ee;
  font-family: var(--serif);
  font-size: clamp(1.9rem, 3.6vw, 2.8rem);
  font-weight: 500;
  letter-spacing: 0.06em;
}

.principles-hero blockquote {
  margin: 0;
  padding-left: 16px;
  border-left: 2px solid #d8bc87;
  color: #fbf7ee;
  font-family: var(--serif);
  font-size: clamp(1.2rem, 2.2vw, 1.65rem);
  line-height: 1.55;
}

.principles-hero__lede {
  max-width: 66ch;
  margin: 16px 0 0;
  color: rgba(244, 239, 228, 0.8);
  font-size: 0.92rem;
  line-height: 1.9;
}

.principles-hero__badge {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 4px;
  padding: 18px;
  border: 1px solid rgba(216, 188, 135, 0.42);
  border-radius: 4px;
  text-align: center;
}

.principles-hero__badge span,
.principles-hero__badge small {
  color: rgba(244, 239, 228, 0.62);
  font-size: 0.72rem;
}

.principles-hero__badge strong {
  color: #d8bc87;
  font-family: var(--serif);
  font-size: 1.2rem;
  font-weight: 500;
}

.core {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 28px;
  padding: 26px 28px;
}

.core h3 {
  margin: 5px 0 10px;
  font-family: var(--serif);
  font-size: 1.35rem;
  font-weight: 500;
}

.core__head > p:last-child {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.8;
}

.core__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.core__grid article {
  min-width: 0;
  padding: 14px 14px 12px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: rgba(255, 253, 247, 0.6);
}

.core__tag {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-bottom: 8px;
  border: 1px solid currentColor;
  border-radius: 50%;
  font-family: var(--serif);
  font-size: 0.9rem;
}

.core__tag--excess {
  color: var(--cinnabar);
}

.core__tag--deficiency {
  color: var(--jade);
}

.core__tag--method {
  color: var(--gold);
}

.core__grid h4 {
  margin: 0 0 5px;
  font-family: var(--serif);
  font-size: 0.98rem;
  font-weight: 500;
}

.core__grid p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.78rem;
  line-height: 1.7;
}

.principle-group {
  display: grid;
  gap: 14px;
  scroll-margin-top: calc(var(--header-h) + 20px);
}

.principle-group__head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.principle-group__line {
  width: 3px;
  height: 42px;
  margin-top: 4px;
  background: var(--gold);
}

.principle-group__head h3 {
  margin: 3px 0 0;
  color: var(--ink-soft);
  font-family: var(--serif);
  font-size: 1.05rem;
  font-weight: 500;
}

.principle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.principle-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(255, 253, 247, 0.9), rgba(247, 242, 231, 0.66)),
    var(--paper);
}

.principle-card__top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.principle-card__group {
  color: var(--gold);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
}

.principle-card__source-tag {
  max-width: 70%;
  color: var(--ink-faint);
  font-size: 0.66rem;
  line-height: 1.5;
  text-align: right;
}

.principle-card h4 {
  margin: 11px 0 8px;
  font-family: var(--serif);
  font-size: 1.12rem;
  font-weight: 500;
  line-height: 1.45;
}

.principle-card > p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.83rem;
  line-height: 1.8;
}

.principle-card ul {
  margin: 11px 0 0;
  padding: 0;
  list-style: none;
}

.principle-card li {
  position: relative;
  padding-left: 14px;
  color: var(--ink-soft);
  font-size: 0.79rem;
  line-height: 1.7;
}

.principle-card li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.7em;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--gold);
}

.principle-card__link {
  margin-top: auto;
  padding-top: 12px;
  color: var(--jade);
  font-size: 0.78rem;
  text-decoration: none;
}

.principle-card__link:hover {
  color: var(--cinnabar);
}

.principles-foot {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 30px;
  padding: 24px 26px;
}

.principles-foot h3 {
  margin: 5px 0 0;
  font-family: var(--serif);
  font-size: 1.25rem;
  font-weight: 500;
}

.principles-foot p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 0.84rem;
  line-height: 1.8;
}

.principles-foot__links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 10px !important;
}

.principles-foot .text-link {
  font-size: 0.8rem;
}

@media (max-width: 980px) {
  .principles-hero {
    grid-template-columns: minmax(0, 1fr);
  }

  .principles-hero__badge {
    justify-self: start;
    grid-template-columns: auto auto auto;
    gap: 10px;
    align-items: center;
    padding: 12px 16px;
  }

  .core,
  .principles-foot {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 760px) {
  .principle-grid,
  .core__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .principles {
    gap: 18px;
  }

  .principles-hero {
    padding: 24px 20px;
  }

  .core,
  .principles-foot {
    padding: 20px 18px;
  }

  .principle-card {
    padding: 18px;
  }

  .principles-hero__badge {
    grid-template-columns: minmax(0, 1fr);
    text-align: left;
  }
}
</style>
