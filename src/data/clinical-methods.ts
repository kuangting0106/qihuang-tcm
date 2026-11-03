export const clinicalDisclaimer = {
  title: '先读：经验总结，不代表绝对正确',
  short: '经验总结 · 非诊断标准',
  body: '以下内容为传统中医看诊与治法的经验整理，仅供学习参考，不能替代专业诊断与治疗。出现急症、持续加重、意识改变、剧烈疼痛、呼吸困难、大出血、孕期异常等情况，请立即就医。',
}

export interface ClinicalQuestion {
  id: string
  no: string
  title: string
  summary: string
  prompts: string[]
  note?: string
}

export const tenQuestionsIntro = {
  eyebrow: 'TEN QUESTIONS / 问诊提纲',
  title: '看诊十问',
  lede:
    '十问不是固定问卷，而是一个不漏项的起手式。先让患者用自己的话讲主诉，再按下面顺序补齐；问到哪一项，就把时间、部位、性质、轻重、诱因和伴随症状记下来。',
  meta: ['10 项核心问诊', '病因诱因单列', '女性 / 儿童附问'],
}

export const tenQuestions: ClinicalQuestion[] = [
  {
    id: 'cold-heat',
    no: '01',
    title: '寒热',
    summary: '先分怕冷、怕热，还是一阵冷一阵热。',
    prompts: [
      '怕冷还是怕热？有没有发热？',
      '寒热同时出现，还是一阵冷一阵热？',
      '手足温凉？加衣被能不能缓解？',
      '一天中什么时候明显？',
    ],
    note: '寒热是辨表里、阴阳与寒热真假的第一入口。',
  },
  {
    id: 'sweat',
    no: '02',
    title: '汗',
    summary: '有汗无汗、自汗盗汗、汗出部位与汗后感受。',
    prompts: [
      '有没有汗？是自汗还是盗汗？',
      '汗出在头面、胸背、手足，还是全身？',
      '汗量多少？颜色清浊？黏不黏？',
      '汗后舒服、疲乏，还是更冷？',
    ],
    note: '汗的有无与多少，常用来判断表证、津液与阳气状态。',
  },
  {
    id: 'head-body',
    no: '03',
    title: '头身感受',
    summary: '头痛、头晕、身痛、身重、麻木，问清部位与性质。',
    prompts: [
      '头痛、头晕、身痛、身重、麻木各在什么部位？',
      '是胀痛、刺痛、空痛、重痛，还是说不清？',
      '转头、低头、劳累、受寒后加重吗？',
      '有没有项强、肢体无力、走路不稳？',
    ],
    note: '突发剧烈头痛、口眼歪斜、肢体无力、说话不清，按急症处理。',
  },
  {
    id: 'bowel-bladder',
    no: '04',
    title: '大小便',
    summary: '大便的次数、形状、颜色、气味；小便的次数、量、颜色与感觉。',
    prompts: [
      '大便一天几次？成形、干结、溏稀还是水样？',
      '颜色、气味如何？有没有黏液、血？',
      '排便费力、排不尽，还是失禁？',
      '小便次数、量、颜色、夜尿、涩痛、灼热、失禁？',
    ],
    note: '二便是判断寒热虚实、津液与气化的重要出口。',
  },
  {
    id: 'diet',
    no: '05',
    title: '饮食',
    summary: '食欲、食量、喜冷喜热，以及饭后的反应。',
    prompts: [
      '想吃吗？吃得多还是少？',
      '喜冷还是喜热？饭后胀、痛、嗳气、恶心、呕吐吗？',
      '有没有反酸、烧心、吞咽困难？',
      '最近体重有没有明显变化？',
    ],
    note: '饮食问的是脾胃受纳与运化，不只看“吃没吃”。',
  },
  {
    id: 'sleep',
    no: '06',
    title: '睡眠',
    summary: '入睡、易醒、多梦、早醒、嗜睡，以及睡醒后的精神。',
    prompts: [
      '入睡难、易醒、早醒、多梦，还是嗜睡？',
      '睡醒后精神如何？',
      '睡前情绪、咖啡茶酒、手机、夜班情况？',
      '有没有打鼾、憋醒、白天困倦？',
    ],
    note: '睡眠既是症状，也是心神、气血与阴阳是否协调的窗口。',
  },
  {
    id: 'chest-abdomen',
    no: '07',
    title: '胸腹',
    summary: '胸闷、心悸、气短、腹胀、腹痛、痞满，问位置与喜按拒按。',
    prompts: [
      '胸闷、心悸、气短、腹胀、腹痛、痞满吗？',
      '位置固定还是游走？',
      '喜按还是拒按？',
      '与饮食、呼吸、情绪、体位有关吗？',
    ],
    note: '胸腹是上中下三焦气机与水火运行的关键区域。',
  },
  {
    id: 'thirst',
    no: '08',
    title: '口渴',
    summary: '渴不渴、喜冷喜热、饮多饮少，以及饮水后的感受。',
    prompts: [
      '渴不渴？想喝冷水还是热水？',
      '喝得多还是少？喝完舒服还是胀？',
      '口干、口苦、口黏、口甜吗？',
      '夜间会渴醒吗？',
    ],
    note: '口渴不能只看“缺水”，还要看津液能不能上承、水湿有没有停聚。',
  },
  {
    id: 'senses',
    no: '09',
    title: '目耳五官感受',
    summary: '眼、耳、鼻、咽、口齿的干涩、疼痛、堵塞、异常感觉。',
    prompts: [
      '眼干、眼涩、胀痛、视物模糊、畏光吗？',
      '耳鸣、耳聋、耳胀、眩晕吗？',
      '鼻塞、流涕、喷嚏、嗅觉变化吗？',
      '咽干、咽痛、异物感、声音变化吗？',
      '口腔溃疡、牙龈出血、味觉异常吗？',
    ],
    note: '五官是脏腑之外窍，问诊时要把局部症状放回全身。',
  },
  {
    id: 'history',
    no: '10',
    title: '旧疾病史',
    summary: '慢性病、手术、外伤、过敏、长期用药与家族史。',
    prompts: [
      '有哪些慢性病、手术、外伤、过敏？',
      '长期吃什么药、保健品？',
      '家族里有没有类似疾病？',
      '过去有没有类似发作，怎么处理？',
    ],
    note: '旧病史决定今天的问诊重点，也决定哪些治疗不能做。',
  },
]

