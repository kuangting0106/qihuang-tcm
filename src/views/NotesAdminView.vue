<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

interface BackupEntry {
  name: string
  size: number
  updatedAt: string
}

interface NotesSnapshot {
  symptomAnnotations?: Record<string, unknown[]>
  herbNotes?: Record<string, Record<string, string>>
  herbRoles?: Record<string, Record<string, string>>
  updatedAt?: string | null
}

const KEY_STORAGE = 'qihuang.editKey'

const backups = ref<BackupEntry[]>([])
const snapshot = ref<NotesSnapshot | null>(null)
const editKey = ref('')
const loading = ref(false)
const restoring = ref('')
const message = ref('')
const error = ref('')

const annotationCount = computed(() =>
  Object.values(snapshot.value?.symptomAnnotations ?? {}).reduce(
    (sum, list) => sum + list.length,
    0,
  ),
)
const herbNoteCount = computed(() =>
  Object.values(snapshot.value?.herbNotes ?? {}).reduce(
    (sum, book) => sum + Object.keys(book).length,
    0,
  ),
)
const herbRoleCount = computed(() =>
  Object.values(snapshot.value?.herbRoles ?? {}).reduce(
    (sum, book) => sum + Object.keys(book).length,
    0,
  ),
)

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatTime(value: string): string {
  if (!value) return '未知时间'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

async function refresh() {
  loading.value = true
  error.value = ''
  try {
    const [backupResponse, notesResponse] = await Promise.all([
      fetch('/api/notes/backups'),
      fetch('/api/notes'),
    ])
    if (!backupResponse.ok) throw new Error('backup-list')
    const backupData = (await backupResponse.json()) as { backups?: BackupEntry[] }
    backups.value = backupData.backups ?? []
    if (notesResponse.ok) {
      snapshot.value = (await notesResponse.json()) as NotesSnapshot
    }
  } catch {
    error.value = '无法连接公开标注服务。请确认 /api 反向代理与 notes-server 正在运行。'
  } finally {
    loading.value = false
  }
}

async function restore(name: string) {
  if (!editKey.value) {
    editKey.value = window.prompt('请输入编辑口令')?.trim() ?? ''
  }
  if (!editKey.value) return
  if (!window.confirm(`确认恢复到「${name}」？当前版本会先自动备份。`)) return

  restoring.value = name
  error.value = ''
  message.value = ''
  try {
    const response = await fetch('/api/notes/restore', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-qihuang-key': editKey.value,
      },
      body: JSON.stringify({ backup: name }),
    })
    if (response.status === 401) {
      localStorage.removeItem(KEY_STORAGE)
      editKey.value = ''
      throw new Error('口令错误，请重新输入。')
    }
    if (!response.ok) throw new Error('恢复失败，请检查备份文件是否仍存在。')
    snapshot.value = (await response.json()) as NotesSnapshot
    localStorage.setItem(KEY_STORAGE, editKey.value)
    message.value = `已恢复到「${name}」。`
    await refresh()
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : '恢复失败。'
  } finally {
    restoring.value = ''
  }
}

function rememberKey() {
  const value = editKey.value.trim()
  if (value) localStorage.setItem(KEY_STORAGE, value)
  else localStorage.removeItem(KEY_STORAGE)
  message.value = value ? '口令已保存在当前浏览器。' : '已清除本机口令。'
}

onMounted(() => {
  editKey.value = localStorage.getItem(KEY_STORAGE) ?? ''
  void refresh()
})
</script>

<template>
  <section class="notes-admin">
    <header class="notes-admin__head">
      <div>
        <p class="eyebrow">ADMIN / 标注管理</p>
        <h1>公开标注备份与回滚</h1>
        <p class="notes-admin__lead">
          每次保存公开注解、方中作用或角色时，服务器会先备份上一版。这里可以查看备份并恢复到任一版本。
        </p>
      </div>
      <RouterLink class="notes-admin__back" to="/formulas">返回方剂</RouterLink>
    </header>

    <div class="notes-admin__grid">
      <section class="admin-panel paper-panel">
        <div class="admin-panel__head">
          <div>
            <p class="eyebrow">EDIT KEY</p>
            <h2>编辑口令</h2>
          </div>
          <span class="admin-panel__state">{{ editKey ? '已填写' : '未填写' }}</span>
        </div>
        <form class="admin-key" @submit.prevent="rememberKey">
          <input
            v-model="editKey"
            type="password"
            autocomplete="current-password"
            placeholder="输入服务器 QIHUANG_EDIT_KEY"
          />
          <button type="submit">记住口令</button>
        </form>
        <p class="admin-panel__hint">
          口令只保存在当前浏览器，用于恢复操作；查看备份不需要口令。
        </p>
      </section>

      <section class="admin-panel paper-panel">
        <div class="admin-panel__head">
          <div>
            <p class="eyebrow">CURRENT</p>
            <h2>当前公开数据</h2>
          </div>
          <button type="button" class="admin-refresh" :disabled="loading" @click="refresh">
            {{ loading ? '读取中…' : '刷新' }}
          </button>
        </div>
        <dl class="admin-stats">
          <div>
            <dt>原文注解</dt>
            <dd>{{ annotationCount }}</dd>
          </div>
          <div>
            <dt>方中作用</dt>
            <dd>{{ herbNoteCount }}</dd>
          </div>
          <div>
            <dt>角色修改</dt>
            <dd>{{ herbRoleCount }}</dd>
          </div>
        </dl>
        <p class="admin-panel__hint">
          最近更新：{{ snapshot?.updatedAt ? formatTime(snapshot.updatedAt) : '暂无记录' }}
        </p>
      </section>
    </div>

    <p v-if="error" class="admin-message admin-message--error">{{ error }}</p>
    <p v-if="message" class="admin-message">{{ message }}</p>

    <section class="admin-panel paper-panel admin-backups">
      <div class="admin-panel__head">
        <div>
          <p class="eyebrow">BACKUPS</p>
          <h2>历史版本</h2>
        </div>
        <span class="admin-panel__state">{{ backups.length }} 份</span>
      </div>

      <p v-if="!loading && !backups.length" class="admin-empty">
        还没有备份。第一次保存公开标注后，这里会出现上一版的备份。
      </p>

      <ol v-else class="backup-list">
        <li v-for="backup in backups" :key="backup.name" class="backup-item">
          <div>
            <strong>{{ formatTime(backup.updatedAt) }}</strong>
            <span>{{ backup.name }} · {{ formatSize(backup.size) }}</span>
          </div>
          <button
            type="button"
            :disabled="restoring === backup.name"
            @click="restore(backup.name)"
          >
            {{ restoring === backup.name ? '恢复中…' : '恢复此版本' }}
          </button>
        </li>
      </ol>
    </section>

    <p class="notes-admin__note">
      恢复操作会覆盖当前公开注解、方中作用与角色；恢复前的当前版本也会自动留一份备份。若备份文件被服务器清理，旧版本无法找回。
    </p>
  </section>
