export type ExerciseMedia = 'video' | 'image' | 'none'

export interface ExerciseItem {
  id: string
  title: string
  teacher: string
  tradition: string
  category: string
  summary: string
  media: ExerciseMedia
  poster: string
  status: '待收录' | '已收录'
  lineageNote: string
  safetyNote?: string
}

export const exercises: ExerciseItem[] = [
  {
    id: 'jingang-gong',
    title: '金刚功',
    teacher: '张至顺道长',
    tradition: '道家导引',
    category: '动功',
    summary: '以站姿为主的导引功法，动作舒展、节奏清楚；具体招式顺序与版本以收藏视频/图谱为准。',
    media: 'none',
    poster: '/images/exercises/pending-media.svg',
    status: '待收录',
    lineageNote: '张至顺道长所传版本；具体传承谱系、招式数量与动作细节待按授权资料核对。',
    safetyNote: '练习前先做热身；有骨关节、心血管或孕期情况者，先咨询医生与专业老师。',
  },
  {
    id: 'changshou-gong',
    title: '长寿功',
    teacher: '张至顺道长',
    tradition: '道家导引',
    category: '动功',
    summary: '与金刚功同一传承脉络的养生功法，动作较缓，重视呼吸与身形配合；版本待核。',
    media: 'none',
    poster: '/images/exercises/pending-media.svg',
    status: '待收录',
    lineageNote: '张至顺道长所传版本；动作谱系与完整套路待按授权资料核对。',
    safetyNote: '动作幅度以自身舒适为度；不要憋气或强行追求幅度。',
  },
  {
    id: 'wuqinxi',
    title: '五禽戏',
    teacher: '传统导引（相传华佗所传）',
    tradition: '医家导引',
    category: '仿生导引',
    summary: '虎、鹿、熊、猿、鸟五式仿生导引。传统上多记于华佗；孙思邈医籍重视导引养生，具体师承与版本分开标注。',
    media: 'none',
    poster: '/images/exercises/pending-media.svg',
    status: '待收录',
    lineageNote:
      '五禽戏通常记于华佗名下；孙思邈是重视导引养生的医家，但不把“孙思邈所创五禽戏”当成既定史实。具体流派版本待核。',
    safetyNote: '仿生动作要避免过度扭转、憋气与突然发力；腰椎、膝关节不适者先咨询专业人士。',
  },
  {
    id: 'yijinjing',
    title: '易筋经',
    teacher: '倪海厦讲授版本',
    tradition: '传统功法',
    category: '导引',
    summary: '传统易筋经的讲授/演示版本之一；动作名称、顺序与呼吸要求在不同流派间有差异。',
    media: 'none',
    poster: '/images/exercises/pending-media.svg',
    status: '待收录',
    lineageNote:
      '易筋经为传统功法，倪海厦为讲授/传播版本之一，不等同于“倪海厦原创”；具体师承、招式与视频来源待核。',
    safetyNote: '拉伸类动作要缓慢；椎间盘、肩袖或髋膝问题者先咨询医生。',
  },
  {
    id: 'baduanjin',
    title: '八段锦',
    teacher: '传统功法',
    tradition: '医家导引',
    category: '导引',
    summary: '八节连贯的导引功法，版本有站式、坐式等差异；页面只收藏可核来源的演示。',
    media: 'none',
    poster: '/images/exercises/pending-media.svg',
    status: '待收录',
    lineageNote: '传统八段锦，非单一作者；具体流派、歌诀与动作版本待按来源标注。',
    safetyNote: '动作宜缓，呼吸自然；有眩晕、胸闷、关节疼痛时立即停止。',
  },
]

export function findExercise(id: string) {
  return exercises.find((e) => e.id === id) ?? null
}