export const causeQuestion = {
  id: 'cause',
  title: '必问：病因、诱因与不舒服的来源',
  summary: '把“怎么开始的”问清楚，常比堆一串症状更有用。',
  prompts: [
    '最早什么时候开始？是突然还是逐渐？',
    '起病前有没有受寒、淋雨、饮食不洁、暴饮暴食、熬夜、劳累、情志刺激、外伤、旅行或用药？',
    '什么情况下加重，什么情况下缓解？',
    '有没有发热、皮疹、呕吐、腹泻、出血、体重下降等伴随表现？',
    '之前看过吗？做过什么检查、用过什么药？',
  ],
}

export interface SpecialQuestionGroup {
  id: string
  title: string
  subtitle: string
  items: { title: string; prompts: string[] }[]
  note: string
}

export const specialQuestionGroups: SpecialQuestionGroup[] = [
  {
    id: 'women',
    title: '女性加问',
    subtitle: '月经与孕史必须单列，不只是“妇科问题”。',
    items: [
      {
        title: '月经',
        prompts: [
          '周期多久一次？每次几天？',
          '量多还是少？颜色、血块、痛经？',
          '末次月经什么时候？',
          '有没有非经期出血、绝经后出血？',
        ],
      },
      {
        title: '孕史',
        prompts: [
          '孕次、产次、流产史？',
          '有没有宫外孕、剖宫产、孕期并发症？',
          '目前是否备孕、怀孕或哺乳？',
          '采用什么避孕方式？',
        ],
      },
    ],
    note: '备孕、孕期、哺乳期先说明；用药、检查与治疗选择都不同。',
  },
  {
    id: 'children',
    title: '儿童加问',
    subtitle: '孩子表述有限，家长补充要具体到时间与场景。',
    items: [
      {
        title: '睡眠',
        prompts: [
          '入睡难、夜啼、翻身、磨牙、夜惊？',
          '有没有盗汗、打鼾、憋醒？',
          '白天精神、午睡与作息如何？',
        ],
      },
      {
        title: '积食',
        prompts: [
          '口气、腹胀、大便酸臭？',
          '食欲、呕吐、腹痛？',
          '最近有没有吃多、吃杂、吃冷？',
        ],
      },
      {
        title: '惊吓',
        prompts: [
          '近期有没有受惊事件？',
          '惊跳、黏人、夜惊、哭闹？',
          '二便、睡眠、食欲有没有变化？',
        ],
      },
    ],
    note: '儿童还需补充出生史、喂养史、预防接种与生长发育情况。',
  },
]