</template>

<style scoped>
.notes-admin {
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(28px, 5vw, 56px) clamp(18px, 4vw, 48px) 72px;
}

.notes-admin__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.notes-admin__head h1 {
  margin-top: 6px;
  font-family: var(--serif);
  font-size: clamp(1.7rem, 3vw, 2.35rem);
  font-weight: 500;
  color: var(--ink);
}

.notes-admin__lead {
  max-width: 58ch;
  margin-top: 8px;
  color: var(--ink-soft);
  font-size: 0.86rem;
  line-height: 1.8;
}

.notes-admin__back {
  flex: 0 0 auto;
  padding: 7px 13px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  color: var(--ink-soft);
  font-size: 0.7rem;
  text-decoration: none;
}

.notes-admin__back:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.notes-admin__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.admin-panel {
  padding: 16px 18px;
}

.admin-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.admin-panel__head h2 {
  margin-top: 4px;
  font-family: var(--serif);
  font-size: 1.08rem;
  font-weight: 500;
  color: var(--ink);
}

.admin-panel__state {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--gold-pale);
  color: #7b5a26;
  font-size: 0.62rem;
}

.admin-panel__hint {
  margin-top: 9px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.65;
}

.admin-key {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.admin-key input {
  min-width: 0;
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--line-strong);
  border-radius: 7px;
  background: #fffdf8;
  color: var(--ink);
  font-size: 0.78rem;
}

.admin-key input:focus {
  outline: none;
  border-color: var(--cinnabar);
}

.admin-key button,
.admin-refresh,
.backup-item button {
  flex: 0 0 auto;
  padding: 7px 12px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: transparent;
  color: var(--ink-soft);
  font-size: 0.7rem;
  cursor: pointer;
}

.admin-key button:hover,
.admin-refresh:hover,
.backup-item button:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.admin-key button:disabled,
.admin-refresh:disabled,
.backup-item button:disabled {
  opacity: 0.55;
  cursor: default;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.admin-stats div {
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: rgba(255, 253, 248, 0.7);
}

.admin-stats dt {
  color: var(--ink-faint);
  font-size: 0.64rem;
}

.admin-stats dd {
  margin-top: 2px;
  color: var(--cinnabar);
  font-family: var(--serif);
  font-size: 1.25rem;
}

.admin-message {
  margin-top: 14px;
  padding: 9px 12px;
  border-left: 2px solid var(--jade);
  border-radius: 0 8px 8px 0;
  background: rgba(221, 236, 232, 0.45);
  color: var(--ink-soft);
  font-size: 0.74rem;
}

.admin-message--error {
  border-left-color: var(--cinnabar);
  background: rgba(163, 58, 43, 0.06);
  color: var(--cinnabar);
}

.admin-backups {
  margin-top: 14px;
}

.admin-empty {
  margin-top: 14px;
  color: var(--ink-faint);
  font-size: 0.76rem;
  line-height: 1.7;
}

.backup-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  border-top: 1px dashed var(--line);
}

.backup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px dashed var(--line);
}

.backup-item strong {
  display: block;
  color: var(--ink);
  font-family: var(--serif);
  font-size: 0.86rem;
  font-weight: 500;
}

.backup-item span {
  display: block;
  margin-top: 2px;
  color: var(--ink-faint);
  font-size: 0.64rem;
  word-break: break-all;
}

.notes-admin__note {
  margin-top: 16px;
  color: var(--ink-faint);
  font-size: 0.68rem;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .notes-admin__head {
    flex-direction: column;
    gap: 12px;
  }

  .admin-key {
    flex-direction: column;
  }

  .admin-key button {
    align-self: flex-start;
  }

  .backup-item {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
