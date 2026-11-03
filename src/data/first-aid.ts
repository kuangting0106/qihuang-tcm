export interface FirstAidFigure {
  src: string
  caption: string
  page: number
}

export interface FirstAidGroup {
  title: string
  items: string[]
}

export interface FirstAidCondition {
  id: string
  title: string
  subtitle: string
  pages: string
  summary: string
  symptoms: string[]
  rescue: FirstAidGroup[]
  care?: FirstAidGroup[]
  figures: FirstAidFigure[]
  caution?: string
}

export const firstAidSource = {
  title: '《中医急救手册·第一时间》',
  edition: '2025.2.20 版本（电子本）',
  note:
    '以下文字与插图据该书摘录、按病症重排；原文为现代出版物，不套用古籍“原文—方解”体例。个别明显讹字（如“菜菔子”“吴茱黄”“师医”）已按常用写法校正，其余保持原意。',
}

export const firstAidGeneralWarning =
  '本栏目涉及放血、针刺、艾灸与处方药，仅作参考学习，不构成诊断或治疗建议，也不能替代现代急救。遇到意识丧失、呼吸心跳停止，请立即拨打 120，并先行心肺复苏（CPR）与自动体外除颤（AED）；放血、针刺、艾灸及内服药物须由具备资质的医务人员操作。'