export const recordTemplate = [
  { label: '主诉', hint: '患者最想解决的问题，用他自己的话记。' },
  { label: '现病史', hint: '起病时间、诱因、演变、加重缓解因素、已做处理。' },
  { label: '十问', hint: '寒热、汗、头身、二便、饮食、睡眠、胸腹、口渴、五官、旧病。' },
  { label: '特殊人群', hint: '女性月经孕史；儿童睡眠、积食、惊吓。' },
  { label: '望闻切', hint: '面色、山根、手掌、眼目、语言姿态、舌象、脉象。' },
  { label: '判断与转诊', hint: '经验判断要写“依据”，并标明需要进一步检查或转诊的情况。' },
]

export type TreatmentGroup = '总纲' | '先后' | '湿与饮' | '实邪' | '站内互证'

export interface TreatmentPrinciple {
  id: string
  group: TreatmentGroup
  title: string
  body: string
  points?: string[]
  source?: string
  href?: string
}

export const treatmentPrinciples: TreatmentPrinciple[] = [
  {
    id: 'deficiency-excess',
    group: '总纲',
    title: '人不会因虚而死，却会因实而亡',
    body:
      '这是一句经验性总结，强调“实邪久留”的危险：该排出的东西排不出去，日久可形成邪、痰水、肿块，甚至癌。不是说虚不要紧，而是虚实夹杂时，不能只看到虚，却放过实。',
    points: [
      '实：邪、痰、水、食、瘀、燥屎、肿块等滞留体内。',
      '虚：气、血、津液、阳气不足。',
      '处理：实则攻之，虚则补之；虚实夹杂，攻补兼施，顾护胃气。',
    ],
    source: '经验条目（用户提供）',
  },
  {
    id: 'exterior-first',
    group: '先后',
    title: '有表证，先解表',
    body: '表证未解时，先以解表为主，避免过早攻里，把表邪引入里。',
    source: '经验条目（用户提供）',
  },
  {
    id: 'exterior-yangming',
    group: '先后',
    title: '表证兼阳明，先解表；里实急重可表里同用',
    body:
      '一般先解表；若便秘已经五六七八天，里实已成、且急重，可在解表的同时兼顾通下。是否同用，要看里实程度与正气，不可机械。',
    source: '经验条目（用户提供）',
  },
  {
    id: 'urgent-first',
    group: '先后',
    title: '急症兼缓症，先救急',
    body: '标急先治标，缓则治本；急症控制后，再处理慢性问题。',
    points: [
      '急：呼吸困难、剧烈疼痛、大出血、意识改变、厥脱等。',
      '缓：慢性调理、体质、旧病。',
    ],
    source: '经验条目（用户提供）；可与《伤寒论》“急当救里 / 急当救表”互参。',
  },
  {
    id: 'cold-damp',
    group: '湿与饮',
    title: '寒湿交加，去寒去湿',
    body: '寒与湿并见，单去湿则寒不去，单温寒则湿不化；需温阳与祛湿同用。',
    source: '经验条目（用户提供）',
  },
  {
    id: 'wind-cold-damp',
    group: '湿与饮',
    title: '风寒湿交加，去风去寒去湿',
    body: '三邪并见，按风、寒、湿的偏重配伍，不可只抓一端。',
    source: '经验条目（用户提供）',
  },
  {
    id: 'edema',
    group: '湿与饮',
    title: '水肿：祛湿、利水、健脾，用阳药热药',
    body:
      '水肿多与脾肾阳气不足、水湿停聚有关；在辨证前提下，常从健脾、温阳利水入手，必要时用阳药、热药。',
    points: [
      '不是所有水肿都适用温药；心衰、肾病、肝病、药物引起的水肿需先查明原因。',
      '治水肿时，甘草有蓄水之弊，常需慎用；见《伤寒论》真武汤讲解。',
    ],
    source: '经验条目（用户提供）；《伤寒论》真武汤讲解。',
    href: '/classics/shanghan-nihaixia',
  },
  {
    id: 'dysentery',
    group: '湿与饮',
    title: '下痢：先止痢；止不住，利小便',
    body:
      '下痢以止痢为急；若单纯固涩止不住，可转从利小便、分利水湿考虑。先辨寒热虚实，不能见痢止痢。',
    points: [
      '热利：大便臭、口渴、舌苔黄、脉数。',
      '寒利：大便不臭、不渴、舌苔白、脉微细。',
      '以上辨法见《伤寒论》桂枝人参汤讲解；具体治疗需辨证。',
    ],
    source: '经验条目（用户提供）；《伤寒论》桂枝人参汤讲解。',
    href: '/classics/shanghan-nihaixia',
  },
  {
    id: 'excess',
    group: '实邪',
    title: '实症：去实通利',
    body:
      '实症以祛邪为要，给邪以出路：汗、吐、下、和、清、消、利，按病位与病性选择，不可一味补。',
    source: '经验条目（用户提供）',
  },
  {
    id: 'yin-excess',
    group: '实邪',
    title: '阴实：攻坚去实，扶阳兼顾气血',
    body:
      '阴实多指寒、痰、瘀、水等阴邪结聚成形。处理上既要攻坚去实，也要扶阳、顾护气血，避免只攻不补。',
    points: [
      '“阴实”是传统概念，不能替代肿瘤的病理诊断。',
      '发现肿块、结节、异常出血、体重下降，应先做规范检查。',
    ],
    source: '经验条目（用户提供）',
  },
  {
    id: 'yang-first',
    group: '站内互证',
    title: '阳虚者必先救阳',
    body: '《伤寒论》真武汤讲解：上下表里俱虚、阳虚水泛时，先复其阳，再行其水。',
    source: '《伤寒论》讲义 · 真武汤',
    href: '/classics/shanghan-nihaixia',
  },
  {
    id: 'damp-urine',
    group: '站内互证',
    title: '治湿不利小便，非其治也',
    body: '《伤寒论》五苓散讲解引《直指》：治湿要给出路，中焦以下多从利小便解。',
    source: '《伤寒论》讲义 · 五苓散',
    href: '/classics/shanghan-nihaixia',
  },
  {
    id: 'deficient-attack',
    group: '站内互证',
    title: '虚人感邪，不可先攻其邪',
    body: '《石室秘录》后治法：正气虚寒又感风寒，先顾正，不可一味攻邪。',
    source: '《石室秘录》后治法',
    href: '/classics/shishimilu',
  },
  {
    id: 'sweat-fluid',
    group: '站内互证',
    title: '汗法先审津液',
    body:
      '《伤寒论》桂枝麻黄各半汤讲解：用汗法前要确定津液与体力足够；脉微、津亏、失血、体虚者不可强发汗。',
    source: '《伤寒论》讲义 · 桂枝麻黄各半汤',
    href: '/classics/shanghan-nihaixia',
  },
  {
    id: 'deficient-heat',
    group: '站内互证',
    title: '虚热与实热分开处理',
    body: '《伤寒论》甘草泻心汤讲解：虚热、发炎多用芩连；实热才用大黄攻。',
    source: '《伤寒论》讲义 · 甘草泻心汤',
    href: '/classics/shanghan-nihaixia',
  },
]

