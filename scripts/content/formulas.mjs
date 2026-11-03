import { source } from './sources.mjs'

const claim = (text, citationIds, kind = 'paraphrase', locator) => ({
  text,
  kind,
  citationIds,
  ...(locator ? { locator } : {}),
})

const comp = (herbId, dosage, role, note, ratio, modern, action) => ({
  herbId,
  dosage,
  role,
  roleCitationIds: ['src-fangjixue'],
  ...(note ? { note } : {}),
  ...(ratio ? { ratio } : {}),
  ...(modern?.dose ? { modernDose: modern.dose } : {}),
  ...(modern?.ratio ? { modernRatio: modern.ratio } : {}),
  ...(action ? { action: claim(action, ['src-fangjixue'], 'analysis') } : {}),
})

const doseConversion = {
  text: '一两 = 现今的一钱',
  note:
    '这是本站统一采用的经方折算约定，便于对照今用剂量；汉代度量衡考证另有异说，折算值不是《伤寒论》原文，也不等于临床处方量。',
}

// 现代病症解说（可选）：在方剂对象里加
// modernExplanation: claim('解说文字', ['src-fangjixue'], 'analysis')
// 不填时页面显示“待补充”，留给编者手动录入，不自动生成。
//
// 原文悬浮注解（可选）：在方剂对象里加
// originalAnnotations: [{ id, phrase: '原文中的词句', note: '现代注解', citationIds: ['src-fangjixue'] }]
// 页面会把 phrase 标成虚线下划线，悬停/聚焦显示 note。

const pair = (from, to, label, citationIds, note) => ({
  from,
  to,
  label,
  kind: 'analysis',
  citationIds,
  ...(note ? { note } : {}),
})

const commentarySlots = (prefix) => [
  {
    id: `${prefix}-commentary-classic`,
    kind: 'classic',
    label: '古籍条曰',
    work: '书名待补',
    locator: '卷/条待补',
    quote: '某古籍中条曰：……',
    status: '待补充',
  },
  {
    id: `${prefix}-commentary-physician`,
    kind: 'physician',
    label: '历代医家解说',
    work: '医家 · 书名待补',
    locator: '卷/条待补',
    quote: '某医家曰：……',
    status: '待补充',
  },
]

const shanghan12 = source('src-shanghan-12')
const shanghan96 = source('src-shanghan-96')

