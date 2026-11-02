export const herbPrinciples = {
  title: '药性基础法则',
  intro:
    '以《神农本草经》三品、《黄帝内经》气味阴阳、《本草备要·药性总义》与《中药学》性能理论为纲；原文、摘录、后世归纳分开标注。',
  branches: [
    {
      id: 'three-ranks',
      index: '01',
      title: '三品分类',
      subtitle: '养命 · 遏病 · 除邪',
      tone: 'jade',
      summary: '《神农本草经》以三品统药：上品养命，中品遏病，下品除邪。',
      items: [
        {
          label: '上品 · 养生',
          text: '主养命以应天，无毒，多服久服不伤人；今人概括为“养生类”。',
        },
        {
          label: '中品 · 遏病',
          text: '主养性以应人，有毒无毒斟酌其宜；欲遏病补虚羸者，本中经。',
        },
        {
          label: '下品 · 除邪',
          text: '主治病以应地，多毒，不可久服；欲除寒热邪气、破积聚、愈疾者，本下经。',
        },
      ],
      note:
        '原文作“养命 / 遏病补虚 / 除邪”，今语概括为养生、遏病、除邪三类；三品不是功效分类，具体药物归品须核对辑复本。',
      kindLabel: '摘录',
      citationIds: ['src-shennong-bencaojing-xulu'],
    },
    {
      id: 'four-natures-five-flavors',
      index: '02',
      title: '四气五味',
      subtitle: '气辨寒热温凉，味辨辛甘酸苦咸',
      tone: 'gold',
      summary: '药性先分气与味：四气辨寒热温凉，五味辨辛甘酸苦咸。',
      items: [
        { label: '四气', text: '寒、热、温、凉；另有平性。' },
        { label: '五味', text: '辛、甘、酸、苦、咸；淡、涩常附于五味之后。' },
        { label: '酸', text: '能收、能涩。' },
        { label: '苦', text: '能泄、能燥、能坚。' },
        { label: '甘', text: '能补、能和、能缓。' },
        {
          label: '辛',
          text: '能散、能行；《本草备要》另云“能润”，但辛润不是所有辛味药的通例。',
        },
        { label: '咸', text: '能下、能软坚。' },
        { label: '淡', text: '能利窍、能渗泄。' },
      ],
      note:
        '四气、五味是药性归纳，不等于药物的全部功效；具体到每味药，仍以药典条目的性味与功效为准。',
      kindLabel: '摘录',
      citationIds: ['src-bencao-beyao-yaoxing', 'src-zhongyaoxue-yaoxing'],
    },
    {
      id: 'qi-flavor-yinyang',
      index: '03',
      title: '气味阴阳',
      subtitle: '气为阳，味为阴；厚薄不同，泄通各异',
      tone: 'cinnabar',
      summary: '气为阳，味为阴；气味各有厚薄，厚薄决定升降泄通。',
      items: [
        { label: '气厚 / 气薄', text: '气厚者为阳中之阳，气薄者为阳中之阴。' },
        { label: '味厚 / 味薄', text: '味厚者为阴中之阴，味薄者为阴中之阳。' },
        { label: '气', text: '气薄则发泄，气厚则发热。' },
        { label: '味', text: '味厚则泄，味薄则通。' },
        {
          label: '总纲',
          text: '辛甘发散为阳；酸苦涌泄为阴；咸味涌泄为阴；淡味渗泄为阳。',
        },
        { label: '升降', text: '轻清升浮为阳，重浊沉降为阴。' },
      ],
      note:
        '“味厚为阴中之阴（主下泻）、味薄为阴中之阳（能通利）”即本于此；但“气薄主降而收、气厚主浮而藏”是升降浮沉的另一组表述，不能与气味厚薄混为一句。',
      kindLabel: '原文',
      citationIds: ['src-suwen-yinyang', 'src-suwen-zhizhen', 'src-bencao-beyao-yaoxing'],
    },
    {
      id: 'ascending-descending',
      index: '04',
      title: '升降浮沉',
      subtitle: '味薄升，气薄降；气厚浮，味厚沉',
      tone: 'plum',
      summary: '升降浮沉以四时生长收藏为喻，气味厚薄各有所归。',
      items: [
        { label: '味薄', text: '味薄者升而生。' },
        { label: '气薄', text: '气薄者降而收。' },
        { label: '气厚', text: '气厚者浮而长。' },
        { label: '味厚', text: '味厚者沉而藏。' },
        { label: '味平', text: '味平者化而成。' },
        { label: '合参', text: '气厚味薄者浮而升；味厚气薄者沉而降。' },
        { label: '约束', text: '酸咸无升，甘辛无降；寒无浮，热无沉。' },
      ],
      note:
        '通行本作“气厚者浮而长；味厚者沉而藏”。把“气厚”写成“浮而藏”，是把气、味两句合并了。',
      kindLabel: '原文',
      citationIds: ['src-bencao-beyao-yaoxing'],
    },
    {
      id: 'part-and-texture',
      index: '05',
      title: '药质与部位',
      subtitle: '枝走四肢，皮走皮肤，心、干内行脏腑',
      tone: 'stone',
      summary: '药之部位与质地，决定其趋向：枝走四肢，皮走皮肤，心、干内行脏腑。',
      items: [
        { label: '枝', text: '为枝者达四肢。' },
        { label: '皮', text: '为皮者达皮肤。' },
        { label: '心 / 干', text: '为心为干者内行脏腑；“干”指主干。' },
        { label: '质轻 / 质重', text: '质轻者上入心肺；质重者下入肝肾。' },
        { label: '中空 / 内实', text: '中空者发表；内实者攻里。' },
        { label: '枯燥 / 润泽', text: '枯燥者入气分；润泽者入血分。' },
        {
          label: '金石',
          text: '金石类多质重沉降，部分能重镇安神；不是所有金石药都能安神。朱砂等有毒，须遵医嘱，不可自行服用。',
        },
      ],
      note:
        '“枝多走四肢、皮多走表肤、杆或心多走内脏”是今语概括；原文用“达四肢 / 达皮肤 / 内行脏腑”。金石重镇安神属后世归纳，不能推广为全部金石药。',
      kindLabel: '原文 + 后世归纳',
      citationIds: ['src-bencao-beyao-yaoxing', 'src-zhongyaoxue-anshen'],
    },
    {
      id: 'seven-relations',
      index: '06',
      title: '配伍七情',
      subtitle: '单行 · 相须 · 相使 · 相畏 · 相杀 · 相恶 · 相反',
      tone: 'moss',
      summary: '配伍七情：单行、相须、相使、相畏、相杀、相恶、相反。',
      items: [
        { label: '单行', text: '单用一味药治病，不需其他药物辅助。' },
        {
          label: '相须',
          text: '同类而不可离，协同增效；通行作“相须”，不是“相需”。',
        },
        { label: '相使', text: '我之佐使；主辅相配，辅药提高主药功效。' },
        { label: '相畏', text: '受彼之制；一药的毒副作用被另一药抑制。' },
        { label: '相杀', text: '制彼之毒；一药能消除另一药的毒副作用。' },
        {
          label: '相恶',
          text: '夺我之能；一药削弱另一药的功效，不是简单“取其一用”。',
        },
        { label: '相反', text: '两不相合；同用增毒或产生不良反应。' },
      ],
      note:
        '相畏与相杀是同一配伍关系的两个角度；七情讲配伍，不是药物分类。',
      kindLabel: '原文 + 教材归纳',
      citationIds: [
        'src-shennong-bencaojing-xulu',
        'src-bencao-beyao-yaoxing',
        'src-zhongyaoxue',
      ],
    },
  ],
  closing: '本页只整理药性理论的阅读框架，不构成处方或自行用药依据。',
}