export interface InspectionEntry {
  id: string
  finding: string
  association: string
  note: string
  source?: string
  href?: string
}

export interface InspectionSection {
  id: string
  title: string
  subtitle: string
  entries: InspectionEntry[]
  note?: string
}

export const inspectionIntro = {
  eyebrow: 'INSPECTION / 望诊经验',
  title: '望诊：先看整体，再落局部',
  lede:
    '望诊不是盯着一个点下结论，而是把神色、面色、形态、局部颜色与语言姿态放在一起看。下面这些条目是经验对应，单看一处不能定病。',
}

export const inspectionSections: InspectionSection[] = [
  {
    id: 'shangen',
    title: '鼻子山根处',
    subtitle: '山根在两眼之间、鼻梁根部。看颜色，也看是青筋、横纹还是光泽变化。',
    entries: [
      {
        id: 'shangen-green',
        finding: '色青',
        association: '腹中痛',
        note: '传统经验：青主寒、主痛。小儿山根青筋常见于里寒、腹痛；需结合哭闹、饮食、大便与腹部触诊。',
        source: '经验条目；《伤寒论》讲义亦有“山根青，里寒而痛”的讲法。',
        href: '/classics/shanghan-nihaixia',
      },
      {
        id: 'shangen-black',
        finding: '色微黑',
        association: '肾脏有问题',
        note: '传统经验：黑主肾、主寒水。需结合水肿、夜尿、腰膝酸软、疲劳与二便。',
      },
      {
        id: 'shangen-white',
        finding: '色白',
        association: '亏血',
        note: '传统经验：白主血少、气虚。需结合唇甲颜色、头晕、心悸、月经量与血常规。',
      },
      {
        id: 'shangen-yellow',
        finding: '色黄',
        association: '胸上有寒',
        note: '传统经验：黄主脾、主湿；“胸上有寒”是经验对应，需结合胸闷、痰、畏寒与饮食。',
      },
      {
        id: 'shangen-red',
        finding: '色微红',
        association: '心脏有问题',
        note: '传统经验：红主热、主心。需结合心悸、胸闷、血压、睡眠与活动后反应。',
      },
    ],
    note: '山根颜色受光线、皮肤厚薄、哭闹、温度影响；婴幼儿尤其不能单凭一条青筋定病。',
  },
  {
    id: 'palm',
    title: '手掌心',
    subtitle: '看整体色泽、润燥、温度，再看局部暗红或偏黑。',
    entries: [
      {
        id: 'palm-dark-red',
        finding: '暗红',
        association: '肝有问题',
        note: '传统经验：暗红主瘀、主热。需结合目黄、胁痛、饮酒史、睡眠与肝功能检查。',
      },
      {
        id: 'palm-black',
        finding: '偏黑',
        association: '肾脏有问题',
        note: '传统经验：黑主肾虚、寒水。需结合水肿、夜尿、腰膝、疲劳与面色。',
      },
    ],
    note: '手掌颜色受温度、职业、末梢循环与光线影响；冬季手冷发暗很常见。',
  },
  {
    id: 'eyes',
    title: '眼珠上下的鸡爪血丝',
    subtitle: '看血丝的形状、位置与是否穿过黑睛，不只看“红不红”。',
    entries: [
      {
        id: 'eye-claw',
        finding: '眼珠上或下有形如鸡爪的血丝',
        association: '此人有精神问题',
        note: '传统望诊把这种形态作为癫、痫、狂等神志病的参考，不是诊断标准。若伴失眠、幻听、躁狂、抑郁或伤人伤己念头，需精神科评估。',
        source: '倪海厦《人纪·针灸教程》眼诊法；站内教程亦有“眼珠上下鸡爪血丝”条目。',
        href: '/methods/acupuncture/tutorial',
      },
    ],
    note: '眼红也可能是结膜炎、干眼、疲劳、隐形眼镜或外伤；先排除眼科急症。',
  },
  {
    id: 'touch',
    title: '一碰就惊叫',
    subtitle: '触诊先看表情与防御，不要反复按压验证。',
    entries: [
      {
        id: 'touch-pain',
        finding: '一碰患者就惊叫',
        association: '身有痛，很痛',
        note: '轻触即剧痛是红旗。先排除外伤、骨折、急腹症、感染、神经痛；不要为了“确认”而反复按压。',
      },
    ],
    note: '疼痛评分、部位、持续时间与伴随症状，比“能不能忍”更有记录价值。',
  },
  {
    id: 'speech',
    title: '语言与姿态',
    subtitle: '听声音大小、说话意愿、反应速度，也看喜欢光还是暗、静还是闹。',
    entries: [
      {
        id: 'speech-stuck',
        finding: '想说话，但讲不出来',
        association: '多为心膈有问题',
        note: '传统经验：心膈有痰或气机不畅。但突发失语、口角歪斜、肢体无力，要按中风急诊处理。',
      },
      {
        id: 'speech-soft-talkative',
        finding: '说话声音小，却喜欢一直说话',
        association: '头有痛',
        note: '经验条目：声音小多属虚，喜言可能是代偿或心烦。需问头痛部位、性质、血压、睡眠与情绪。',
      },
      {
        id: 'speech-quiet-dark',
        finding: '不爱说话，喜欢静、暗处',
        association: '多为阳气不足',
        note: '经验条目：阳虚、气虚可见少言、畏光、喜静；也需考虑情绪低落、贫血、甲状腺功能低下与慢性疲劳。',
      },
    ],
    note: '语言与姿态的变化，既可能是功能状态，也可能是神经系统急症；起病突然时先按急症处理。',
  },
  {
    id: 'complexion',
    title: '站内可互证的面色条目',
    subtitle: '从现有经典与讲义中补几条，便于和上面经验条目对照。',
    entries: [
      {
        id: 'complexion-green',
        finding: '面色青',
        association: '痛、循环不畅',
        note: '《伤寒论》讲义：面青多主痛，血液循环差；受寒、剧痛、缺氧均可出现。',
        source: '《伤寒论》讲义 · 太阳病篇',
        href: '/classics/shanghan-nihaixia',
      },
      {
        id: 'complexion-pale',
        finding: '面色苍白、唇白',
        association: '失血、贫血',
        note: '《伤寒论》讲义：失血家可见面色苍白、唇白；需查血常规与出血源。',
        source: '《伤寒论》讲义 · 亡血条',
        href: '/classics/shanghan-nihaixia',
      },
      {
        id: 'tongue-thick',
        finding: '舌体肥厚',
        association: '多提示虚',
        note: '《伤寒论》讲义：舌头越肥越厚，多提示身体虚；需结合舌色、舌苔、齿痕与津液。',
        source: '《伤寒论》讲义 · 桂枝汤篇',
        href: '/classics/shanghan-nihaixia',
      },
    ],
    note: '面色与舌象要放在光线、饮食、药物、情绪与病程里看，不能凭一张照片定论。',
  },
]

export const inspectionTemplate = [
  { label: '部位', hint: '山根、手掌、眼目、面色、舌象，分别记录。' },
  { label: '所见', hint: '颜色、形态、润燥、温度；用描述，不急着下病名。' },
  { label: '条件', hint: '光线、时间、刚哭闹/运动/饮酒/服药后。' },
  { label: '伴随', hint: '疼痛、发热、出汗、二便、睡眠、情绪。' },
  { label: '结论', hint: '写“经验提示”，并列出需要排除的急症或需检查的项目。' },
]
