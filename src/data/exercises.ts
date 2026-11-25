export type ExerciseMedia = 'video' | 'image' | 'none'

export interface ExerciseImage {
  src: string
  caption: string
}

export interface ExerciseStep {
  title: string
  text: string
  images?: ExerciseImage[]
}

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
  intro?: string
  sourceNote?: string
  steps?: ExerciseStep[]
}

export const exercises: ExerciseItem[] = [
  {
    id: 'jingang-gong',
    title: '金刚功',
    teacher: '张至顺道长',
    tradition: '道家导引',
    category: '动功',
    summary:
      '张至顺道长所传的八部金刚功，以站姿、伸展与扭转为主；本页据《张至顺老道长金刚功（三校）》整理动作顺序与原书动作图。',
    media: 'image',
    poster: '/images/exercises/jingang/jg-013.webp',
    status: '已收录',
    intro:
      '金刚功以预备式起势，依次练习双手插顶、手足前后、调理脾肤、左肝右肺、回头望足、五劳七伤向后瞧、凤凰展翅、两足顿顿八部，最后收功。动作宜缓，呼吸自然，以自身舒适为度。',
    lineageNote:
      '张至顺道长所传版本。本页文字与动作图据《张至顺老道长金刚功（三校）》整理；不同传授版本在动作幅度、次数与口令上可能略有差异，以师传和原书为准。',
    safetyNote:
      '饭后一小时内不宜练功；恶劣天气不宜在室外练。左右对称的动作要两侧都练完，初学可量力减少次数，但每次应做预备式与收功。有骨关节、心血管疾病或孕期情况者，先咨询医生与专业老师。',
    sourceNote:
      '来源：《张至顺老道长金刚功（三校）》PDF（用户提供）。动作图为原书扫描页，仅作学习参考；页面文字为整理摘录，不改写原书功理。',
    steps: [
      {
        title: '预备式',
        text:
          '两脚并拢，身体直立，双手自然下垂，目视前方，全身放松。左脚向左拉开与肩同宽，两手五指并拢，稍用内劲伸直。两手上提至腰部，指尖对肋，再向前移至腹部，一手在脐上、一手在脐下，劳宫相对，气归中宫。',
        images: [
          { src: '/images/exercises/jingang/jg-012.webp', caption: '预备式 预-1（原书第 3 页）' },
          { src: '/images/exercises/jingang/jg-013.webp', caption: '预备式 预-2、预-3（原书第 4 页）' },
          { src: '/images/exercises/jingang/jg-014.webp', caption: '预备式 预-4（原书第 5 页）' },
        ],
      },
      {
        title: '第一部 · 双手插顶利三焦',
        text:
          '两手五指并拢，以腕为轴向上成立掌，掌心向外；屈肘，两掌向头顶百会穴上方相靠，中指尖相接。默念“生”字，两臂用力向天空插至直立，默念“长”“化”；再分开两臂向体侧渐降至于肩平，默念“收”；最后两臂向下搂抱至腹部，两手分开贴于脐部，默念“藏”。',
        images: [
          { src: '/images/exercises/jingang/jg-016.webp', caption: '第一部 外1-1、外1-2（原书第 7 页）' },
          { src: '/images/exercises/jingang/jg-018.webp', caption: '第一部 外1-5、外1-6（原书第 9 页）' },
        ],
      },
      {
        title: '第二部 · 手足前后固肾腰',
        text:
          '两手合掌置于胸前，左脚向左前方迈出一步，合掌向前冲出，直臂与肩同高。两手翻掌、背靠背紧贴，向两侧平展；前腿屈膝成左弓步，身体前倾，两手向后搂抱至尾椎部，合掌上提，再沿脊椎两侧下推。随后两手斜向上提至与肩同高，前腿蹬直，再向前搂抱合掌，收回左腿；换右腿反向练习。',
        images: [
          { src: '/images/exercises/jingang/jg-020.webp', caption: '第二部 外2-1（原书第 11 页）' },
          { src: '/images/exercises/jingang/jg-022.webp', caption: '第二部 外2-4、外2-5（原书第 13 页）' },
          { src: '/images/exercises/jingang/jg-024.webp', caption: '第二部 外2-8、外2-9（原书第 15 页）' },
        ],
      },
      {
        title: '第三部 · 调理脾肤需单举',
        text:
          '双拳相对置于脐上，左脚向左迈开，双拳移至左腰外侧。左掌经耳旁向上直举，变阳平掌，指尖向后；右掌从左腹外向下直按，指尖向左，同时左腿屈膝成左弓步。两小臂内旋，左掌变立掌，右掌变垂掌；左拳下拉、右拳上提至左乳下，再移至腹部。换右侧反向练习，最后收回左脚。',
        images: [
          { src: '/images/exercises/jingang/jg-026.webp', caption: '第三部 外3-2、外3-3（原书第 17 页）' },
          { src: '/images/exercises/jingang/jg-028.webp', caption: '第三部 外3-5、外3-6（原书第 19 页）' },
        ],
      },
      {
        title: '第四部 · 左肝右肺如射雕',
        text:
          '左脚向左迈开一大步，双拳变掌，掌心相对，两臂平行向左伸直与肩同高；不停向上、向右、向下旋转两圈，在腹前下方稍停，双掌变拳提至脐部。右拳变立掌于胸前，绕右乳下半圈向右下经右膝弧形向右前上方推出，如开弓状；左拳上提至右腋，如拉弦般平拉至左腋，目视右手劳宫。换右侧反向练习，左右合为一次。',
        images: [
          { src: '/images/exercises/jingang/jg-031.webp', caption: '第四部 外4-1、外4-2（原书第 22 页）' },
          { src: '/images/exercises/jingang/jg-033.webp', caption: '第四部 外4-5、外4-6（原书第 24 页）' },
          { src: '/images/exercises/jingang/jg-035.webp', caption: '第四部 外4-9、外4-10（原书第 26 页）' },
        ],
      },
      {
        title: '第五部 · 回头望足去心疾',
        text:
          '双拳提至肋部，左掌向后插、右掌向前推，同时转头向后，眼光从左肩微视右脚跟。两手小臂旋转、握拳收回左腰，双拳相对，拳心向上，左腿蹬直；双拳移至腹前，身体转回原位。换右侧反向练习，左右回望合为一次，最后收回左腿，双拳置于腹部。',
        images: [
          { src: '/images/exercises/jingang/jg-038.webp', caption: '第五部 外5-1～外5-3（原书第 29 页）' },
          { src: '/images/exercises/jingang/jg-040.webp', caption: '第五部 外5-6、外5-7（原书第 31 页）' },
        ],
      },
      {
        title: '第六部 · 五劳七伤向后瞧',
        text:
          '两手横向拉开至劳宫穴在身躯边，稍停；左右手同时向脐部合拢，五指交叉，拇指与小指尖相按。仰掌沿胸中线上提至人中，翻掌向下沿胸中线按至臂直，两臂紧贴身体。全身放松，眼帘微垂，注视鼻尖，头向左慢慢转动内视，再向后转，巡视左半身与脊椎；随后转回胸前，向右同样内视。最后头部转回中线，睁眼，翻掌上提至脐，气归下丹田。',
        images: [
          { src: '/images/exercises/jingang/jg-043.webp', caption: '第六部 外6-1、外6-2（原书第 34 页）' },
          { src: '/images/exercises/jingang/jg-045.webp', caption: '第六部 外6-5、外6-6（原书第 36 页）' },
          { src: '/images/exercises/jingang/jg-047.webp', caption: '第六部 外6-9、外6-10（原书第 38 页）' },
        ],
      },
      {
        title: '第七部 · 凤凰展翅周身力',
        text:
          '左脚向右迈开一大步，双拳变掌，掌心相对，两臂平行向左伸直与肩同高；不停向上、向右、向下划圈，共划三圈。第三圈双手到头顶时，往右后左方向劈去；身体向右，以腰带动左手弯腰，手指点右脚尖，直腰后左手举回头上，再弯腰点右脚尖，上下连点三次。换左侧反向练习，最后握拳归位、收回左脚。',
        images: [
          { src: '/images/exercises/jingang/jg-048.webp', caption: '第七部 外7-1（原书第 39 页）' },
          { src: '/images/exercises/jingang/jg-050.webp', caption: '第七部 外7-4、外7-5（原书第 41 页）' },
          { src: '/images/exercises/jingang/jg-052.webp', caption: '第七部 外7-8（原书第 43 页）' },
        ],
      },
      {
        title: '第八部 · 两足顿顿饮嗜消',
        text:
          '全身自然松立，两脚紧靠，两臂下垂紧靠身体，全身用内劲绷紧。两脚跟慢慢抬起，将身体举起又放下，作有节奏的上下起落，五次为一节，至少五节。最后两脚分开与肩同宽，翻掌上提至脐部。',
        images: [
          { src: '/images/exercises/jingang/jg-054.webp', caption: '第八部 外8-1、外8-2（原书第 45 页）' },
        ],
      },
      {
        title: '收功式',
        text:
          '两手分开，指尖向上，指背相靠置于脐上；两手上提至指尖到天突穴，稍停，舌顶上腭，意想气从气海沿胸而上，经印堂到百会，过后脑下至玉枕。两手分开向左右变垂掌，置于乳房外侧，意想气从玉枕沿颈椎向左右肩分流，两手继续沿两肋下落至大腿两侧；随手下落时，意想气如淋浴般直至涌泉。脚有气感时，手指与全身自然放松，安静站立片刻，即收功完毕。',
        images: [
          { src: '/images/exercises/jingang/jg-055.webp', caption: '收功式 外收-1（原书第 46 页）' },
          { src: '/images/exercises/jingang/jg-056.webp', caption: '收功式 外收-2、外收-3（原书第 47 页）' },
        ],
      },
    ],
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
