import { reactive } from 'vue'

export interface CitationDrawerState {
  open: boolean
  ids: string[]
  title: string
}

const state = reactive<CitationDrawerState>({
  open: false,
  ids: [],
  title: '出处',
})

export function openCitations(ids: string[], title = '出处') {
  state.ids = [...ids]
  state.title = title
  state.open = true
}

export function closeCitations() {
  state.open = false
}

export function useCitationDrawer() {
  return state
}