export const firstAidConditions: FirstAidCondition[] = [
  {
    id: 'heart-attack',
    title: '心梗',
    subtitle: '心脏问题的急救',
    pages: '第 2–8 页',
    summary: '胸闷、胸痛，可放射至肩胛，伴头晕、舌麻、唇紫与异常出汗。',
    symptoms: [
      '胸闷、气短、胸口疼痛。',
      '肩胛骨区域疼痛，呈放射性疼、刺痛、麻木或电击感。',
      '头晕，可有一过性昏厥。',
      '舌头麻木、发胀、僵硬。',
      '嘴唇发紫，出汗异常。',
    ],
    rescue: [
      {
        title: '1. 十宣放血',
        items: [
          '以三棱针点刺十指尖端放血；刺血前用 75% 酒精棉消毒皮肤及用具。',
          '注意：面色晦暗、唇甲青紫或淡白、大汗淋漓、气促息微、四肢厥冷等寒邪凝滞、阳气虚衰者，不宜点刺放血。',
        ],
      },
      {
        title: '2. 指掐穴位',
        items: [
          '以拇指重力掐按人中（水沟）、内关、合谷、通里。',
          '昏迷患者以出现疼痛反应并苏醒为度。',
        ],
      },
      {
        title: '3. 弹拨极泉',
        items: [
          '用中指在右侧极泉穴处将肌肉向后推、再向前拨，前后拨动 3～9 次。',
          '方法正确时，患者会有如触电般麻至手的感觉。',
        ],
      },
      {
        title: '4. 提捏腋前大筋',
        items: [
          '用拇指和食指、中指、无名指提捏右侧腋前大筋（肩前与胸侧连接处），向前拉放，连续 3 次。',
          '同时密切观察患者面色、表情及呼吸变化；3 次不行，可连续提捏 6 次或 9 次。',
        ],
      },
      {
        title: '5. 其他手法',
        items: [
          '拍打手肘窝。',
          '用指关节按住肩胛骨内侧痛点结节，用力晃动。',
          '用手使劲掐捏足跟腱（昆仑、太溪）。',
        ],
      },
    ],
    care: [
      {
        title: '日常心脏保养',
        items: [
          '膻中穴上下区域轻轻按揉；左上方有痛点时要揉开。',
          '外关、内关附近有痛点，经常按揉；放置支架的患者动作要轻。',
          '按揉后背至阳穴周围区域。',
          '按揉胸部上方、锁骨下方。',
          '常按心经神门、少府；心包经大陵、劳宫、内关。',
          '灸法：心悸、气短喘息、乏力、咳嗽痰多、遇劳加重、肢体水肿、形寒肢冷、吐泡沫痰、胸刺痛、面色苍白、舌淡有齿痕等阳虚表现，可取关元、气海、肺俞（双）、心俞（双）、肾俞（双）；阴虚重症慎用。',
        ],
      },
    ],
    figures: [
      { src: '/images/first-aid/p03-01.jpg', caption: '十宣穴', page: 2 },
      { src: '/images/first-aid/p04-01.jpg', caption: '水沟穴（人中）', page: 3 },
      { src: '/images/first-aid/p04-02.jpg', caption: '内关穴', page: 3 },
      { src: '/images/first-aid/p04-03.jpg', caption: '合谷穴', page: 3 },
      { src: '/images/first-aid/p05-01.jpg', caption: '通里穴', page: 4 },
      { src: '/images/first-aid/p05-02.jpg', caption: '极泉穴', page: 4 },
      { src: '/images/first-aid/p07-01.jpg', caption: '膻中穴', page: 6 },
      { src: '/images/first-aid/p07-04.jpg', caption: '至阳穴', page: 6 },
      { src: '/images/first-aid/p09-01.jpg', caption: '关元穴（灸）', page: 8 },
      { src: '/images/first-aid/p09-02.jpg', caption: '气海穴（灸）', page: 8 },
    ],
  },
  {
    id: 'sudden-death',
    title: '猝死',
    subtitle: '心脏问题的急救',
    pages: '第 9–14 页',
    summary: '突然神昏、不省人事，脉搏消失，气息微弱或呼吸停止。',
    symptoms: [
      '主症：突然神昏、不省人事；虚里、寸口、人迎、阴股脉、跌阳脉搏动消失；气息微弱或呼吸停止。',
      '兼症：气息不调，舌青舌卷，面唇甚至全身青紫瘀暗，瞳孔散大或两目睁圆，四肢厥冷甚至身冷如冰。',
    ],
    rescue: [
      {
        title: '1. 灸法',
        items: [
          '取气海、关元、神阙（肚脐眼）、百会、足三里、涌泉、心俞。',
          '艾灸不拘壮数，以脉复、汗止、肢温为度。',
        ],
      },
      {
        title: '2. 耳穴',
        items: [
          '取心、脑、皮质下、肾上腺。',
          '上穴全取，贴耳豆强刺激，以心跳恢复、神志清醒为度。',
        ],
      },
      {
        title: '3. 三棱针刺血',
        items: [
          '刺血前用 75% 酒精棉消毒皮肤及用具。',
          '取少泽、十宣、人中（水沟）、百会，用三棱针点刺，挤出几滴鲜血，以强心通脉、护脑醒神。',
          '另取人中、肺俞、素髎、十宣、曲池，同法点刺放血，以宣肺利气。',
        ],
      },
      {
        title: '4. 中成药（请在医师指导下使用）',
        items: [
          '安宫牛黄丸、至宝丹、苏合香丸鼻饲给药，以醒脑开窍。',
          '通关散吹入鼻中取嚏，以宣通肺气、开窍醒神。',
          '四味回阳饮以回阳固脱。',
        ],
      },
      {
        title: '5. 其他治法（古籍记载）',
        items: [
          '葱黄刺鼻法（《肘后备急方》）：用葱黄心刺入鼻孔 7～8 寸（内迎香），鼻目出血即苏，无血者难救。',
          '刺舌下紫脉法（《串雅》）：用瓷碗块尖刺舌下两侧静脉出血；不可刺舌下正中静脉，忌用铁制针具。',
          '吹耳法（《肘后备急方》）：以管放入耳中，施术者用力吹气 3 次，先吹左耳，后吹右耳。',
          '灸神阙法（《肘后备急方》）：以盐末填脐眼，用大艾炷灸脐中百壮。',
          '通关散吹鼻法：牙皂、细辛等份为末吹鼻，有嚏则生，无嚏则死。',
          '生半夏粉吹鼻法（《肘后备急方》）：以生半夏粉吹鼻中。',
        ],
      },
    ],
    figures: [
      { src: '/images/first-aid/p10-01.jpg', caption: '气海穴', page: 9 },
      { src: '/images/first-aid/p10-02.jpg', caption: '关元穴', page: 9 },
      { src: '/images/first-aid/p11-03.jpg', caption: '百会穴', page: 10 },
      { src: '/images/first-aid/p11-04.jpg', caption: '涌泉穴', page: 10 },
      { src: '/images/first-aid/p11-05.jpg', caption: '心俞穴', page: 10 },
      { src: '/images/first-aid/p12-01.jpg', caption: '耳穴全图', page: 11 },
      { src: '/images/first-aid/p13-01.jpg', caption: '少泽穴', page: 12 },
      { src: '/images/first-aid/p13-02.jpg', caption: '十宣穴', page: 12 },
      { src: '/images/first-aid/p14-03.jpg', caption: '素髎穴', page: 13 },
    ],
    caution:
      '猝死属急危重症。发现患者无反应、无呼吸或仅有濒死喘息，应立即拨打 120、开始胸外按压并使用 AED；本页所列为原书整理的中医应急方法，不能替代现代心肺复苏。',
  },
  {
    id: 'stroke',
    title: '脑中风',
    subtitle: '脑问题的急救',
    pages: '第 15–28 页',
    summary: '突然昏仆、口角歪斜、言语不利、半身不遂或偏身麻木。',
    symptoms: [
      '以突然昏仆、不省人事、口角歪斜、言语不利、半身不遂或偏身麻木为主要表现。',
      '轻者可以没有突然昏仆，仅有口舌歪斜、言语不利、半身不遂等。',
      '发现中风患者，请立即拨打 120 急救电话。',
      '不要轻易搬动患者，让患者原地躺平；昏迷者保持呼吸道通畅，帮助清除口腔异物；若有呕吐，应让患者头偏向一侧。',
    ],
    rescue: [
      {
        title: '1. 提捏腋前大筋',
        items: [
          '用拇指和食指、中指、无名指提捏右侧腋前大筋（肩前与胸侧连接处），向前拉放，连续 3 次。',
          '同时密切关注患者面色、表情及呼吸变化。拿捏到位时，胸痛、胸闷或压榨感可瞬间消失；3 次不行，可连续提捏 6 次或 9 次。',
        ],
      },
      {
        title: '2. “闭证”点刺放血',
        items: [
          '适用于神昏面赤、呼吸急促、喉中痰鸣、牙关紧闭、口噤不开、肢体强痉、两手握固、二便不通等“闭证”。',
          '取十宣、百会、双侧耳尖点刺放血；口角歪斜者，加双侧耳垂点刺放血。刺血前用 75% 酒精棉消毒皮肤及用具。',
          '三棱针操作：先在被刺部位或周围推、揉、挤、捋使局部充血；一手固定部位，另一手捏住针柄上中段，中指紧靠针身，露出针尖 3～5 mm，快速刺入并迅速出针。',
          '点刺后可放出适量血液或黏液，也可辅以推挤；无三棱针时，可用 12# 注射器针头或一次性采血针代替。',
        ],
      },
      {
        title: '3. “脱证”悬灸',
        items: [
          '适用于汗多、手撒肢冷、目合口张、肢体瘫软等“脱证”。',
          '点燃艾条悬灸百会、神阙、关元、足三里、涌泉，每个穴位不少于 10 分钟。',
          '悬灸时艾条距皮肤约 2～3 cm，以局部温热而无灼痛为宜；可如雀啄般上下活动，或左右移动、反复旋转。',
        ],
      },
      {
        title: '4. 指掐穴位',
        items: [
          '以拇指重力掐按人中（水沟）、内关、合谷、通里。',
          '昏迷患者以出现疼痛反应并苏醒为度。',
        ],
      },
    ],
    care: [
      {
        title: '中风后遗症及调理',
        items: [
          '手足不仁，先按隐白；患者能感知疼痛、肢体有反应，调理相对较快。',
          '从大脑治起：两侧足大趾用刮痧板刮，趾尖往外、往小趾方向刮，每个趾头都刮到。',
          '按尺泽、腰腿点调全身气血；再按耳后高骨下大筋、心经少海与通里、心包经曲泽下与内关、大趾痛点、脚后跟。',
          '中风总体属气血不足：灸肚脐，每次一支艾条；足三里一支艾条；肚脐与足三里可交替灸。',
          '大脑之后调肝胆：把足底肝胆反射区压着向前推，使之疏通。',
          '右手抬不起来，可按治肩周炎的方法，取手部腰腿点、尺泽及尺泽下大筋、脚背肩痛点。',
          '曲池放血；凡与肝、筋有关的毛病，点曲池加阳陵泉。',
          '加风池穴，往头顶方向压、推，管大脑供血。',
          '按压小腿黄金线。',
          '小腿内侧地机穴，对腿脚在地上拖者尤其管用；脾主四肢，脾无力则四肢无力。',
          '压过地机后压股动脉处的气冲，可疏通肝、脾、肾三经。',
          '压阳明经的内庭穴。',
          '捏手指缝、脚趾缝；用按摩棒挤着每条指缝按压各一分钟。',
          '半边冰冷者先拍，拍松后压合谷，一压一松；合谷属阳明经，阳明多气多血。',
        ],
      },
      {
        title: '回阳救逆大法：弹拨极泉、拉腋前大筋',
        items: [
          '心脏病发作、中暑或其他原因导致昏厥时，可采用弹拨极泉、拉腋前大筋。',
          '弹拨极泉：中指按住腋窝顶点、腋动脉搏动处，前后拨动 3～9 次；方法正确时患者会如触电般麻至手。',
          '拉腋前大筋：以拇指和食指、中指、无名指提捏右侧大筋，向前拉放，连续 3 次；密切观察面色、表情与呼吸。',
          '心脏病急性发作时，患者常用手按左侧胸口；此时按压患者右手内关，往往可立刻缓解。',
        ],
      },
    ],
    figures: [
      { src: '/images/first-aid/p17-02.jpg', caption: '十宣穴', page: 16 },
      { src: '/images/first-aid/p18-01.jpg', caption: '百会穴', page: 17 },
      { src: '/images/first-aid/p18-02.jpg', caption: '耳尖', page: 17 },
      { src: '/images/first-aid/p18-03.jpg', caption: '耳垂', page: 17 },
      { src: '/images/first-aid/p20-01.jpg', caption: '神阙穴', page: 19 },
      { src: '/images/first-aid/p20-03.jpg', caption: '足三里穴', page: 19 },
      { src: '/images/first-aid/p21-01.jpg', caption: '涌泉穴', page: 20 },
      { src: '/images/first-aid/p21-02.jpg', caption: '水沟穴（人中）', page: 20 },
      { src: '/images/first-aid/p22-01.jpg', caption: '内关穴', page: 21 },
      { src: '/images/first-aid/p29-01.jpg', caption: '极泉穴', page: 28 },
      { src: '/images/first-aid/p29-02.jpg', caption: '提捏腋前大筋', page: 28 },
    ],
    caution:
      '中风需与低血糖、癫痫等鉴别。务必先拨打 120，不要自行给患者喂水、喂药；放血与艾灸不能替代静脉溶栓、取栓等现代救治。',
  },
  {
    id: 'asthma',
    title: '哮喘',
    subtitle: '肺呼吸道问题的急救',
    pages: '第 29–32 页',
    summary: '喘息、气急、胸闷，可闻及哮鸣音，常伴咳嗽咳痰。',
    symptoms: [
      '主症：喘息，呼吸急促，可闻及哮鸣音；气急，感觉呼吸费力、气不够用；胸闷，胸部有压迫感。',
      '兼症：咳嗽，可为干咳或有痰咳嗽；痰液多为白色泡沫样，严重时可呈脓性。',
      '呼吸困难加重时，可出现烦躁不安、大汗淋漓。',
    ],
    rescue: [
      {
        title: '1. 急救按揉',
        items: ['按揉膻中、太渊、外劳宫、孔最。'],
      },
      {
        title: '2. 治本方法',
        items: [
          '按压治咳穴位：解溪、委中、曲池、丰隆、耳穴肺。',
          '艾灸较快：灸心肺俞、八髎；灸八髎补的是肾，哮喘因肾不纳气。',
          '拨太溪补肾。',
        ],
      },
    ],
    care: [
      {
        title: '注意事项',
        items: [
          '避免诱因：远离过敏原、刺激性气体等。',
          '生活调理：适当运动增强体质，避免劳累和精神紧张。',
        ],
      },
    ],
    figures: [
      { src: '/images/first-aid/p30-01.jpg', caption: '膻中穴', page: 29 },
      { src: '/images/first-aid/p31-01.jpg', caption: '孔最穴', page: 30 },
      { src: '/images/first-aid/p31-02.jpg', caption: '外劳宫穴', page: 30 },
      { src: '/images/first-aid/p31-03.jpg', caption: '太渊穴', page: 30 },
      { src: '/images/first-aid/p31-04.jpg', caption: '解溪穴与耳穴肺', page: 30 },
      { src: '/images/first-aid/p32-02.jpg', caption: '委中穴', page: 31 },
      { src: '/images/first-aid/p32-03.jpg', caption: '丰隆穴', page: 31 },
      { src: '/images/first-aid/p32-04.jpg', caption: '心肺俞与八髎', page: 31 },
      { src: '/images/first-aid/p33-01.jpg', caption: '太溪穴', page: 32 },
    ],
    caution:
      '哮喘急性发作出现说话困难、口唇发紫、意识改变时，应立即使用急救药物并拨打 120；艾灸与按揉只能作为辅助，不能延误支气管舒张剂和氧疗。',
  },
  {
    id: 'lung-failure',
    title: '肺衰',
    subtitle: '肺呼吸道问题的急救',
    pages: '第 33–39 页',
    summary: '呼吸困难、喘息抬肩、气息不能接续，伴胸闷、心悸、唇紫。',
    symptoms: [
      '主症：呼吸困难，喘息抬肩，气息喘促、不能接续，深浅不一、快慢不齐，或间歇停顿；胸闷胀满，心悸，唇紫，神疲，咳逆痰壅。',
      '兼症：表情淡漠，嗜睡，甚则神昏谵语、抽搐；或伴跗肿甚至肢体浮肿；或汗出如油、大汗淋漓，四肢厥冷。',
    ],
    rescue: [
      {
        title: '1. 针刺疗法',
        items: [
          '主穴：肺俞、支沟、定喘。',
          '配穴：外寒内饮证配列缺、尺泽、风门；痰浊阻肺证选章门、丰隆、太白、太渊；痰热郁肺证选尺泽、丰隆、列缺；虚证选肺俞、肾俞、足三里、三阴交、气海。',
          '操作：均以直刺为主，强调得气为度。实证刺不留针，起针后加火罐；虚证以补法为主，给予弱刺激。同时急灸气海、关元。',
        ],
      },
      {
        title: '2. 耳穴疗法',
        items: [
          '取肺、脾、肾、气管、皮质下、交感、平喘点等穴贴压。',
          '每天按压 3～5 次，每次每穴按压 10 次。',
        ],
      },
    ],
    figures: [
      { src: '/images/first-aid/p35-01.jpg', caption: '肺俞穴', page: 34 },
      { src: '/images/first-aid/p35-02.jpg', caption: '支沟穴', page: 34 },
      { src: '/images/first-aid/p35-04.jpg', caption: '定喘穴', page: 34 },
      { src: '/images/first-aid/p36-01.jpg', caption: '列缺穴', page: 35 },
      { src: '/images/first-aid/p36-02.jpg', caption: '尺泽穴', page: 35 },
      { src: '/images/first-aid/p37-01.jpg', caption: '章门穴', page: 36 },
      { src: '/images/first-aid/p37-02.jpg', caption: '丰隆穴', page: 36 },
      { src: '/images/first-aid/p38-02.jpg', caption: '肾俞穴', page: 37 },
      { src: '/images/first-aid/p39-01.jpg', caption: '三阴交穴', page: 38 },
      { src: '/images/first-aid/p39-02.jpg', caption: '气海穴', page: 38 },
      { src: '/images/first-aid/p40-01.jpg', caption: '耳穴全图', page: 39 },
    ],
    caution:
      '“肺衰”对应现代呼吸衰竭，属危重症。出现意识改变、发绀、呼吸节律异常时须立即吸氧并送医；针刺、艾灸应由医务人员实施。',
  },
  {
    id: 'acute-stomach-pain',
    title: '急性胃脘痛',
    subtitle: '胃部问题的急救',
    pages: '第 40–42 页',
    summary: '胃脘部突发剧烈疼痛或绞痛，伴腹胀、恶心呕吐、嗳气。',
    symptoms: [
      '西医学中的急性胃炎、急性肠胃炎、肠溃疡急性穿孔、胃癌穿孔、急性胃扭转等疾病可见类似表现。',
      '主症：胃脘部突发剧烈疼痛，或绞痛，或持续性加剧。',
      '兼症：多兼腹痛、腹胀、恶心呕吐、嗳气、烧灼等消化道症状。',
      '拒按是实证，喜按是虚证。',
    ],
    rescue: [
      {
        title: '1. 虚证胃脘痛',
        items: [
          '艾灸中脘、足三里，30 分钟 1 次，每日 2 次；可配合隔盐或隔姜灸神阙（肚脐眼）。',
          '中药热熨：用酒炒热莱菔子、姜、葱末，包熨中脘部位；或食盐、吴茱萸、麦麸等炒热，装入布袋热熨痛处。',
          '中成药：理中丸（请在医师指导下使用）。',
        ],
      },
      {
        title: '2. 实证胃脘痛',
        items: [
          '中药汤剂：轻症可用焦三仙、调胃承气汤、小承气汤；重症可用大承气汤（请在医师指导下使用）。',
        ],
      },
      {
        title: '3. 快速止痛',
        items: ['至阳穴和内关穴也能快速止胃痛。'],
      },
      {
        title: '4. 耳穴',
        items: ['取交感、皮质下、胃等穴，贴耳豆中等强度刺激。'],
      },
    ],
    figures: [
      { src: '/images/first-aid/p41-01.jpg', caption: '中脘穴', page: 40 },
      { src: '/images/first-aid/p42-02.jpg', caption: '足三里穴', page: 41 },
      { src: '/images/first-aid/p42-03.jpg', caption: '至阳穴', page: 41 },
      { src: '/images/first-aid/p42-04.jpg', caption: '内关穴', page: 41 },
      { src: '/images/first-aid/p43-01.jpg', caption: '耳穴全图', page: 42 },
    ],
    caution:
      '突发剧烈腹痛在明确诊断前不要热敷、不要自行服止痛药；若为溃疡穿孔、急腹症，热敷与攻下药可能加重病情，须立即就医。',
  },
]
