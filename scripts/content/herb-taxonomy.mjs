export const herbTaxonomy = {
  ranks: [
    {
      id: 'upper',
      title: '上经',
      subtitle: '益气延年养生',
      description:
        '《神农本草经》序录以上药为君，主养命以应天，无毒，多服久服不伤人；本栏按“益气延年养生”作阅读标签。',
      citationIds: ['src-shennong-bencaojing-xulu'],
    },
    {
      id: 'middle',
      title: '中经',
      subtitle: '治病',
      description:
        '《神农本草经》序录以中药为臣，主养性以应人，无毒有毒，斟酌其宜；本栏按“治病”作阅读标签。',
      citationIds: ['src-shennong-bencaojing-xulu'],
    },
    {
      id: 'lower',
      title: '下经',
      subtitle: '治大病或有微毒',
      description:
        '《神农本草经》序录以下药为佐使，主治病以应地，多毒，不可久服；本栏按“治大病或有微毒”作阅读标签。',
      citationIds: ['src-shennong-bencaojing-xulu'],
    },
  ],
  categories: [
    {
      id: 'exterior',
      title: '解表药',
      description: '发散表邪，解除表证。',
      pending: [],
    },
    {
      id: 'clear-heat',
      title: '清热药',
      description: '清泄里热，凉血解毒。',
      pending: [],
    },
    {
      id: 'purgative',
      title: '泻下药',
      description: '通利大便，攻逐水饮。',
      pending: ['大黄', '芒硝'],
    },
    {
      id: 'wind-damp',
      title: '祛风去湿利水药',
      description: '祛风除湿，通利水道。',
      pending: ['白术', '茯苓'],
    },
    {
      id: 'qi-digest',
      title: '理气消食药',
      description: '疏理气机，消食化积。',
      pending: [],
    },
    {
      id: 'stop-bleeding',
      title: '止血凉血药',
      description: '制止出血，清解血热。',
      pending: [],
    },
    {
      id: 'blood-moving',
      title: '活血化瘀药',
      description: '活血通经，散瘀止痛。',
      pending: ['川芎', '丹参'],
    },
    {
      id: 'cough-phlegm',
      title: '止咳平喘化痰药',
      description: '止咳平喘，化痰利咽。',
      pending: [],
    },
    {
      id: 'warm-tonic',
      title: '温中补虚药',
      description: '温中散寒，补益虚损。',
      pending: [],
    },
    {
      id: 'astringent',
      title: '收敛固涩药',
      description: '收敛固涩，止汗止泻。',
      pending: [],
    },
    {
      id: 'calm-open',
      title: '安神开窍药',
      description: '安神定志，开窍醒神。',
      pending: ['远志', '石菖蒲'],
    },
    {
      id: 'attack-cold',
      title: '攻坚去实去寒药',
      description: '攻逐坚积，去实散寒。',
      pending: ['细辛'],
    },
  ],
  assignments: {
    gancao: { rankId: 'upper', categoryIds: ['warm-tonic', 'cough-phlegm'] },
    guizhi: { rankId: 'upper', categoryIds: ['exterior'] },
    baishao: { rankId: 'middle', categoryIds: ['astringent'] },
    shengjiang: { rankId: 'middle', categoryIds: ['exterior', 'warm-tonic', 'cough-phlegm'] },
    dazao: { rankId: 'upper', categoryIds: ['warm-tonic', 'calm-open'] },
    chaihu: { rankId: 'upper', categoryIds: ['exterior', 'qi-digest'] },
    huangqin: { rankId: 'middle', categoryIds: ['clear-heat', 'stop-bleeding'] },
    banxia: { rankId: 'lower', categoryIds: ['qi-digest', 'cough-phlegm', 'attack-cold'] },
    renshen: { rankId: 'upper', categoryIds: ['warm-tonic', 'calm-open'] },
  },
  note: '三经名目见《神农本草经》序录；十二个功效分类是本站导航标签，不是《神农本草经》原文，具体药物归入需逐条核对。',
}
