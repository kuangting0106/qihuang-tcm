export interface PulseMedia {
  id: string
  title: string
  subtitle: string
  description: string
  file: string
  format: string
  credit: string
  note: string
}

export const pulseMedia: PulseMedia[] = [
  {
    id: 'maizhentu',
    title: '脉诊图',
    subtitle: '图示资料 · 点击后新窗口打开',
    description:
      '以图示方式整理脉诊部位与脉象对照，适合配合本页“常见脉象”“危重脉象”两节回看。',
    file: '/videos/pulse/maizhentu.mp4',
    format: 'MP4 · 约 8.2 MB',
    credit: '用户提供',
    note: '为避免拖慢脉诊页，本页不内嵌播放器；点击链接后在浏览器中单独打开视频。',
  },
]

export function pulseMediaHref(file: string): string {
  return `${import.meta.env.BASE_URL}${file.replace(/^\//, '')}`
}
