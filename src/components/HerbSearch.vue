<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type {
  HerbCategoryMeta,
  HerbRankMeta,
  HerbSearchIndexPayload,
} from '@/composables/useHerbApi'

type SearchHerb = HerbSearchIndexPayload['herbs'][number]
type SearchLecture = HerbSearchIndexPayload['lectures'][number]

const props = defineProps<{
  herbs: SearchHerb[]
  lectures: SearchLecture[]
  ranks: HerbRankMeta[]
  categories: HerbCategoryMeta[]
}>()

const router = useRouter()

interface SearchEntry {
  key: string
  name: string
  pinyin: string
  aliases: string[]
  href: string
  rankTitle: string
  categoryTitles: string[]
  kind: '药典条目' | '讲义条目'
}

const rankTitles = computed(() => {
  const map = new Map<string, string>()
  for (const rank of props.ranks) map.set(rank.id, rank.title)
  map.set('nishi', '倪师补充')
  map.set('editor', '小编补充')
  return map
})

const categoryTitles = computed(() => {
  const map = new Map<string, string>()
  for (const category of props.categories) map.set(category.id, category.title)
  return map
})

function splitAliases(text: string) {
  return text
    .split(/[、，,。；;]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 8)
}

function uniqueAliases(values: Array<string | undefined>) {
  const seen = new Set<string>()
  const aliases: string[] = []
  for (const value of values) {
    const alias = value
      ?.replace(/（[^）]*）/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/[。；，,]+$/g, '')
      .trim()
    if (!alias || seen.has(alias)) continue
    seen.add(alias)
    aliases.push(alias)
  }
  return aliases
}

const entries = computed<SearchEntry[]>(() => {
  const curated = props.herbs.map<SearchEntry>((herb) => ({
    key: `herb-${herb.id}`,
    name: herb.name,
    pinyin: herb.pinyin,
    aliases: uniqueAliases([
      ...herb.aliases,
      ...splitAliases(herb.names.ancient.text),
    ]),
    href: `/herbs/${herb.id}`,
    rankTitle: rankTitles.value.get(herb.classicRankId) ?? '三经待考',
    categoryTitles: herb.therapyCategoryIds
      .map((id) => categoryTitles.value.get(id))
      .filter((title): title is string => Boolean(title)),
    kind: '药典条目',
  }))

  const lectures = props.lectures
    .filter((item) => !item.curatedId)
    .map<SearchEntry>((item) => ({
      key: `lecture-${item.key}`,
      name: item.name,
      pinyin: item.pinyin,
      aliases: uniqueAliases([
        item.ancientName,
        ...(item.alsoKnownAs ?? []),
        ...item.aliases,
      ]),
      href: `/bencao/${item.groupId}/${item.entryId}`,
      rankTitle: rankTitles.value.get(item.rankId) ?? '讲义',
      categoryTitles: item.therapyCategoryIds
        .map((id) => categoryTitles.value.get(id))
        .filter((title): title is string => Boolean(title)),
      kind: '讲义条目',
    }))

  return [...curated, ...lectures]
})

const query = ref('')
const open = ref(false)
const selectedIndex = ref(0)
const root = ref<HTMLElement | null>(null)
const input = ref<HTMLInputElement | null>(null)

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '')
}

const matched = computed(() => {
  const needle = normalize(query.value.trim())
  if (!needle) return []

  return entries.value
    .map((entry) => {
      const name = normalize(entry.name)
      const pinyin = normalize(entry.pinyin)
      const aliases = entry.aliases.map(normalize)

      let score = -1
      if (name === needle) score = 0
      else if (aliases.includes(needle)) score = 1
      else if (name.startsWith(needle)) score = 2
      else if (aliases.some((alias) => alias.startsWith(needle))) score = 3
      else if (pinyin.startsWith(needle)) score = 4
      else if (name.includes(needle)) score = 5
      else if (aliases.some((alias) => alias.includes(needle))) score = 6
      else if (pinyin.includes(needle)) score = 7

      return { entry, score }
    })
    .filter((item) => item.score >= 0)
    .sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name, 'zh-CN'))
    .map((item) => item.entry)
})

const results = computed(() => matched.value.slice(0, 8))
const showPanel = computed(() => open.value && query.value.trim().length > 0)
const empty = computed(() => showPanel.value && results.value.length === 0)

watch(results, () => {
  selectedIndex.value = 0
})

function choose(entry: SearchEntry | undefined) {
  if (!entry) return
  open.value = false
  router.push(entry.href)
}

function onSubmit() {
  choose(results.value[selectedIndex.value] ?? results.value[0])
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    return
  }

  if (!showPanel.value) {
    if (event.key === 'ArrowDown' && query.value.trim()) {
      event.preventDefault()
      open.value = true
    }
    return
  }

  if (!results.value.length) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value =
      (selectedIndex.value - 1 + results.value.length) % results.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    onSubmit()
  }
}

