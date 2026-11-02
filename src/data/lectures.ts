export interface LectureTrack {
  id: string
  title: string
  author: string
  work: string
  era: string
  focus: string
  status: '待收录' | '已收录'
  videoCount: number
  note: string
}

export const lectureTracks: LectureTrack[] = [
  {
    id: 'shanghan',
    title: '伤寒论讲堂',
    author: '张仲景',
    work: '《伤寒论》',
    era: '东汉',
    focus: '六经辨证、方证与条文',
    status: '待收录',
    videoCount: 0,
    note: '收后世名家讲授《伤寒论》的视频课件；讲授者、授权与版本逐条核对，不把讲授者写成原作者。',
  },
  {
    id: 'jinkui',
    title: '金匮要略讲堂',
    author: '张仲景',
    work: '《金匮要略》',
    era: '东汉',
    focus: '杂病脉证、方证与治法',
    status: '待收录',
    videoCount: 0,
    note: '《金匮要略》为《伤寒杂病论》杂病部分；课件来源、讲授者与版本待核。',
  },
  {
    id: 'fuqingzhu',
    title: '傅青主女科讲堂',
    author: '傅青主',
    work: '《傅青主女科》',
    era: '明末清初',
    focus: '女科辨证、方药与医案',
    status: '待收录',
    videoCount: 0,
    note: '只收可核授权的讲授视频；书名、版本与讲授者分开标注，不混成傅青主本人影像。',
  },
  {
    id: 'bencao',
    title: '本草纲目讲堂',
    author: '李时珍',
    work: '《本草纲目》',
    era: '明',
    focus: '药物分类、释名与炮制',
    status: '待收录',
    videoCount: 0,
    note: '以《本草纲目》为线索收讲授课件；具体药物条目仍回引原书与药典，不用视频替代原文。',
  },
  {
    id: 'qianjin',
    title: '千金方讲堂',
    author: '孙思邈',
    work: '《千金要方》《千金翼方》',
    era: '唐',
    focus: '医德、方药与养生',
    status: '待收录',
    videoCount: 0,
    note: '孙思邈医籍与后世讲授分开；视频课件、讲授者与授权待核。',
  },
]
