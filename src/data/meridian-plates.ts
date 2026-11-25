export interface PlateHotspot {
  id: string
  /** 图上已印穴名的中心点，归一化到 0–1 */
  x: number
  y: number
  /** 人体上穴位圆点的位置，用于悬停或选中时高亮 */
  dotX?: number
  dotY?: number
  /** 穴名热区大小，归一化到 0–1 */
  w: number
  h: number
  /** 原图未印穴名时，在热区位置叠加可见穴名标签 */
  showLabel?: boolean
}

export interface MeridianPlateOverview {
  viscera: string
  indications: string
  fiveShu: Array<{ id: string; name: string; label: string }>
  note: string
  citationIds: string[]
}

export interface MeridianPlate {
  id: string
  image: string
  width: number
  height: number
  title: string
  label: string
  seal: string
  countLabel: string
  flow?: string
  tipSide?: 'left' | 'right'
  /** 悬停卡片显示完整字段（定位、主治、针刺、艾灸、安全、出处） */
  detailedTips?: boolean
  /** 可选的经络循行线，点坐标为图像像素 [x, y]，可分段 */
  routes?: Array<Array<[number, number]>>
  /** 在 dotX/dotY 处常驻显示发光圆点 */
  glowDots?: boolean
  /** 发光点直径（CSS px），默认 9px；图版自带光点较小时可调小 */
  glowSize?: number
  /** 额外光点，坐标归一化到 0–1 */
  extraGlows?: Array<{ x: number; y: number }>
  /** 不属于本经、但需要在图上注明的文字标签，坐标归一化到 0–1 */
  extraLabels?: Array<{ text: string; x: number; y: number }>
  credit: string
  hotspots: PlateHotspot[]
  overview: MeridianPlateOverview
}

const KW = 2000
const KH = 1126
const LW = 1200
const LH = 1125
const LIW = 1460
const LIH = 1117
const SW = 2000
const SH = 1126
const HW = 2000
const HH = 1073
const SIW = 2000
const SIH = 1129
const SPW = 2000
const SPH = 1133
const PW = 2000
const PH = 1125
const GBW = 2000
const GBH = 1129
const LVW = 1545
const LVH = 1641
const RW = 2000
const RH = 1382
const DUW = 1272
const DUH = 875
const SJW = 2000
const SJH = 1123
const BLW = 2000
const BLH = 1126

function spotAt(
  id: string,
  x: number,
  y: number,
  dotX: number | undefined,
  dotY: number | undefined,
  w: number,
  h: number,
  width: number,
  height: number,
  showLabel = false,
): PlateHotspot {
  return {
    id,
    x: x / width,
    y: y / height,
    ...(dotX !== undefined && dotY !== undefined
      ? { dotX: dotX / width, dotY: dotY / height }
      : {}),
    w: w / width,
    h: h / height,
    ...(showLabel ? { showLabel: true } : {}),
  }
}

function kidneySpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 64,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, KW, KH, showLabel)
}

function pericardiumSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 64,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, PW, PH, showLabel)
}

function lungSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 58,
  h = 28,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, LW, LH)
}

function liSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 52,
  h = 24,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, LIW, LIH, showLabel)
}

function stomachSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 60,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, SW, SH, showLabel)
}

function heartSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 62,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, HW, HH, showLabel)
}

function siSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 62,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, SIW, SIH, showLabel)
}

function spleenSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 62,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, SPW, SPH, showLabel)
}

function gbSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 62,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, GBW, GBH, showLabel)
}

function renSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 60,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, RW, RH, showLabel)
}

function liverSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 62,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, LVW, LVH, showLabel)
}

function duSpot(
  id: string,
  x: number,
  y: number,
  w = 70,
  h = 30,
): PlateHotspot {
  // 督脉图上已印穴名，热区直接覆盖文字；dot 与标签同位，避免组件再画引线。
  return spotAt(id, x, y, x, y, w, h, DUW, DUH)
}

function duPoint(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 70,
  h = 30,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, DUW, DUH, showLabel)
}

function sjSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 62,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, SJW, SJH, showLabel)
}

function bladderSpot(
  id: string,
  x: number,
  y: number,
  dotX: number,
  dotY: number,
  w = 62,
  h = 26,
  showLabel = true,
): PlateHotspot {
  return spotAt(id, x, y, dotX, dotY, w, h, BLW, BLH, showLabel)
}