export const formulas = [
  {
    id: 'guizhi-tang',
    name: '桂枝汤',
    pinyin: 'Guì Zhī Tāng',
    sourceCitationId: 'src-shanghan-12',
    originalText: claim(shanghan12.quote, ['src-shanghan-12'], 'quote', '辨太阳病脉证并治上·第12条'),
    effects: claim('解肌发表，调和营卫。', ['src-fangjixue'], 'analysis', '桂枝汤方解'),
    symptoms: [
      claim(
        '太阳中风，阳浮而阴弱，阳浮者，热自发，阴弱者，汗自出，啬啬恶寒，淅淅恶风，翕翕发热，鼻鸣干呕者，桂枝汤主之。',
        ['src-shanghan-12'],
        'quote',
        '辨太阳病脉证并治上·第12条',
      ),
    ],
    originalAnnotations: [
      {
        id: 'guizhi-yangfu-yinruo',
        phrase: '阳浮而阴弱',
        note: '指卫气浮盛于外、营阴不足于内，是营卫不和的表现。',
        citationIds: ['src-fangjixue'],
      },
      {
        id: 'guizhi-sese-ehan',
        phrase: '啬啬恶寒',
        note: '形容畏寒蜷缩、怕冷明显。',
        citationIds: ['src-fangjixue'],
      },
      {
        id: 'guizhi-xixi-efeng',
        phrase: '淅淅恶风',
        note: '形容怕风，像冷水淋身一样。',
        citationIds: ['src-fangjixue'],
      },
      {
        id: 'guizhi-xixi-fare',
        phrase: '翕翕发热',
        note: '形容发热轻浅，像羽毛覆在身上。',
        citationIds: ['src-fangjixue'],
      },
      {
        id: 'guizhi-biming-ganou',
        phrase: '鼻鸣干呕',
        note: '鼻塞而呼吸有声；胃气上逆而干呕。',
        citationIds: ['src-fangjixue'],
      },
    ],
    preparation: {
      ingredients: claim(
        '桂枝三两（去皮） 芍药三两 甘草二两（炙） 生姜三两（切） 大枣十二枚（擘）',
        ['src-shanghan-12'],
        'quote',
        '辨太阳病脉证并治上·第12条·方后注',
      ),
      decoction: claim(
        '上五味，㕮咀三味，以水七升，微火煮取三升，去滓',
        ['src-shanghan-12'],
        'quote',
        '辨太阳病脉证并治上·第12条·方后注',
      ),
      administration: claim(
        '适寒温，服一升。服已须臾，啜热稀粥一升余，以助药力。温覆令一时许，遍身漐漐微似有汗者益佳，不可令如水流漓，病必不除。',
        ['src-shanghan-12'],
        'quote',
        '辨太阳病脉证并治上·第12条·方后注',
      ),
      modernDecoction: '9 碗水煮至 3 碗水，去滓。',
      modernAdministration: '空腹温服，一天三次；服后啜热稀粥，温覆取微汗。',
      modernNote: '现代用法为学习参考，不是《伤寒论》原文；具体煎服请遵医嘱。',
    },
    meaning: {
      herbMeanings: [
        { herbId: 'guizhi', text: '辛甘温，解肌发表，温通卫阳。' },
        { herbId: 'baishao', text: '酸苦微寒，敛阴和营，缓急止痛。' },
        { herbId: 'shengjiang', text: '辛温，散寒解表，和胃止呕。' },
        { herbId: 'dazao', text: '甘温，补中益气，护胃安中。' },
        { herbId: 'gancao', text: '甘平，调和诸药，益气和中。' },
      ],
      summary: claim(
        '诸药合用，解肌发表、调和营卫。主治太阳中风表虚证：发热、汗出、恶风、鼻鸣干呕，苔白不渴，脉浮缓或浮弱。',
        ['src-fangjixue'],
        'analysis',
        '桂枝汤方义',
      ),
    },
    composition: [
      comp('guizhi', '三两（去皮）', '君', undefined, { group: '两', value: 3, text: '3 两' }, { dose: '3 钱', ratio: { group: '今用钱', value: 3, text: '3 钱' } }, '解肌发表，温通卫阳'),
      comp('baishao', '三两', '臣', '《伤寒论》原文作“芍药”；本样例按现代药材名“白芍”建条目。', { group: '两', value: 3, text: '3 两' }, { dose: '3 钱', ratio: { group: '今用钱', value: 3, text: '3 钱' } }, '敛阴和营，缓急止痛'),
      comp('shengjiang', '三两（切）', '佐', undefined, { group: '两', value: 3, text: '3 两' }, { dose: '3 钱', ratio: { group: '今用钱', value: 3, text: '3 钱' } }, '散寒解表，和胃止呕'),
      comp('dazao', '十二枚（擘）', '佐', undefined, { group: '枚', value: 12, text: '12 枚' }, { dose: '12 枚（擘）', ratio: { group: '今用枚', value: 12, text: '12 枚', note: '单独计量' } }, '补中益气，护胃安中'),
      comp('gancao', '二两（炙）', '使', undefined, { group: '两', value: 2, text: '2 两' }, { dose: '2 钱', ratio: { group: '今用钱', value: 2, text: '2 钱' } }, '调和诸药，益气和中'),
    ],
    dosageNote:
      '原方以“两”和“枚”计量；比例只在同一单位组内比较，不把“两”与“枚”相加。',
    dosageRatioSummary: '两：桂枝 3 : 白芍 3 : 生姜 3 : 甘草 2；大枣 12 枚（单独计量）',
    doseConversion,
    modernDoseSummary: '桂枝3钱，白芍3钱，生姜3钱，大枣12枚（擘），甘草2钱。3:3:3:2',
    modernRatioSummary: '今用：桂枝 3 : 白芍 3 : 生姜 3 : 甘草 2；大枣 12 枚（单独计量）',
    modernGramDoses: {
      guizhi: '9 g',
      baishao: '9 g',
      shengjiang: '3 片',
      dazao: '12 个（劈）',
      gancao: '6 g（炙）',
    },
    modernGramNote: '本站中使用方剂用量不等于实际处方的用量。一钱≈3.75克。',
    modernDoseNote:
      '按“一两 = 现今的一钱”直接折算：原方三两即今用三钱，二两即二钱；大枣仍按枚单独计量。折算值只作经方用量参考，不是临床处方。',
    symptomTags: ['发热', '汗出', '恶风', '鼻鸣', '干呕'],
    modifications: [],
    modificationsNote:
      '《伤寒论》第12条原文未列加减法；相关变方（如桂枝加葛根汤）本样例暂未收录，不在此处硬编。',
    corePairs: [
      pair('guizhi', 'baishao', '调和营卫', ['src-fangjixue'], '桂枝汤方解，属后世教材归纳。'),
      pair('guizhi', 'gancao', '辛甘化阳', ['src-fangjixue'], '桂枝汤方解，属后世教材归纳。'),
      pair('baishao', 'gancao', '酸甘化阴、缓急止痛', ['src-fangjixue'], '桂枝汤方解，属后世教材归纳。'),
    ],
    commentaries: [],
    commentarySlots: commentarySlots('guizhi-tang'),
    additionalIndications: [],
    commentaryNote:
      '历代注家、名家医案与扩展主治待逐条补充；收到典籍原文后按“书名·卷/条·原文”录入。这里不把当代教材当作古籍解说。',
    verification: 'verified',
  },
  {
    id: 'xiao-chai-hu-tang',
    name: '小柴胡汤',
    pinyin: 'Xiǎo Chái Hú Tāng',
    sourceCitationId: 'src-shanghan-96',
    originalText: claim(shanghan96.quote, ['src-shanghan-96'], 'quote', '辨太阳病脉证并治中·第96条'),
    effects: claim('和解少阳。', ['src-fangjixue'], 'analysis', '小柴胡汤方解'),
    modernExplanation: claim(
      '当有太阳表症兼阳明症、少阳症时，当和解少阳，用小柴胡汤。\n' +
        '女性生理期感冒可直接用小柴胡汤，不使用桂枝汤或麻黄汤解表。\n' +
        '以小柴胡汤为基础方进行加减，对各种肝胆病、甲状腺、乳腺、淋巴、男女胞宫类疾病均可。',
      ['src-fangjixue'],
      'analysis',
      '现代病症解说',
    ),
    symptoms: [
      claim(
        '伤寒五六日，中风，往来寒热，胸胁苦满，嘿嘿不欲饮食，心烦喜呕，或胸中烦而不呕，或渴，或腹中痛，或胁下痞硬，或心下悸、小便不利，或不渴、身有微热，或咳者，小柴胡汤主之。',
        ['src-shanghan-96'],
        'quote',
        '辨太阳病脉证并治中·第96条',
      ),
    ],
    originalAnnotations: [
      {
        id: 'xiaochaihu-wanglai-hanre',
        phrase: '往来寒热',
        note: '恶寒与发热交替出现，是少阳病半表半里的典型热型。',
        citationIds: ['src-fangjixue'],
      },
      {
        id: 'xiaochaihu-xiongxie-kuman',
        phrase: '胸胁苦满',
        note: '胸胁部胀满不舒，为少阳经气不利。',
        citationIds: ['src-fangjixue'],
      },
      {
        id: 'xiaochaihu-hehe-buyinshi',
        phrase: '嘿嘿不欲饮食',
        note: '神情沉默、不想饮食，属胆胃不和。',
        citationIds: ['src-fangjixue'],
      },
      {
        id: 'xiaochaihu-xinfan-xinou',
        phrase: '心烦喜呕',
        note: '心中烦热，容易恶心呕吐。',
        citationIds: ['src-fangjixue'],
      },
    ],
    preparation: {
      ingredients: claim(
        '柴胡半斤 黄芩三两 人参三两 半夏半升（洗） 甘草三两（炙） 生姜三两（切） 大枣十二枚（擘）',
        ['src-shanghan-96'],
        'quote',
        '辨太阳病脉证并治中·第96条·方后注',
      ),
      decoction: claim(
        '上七味，以水一斗二升，煮取六升，去滓，再煎取三升',
        ['src-shanghan-96'],
        'quote',
        '辨太阳病脉证并治中·第96条·方后注',
      ),
      administration: claim(
        '温服一升，日三服',
        ['src-shanghan-96'],
        'quote',
        '辨太阳病脉证并治中·第96条·方后注',
      ),
      modernDecoction: '9 碗水煮至 3 碗水，去滓。',
      modernAdministration: '空腹温服，一天三次。',
      modernNote: '现代用法为学习参考，不是《伤寒论》原文；具体煎服请遵医嘱。',
    },
    meaning: {
      herbMeanings: [
        { herbId: 'chaihu', text: '性苦平，入肝胆经，泻少阳之邪，舒肝胆气之郁滞。' },
        { herbId: 'huangqin', text: '性苦寒，清泄少阳肝胆之热。' },
        { herbId: 'banxia', text: '降逆，去水，止呕。' },
        { herbId: 'shengjiang', text: '温胃，去胃中之水，止吐。' },
        { herbId: 'renshen', text: '益气补津。' },
        { herbId: 'dazao', text: '护胃。' },
        { herbId: 'gancao', text: '调和诸药，益气和中。' },
      ],
      summary: claim(
        '诸药合用，主治：\n1. 少阳伤寒症，往来寒热，胸胁苦满，不思饮食，心烦躁，见呕吐、口干、口苦、咽干、头昏目眩、舌苔白薄。\n2. 女性得表症，热入血室（女性月经期）\n3. 疟疾、黄疸等少阳症状',
        ['src-fangjixue'],
        'analysis',
        '小柴胡汤方义',
      ),
    },
    composition: [
      comp('chaihu', '半斤', '君', '半斤按汉代 1 斤 = 16 两折算为 8 两；页面同时保留原文“半斤”。', {
        group: '两',
        value: 8,
        text: '半斤（8 两）',
        note: '折算',
      }, { dose: '5 钱', ratio: { group: '今用钱', value: 5, text: '5 钱' } }, '疏肝胆'),
      comp('huangqin', '三两', '臣', undefined, { group: '两', value: 3, text: '3 两' }, { dose: '3 钱', ratio: { group: '今用钱', value: 3, text: '3 钱' } }, '清热'),
      comp('renshen', '三两', '佐', undefined, { group: '两', value: 3, text: '3 两' }, { dose: '3 钱', ratio: { group: '今用钱', value: 3, text: '3 钱' } }, '滋阴、生津'),
      comp('banxia', '半升（洗）', '佐', undefined, { group: '升', value: 0.5, text: '半升' }, { dose: '5 钱', ratio: { group: '今用钱', value: 5, text: '5 钱' } }, '去三焦水、行气、降逆、止呕'),
      comp('shengjiang', '三两（切）', '佐', undefined, { group: '两', value: 3, text: '3 两' }, { dose: '3 钱', ratio: { group: '今用钱', value: 3, text: '3 钱' } }, '温胃、去胃中水、止吐'),
      comp('dazao', '十二枚（擘）', '佐', undefined, { group: '枚', value: 12, text: '12 枚' }, { dose: '12 个（劈）', ratio: { group: '今用枚', value: 12, text: '12 个', note: '单独计量' } }, '护胃'),
      comp('gancao', '三两（炙）', '佐使', undefined, { group: '两', value: 3, text: '3 两' }, { dose: '3 钱', ratio: { group: '今用钱', value: 3, text: '3 钱' } }, '调和诸药，益气和中'),
    ],
    dosageNote:
      '柴胡半斤按汉代 1 斤 = 16 两折算为 8 两；半夏按升、大枣按枚，另行计量，不同单位不合并计算。',
    dosageRatioSummary:
      '两：柴胡 8（半斤折算） : 黄芩 3 : 人参 3 : 甘草 3 : 生姜 3；半夏 半升、大枣 12 枚（单独计量）',
    doseConversion,
    modernDoseSummary: '柴胡5钱，黄芩3钱，人参3钱，半夏5钱，甘草3钱，生姜3钱，大枣12个劈。5:3:3:5:3:3',
    modernRatioSummary: '今用：柴胡 5 : 黄芩 3 : 人参 3 : 半夏 5 : 甘草 3 : 生姜 3；大枣 12 个（单独计量）',
    modernGramDoses: {
      chaihu: '20 g',
      huangqin: '12 g',
      renshen: '12 g',
      banxia: '20 g',
      shengjiang: '3 片',
      dazao: '12 个（劈）',
      gancao: '12 g（炙）',
    },
    modernGramNote: '本站中使用方剂用量不等于实际处方的用量。一钱≈3.75克。',
    modernDoseNote:
      '今用剂量按常见今用配比录入：柴胡、半夏各 5 钱，黄芩、人参、甘草、生姜各 3 钱，大枣 12 个（劈）。5:3:3:5:3:3 为柴、芩、参、半、草、姜的今用比例，大枣按个单独计量。今用配比与原文按“一两 = 一钱”直接折算不完全等同，也不是《伤寒论》原文。',
    symptomTags: ['往来寒热', '胸胁苦满', '不欲饮食', '心烦喜呕', '或然症'],
    modifications: [
      {
        condition: '若胸中烦而不呕者',
        change: '去半夏、人参，加栝楼实一枚',
        citationIds: ['src-shanghan-96'],
        kind: 'quote',
      },
      {
        condition: '若渴',
        change: '去半夏，加人参合前成四两半、栝楼根四两',
        citationIds: ['src-shanghan-96'],
        kind: 'quote',
      },
      {
        condition: '若腹中痛者',
        change: '去黄芩，加芍药三两',
        citationIds: ['src-shanghan-96'],
        kind: 'quote',
      },
      {
        condition: '若胁下痞硬',
        change: '去大枣，加牡蛎四两',
        citationIds: ['src-shanghan-96'],
        kind: 'quote',
      },
      {
        condition: '若心下悸、小便不利者',
        change: '去黄芩，加茯苓四两',
        citationIds: ['src-shanghan-96'],
        kind: 'quote',
      },
      {
        condition: '若不渴，外有微热者',
        change: '去人参，加桂枝三两，温覆微汗愈',
        citationIds: ['src-shanghan-96'],
        kind: 'quote',
      },
      {
        condition: '若咳者',
        change: '去人参、大枣、生姜，加五味子半升、干姜二两',
        citationIds: ['src-shanghan-96'],
        kind: 'quote',
      },
    ],
    modificationsNote: '以上加减均见《伤寒论》第96条原文；加减后的方剂需由医师辨证使用。',
    corePairs: [
      pair('chaihu', 'huangqin', '和解少阳', ['src-fangjixue'], '小柴胡汤方解，属后世教材归纳。'),
      pair('banxia', 'shengjiang', '和胃降逆，生姜杀半夏', ['src-fangjixue', 'src-zhongyaoxue'], '属方解与七情归纳。'),
      pair('renshen', 'gancao', '益气和中', ['src-fangjixue'], '小柴胡汤方解，属后世教材归纳。'),
    ],
    commentaries: [],
    commentarySlots: commentarySlots('xiao-chai-hu-tang'),
    additionalIndications: [],
    commentaryNote:
      '历代注家、名家医案与扩展主治待逐条补充；收到典籍原文后按“书名·卷/条·原文”录入。这里不把当代教材当作古籍解说。',
    verification: 'verified',
  },
]