function useQuickTerm(term: string) {
  query.value = term
  open.value = true
  nextTick(() => input.value?.focus())
}

function clearQuery() {
  query.value = ''
  open.value = false
  input.value?.focus()
}

function onPointerDown(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

const quickTerms = ['玉竹', '女萎', '紫苏', '大苏', '甘草', '柴胡']
</script>

<template>
  <section class="herb-search" aria-label="药材检索">
    <div class="herb-search__intro">
      <p class="eyebrow">SEARCH / 药材检索</p>
      <h2>查一味药</h2>
      <p class="herb-search__lead">
        输入药名、别名或拼音，结果直达药页或讲义条目；下方索引仍可按三经与功效分类浏览。
      </p>
    </div>

    <div ref="root" class="herb-search__panel">
      <form class="herb-search__form" role="search" @submit.prevent="onSubmit">
        <span class="herb-search__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" />
          </svg>
        </span>
        <input
          ref="input"
          v-model="query"
          type="search"
          role="combobox"
          aria-label="输入药材名称、别名或拼音"
          aria-autocomplete="list"
          :aria-expanded="showPanel"
          aria-controls="herb-search-results"
          :aria-activedescendant="showPanel && results.length ? `herb-search-option-${selectedIndex}` : undefined"
          placeholder="输入药名、别名或拼音，如 玉竹、女萎、yuzhu"
          autocomplete="off"
          @focus="open = true"
          @input="open = true"
          @keydown="onKeydown"
        />
        <button v-if="query" class="herb-search__clear" type="button" @click="clearQuery">
          清除
        </button>
        <span class="herb-search__enter" aria-hidden="true">Enter</span>
      </form>

      <div v-if="showPanel" id="herb-search-results" class="herb-search__results" role="listbox">
        <p class="herb-search__count">
          <template v-if="results.length">
            找到 {{ matched.length }} 味<template v-if="matched.length > results.length">，显示前 {{ results.length }} 味</template>
          </template>
          <template v-else>没有找到这味药</template>
        </p>

        <template v-if="results.length">
          <RouterLink
            v-for="(entry, index) in results"
            :id="`herb-search-option-${index}`"
            :key="entry.key"
            class="herb-hit"
            :class="{ 'herb-hit--active': index === selectedIndex }"
            :to="entry.href"
            role="option"
            :aria-selected="index === selectedIndex"
            @mouseenter="selectedIndex = index"
            @click="open = false"
          >
            <span class="herb-hit__seal" aria-hidden="true">{{ entry.name.slice(0, 1) }}</span>
            <span class="herb-hit__body">
              <span class="herb-hit__name">
                <strong>{{ entry.name }}</strong>
                <span>{{ entry.pinyin }}</span>
              </span>
              <span v-if="entry.aliases.length" class="herb-hit__aliases">
                又名 {{ entry.aliases.slice(0, 4).join('、') }}
              </span>
            </span>
            <span class="herb-hit__meta">
              <span>{{ entry.rankTitle }}</span>
              <span v-if="entry.categoryTitles.length">{{ entry.categoryTitles[0] }}</span>
              <span>{{ entry.kind }}</span>
              <span class="herb-hit__arrow" aria-hidden="true">→</span>
            </span>
          </RouterLink>
        </template>

        <div v-else class="herb-search__empty">
          <p>换个正名、别名或拼音试试；也可以直接按索引逐条查找。</p>
          <div>
            <button type="button" @click="query = ''">清空关键词</button>
            <RouterLink to="/herbs/rank/upper" @click="open = false">上经索引</RouterLink>
            <RouterLink to="/herbs/category/exterior" @click="open = false">功效分类</RouterLink>
          </div>
        </div>
      </div>

      <div v-else class="herb-search__hints">
        <span>试试</span>
        <button v-for="term in quickTerms" :key="term" type="button" @click="useQuickTerm(term)">
          {{ term }}
        </button>
        <span class="herb-search__hint-links">
          <RouterLink to="/herbs/rank/upper">三经索引</RouterLink>
          <RouterLink to="/herbs/category/exterior">功效分类</RouterLink>
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.herb-search {
  display: grid;
  grid-template-columns: minmax(220px, 0.72fr) minmax(0, 1.28fr);
  gap: 26px 40px;
  align-items: end;
  margin-top: 38px;
  padding: 22px 24px;
  border: 1px solid color-mix(in srgb, var(--jade) 30%, var(--line));
  border-radius: 16px;
  background:
    linear-gradient(100deg, rgba(228, 239, 229, 0.52), rgba(255, 252, 245, 0.48)),
    rgba(255, 252, 245, 0.62);
}

.herb-search__intro h2 {
  margin: 4px 0 7px;
  font-family: var(--serif);
  font-size: clamp(1.35rem, 2.3vw, 1.75rem);
  font-weight: 400;
  letter-spacing: 0.05em;
}

.herb-search__lead {
  max-width: 330px;
  color: var(--ink-soft);
  font-size: 0.7rem;
  line-height: 1.8;
}

.herb-search__panel {
  position: relative;
  min-width: 0;
}

.herb-search__form {
  display: flex;
  gap: 10px;
  align-items: center;
  height: 52px;
  padding: 0 10px 0 15px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  background: rgba(255, 252, 245, 0.92);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.herb-search__form:focus-within {
  border-color: var(--jade);
  box-shadow: 0 0 0 3px rgba(60, 104, 88, 0.1);
}

.herb-search__icon {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 21px;
  height: 21px;
  color: var(--jade);
}

.herb-search__icon svg {
  width: 19px;
  height: 19px;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
}

.herb-search__form input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.94rem;
  letter-spacing: 0.02em;
}

.herb-search__form input::placeholder {
  color: var(--ink-faint);
  font-family: var(--sans);
  font-size: 0.72rem;
  letter-spacing: 0;
}

.herb-search__form input::-webkit-search-cancel-button {
  display: none;
}

.herb-search__clear {
  flex-shrink: 0;
  padding: 3px 8px;
  border: 0;
  border-radius: 999px;
  background: var(--paper-2);
  color: var(--ink-faint);
  font-size: 0.64rem;
  cursor: pointer;
}

.herb-search__clear:hover {
  color: var(--cinnabar);
}

.herb-search__enter {
  flex-shrink: 0;
  padding: 3px 6px;
  border: 1px solid var(--line);
  border-radius: 4px;
  color: var(--ink-faint);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.58rem;
  letter-spacing: 0.04em;
}

.herb-search__hints {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  align-items: center;
  margin-top: 9px;
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.herb-search__hints button {
  padding: 2px 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 252, 245, 0.6);
  color: var(--ink-soft);
  font-size: 0.64rem;
  cursor: pointer;
}

.herb-search__hints button:hover {
  border-color: var(--jade);
  color: var(--jade);
}

.herb-search__hint-links {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.herb-search__hint-links a {
  color: var(--jade);
  text-decoration: none;
  text-underline-offset: 3px;
}

.herb-search__hint-links a:hover {
  text-decoration: underline;
}

.herb-search__results {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  overflow: auto;
  max-height: min(430px, 68vh);
  padding: 8px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: rgba(255, 252, 245, 0.98);
  box-shadow: 0 18px 44px rgba(36, 30, 22, 0.15);
}

.herb-search__count {
  padding: 5px 8px 7px;
  color: var(--ink-faint);
  font-size: 0.62rem;
  letter-spacing: 0.04em;
}

.herb-hit {
  display: flex;
  gap: 11px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 9px;
  color: inherit;
  text-decoration: none;
}

.herb-hit + .herb-hit {
  border-top: 1px dashed var(--line);
}

.herb-hit:hover,
.herb-hit--active {
  background: rgba(228, 239, 229, 0.52);
}

.herb-hit__seal {
  flex-shrink: 0;
  display: grid;
  place-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid color-mix(in srgb, var(--cinnabar) 55%, var(--line));
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.05rem;
}

.herb-hit__body {
  display: grid;
  flex: 1;
  gap: 2px;
  min-width: 0;
}

.herb-hit__name {
  display: flex;
  flex-wrap: wrap;
  gap: 3px 8px;
  align-items: baseline;
}

.herb-hit__name strong {
  font-family: var(--serif);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.herb-hit__name span {
  color: var(--ink-faint);
  font-size: 0.62rem;
}

.herb-hit__aliases {
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.64rem;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.herb-hit__meta {
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 3px 7px;
  max-width: 175px;
  color: var(--ink-faint);
  font-size: 0.6rem;
  line-height: 1.4;
}

.herb-hit__meta span:first-child {
  color: var(--jade);
}

.herb-hit__arrow {
  color: var(--cinnabar);
  font-size: 0.8rem;
}

.herb-search__empty {
  display: grid;
  gap: 8px;
  padding: 12px 10px 10px;
  color: var(--ink-soft);
  font-size: 0.68rem;
  line-height: 1.7;
}

.herb-search__empty div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
}

.herb-search__empty button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--cinnabar);
  font-size: 0.66rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.herb-search__empty a {
  color: var(--jade);
  text-decoration: underline;
  text-underline-offset: 3px;
}

@media (max-width: 900px) {
  .herb-search {
    grid-template-columns: 1fr;
    gap: 14px;
    align-items: start;
  }

  .herb-search__lead {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .herb-search {
    margin-top: 28px;
    padding: 16px;
  }

  .herb-search__form {
    height: 48px;
    padding-left: 11px;
  }

  .herb-search__enter {
    display: none;
  }

  .herb-search__hint-links {
    margin-left: 0;
  }

  .herb-search__results {
    position: static;
    margin-top: 8px;
    max-height: none;
    box-shadow: none;
  }

  .herb-hit {
    align-items: flex-start;
  }

  .herb-hit__meta {
    display: none;
  }
}
</style>