export const meridianPlates: Record<string, MeridianPlate> = {
  kidney: {
    id: 'kidney',
    image: '/images/acupuncture/kidney-meridian.jpg',
    width: KW,
    height: KH,
    title: '足少阴肾经',
    label: '足少阴肾经',
    seal: '肾',
    countLabel: '凡二十七穴',
    flow: '酉时（17:00–19:00）',
    tipSide: 'left',
    credit: '图版由用户制作并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      kidneySpot('KI1', 700, 1110, 430, 1075),
      kidneySpot('KI2', 700, 1075, 480, 1025),
      kidneySpot('KI3', 700, 1040, 535, 995),
      kidneySpot('KI4', 700, 1005, 560, 982),
      kidneySpot('KI5', 700, 970, 548, 1000),
      kidneySpot('KI6', 700, 935, 520, 988),
      kidneySpot('KI7', 700, 900, 525, 930),
      kidneySpot('KI8', 700, 865, 545, 915),
      kidneySpot('KI9', 700, 800, 545, 790),
      kidneySpot('KI10', 700, 380, 510, 350),
      kidneySpot('KI11', 1320, 770, 1540, 520),
      kidneySpot('KI12', 1320, 735, 1542, 503),
      kidneySpot('KI13', 1320, 700, 1544, 486),
      kidneySpot('KI14', 1320, 665, 1546, 469),
      kidneySpot('KI15', 1320, 630, 1548, 452),
      kidneySpot('KI16', 1200, 595, 1550, 435),
      kidneySpot('KI17', 1200, 560, 1552, 418),
      kidneySpot('KI18', 1200, 525, 1554, 401),
      kidneySpot('KI19', 1200, 490, 1556, 384),
      kidneySpot('KI20', 1200, 455, 1558, 367),
      kidneySpot('KI21', 1200, 420, 1560, 350),
      kidneySpot('KI22', 1080, 440, 1572, 333),
      kidneySpot('KI23', 1080, 400, 1574, 316),
      kidneySpot('KI24', 1080, 360, 1576, 299),
      kidneySpot('KI25', 1080, 320, 1578, 282),
      kidneySpot('KI26', 1080, 280, 1580, 265),
      kidneySpot('KI27', 1080, 240, 1580, 248),
    ],
    overview: {
      viscera: '属肾，络膀胱；上贯肝膈，入肺，挟舌本。',
      indications:
        '主治妇科、前阴病及肾、肺、咽喉病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'KI1', name: '涌泉', label: '井木' },
        { id: 'KI2', name: '然谷', label: '荥火' },
        { id: 'KI3', name: '太溪', label: '输土 · 原' },
        { id: 'KI7', name: '复溜', label: '经金' },
        { id: 'KI10', name: '阴谷', label: '合水' },
      ],
      note:
        '肾经腧穴多用于泌尿生殖、妇科及咽喉、腰部病证。胸腹部穴位不可深刺，孕期慎用；具体操作须由执业中医师完成。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  lung: {
    id: 'lung',
    image: '/images/acupuncture/lung-meridian.jpg',
    width: LW,
    height: LH,
    title: '手太阴肺经',
    label: '手太阴肺经',
    seal: '肺',
    countLabel: '凡十一穴',
    flow: '寅时（03:00–05:00）',
    tipSide: 'left',
    credit: '图版由用户自制并提供，用于本站学习展示。',
    hotspots: [
      lungSpot('LU1', 538, 695, 520, 650),
      lungSpot('LU2', 430, 576, 520, 610, 62, 30),
      lungSpot('LU3', 357, 665, 465, 675),
      lungSpot('LU4', 347, 718, 440, 740),
      lungSpot('LU5', 310, 795, 405, 825),
      lungSpot('LU6', 265, 892, 347, 950),
      lungSpot('LU7', 202, 946, 300, 982),
      // 图上未单独印“经渠”二字，热区落在腕部圆点上。
      lungSpot('LU8', 282, 1020, 282, 1020, 30, 26),
      lungSpot('LU9', 240, 985, 287, 1000),
      lungSpot('LU10', 165, 1003, 232, 1037, 52, 26),
      lungSpot('LU11', 104, 1042, 180, 1057, 52, 26),
    ],
    overview: {
      viscera:
        '属肺，络大肠；起于中焦，下络大肠，还循胃口，上膈属肺，从肺系横出腋下。',
      indications:
        '主治咳嗽、气喘、咯血、胸痛、咽喉痛等肺系病证，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'LU11', name: '少商', label: '井木' },
        { id: 'LU10', name: '鱼际', label: '荥火' },
        { id: 'LU9', name: '太渊', label: '输土 · 原' },
        { id: 'LU8', name: '经渠', label: '经金' },
        { id: 'LU5', name: '尺泽', label: '合水' },
      ],
      note:
        '肺经腧穴多用于咳嗽、气喘、咽喉及胸肺病证。胸背部穴位不可深刺，具体操作须由执业中医师完成。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  'large-intestine': {
    id: 'large-intestine',
    image: '/images/acupuncture/large-intestine-meridian.jpg',
    width: LIW,
    height: LIH,
    title: '手阳明大肠经',
    label: '手阳明大肠经',
    seal: '肠',
    countLabel: '凡二十穴',
    flow: '卯时（05:00–07:00）',
    tipSide: 'right',
    glowDots: true,
    glowSize: 2.5,
    routes: [
      // 左下左手食指放大图：商阳 → 二间 → 三间 → 合谷 → 前臂
      [
        [145, 693],
        [182, 715],
        [227, 746],
        [270, 780],
        [296, 800],
        [315, 815],
        [330, 830],
        [340, 841],
        [345, 880],
        [366, 903],
        [352, 936],
        [395, 1000],
        [440, 1046],
        [490, 1094],
        [510, 1110],
      ],
      // 右侧正面图：迎香 → 颈肩 → 臂外侧 → 阳溪 → 食指端
      [
        [940, 316],
        [958, 330],
        [978, 344],
        [990, 362],
        [1010, 390],
        [1012, 414],
        [1060, 432],
        [1112, 458],
        [1132, 478],
        [1148, 520],
        [1155, 560],
        [1160, 600],
        [1170, 645],
        [1163, 680],
        [1176, 708],
        [1188, 719],
        [1181, 745],
        [1195, 770],
        [1206, 820],
        [1216, 860],
        [1224, 905],
        [1238, 945],
        [1250, 985],
        [1260, 1030],
        [1262, 1075],
      ],
    ],
    credit:
      '图版由用户自制并提供，用于本站学习展示；穴位与经络循行线按用户标注校正，蓝线为示意。',
    hotspots: [
      // 左下为左手食指放大图，原图已印“商阳”“合谷”；二间、三间按用户白点校正。
      // 商阳、合谷保留图上原印穴名，dot 以红线端点/原图光点为准（商阳 145,693；合谷小光点 366,903）。
      liSpot('LI1', 70, 655, 145, 693, 58, 28, false),
      liSpot('LI2', 410, 737, 315, 815, 48, 22),
      liSpot('LI3', 410, 785, 340, 841, 48, 22),
      liSpot('LI4', 440, 880, 366, 903, 58, 28, false),
      // 前臂—上臂：穴名统一外移到右侧空白列 x=1368，自上而下按解剖顺序每 39px 错开，避免压住蓝色经络线。
      liSpot('LI15', 1368, 500, 1112, 458, 64, 24),
      liSpot('LI14', 1368, 539, 1155, 500, 64, 24),
      liSpot('LI13', 1368, 578, 1160, 600, 64, 24),
      liSpot('LI12', 1368, 617, 1170, 645, 64, 24),
      liSpot('LI11', 1368, 656, 1163, 680, 64, 24),
      liSpot('LI10', 1368, 695, 1188, 719, 64, 24),
      liSpot('LI9', 1368, 734, 1181, 745, 64, 24),
      liSpot('LI8', 1368, 773, 1201, 770, 64, 24),
      liSpot('LI7', 1368, 812, 1206, 820, 64, 24),
      liSpot('LI6', 1368, 851, 1216, 860, 64, 24),
      liSpot('LI5', 1368, 890, 1224, 905, 64, 24),
      // 面颊—颈部：穴名移到头部右侧空白列 x=1188，纵向错开，不压脸/颈线与肩线。
      liSpot('LI20', 1188, 292, 940, 316, 58, 24),
      liSpot('LI19', 1188, 327, 958, 330, 64, 24),
      liSpot('LI18', 1188, 362, 990, 362, 58, 24),
      liSpot('LI17', 1188, 397, 1010, 390, 58, 24),
      liSpot('LI16', 1188, 432, 1012, 414, 58, 24),
    ],
    overview: {
      viscera:
        '属大肠，络肺；起于食指桡侧端，沿上肢外侧前缘上行，经肩、颈至面部，止于对侧鼻旁。',
      indications:
        '主治头面、五官、咽喉病，热病，肠胃病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'LI1', name: '商阳', label: '井金' },
        { id: 'LI2', name: '二间', label: '荥水' },
        { id: 'LI3', name: '三间', label: '输木' },
        { id: 'LI5', name: '阳溪', label: '经火' },
        { id: 'LI11', name: '曲池', label: '合土' },
      ],
      note:
        '大肠经腧穴多用于头面五官、咽喉、热病及肠腑病证。颈胸部穴位不可深刺，具体操作须由执业中医师完成。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  stomach: {
    id: 'stomach',
    image: '/images/acupuncture/stomach-meridian.jpg',
    width: SW,
    height: SH,
    title: '足阳明胃经',
    label: '足阳明胃经',
    seal: '胃',
    countLabel: '凡四十五穴',
    flow: '辰时（07:00–09:00）',
    tipSide: 'right',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      // 头面部
      stomachSpot('ST1', 110, 515, 284, 533),
      stomachSpot('ST2', 110, 555, 282, 555),
      stomachSpot('ST3', 110, 620, 285, 631),
      stomachSpot('ST4', 110, 700, 284, 704),
      stomachSpot('ST8', 555, 310, 420, 312),
      stomachSpot('ST7', 560, 575, 444, 569),
      stomachSpot('ST6', 560, 675, 435, 670),
      stomachSpot('ST5', 560, 750, 388, 734),
      stomachSpot('ST9', 600, 860, 520, 850),
      // 躯干左栏
      stomachSpot('ST10', 710, 470, 930, 487),
      stomachSpot('ST11', 710, 520, 921, 512),
      stomachSpot('ST12', 710, 570, 914, 542),
      stomachSpot('ST13', 710, 620, 910, 568),
      stomachSpot('ST14', 710, 670, 907, 594),
      // 躯干右栏上
      stomachSpot('ST15', 1210, 560, 907, 622),
      stomachSpot('ST16', 1210, 620, 907, 664),
      stomachSpot('ST17', 1210, 680, 910, 693),
      stomachSpot('ST18', 1210, 740, 930, 715),
      // 躯干右栏中
      stomachSpot('ST19', 1270, 810, 957, 737),
      stomachSpot('ST20', 1270, 860, 959, 763),
      stomachSpot('ST21', 1270, 910, 960, 784),
      stomachSpot('ST22', 1270, 960, 960, 810),
      stomachSpot('ST23', 1270, 1010, 961, 838),
      stomachSpot('ST24', 1270, 1060, 962, 869),
      // 躯干右下腹，移到左侧空栏，避免与上组垂直重叠
      stomachSpot('ST25', 710, 850, 961, 895),
      stomachSpot('ST26', 710, 900, 961, 928),
      stomachSpot('ST27', 710, 950, 962, 957),
      stomachSpot('ST28', 710, 1000, 960, 973),
      stomachSpot('ST29', 710, 1050, 961, 999),
      stomachSpot('ST30', 710, 1100, 961, 1021),
      // 腿左栏
      stomachSpot('ST31', 1405, 240, 1547, 234),
      stomachSpot('ST32', 1405, 330, 1564, 354),
      stomachSpot('ST33', 1405, 420, 1586, 460),
      stomachSpot('ST34', 1405, 500, 1599, 511),
      stomachSpot('ST35', 1405, 575, 1585, 562),
      stomachSpot('ST36', 1405, 650, 1567, 639),
      stomachSpot('ST37', 1405, 725, 1568, 706),
      // 腿右栏
      stomachSpot('ST38', 1740, 720, 1571, 749),
      stomachSpot('ST39', 1740, 774, 1577, 809),
      stomachSpot('ST40', 1740, 828, 1586, 860),
      stomachSpot('ST41', 1740, 882, 1602, 927),
      stomachSpot('ST42', 1740, 936, 1603, 965),
      stomachSpot('ST43', 1740, 990, 1586, 997),
      stomachSpot('ST44', 1740, 1044, 1575, 1021),
      stomachSpot('ST45', 1740, 1098, 1565, 1047),
    ],
    overview: {
      viscera:
        '属胃，络脾；起于鼻旁，上行至额，下行经颈、胸、腹至下肢外侧前缘，止于第2趾外侧端。',
      indications:
        '主治胃肠病、头面五官病、神志病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'ST45', name: '厉兑', label: '井金' },
        { id: 'ST44', name: '内庭', label: '荥水' },
        { id: 'ST43', name: '陷谷', label: '输木' },
        { id: 'ST41', name: '解溪', label: '经火' },
        { id: 'ST36', name: '足三里', label: '合土' },
      ],
      note:
        '胃经腧穴多用于胃肠、头面及神志病证。胸腹部穴位不可深刺，孕期慎用；具体操作须由执业中医师完成。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  heart: {
    id: 'heart',
    image: '/images/acupuncture/heart-meridian.jpg',
    width: HW,
    height: HH,
    title: '手少阴心经',
    label: '手少阴心经',
    seal: '心',
    countLabel: '凡九穴',
    flow: '午时（11:00–13:00）',
    tipSide: 'left',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      heartSpot('HT1', 610, 580, 822, 575),
      heartSpot('HT2', 610, 640, 812, 636),
      heartSpot('HT3', 610, 700, 794, 693),
      heartSpot('HT4', 610, 780, 719, 884),
      heartSpot('HT5', 610, 830, 715, 893),
      heartSpot('HT6', 610, 880, 712, 902),
      heartSpot('HT7', 610, 930, 707, 911),
      heartSpot('HT8', 610, 980, 695, 958),
      heartSpot('HT9', 610, 1030, 680, 1025),
    ],
    overview: {
      viscera:
        '属心，络小肠；起于心中，出属心系，下膈络小肠，其支脉上挟咽、系目系，直行者从心系上肺、出腋下，沿上肢内侧后缘至小指桡侧端。',
      indications:
        '主治心痛、心悸、怔忡、失眠、健忘、癫狂痫等心神病证，以及胸胁、上肢内侧病证。',
      fiveShu: [
        { id: 'HT9', name: '少冲', label: '井木' },
        { id: 'HT8', name: '少府', label: '荥火' },
        { id: 'HT7', name: '神门', label: '输土·原' },
        { id: 'HT4', name: '灵道', label: '经金' },
        { id: 'HT3', name: '少海', label: '合水' },
      ],
      note:
        '心经腧穴多用于心神、胸胁及上肢内侧病证。腋部、腕部血管神经丰富，须由执业中医师操作。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  'small-intestine': {
    id: 'small-intestine',
    image: '/images/acupuncture/small-intestine-meridian.jpg',
    width: SIW,
    height: SIH,
    title: '手太阳小肠经',
    label: '手太阳小肠经',
    seal: '肠',
    countLabel: '凡十九穴',
    flow: '未时（13:00–15:00）',
    tipSide: 'right',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      siSpot('SI19', 900, 600, 574, 613),
      siSpot('SI18', 900, 660, 540, 662),
      siSpot('SI17', 900, 720, 620, 678),
      siSpot('SI16', 900, 780, 600, 790),
      siSpot('SI15', 1880, 295, 1520, 315),
      siSpot('SI14', 1880, 345, 1495, 345),
      siSpot('SI13', 1880, 395, 1498, 388),
      siSpot('SI12', 1880, 445, 1545, 380),
      siSpot('SI11', 1880, 495, 1540, 450),
      siSpot('SI10', 1880, 545, 1585, 435),
      siSpot('SI9', 1880, 595, 1590, 500),
      siSpot('SI8', 1880, 700, 1678, 725),
      siSpot('SI7', 1880, 760, 1690, 845),
      siSpot('SI6', 1880, 820, 1696, 900),
      siSpot('SI5', 1880, 880, 1708, 948),
      siSpot('SI4', 1880, 930, 1700, 972),
      siSpot('SI3', 1880, 980, 1710, 998),
      siSpot('SI2', 1880, 1030, 1722, 1020),
      siSpot('SI1', 1880, 1080, 1748, 1046),
    ],
    overview: {
      viscera:
        '属小肠，络心；起于小指尺侧端，沿上肢外侧后缘上行，经肩胛、颈侧至面颊，止于耳前。',
      indications:
        '主治头项、耳目、咽喉病，热病、神志病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'SI1', name: '少泽', label: '井金' },
        { id: 'SI2', name: '前谷', label: '荥水' },
        { id: 'SI3', name: '后溪', label: '输木' },
        { id: 'SI5', name: '阳谷', label: '经火' },
        { id: 'SI8', name: '小海', label: '合土' },
      ],
      note:
        '小肠经腧穴多用于头项、耳目、咽喉及肩胛上肢病证。颈部、肩胛部血管神经丰富，胸背部不宜深刺，须由执业中医师操作。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  spleen: {
    id: 'spleen',
    image: '/images/acupuncture/spleen-meridian.jpg',
    width: SPW,
    height: SPH,
    title: '足太阴脾经',
    label: '足太阴脾经',
    seal: '脾',
    countLabel: '凡二十一穴',
    flow: '巳时（09:00–11:00）',
    tipSide: 'right',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      // 左图：足内侧至小腿
      spleenSpot('SP1', 150, 1060, 290, 1053),
      spleenSpot('SP2', 150, 1010, 336, 1016),
      spleenSpot('SP3', 150, 960, 356, 989),
      spleenSpot('SP4', 150, 910, 401, 965),
      spleenSpot('SP5', 150, 860, 451, 930),
      spleenSpot('SP6', 150, 700, 550, 700),
      spleenSpot('SP7', 150, 600, 525, 590),
      spleenSpot('SP8', 150, 300, 505, 305),
      spleenSpot('SP9', 150, 200, 480, 205),
      // 右图：大腿、腹部
      spleenSpot('SP10', 1250, 780, 1495, 770),
      spleenSpot('SP11', 1250, 720, 1492, 710),
      spleenSpot('SP12', 1250, 660, 1488, 650),
      spleenSpot('SP13', 1250, 600, 1488, 590),
      spleenSpot('SP14', 1250, 545, 1488, 540),
      spleenSpot('SP15', 1250, 490, 1488, 490),
      spleenSpot('SP16', 1250, 435, 1490, 435),
      // 右图：胸外侧，按肋间隙与腋中线校正
      spleenSpot('SP17', 1850, 450, 1495, 400),
      spleenSpot('SP18', 1850, 400, 1512, 378),
      spleenSpot('SP19', 1850, 350, 1535, 355),
      spleenSpot('SP20', 1850, 300, 1560, 332),
      spleenSpot('SP21', 1850, 500, 1585, 430),
    ],
    overview: {
      viscera:
        '属脾，络胃；起于足大趾内侧端，沿下肢内侧前缘上行，入腹属脾络胃，上膈挟咽，连舌本、散舌下；其支者从胃上膈，注心中。',
      indications:
        '主治脾胃病、妇科病、前阴病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'SP1', name: '隐白', label: '井木' },
        { id: 'SP2', name: '大都', label: '荥火' },
        { id: 'SP3', name: '太白', label: '输土 · 原' },
        { id: 'SP5', name: '商丘', label: '经金' },
        { id: 'SP9', name: '阴陵泉', label: '合水' },
      ],
      note:
        '脾经腧穴多用于脾胃、妇科、前阴及水湿病证。胸腹部穴位不可深刺，孕期及膀胱充盈时慎用；具体操作须由执业中医师完成。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  pericardium: {
    id: 'pericardium',
    image: '/images/acupuncture/pericardium-meridian.jpg',
    width: PW,
    height: PH,
    title: '手厥阴心包经',
    label: '手厥阴心包经',
    seal: '包',
    countLabel: '凡九穴',
    flow: '戌时（19:00–21:00）',
    tipSide: 'right',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      // 圆点取图上蓝色光点中心：天池为左胸第4肋间外侧小点，天泉为腋前主光点，
      // 曲泽在肘横纹，郄门/间使/内关依次沿前臂中线，大陵在腕横纹，劳宫在掌心，中冲在中指尖。
      pericardiumSpot('PC1', 75, 230, 146, 149),
      pericardiumSpot('PC2', 500, 200, 235, 106),
      pericardiumSpot('PC3', 650, 405, 406, 437),
      pericardiumSpot('PC4', 650, 505, 527, 671),
      pericardiumSpot('PC5', 650, 570, 566, 728),
      pericardiumSpot('PC6', 650, 635, 595, 764),
      pericardiumSpot('PC7', 720, 725, 624, 800),
      pericardiumSpot('PC8', 720, 790, 715, 907),
      pericardiumSpot('PC9', 830, 970, 837, 1063),
    ],
    overview: {
      viscera:
        '属心包，络三焦；起于胸中，出属心包络，下膈历络三焦；其支者循胸出胁，上抵腋下，沿上肢内侧中线下行，入掌中，至中指端。',
      indications:
        '主治心痛、心悸、胸闷、呕吐、胃痛、癫狂痫等心包、心神病证，以及胸胁、上肢内侧病证。',
      fiveShu: [
        { id: 'PC9', name: '中冲', label: '井木' },
        { id: 'PC8', name: '劳宫', label: '荥火' },
        { id: 'PC7', name: '大陵', label: '输土 · 原' },
        { id: 'PC5', name: '间使', label: '经金' },
        { id: 'PC3', name: '曲泽', label: '合水' },
      ],
      note:
        '心包经腧穴多用于心胸、胃及神志病证。胸部穴位不可深刺，以防气胸；腕掌部血管神经丰富，具体操作须由执业中医师完成。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  gallbladder: {
    id: 'gallbladder',
    image: '/images/acupuncture/gallbladder-meridian.jpg',
    width: GBW,
    height: GBH,
    title: '足少阳胆经',
    label: '足少阳胆经',
    seal: '胆',
    countLabel: '重点十九穴',
    flow: '子时（23:00–01:00）',
    tipSide: 'right',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正，仅标常用重点穴。',
    hotspots: [
      gbSpot('GB14', 100, 410, 375, 470),
      gbSpot('GB1', 100, 490, 385, 545),
      gbSpot('GB8', 1020, 430, 620, 520),
      gbSpot('GB2', 1020, 620, 505, 640),
      gbSpot('GB12', 1020, 700, 735, 695),
      gbSpot('GB20', 1020, 790, 760, 790),
      gbSpot('GB21', 1250, 250, 1510, 275),
      gbSpot('GB24', 1250, 430, 1490, 440),
      gbSpot('GB25', 1250, 500, 1465, 520),
      gbSpot('GB26', 1250, 560, 1470, 570),
      gbSpot('GB30', 1250, 700, 1515, 700),
      gbSpot('GB31', 1750, 780, 1540, 780),
      gbSpot('GB34', 1750, 880, 1535, 880),
      gbSpot('GB35', 1750, 940, 1545, 940),
      gbSpot('GB37', 1870, 970, 1540, 990),
      gbSpot('GB39', 1750, 1010, 1545, 1020),
      gbSpot('GB40', 1880, 1040, 1560, 1055),
      gbSpot('GB41', 1750, 1065, 1575, 1085),
      gbSpot('GB44', 1900, 1110, 1600, 1105),
    ],
    overview: {
      viscera:
        '属胆，络肝；起于目外眦，上行头角，下耳后，沿颈、肩、胁、髋及下肢外侧下行，止于第4趾外侧端。',
      indications:
        '主治肝胆病、侧头、目、耳、咽喉病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'GB44', name: '足窍阴', label: '井金' },
        { id: 'GB43', name: '侠溪', label: '荥水' },
        { id: 'GB41', name: '足临泣', label: '输木' },
        { id: 'GB38', name: '阳辅', label: '经火' },
        { id: 'GB34', name: '阳陵泉', label: '合土' },
      ],
      note:
        '胆经腧穴多用于肝胆、侧头、目耳及下肢外侧病证。眼区、耳周、颈项及胸胁部穴位不可深刺；本图仅标常用重点穴，未标注穴位可在目录中查看。具体操作须由执业中医师完成。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  liver: {
    id: 'liver',
    image: '/images/acupuncture/liver-meridian.jpg',
    width: LVW,
    height: LVH,
    title: '足厥阴肝经',
    label: '足厥阴肝经',
    seal: '肝',
    countLabel: '凡十四穴',
    flow: '丑时（01:00–03:00）',
    tipSide: 'right',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      liverSpot('LR14', 1280, 640, 855, 665),
      liverSpot('LR13', 1280, 710, 825, 760),
      liverSpot('LR12', 1280, 780, 830, 910),
      liverSpot('LR11', 1280, 850, 845, 960),
      liverSpot('LR10', 1280, 920, 845, 1000),
      liverSpot('LR9', 1280, 990, 840, 1100),
      liverSpot('LR8', 1280, 1060, 845, 1160),
      liverSpot('LR7', 1280, 1130, 850, 1200),
      liverSpot('LR6', 1280, 1200, 845, 1260),
      liverSpot('LR5', 1280, 1270, 840, 1330),
      liverSpot('LR4', 300, 1420, 800, 1520),
      liverSpot('LR3', 300, 1480, 750, 1540),
      liverSpot('LR2', 300, 1540, 700, 1570),
      liverSpot('LR1', 300, 1600, 650, 1600),
    ],
    overview: {
      viscera:
        '属肝，络胆；起于足大趾外侧端，沿下肢内侧上行，绕阴器，入小腹，挟胃属肝络胆，上贯膈，布胁肋，连目系，上出额，与督脉会于巅；其支者从目系下颊里，环唇内。',
      indications:
        '主治肝胆病、妇科病、前阴病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'LR1', name: '大敦', label: '井木' },
        { id: 'LR2', name: '行间', label: '荥火' },
        { id: 'LR3', name: '太冲', label: '输土·原' },
        { id: 'LR4', name: '中封', label: '经金' },
        { id: 'LR8', name: '曲泉', label: '合水' },
      ],
      note:
        '肝经腧穴多用于肝胆、妇科、前阴及小腹病证。胸胁部穴位不可深刺；腹股沟、腘窝及踝部血管神经丰富，具体操作须由执业中医师完成。图上蓝线为示意，穴位以解剖标志和 GB/T 12346-2021 为准。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  ren: {
    id: 'ren',
    image: '/images/acupuncture/ren-meridian.jpg',
    width: RW,
    height: RH,
    title: '任脉',
    label: '任脉',
    seal: '任',
    countLabel: '图上二十三穴',
    tipSide: 'right',
    credit: '图版由用户自制并提供，用于本站学习展示；穴位标注按解剖关系校正。',
    hotspots: [
      renSpot('REN24', 1700, 355, 1090, 355),
      renSpot('REN23', 300, 405, 1090, 405),
      renSpot('REN22', 1700, 475, 1090, 475),
      renSpot('REN21', 300, 560, 1090, 560),
      renSpot('REN20', 1700, 620, 1090, 620),
      renSpot('REN19', 300, 680, 1090, 680),
      renSpot('REN18', 1700, 735, 1090, 735),
      renSpot('REN17', 300, 785, 1090, 785),
      renSpot('REN16', 1700, 825, 1090, 825),
      renSpot('REN15', 300, 865, 1090, 865),
      renSpot('REN14', 1700, 905, 1090, 905),
      renSpot('REN13', 300, 955, 1090, 955),
      renSpot('REN12', 1700, 1000, 1090, 1000),
      renSpot('REN11', 300, 1040, 1090, 1040),
      renSpot('REN10', 1700, 1060, 1090, 1060),
      renSpot('REN9', 300, 1090, 1090, 1090),
      renSpot('REN8', 1700, 1110, 1090, 1110),
      renSpot('REN7', 300, 1145, 1090, 1145),
      renSpot('REN6', 1700, 1170, 1090, 1170),
      renSpot('REN5', 300, 1195, 1090, 1195),
      renSpot('REN4', 1700, 1220, 1090, 1220),
      renSpot('REN3', 300, 1245, 1090, 1245),
      renSpot('REN2', 1700, 1270, 1090, 1270),
    ],
    overview: {
      viscera:
        '起于胞中，下出会阴，沿腹胸正中线上行，至下颌承浆，环唇入目下。',
      indications:
        '主治腹、胸、颈、头面部局部病证，以及相应内脏病证；任脉为“阴脉之海”，与生殖、泌尿、妇科关系密切。',
      fiveShu: [],
      note:
        '任脉不属五输穴。会阴（CV1）不在本图画面内，未标注；下腹至耻骨区被腰布遮挡，曲骨（CV2）为示意位置。图上蓝线为示意，穴位以解剖标志和 GB/T 12346-2021 为准；胸腹部穴位不可深刺，孕期慎用。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  du: {
    id: 'du',
    image: '/images/acupuncture/du-meridian.jpg',
    width: DUW,
    height: DUH,
    title: '督脉',
    label: '督脉',
    seal: '督',
    countLabel: '图上二十八穴',
    tipSide: 'right',
    detailedTips: true,
    credit:
      '图版由用户制作并提供，用于本站学习展示；穴名位置按用户标注，龈交以右下唇特写红箭头所指上唇系带为准。',
    glowSize: 4,
    routes: [
      [
        [425, 590],
        [425, 619],
        [425, 690],
        [425, 750],
      ],
    ],
    extraGlows: [
      { x: 425 / 1272, y: 690 / 875 },
      { x: 425 / 1272, y: 750 / 875 },
      { x: 1008 / 1272, y: 620 / 875 },
    ],
    extraLabels: [{ text: '会阴（任脉）', x: 575 / 1272, y: 775 / 875 }],
    hotspots: [
      // 面部“龈交”标签保留在原位，引线指向右下唇特写的上唇系带。
      duPoint('DU28', 838, 463, 1025, 620, 70, 24),
      // 面部（右中面板）已印穴名
      duSpot('DU25', 838, 376, 70, 24),
      duSpot('DU26', 838, 407, 70, 24),
      duSpot('DU27', 838, 437, 70, 24),
      // 头顶（右上小图）已印穴名
      duSpot('DU21', 838, 123, 70, 24),
      duSpot('DU22', 838, 150, 70, 24),
      duSpot('DU23', 838, 178, 70, 24),
      duSpot('DU24', 838, 206, 70, 24),
      // 背部右栏已印穴名
      duSpot('DU20', 653, 81, 70, 28),
      duSpot('DU19', 653, 111, 70, 28),
      duSpot('DU18', 653, 140, 70, 28),
      duSpot('DU17', 653, 169, 70, 28),
      duSpot('DU16', 653, 199, 70, 28),
      duSpot('DU15', 653, 230, 70, 28),
      duSpot('DU14', 653, 260, 70, 28),
      duSpot('DU13', 653, 290, 70, 28),
      duSpot('DU12', 653, 321, 70, 28),
      duSpot('DU11', 653, 352, 70, 28),
      duSpot('DU10', 653, 382, 70, 28),
      duSpot('DU9', 653, 413, 70, 28),
      // 背部左栏已印穴名
      duSpot('DU8', 95, 458, 70, 28),
      duSpot('DU7', 95, 488, 70, 28),
      duSpot('DU6', 95, 519, 70, 28),
      duSpot('DU5', 95, 549, 70, 28),
      duSpot('DU4', 95, 582, 70, 28),
      duSpot('DU3', 95, 619, 70, 28),
      // 骶尾：长强落尾骨尖，腰俞落骶管裂孔；标签在底部左右两侧，虚线指向中线。
      duPoint('DU1', 257, 730, 425, 750, 100, 36),
      duPoint('DU2', 600, 700, 425, 690, 100, 36),
    ],
    overview: {
      viscera:
        '起于胞中，下出会阴，沿脊柱正中线上行，经项、头顶、额、鼻、人中至上唇系带；为“阳脉之海”，总督一身阳经。',
      indications:
        '主治神志病、热病、腰骶、背、头项局部病证，以及相应内脏病证。',
      fiveShu: [],
      note:
        '长强（GV1）、腰俞（GV2）按图下部红字标注；会阴属任脉，不属督脉，未设热区。督脉不属五输穴。图上蓝线蓝点为示意，穴位以脊柱棘突和解剖标志为准；龈交定位在上唇系带，见右下唇特写；颈项、胸椎及面部穴位不可深刺，须由执业中医师操作。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  bladder: {
    id: 'bladder',
    image: '/images/acupuncture/bladder-meridian.jpg',
    width: BLW,
    height: BLH,
    title: '足太阳膀胱经',
    label: '足太阳膀胱经',
    seal: '膀',
    countLabel: '重点三十二穴',
    flow: '申时（15:00–17:00）',
    tipSide: 'right',
    glowDots: true,
    glowSize: 2.5,
    routes: [
      // 右下肢后侧纠正线：承扶 → 殷门 → 浮郄/委中 → 合阳 → 承筋 → 承山 → 飞扬 → 跗阳 → 昆仑 → 申脉 → 京骨 → 至阴。
      [
        [1501, 676],
        [1503, 700],
        [1505, 736],
        [1509, 760],
        [1512, 783],
        [1508, 790],
        [1504, 796],
        [1505, 810],
        [1506, 822],
        [1506, 840],
        [1507, 861],
        [1507, 880],
        [1507, 900],
        [1512, 906],
        [1516, 912],
        [1514, 935],
        [1511, 963],
        [1509, 982],
        [1508, 1002],
        [1511, 1012],
        [1514, 1022],
        [1522, 1034],
        [1536, 1048],
        [1550, 1058],
        [1568, 1068],
      ],
    ],
    credit:
      '图版由用户自制并提供，用于本站学习原型展示；本图只标常用重点穴，穴位标注按解剖关系校正，再分发需作者同意。',
    hotspots: [
      // 头面与颈项：左侧为脸/头顶放大，右侧全身取颈后天柱。
      bladderSpot('BL1', 330, 305, 555, 290),
      bladderSpot('BL2', 330, 263, 556, 264),
      bladderSpot('BL7', 720, 245, 582, 157),
      bladderSpot('BL10', 1230, 230, 1463, 190),
      // 背俞内线：按棘突下旁开 1.5 寸排列，标签在右侧空白列。
      // 标签纵向间距 42px，避免 1440 宽下图版缩放后上下文字重叠。
      bladderSpot('BL11', 1300, 270, 1474, 278),
      bladderSpot('BL12', 1300, 312, 1476, 296),
      bladderSpot('BL13', 1300, 354, 1477, 315),
      bladderSpot('BL15', 1300, 396, 1476, 361),
      bladderSpot('BL17', 1300, 438, 1475, 400),
      bladderSpot('BL18', 1300, 480, 1472, 449),
      bladderSpot('BL20', 1300, 522, 1471, 480),
      bladderSpot('BL21', 1300, 564, 1471, 497),
      bladderSpot('BL23', 1300, 606, 1473, 540),
      bladderSpot('BL25', 1300, 648, 1474, 580),
      bladderSpot('BL32', 1300, 690, 1488, 635),
      // 背外线与骶部：旁开 3 寸，置信度低于内线。
      bladderSpot('BL43', 1190, 340, 1452, 348),
      bladderSpot('BL52', 1190, 520, 1448, 540),
      bladderSpot('BL54', 1190, 650, 1447, 675),
      // 下肢后侧与足外侧：全部落在右侧全身腿，标签在右侧空白列纵向排开。
      bladderSpot('BL36', 1760, 660, 1501, 676),
      bladderSpot('BL37', 1760, 694, 1505, 736),
      bladderSpot('BL38', 1760, 728, 1512, 783),
      bladderSpot('BL39', 1760, 762, 1516, 796),
      bladderSpot('BL40', 1760, 796, 1504, 796),
      bladderSpot('BL55', 1760, 830, 1506, 822),
      bladderSpot('BL56', 1760, 864, 1507, 861),
      bladderSpot('BL57', 1760, 898, 1507, 900),
      bladderSpot('BL58', 1760, 932, 1516, 912),
      bladderSpot('BL59', 1760, 966, 1511, 963),
      bladderSpot('BL60', 1760, 1000, 1508, 1002),
      // 足部图保留：昆仑与申脉、京骨、至阴一并标在左下独立足部图，方便与右腿比对。
      bladderSpot('BL60', 1040, 850, 657, 869),
      bladderSpot('BL62', 1040, 905, 676, 920),
      bladderSpot('BL64', 1040, 960, 750, 995),
      bladderSpot('BL67', 1040, 1015, 840, 1040),
    ],
    overview: {
      viscera:
        '属膀胱，络肾；起于目内眦，上额交巅，下项夹脊，抵腰络肾属膀胱，下行经臀、下肢后侧至小趾外侧端。',
      indications:
        '主治头项、目、背、腰、下肢病证，以及神志病；背俞穴主治相应脏腑病证。',
      fiveShu: [
        { id: 'BL67', name: '至阴', label: '井金' },
        { id: 'BL60', name: '昆仑', label: '经火' },
        { id: 'BL40', name: '委中', label: '合土' },
        { id: 'BL64', name: '京骨', label: '原穴' },
      ],
      note:
        '本图只标 32 个常用重点穴，未标穴位未逐一列入；背部内线为旁开 1.5 寸、外线为旁开 3 寸，图上两列蓝点间距偏近，标注按解剖关系校正。左下小腿放大图已移除，保留独立足部放大图；下肢穴位落在右侧全身腿，申脉、京骨、至阴落在足部图原位；眼区、颈项、胸背、腘窝及骶部均不可深刺；背部穴位须避免伤及胸膜与肺尖，须由执业中医师操作。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
  'triple-burner': {
    id: 'triple-burner',
    image: '/images/acupuncture/triple-burner-meridian.jpg',
    width: SJW,
    height: SJH,
    title: '手少阳三焦经',
    label: '手少阳三焦经',
    seal: '焦',
    countLabel: '凡二十三穴',
    flow: '亥时（21:00–23:00）',
    tipSide: 'right',
    credit:
      '图版由用户自制并提供，用于本站学习原型展示；穴位标注按解剖关系校正，再分发需作者同意。',
    hotspots: [
      // 左上手臂放大图：手掌向左，指端为无名指尺侧（关冲）。
      // 原图蓝线终点误落在小指，此处按解剖把关冲移到无名指尺侧，余穴沿前臂背侧中线排布。
      sjSpot('SJ1', 100, 180, 66, 469),
      sjSpot('SJ2', 190, 240, 172, 468),
      sjSpot('SJ3', 280, 180, 240, 465),
      sjSpot('SJ4', 370, 240, 331, 435),
      sjSpot('SJ5', 460, 180, 360, 433),
      sjSpot('SJ6', 550, 240, 390, 433),
      sjSpot('SJ7', 640, 180, 433, 433),
      sjSpot('SJ8', 730, 240, 509, 429),
      sjSpot('SJ9', 880, 180, 558, 432),
      sjSpot('SJ10', 910, 240, 694, 414),
      // 右侧背面全身图：肩、臂后外侧。原图蓝线由项后跨肩胛转向臂后外侧，未见向腰的下行线。
      sjSpot('SJ11', 1200, 465, 1374, 414),
      sjSpot('SJ12', 1200, 405, 1383, 371),
      sjSpot('SJ13', 1200, 345, 1386, 313),
      sjSpot('SJ14', 1200, 285, 1394, 271),
      sjSpot('SJ15', 1200, 225, 1452, 238),
      // 左下头颈侧脸：耳后至眉梢。耳周穴位密集，穴名分两列并向上方扇出。
      sjSpot('SJ16', 150, 975, 441, 966),
      sjSpot('SJ17', 150, 900, 473, 875),
      sjSpot('SJ18', 150, 835, 445, 818),
      sjSpot('SJ19', 150, 780, 444, 777),
      sjSpot('SJ20', 300, 650, 522, 758),
      sjSpot('SJ21', 590, 710, 554, 790),
      sjSpot('SJ22', 520, 650, 550, 766),
      sjSpot('SJ23', 720, 640, 599, 738),
    ],
    overview: {
      viscera:
        '属三焦，络心包；起于无名指尺侧端，沿上肢外侧中线上行，经肩、颈、耳后至眉梢。',
      indications:
        '主治头面、耳目、咽喉病，热病，胁肋病，以及经脉循行部位的其他病证。',
      fiveShu: [
        { id: 'SJ1', name: '关冲', label: '井金' },
        { id: 'SJ2', name: '液门', label: '荥水' },
        { id: 'SJ3', name: '中渚', label: '输木' },
        { id: 'SJ6', name: '支沟', label: '经火' },
        { id: 'SJ10', name: '天井', label: '合土' },
      ],
      note:
        '三焦经腧穴多用于头面耳目、咽喉、热病及胁肋病证。耳周、颈部血管神经丰富：耳门、耳和髎、翳风、天牖不可深刺，避免伤及面神经、耳道、颈动脉及颞浅动脉；肩髎、天髎不可向内深刺，避免伤及肺尖；丝竹空在眼周，须浅刺。图上蓝线为示意，手臂末端止点有误，穴位标注已按解剖关系校正，定位以 GB/T 12346-2021 为准。',
      citationIds: ['src-lingshu-jingmai', 'src-zhenjiuxue'],
    },
  },
}
