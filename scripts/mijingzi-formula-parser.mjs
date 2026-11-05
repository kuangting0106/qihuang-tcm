/**
 * 《米晶子济世良方》条文拆方工具。
 *
 * 目标：
 * - 从 OCR 原文中识别“药材 + 用量”；
 * - 把原文拆成“药材及用量 / 煎煮及服用”；
 * - 识别不出的条目只报告，不猜药名、不补功效。
 *
 * 说明：OCR 本错字、异体字和断句都不稳定，本模块只做保守匹配：
 * 只在药材词典中命中时才算药材；没有明确用量时统一标注待定用量。
 */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { herbAliasGroups } from './content/herb-aliases.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const UNDETERMINED_DOSAGE = '用量需根据实际病症情况而定'

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

const catalog = readJson(path.join(root, 'public/data/bencao-lectures/catalog.json'), { items: [] })
const sampleData = readJson(path.join(root, 'public/data/sample_data.json'), { herbs: [] })

/**
 * 补充词典：OCR 常见异写、简写、炮制品名与药引。
 * 只收能确认指向同一味药的名称；不确定的 OCR 残字不强行归类。
 * 每组第一项为规范名，其余为异名（用 | 分隔）。
 */
const SUPPLEMENTAL_GROUPS = [
  ['生地黄', '生地|鲜生地|干生地'],
  ['熟地黄', '熟地|九地'],
  ['山茱萸', '山萸肉|山芋肉|山茱|萸肉'],
  ['玄参', '元参'],
  ['麦冬', '麦门冬|寸冬'],
  ['天冬', '天门冬'],
  ['天花粉', '花粉|栝蒌根|瓜蒌根|瓜萎根'],
  ['茯苓', '云苓|白茯苓|赤茯苓|茯内苓'],
  ['茯神', '朱茯神'],
  ['白术', '贡术|土白术|焦术|真白术'],
  ['白芍', '杭芍|白芍药|芍药'],
  ['当归', '归身|当归身|归尾|全当归'],
  ['川芎', '芎穷'],
  ['黄芪', '炙黄芪|生黄芪|北芪|黄耆'],
  ['甘草', '炙甘草|生甘草|粉甘草|甘草节'],
  ['大枣', '红枣|枣'],
  ['生姜', '鲜姜|姜'],
  ['干姜', '黑姜|炮姜|姜炭|煨姜|炒姜'],
  ['葱白', '老葱|鲜葱|葱头|葱心|大葱|葱'],
  ['大蒜', '蒜|蒜瓣'],
  ['灯心草', '灯心|灯芯草'],
  ['连翘', '连壳'],
  ['金银花', '银花|禹二花|禹根银花'],
  ['枳壳', '积壳'],
  ['枳实', '积实'],
  ['栀子', '山栀子|山枝子|栀仁|黑山栀|黑栀子'],
  ['牛膝', '川牛膝|土牛膝|牛夕'],
  ['续断', '川断'],
  ['秦艽', '秦芃|秦苏|秦九'],
  ['藁本', '蒿本'],
  ['辛夷', '辛黄'],
  ['银柴胡', '银胡'],
  ['羌活', '川羌活'],
  ['防己', '防已|汉防己'],
  ['荆芥', '芥穗|荆芥穗|焦芥穗|荆芥穗炭'],
  ['白芷', '香白芷'],
  ['细辛', '辽细辛'],
  ['苍耳子', '苍耳'],
  ['天麻', '明天麻|冬天麻'],
  ['钩藤', '钩丁|双钩藤'],
  ['全蝎', '全虫|蝎子'],
  ['僵蚕', '僵虫'],
  ['地龙', '地龙子|蚯蚓|红蚯蚓'],
  ['斑蝥', '斑毛|斑蟊'],
  ['土鳖虫', '土鳖|苏土鳖'],
  ['酸枣仁', '枣仁'],
  ['白豆蔻', '白蔻|紫蔻|紫寇'],
  ['肉豆蔻', '肉蔻|煨肉蔻'],
  ['草果', '草果仁'],
  ['草豆蔻', '草寇'],
  ['槟榔', '大白|玉片'],
  ['牵牛子', '二丑|黑丑|白丑|黑白丑|黑丑头末'],
  ['莱菔子', '莱子|萝卜子|五莱子'],
  ['紫苏', '苏叶|苏子'],
  ['白芥子', '芥子'],
  ['葶苈子', '葶苈'],
  ['枸杞子', '枸杞|杞子'],
  ['菟丝子', '丝子'],
  ['金樱子', '金樱花'],
  ['芡实', '白芡'],
  ['莲子', '莲肉|莲子肉|石莲子|白连肉'],
  ['薏苡仁', '薏米|薏苡'],
  ['白扁豆', '扁豆'],
  ['麦芽', '生麦芽|炒麦芽'],
  ['神曲', '建曲'],
  ['山楂', '山楂炭|楂肉'],
  ['木香', '广木香|南木香|青木香'],
  ['香附', '香附子|炙香附|香附米'],
  ['沉香', '海南沉香|海沉香|沉香片'],
  ['檀香', '白檀香|檀香片'],
  ['丁香', '母丁香|公丁香'],
  ['血竭', '血竭花|血力花|血力'],
  ['延胡索', '元胡索|玄胡|元胡'],
  ['五灵脂', '灵脂'],
  ['蒲黄', '炒蒲黄'],
  ['三七', '川七|三七根'],
  ['地榆', '地榆炭'],
  ['槐花', '土槐花'],
  ['侧柏叶', '侧柏'],
  ['白茅根', '鲜茅根|茅根'],
  ['艾叶', '陈艾|端阳陈艾'],
  ['通草', '白通草'],
  ['萹蓄', '扁蓄'],
  ['大黄', '川军|酒军|熟大黄|生大黄'],
  ['朴硝', '皮硝'],
  ['玄明粉', '元明粉'],
  ['硝石', '火硝'],
  ['大青盐', '青盐'],
  ['黄连', '川黄连|川连|酒炒黄连'],
  ['黄芩', '条芩|酒黄芩|枯芩'],
  ['黄柏', '酒炒黄柏'],
  ['龙胆', '龙胆草|胆草'],
  ['石膏', '生石膏'],
  ['芦根', '干芦根'],
  ['竹叶', '淡竹叶'],
  ['竹茹', '生竹茹'],
  ['犀角', '西角'],
  ['冰片', '梅片'],
  ['麝香', '元寸'],
  ['樟脑', '潮脑'],
  ['硼砂', '月石'],
  ['朱砂', '辰砂'],
  ['雄黄', '明雄|雄精'],
  ['银朱', '辛红|银珠'],
  ['白矾', '枯白矾|枯矾|明矾|矾石'],
  ['硫黄', '硫磺|龙黄'],
  ['铅丹', '黄丹|广丹'],
  ['铅粉', '水粉|铅粉|官粉|银粉'],
  ['磁石', '活磁石'],
  ['珍珠', '米珠|珠子'],
  ['石决明', '石决'],
  ['蛤壳', '文蛤|海蛤'],
  ['海螵蛸', '海蝶|乌贼骨'],
  ['鳖甲', '别甲'],
  ['龟甲', '败龟板|龟板'],
  ['生龟', '生龟'],
  ['穿山甲', '山甲|川山甲'],
  ['鹿角霜', '角霜'],
  ['鹿肾', '鹿鞭'],
  ['蛤蚧', '大蛤'],
  ['紫河车', '胎衣'],
  ['血余', '血余炭|发灰'],
  ['人乳', '乳汁'],
  ['鸡子清', '鸡蛋白'],
  ['猪胆', '猪苦胆'],
  ['牛胆', '牛苦胆'],
  ['蜂蜜', '蜂糖'],
  ['白糖', '白沙糖'],
  ['厚朴', '川朴|紫油朴'],
  ['陈皮', '广皮|广陈皮|桔皮|橘皮'],
  ['橘红', '七爪红'],
  ['佩兰', '兰叶'],
  ['半夏', '法半夏|清半夏|炙半夏|半夏曲'],
  ['天南星', '生南星|胆南星|九转胆南星|胆星|南星'],
  ['附子', '附片|制附子|炮附子|大附子|雄附子'],
  ['川乌', '制川乌|生川乌|川乌头'],
  ['草乌', '制草乌|生草乌'],
  ['川贝母', '川贝'],
  ['土贝母', '上贝母'],
  ['瓜蒌', '瓜萎仁|瓜蒌仁|瓜萎'],
  ['紫菀', '蜜炙紫菀|紫苑'],
  ['款冬花', '冬花'],
  ['百部', '生百部'],
  ['马兜铃', '炙马兜铃'],
  ['桑白皮', '蜜双皮|炙桑皮|桑皮'],
  ['白果', '白果仁'],
  ['杏仁', '杏核仁'],
  ['麻黄', '蜜炙麻黄|炙麻黄|麻黄绒'],
  ['肉桂', '官桂|油桂|紫油桂|企边桂|辣桂|元桂'],
  ['桑叶', '冬桑叶|霜桑叶|扫霜桑叶'],
  ['菊花', '白菊花|甘菊|野菊花'],
  ['紫花地丁', '地丁'],
  ['败酱草', '败酱'],
  ['威灵仙', '灵仙'],
  ['络石藤', '络石'],
  ['青风藤', '风藤'],
  ['首乌藤', '夜交藤'],
  ['野葡萄根', '野葡萄藤|玉葡萄|白葡萄'],
  ['丝瓜络', '丝瓜根|丝瓜'],
  ['茄根', '茄子根'],
  ['何首乌', '生首乌|制首乌|首乌'],
  ['黑芝麻', '胡麻'],
  ['山药', '真山药|淮山|正淮山'],
  ['龙眼肉', '桂圆肉|桂圆'],
  ['肉苁蓉', '肉蓉|肉放蓉|肉苡蓉|苁蓉'],
  ['巴戟天', '巴戟肉'],
  ['淫羊藿', '仙灵脾'],
  ['杜仲', '酒杜仲|川杜仲'],
  ['骨碎补', '猴姜|毛姜'],
  ['补骨脂', '破故纸|故纸'],
  ['韭菜子', '炒韭子|韭子'],
  ['核桃仁', '核桃'],
  ['冬虫夏草', '冬虫草'],
  ['远志', '远志肉'],
  ['石菖蒲', '菖蒲'],
  ['白鲜皮', '白鲜'],
  ['苦楝皮', '苦楝树根皮'],
  ['蓖麻子', '篦麻子|红麻子|蓖麻仁'],
  ['木鳖子', '木别子|木鳖仁|木别'],
  ['芫花', '荒花'],
  ['皂角', '皂角子|猪牙皂|牙皂'],
  ['巴豆', '巴豆霜|巴双'],
  ['信石', '白信|人言'],
  ['硇砂', '硒砂'],
  ['蝼蛄', '土狗子'],
  ['蜘蛛', '大蜘蛛'],
  ['蜂房', '马蜂窝'],
  ['瓜蒂', '苦丁香|甜瓜蒂'],
  ['葫芦', '陈葫芦'],
  ['马齿苋', '马生菜'],
  ['六月寒', '六月寒根'],
  ['钮子七', '扣子七|珠儿参'],
  ['鹿衔草', '鹿寿茶|绿寿茶|录叶七'],
  ['伏龙肝', '灶心土'],
  ['松香', '松脂|黄香'],
  ['荷叶', '金枝荷叶'],
  ['决明子', '草决明'],
  ['青葙子', '青箱子'],
  ['密蒙花', '蒙花'],
  ['蒺藜', '白藜|刺藜|潼藜'],
  ['胡黄连', '胡连'],
  ['山豆根', '豆根'],
  ['牛蒡子', '牛子|大力子'],
  ['郁金', '玉金'],
  ['胡椒', '古月|白胡椒'],
  ['花椒', '川椒|蜀椒'],
  ['紫梢花', '紫霄花'],
  ['沙苑子', '潼蒺藜'],
  ['益智仁', '益智'],
  ['赤芍', '赤芍'],
  ['牡丹皮', '丹皮'],
  ['乌梅', '乌梅'],
  ['青皮', '青皮'],
  ['鸡冠花', '鸡冠花'],
  ['海带', '海带'],
  ['炉甘石', '生炉甘石|炉甘石'],
  ['珊瑚', '珊瑚'],
  ['玛瑙', '玛瑙'],
  ['绿豆', '绿豆粉'],
  ['光明草', '光明草'],
  ['鸡胆', '雄鸡胆'],
  ['芸香', '芸香'],
  ['桂心', '桂心'],
  ['蝉蜕', '蝉蜕'],
  ['胭脂', '胭脂'],
  ['铜绿', '铜绿'],
  ['甘松', '甘松'],
  ['白豆蔻', '豆蔻'],
  ['金龟子', '屎爬牛|金龟子'],
  ['轻粉', '轻粉'],
  ['昆布', '昆布'],
  ['冰糖', '冰糖'],
  ['前胡', '前胡'],
  ['藕节', '藕节'],
  ['罂粟壳', '粟壳'],
  ['葵花', '葵花'],
  ['青桐子花', '青桐子花'],
  ['浮风子', '浮风子'],
  ['上片', '上片'],
  ['溪片', '溪片'],
  ['炒片', '炒片'],
  ['白芍', '白芍花'],
  ['柿蒂', '柿蒂'],
  ['柳叶', '柳叶'],
  ['铜扫帚苗子', '铜扫帚苗子'],
  ['小曲子', '曲蛋子|小曲'],
  ['柞树尖', '柞树尖'],
  ['前草', '前草'],
  ['赤衣', '赤衣'],
  ['小茴香', '茴香'],
  ['小茴香虫', '小茴香虫'],
  ['藤黄', '藤黄'],
  ['鲤鱼', '活鲤鱼'],
  ['刘寄奴', '刘寄奴'],
  ['棉花花', '棉花花'],
  ['棉花根', '棉花根'],
  ['艾叶', '艾绒|艾柱'],
  ['茄根', '茄子根'],
  ['茄子', '大茄子|茄子'],
  ['石榴皮', '石榴皮'],
  ['木耳', '木耳'],
  ['韭菜', '韭菜'],
  ['谷皮', '谷皮'],
  ['羊肝', '羊肝|羊子肝'],
  ['皂矾', '黑矾'],
  ['血余', '头发|人发'],
  ['核桃叶', '核桃叶|核桃树叶'],
  ['石花', '石花'],
  ['水葱', '水葱'],
  ['糠谷老', '糠谷老'],
  ['地蚤婆', '地蚤婆'],
  ['梨', '甜梨'],
  ['竹沥', '竹沥'],
  ['牛蹄甲', '黄牛蹄甲|牛蹄甲'],
  ['高良姜', '高良姜|良姜'],
  ['吴茱萸', '吴茱萸|茱萸|吴芋子'],
  ['肉苁蓉', '大云|甜大云'],
  ['川贝母', '平川贝'],
  ['海浮石', '海浮石'],
  ['荷叶', '荷叶蒂'],
  ['姜皮', '生姜皮'],
  ['羊枣', '羊枣'],
  ['儿茶', '儿茶'],
  ['朱砂', '丹砂|辰砂'],
  ['肉苁蓉', '酒苁蓉'],
  ['红升丹', '红升丹'],
  ['七正香', '七正香'],
  ['芫荽', '竹园荽'],
  ['木瓜', '木瓜'],
  ['香薷', '香薷|香茹'],
  ['莲花蕊', '莲花蕊'],
  ['牵牛子', '牵牛'],
  ['秋麻', '秋麻'],
  ['透骨草', '透骨草'],
  ['伸筋草', '伸筋草'],
  ['海桐皮', '海桐皮'],
  ['三棱', '三棱'],
  ['雪莲', '雪莲'],
  ['虾蟆草', '虾蟆草'],
  ['紫金龙', '紫金龙'],
  ['虎骨', '虎骨'],
  ['千年健', '千年健'],
  ['紫苏', '蓑苏'],
  ['火麻仁', '大麻子'],
  ['丝瓜根', '丝瓜根'],
  ['葡萄', '玉葡萄|白葡萄'],
  ['鸡血藤', '鸡血藤'],
  ['莪术', '莪术|義术|文术'],
  ['苏合香', '苏合香'],
  ['琥珀', '琥珀'],
  ['珍珠母', '珍珠母'],
  ['蜂蜜', '白蜜'],
  ['鸡蛋', '鸡子'],
  ['莲子', '湖莲'],
  ['绞股蓝', '绞股蓝'],
  ['自然铜', '自然铜'],
  ['海马', '海马'],
  ['火麻仁', '大麻子仁'],
  ['胡茄子', '胡茄子'],
  ['姜黄', '姜黄'],
  ['大风子', '大风子'],
  ['血竭', '麒麟竭'],
  ['花蕊石', '花蕊石'],
  ['白蜡', '白蜡'],
  ['山羊血', '山羊血'],
  ['皂矾', '苦矾'],
  ['党参', '大党'],
  ['桑枝', '桑枝'],
  ['酒曲', '酒曲'],
  ['乌鸡', '乌鸡|雄乌鸡'],
  ['猪蹄甲', '猪蹄甲'],
  ['芸苔子', '芸台子'],
  ['马兰花', '马兰花'],
  ['荜澄茄', '澄茄'],
  ['干漆', '干漆'],
  ['八角茴香', '大茴香'],
  ['雄黄', '苏雄'],
  ['天竺黄', '天竺黄|竹黄'],
  ['甘草', '粉草'],
  ['黄药子', '黄药'],
  ['锦地罗', '锦地罗'],
  ['蜗牛', '蜗牛'],
  ['麝香', '射香'],
  ['地龙粪', '地龙粪'],
  ['青果', '青果'],
  ['大腹皮', '腹皮'],
  ['蒲公英', '蒲公英'],
  ['黄明胶', '牛皮胶'],
  ['构树叶', '苟树叶|褚树叶'],
  ['蘘荷', '襄荷根|蘘荷根'],
  ['冬瓜皮', '冬瓜皮'],
  ['西瓜皮', '西瓜皮'],
  ['野苜子', '野苜子'],
  ['稻子花', '稻子花'],
  ['高粱花', '高梁花'],
  ['玉米花', '玉米花'],
  ['芒硝', '芒硝'],
  ['卤碱', '卤水'],
  ['苦丁茶', '苦丁茶'],
  ['半枝莲', '半枝莲'],
  ['白花蛇舌草', '白花蛇舌草'],
  ['生龟', '生龟'],
  ['鸡蛋黄', '鸡蛋黄'],
  ['人指甲', '指甲'],
  ['黑豆', '黑豆'],
  ['苏木', '苏木'],
  ['降香', '降香'],
  ['仙人掌', '仙人掌'],
  ['蟑螂', '螂'],
  ['藜芦', '藜芦'],
  ['蒺藜', '藜'],
]

const lexicon = new Map()

function addTerm(term, canonical) {
  const value = String(term ?? '').trim()
  if (!value) return
  if (!/^[\u4e00-\u9fff]+$/.test(value)) return
  if (value.length < 2 && !['姜', '枣', '葱', '蒜', '蟹', '螂', '藜', '梨'].includes(value)) return
  lexicon.set(value, canonical)
}

// 补充词典优先，能覆盖 catalog 中同名但需要归并的条目。
for (const [canonical, aliases] of SUPPLEMENTAL_GROUPS) {
  addTerm(canonical, canonical)
  for (const alias of aliases.split('|')) addTerm(alias, canonical)
}

for (const item of catalog.items ?? []) {
  const name = item?.name
  if (!name) continue
  if (name.length < 2 && !['姜', '枣', '葱', '蒜', '蟹'].includes(name)) continue
  if (!lexicon.has(name)) lexicon.set(name, name)
  for (const alias of [...(item.aliases ?? []), ...(item.alsoKnownAs ?? [])]) {
    if (typeof alias === 'string' && !lexicon.has(alias)) addTerm(alias, name)
  }
}

for (const herb of sampleData.herbs ?? []) {
  if (herb?.name && !lexicon.has(herb.name)) addTerm(herb.name, herb.name)
  for (const alias of herb?.aliases ?? []) {
    if (typeof alias === 'string' && !lexicon.has(alias)) addTerm(alias, herb.name)
  }
}

for (const group of herbAliasGroups) {
  if (!lexicon.has(group.canonical)) addTerm(group.canonical, group.canonical)
  for (const alias of group.aliases) {
    if (!lexicon.has(alias)) addTerm(alias, group.canonical)
  }
}

const sampleIdByCanonical = new Map()
for (const herb of sampleData.herbs ?? []) {
  if (herb?.id && herb?.name) sampleIdByCanonical.set(herb.name, herb.id)
}

const lexTerms = [...lexicon.keys()].sort((a, b) => b.length - a.length || a.localeCompare(b))
const TERM_MAX = lexTerms.reduce((max, term) => Math.max(max, term.length), 2)

export function herbIdFor(canonical) {
  const sampleId = sampleIdByCanonical.get(canonical)
  if (sampleId) return sampleId
  return `mijingzi-herb-${createHash('sha1').update(canonical).digest('hex').slice(0, 10)}`
}

const CN_NUM = '[一二三四五六七八九十百千万零〇两0-9]'
const DOSE_UNIT =
  '钱|两|分|克|斤|枚|个|片|只|条|根|把|粒|颗|盏|杯|碗|升|合|寸|尺|厘|支|对|块|团|双|张|具|头|节|壮|文|锭|丸|撮|握|茶匙|汤匙|酒盅|匙|盅'
const DOSE_RE = new RegExp(
  [
    '方寸匕',
    `半(?:${DOSE_UNIT})`,
    `(?:${CN_NUM}+(?:[、至\\-~]${CN_NUM}+)*(?:${DOSE_UNIT})(?:半)?(?:${CN_NUM}+(?:${DOSE_UNIT}))*)`,
    '钱半',
    '两半',
    '各?等分',
    '适量',
    '少许',
    '不拘多少',
    '若干',
  ].join('|'),
  'g',
)

const ADMIN_CONTEXT_RE =
  /(每服|每用|每次|每日|日服|日三服|日二服|日一服|分作|分成|小儿|成人|壮者|弱者|量人|断成|切成|分成|研成|捣成|做成|团成|捻成|搓成|换一个|再换|第二年|第三年|调服|送服|冲服|炖服|含服)/
const DOSAGE_GROUP_RE = /^(?:各?等分|适量|少许|不拘多少|若干)$/

// 原文明确写了药名，但属于地方名/OCR 残字，暂不强行归并到现代药名。
const UNCERTAIN_TERMS = new Set([
  '前草',
  '赤衣',
  '青桐子花',
  '浮风子',
  '上片',
  '溪片',
  '炒片',
  '羊枣',
  '七正香',
  '秋麻',
  '胡茄子',
])

const REQUIRE_DOSE = new Set(['小米', '白糖', '红糖', '白沙糖'])
const SERVING_VEHICLES = new Set(['大枣', '生姜', '葱白', '蜂蜜', '冰糖', '白糖', '红糖'])

function cleanText(text) {
  return String(text ?? '')
    .replace(/\s+/g, '')
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩][“"][^”"]*[”"][^。]*。?/g, '')
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩][^。：:]{0,8}[：:][^。]*。?/g, '')
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, '')
    .replace(/([一二三四五六七八九十百千万零〇两0-9])部(?=(?:钱|两|分|克|斤))/g, '$1')
    .replace(/([一二三四五六七八九十百]+)线/g, '$1钱')
    .replace(/部(?=[，。；;]|$)/g, '')
    .replace(/の/g, '')
    .replace(/[·•O〇]/g, '')
    .trim()
}

function cutEditorialTail(text) {
  const cuts = [
    text.search(/注[：:]/),
    text.search(/出处[：:]/),
    text.search(/方名[：:]/),
    text.search(/见《/),
    text.search(/按《/),
    text.search(/原按/),
    text.search(/【/),
    text.search(/编者注/),
    text.search(/另[，,]/),
    text.search(/或单用/),
    text.search(/别名/),
    text.search(/又名/),
    text.search(/[（(][0-9一二三四五六七八九十]+[）)]/),
  ].filter((index) => index > 0)
  const footnoteAfterSentence = text.search(/[。；][①②③④⑤⑥⑦⑧⑨⑩]/)
  if (footnoteAfterSentence >= 0) cuts.push(footnoteAfterSentence + 1)
  if (!cuts.length) return text
  return text.slice(0, Math.min(...cuts))
}

const PREPARATION_BOUNDARY_RES = [
  /水煎服/,
  /水煎/,
  /煎服/,
  /煎汤/,
  /煎水/,
  /煎汁/,
  /煎药/,
  /共煎/,
  /同煎/,
  /煎[一二三四五六七八九十百数]+次/,
  /煎[一二三四五六七八九十百数]+沸/,
  /共为细末/,
  /共细末/,
  /为细末/,
  /研细末/,
  /练成细末/,
  /研成细末/,
  /共研细末/,
  /制成丸/,
  /枣泥/,
  /研末/,
  /为末/,
  /共末/,
  /炼蜜/,
  /蜜为丸/,
  /为丸/,
  /糊为丸/,
  /醋糊/,
  /面糊/,
  /为锭/,
  /熬膏/,
  /收膏/,
  /熬水/,
  /熬汤/,
  /熬成/,
  /共捣/,
  /捣为/,
  /捣烂/,
  /捣泥/,
  /调敷/,
  /外敷/,
  /敷患处/,
  /洗之/,
  /洗患/,
  /洗擦/,
  /洗头/,
  /洗眼/,
  /洗耳/,
  /洗方/,
  /水煎洗/,
  /点眼/,
  /吹鼻/,
  /吹入/,
  /吹人/,
  /塞耳/,
  /塞入/,
  /含服/,
  /漱/,
  /每服/,
  /每用/,
  /每次/,
  /每日/,
  /以上.{0,8}共/,
  /上药/,
  /右[一二三四五六七八九十]+味/,
  /将药/,
  /把药/,
  /用时/,
  /分为/,
  /分作/,
]

function firstPreparationBoundary(text) {
  let min = -1
  for (const re of PREPARATION_BOUNDARY_RES) {
    const match = re.exec(text)
    if (!match) continue
    if (min < 0 || match.index < min) min = match.index
  }
  return min
}

function isServingContext(text, index) {
  const window = text.slice(Math.max(0, index - 16), index)
  return /(每服|每用|每次|每日|送下|送服|调下|调服|冲服|汤下|茶下|酒下|药引)/.test(window)
}

function isProcessingAdjuvant(text, index) {
  const window = text.slice(Math.max(0, index - 14), index)
  return /(拌炒|同炒|炒后去|炒黄.{0,4}去|用.{0,6}拌|为衣)/.test(window)
}

function isFootnoteContext(text, index) {
  const window = text.slice(Math.max(0, index - 12), index)
  return /(此方中|要求|：即|即[一-龥]{1,4}，|即$|属|指|见《|原按|按《)/.test(window)
}

function cutModificationTail(text) {
  // “微热加苍术、黄柏”“虚汗者加寸冬”“可加附子”之类是加减，不是本方组成。
  // 不切“再加冰片”这类制剂步骤，避免把加入的药材误删。
  const re =
    /(?:(?<!不)可加|酌加|随症加|辨证加|临证加|热加|寒加|痛加|痒加|虚加|实加|咳嗽加|吐血加|孕妇加|小儿加|胀加|冷加|虚弱加|虚汗加|食积加|气弱加|后加)/
  const match = re.exec(text)
  if (!match || match.index <= 0) return text
  return text.slice(0, match.index)
}

function scanHerbMatches(text) {
  const matches = []
  let index = 0
  while (index < text.length) {
    let found = null
    const max = Math.min(TERM_MAX, text.length - index)
    for (let length = max; length >= 1; length -= 1) {
      const term = text.slice(index, index + length)
      const canonical = lexicon.get(term)
      if (canonical) {
        found = { term, canonical, start: index, end: index + length }
        break
      }
    }
    if (found) {
      matches.push(found)
      index = found.end
    } else {
      index += 1
    }
  }
  return matches
}

const PROCESSING_RE =
  /^(?:酒洗|酒浸|醋洗|盐水炒|蜜炙|姜汁炒|土炒|麸炒|米炒|面炒|酥炙|盐炒|酒炒|醋炒|炒黄|炒焦|炒黑|炒炭|微炒|炒|炙|制|生|熟|煨|炮|洗|浸|切碎|切|碎|焙干|焙|烘干|炕干|晒干|阴干|去皮尖|去皮|去心|去核|去油|去刺|去头足|去翅|去壳|去芦|去白|去瓤|去子|打碎|捣碎|研泥|研细|绢包|另包|后下|先煎|包煎|半生半熟|烧存性|煅|杵|锉|各包|为引)$/

function extractProcessing(between) {
  let value = String(between ?? '').replace(/[，,、；;。：:\s]/g, '')
  value = value.replace(/[各共以上]+$/g, '')
  if (!value || value.length > 12) return ''
  return PROCESSING_RE.test(value) ? value : ''
}

const COUNT_UNITS = new Set([
  '枚', '个', '片', '只', '条', '根', '把', '粒', '盏', '杯', '碗', '寸', '尺', '厘',
  '支', '对', '块', '团', '双', '张', '具', '头', '节', '壮', '文', '锭', '丸', '撮',
  '握', '匙', '盅',
])

const CN_DIGITS = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
}

function cnNumber(text) {
  if (/^\d+$/.test(text)) return Number(text)
  let total = 0
  let number = 0
  for (const char of text) {
    if (char in CN_DIGITS) {
      number = CN_DIGITS[char]
      continue
    }
    if (char === '十') {
      total += (number || 1) * 10
      number = 0
      continue
    }
    if (char === '百') {
      total += (number || 1) * 100
      number = 0
      continue
    }
    if (char === '千') {
      total += (number || 1) * 1000
      number = 0
      continue
    }
    if (char === '万') {
      total = (total + number) * 10000
      number = 0
    }
  }
  return total + number
}

/** 同一串剂量含多个单位、或单味药量异常大时，按 OCR 不清处理。 */
function doseIsUnclear(text) {
  if (!text || text === UNDETERMINED_DOSAGE) return false
  const units = [...text.matchAll(new RegExp(`(?:${CN_NUM})+(?:半)?(${DOSE_UNIT})`, 'g'))].map(
    (item) => item[1],
  )
  if (new Set(units).size > 1) return true

  const single = text.match(new RegExp(`^(${CN_NUM}+)(?:半)?(两|钱|克)$`))
  if (!single) return false
  const value = cnNumber(single[1]) + (text.includes('半') ? 0.5 : 0)
  if (single[2] === '两' && value > 20) return true
  if (single[2] === '钱' && value > 100) return true
  if (single[2] === '克' && value > 500) return true
  return false
}

/** 处理“三个乌梅七个枣，三钱干姜”这类剂量前置写法。 */
function findDoseBefore(gap) {
  const trimmed = gap.replace(/[，,。；;：:\s]+$/, '')
  if (!trimmed) return null
  DOSE_RE.lastIndex = 0
  let last = null
  let match
  while ((match = DOSE_RE.exec(trimmed))) {
    if (match.index + match[0].length === trimmed.length) last = match
  }
  if (!last) return null

  const context = trimmed.slice(Math.max(0, last.index - 8), last.index)
  if (ADMIN_CONTEXT_RE.test(context)) return null
  if (/(制成|为丸|为衣|如.{0,4}大|最多|不过|以人定量)/.test(context)) return null

  let normalized = last[0].replace(/^各/, '').replace(/^(.{1,4})\1$/, '$1')
  normalized = normalized.replace(
    /^([一二三四五六七八九十])([一二三四五六七八九十]{3,})(钱|两|分|克)$/,
    '$1$3',
  )
  if (doseIsUnclear(normalized)) {
    return {
      text: UNDETERMINED_DOSAGE,
      raw: last[0],
      index: 0,
      end: gap.length,
      grouped: false,
      before: true,
      unclear: true,
    }
  }
  return {
    text: normalized,
    raw: last[0],
    index: 0,
    end: gap.length,
    grouped: DOSAGE_GROUP_RE.test(normalized),
    before: true,
  }
}

function findDose(segment) {
  DOSE_RE.lastIndex = 0
  let match
  while ((match = DOSE_RE.exec(segment))) {
    const context = segment.slice(Math.max(0, match.index - 8), match.index)
    if (ADMIN_CONTEXT_RE.test(context)) continue
    if (/(制成|为丸|为衣|如.{0,4}大|最多|不过|以人定量)/.test(context)) continue
    const after = segment.charAt(match.index + match[0].length)
    const unit = match[0].replace(/^各/, '').slice(-1)
    if (COUNT_UNITS.has(unit) && /[月天年日时]/.test(after)) continue
    if (
      COUNT_UNITS.has(unit) &&
      /(每|服|丸|如|共|最多|不过|只|壮|弱|老|小|制成|为衣|为丸|换|再换|第[二三]年|罐|锅|盆|瓶|碗|缸|壶|坛|针|灌|饮)/.test(
        context,
      )
    ) {
      continue
    }
    let normalized = match[0].replace(/^各/, '').replace(/^(.{1,4})\1$/, '$1')
    normalized = normalized.replace(
      /^([一二三四五六七八九十])([一二三四五六七八九十]{3,})(钱|两|分|克)$/,
      '$1$3',
    )
    const tail = segment.charAt(match.index + match[0].length)
    if (/[付剂服]/.test(tail) && /两$/.test(normalized) && (normalized.match(/两/g) ?? []).length > 1) {
      normalized = normalized.slice(0, -1)
    }
    if (doseIsUnclear(normalized)) {
      return {
        text: UNDETERMINED_DOSAGE,
        raw: match[0],
        index: match.index,
        end: match.index + match[0].length,
        grouped: false,
        unclear: true,
      }
    }
    return {
      text: normalized,
      raw: match[0],
      index: match.index,
      end: match.index + match[0].length,
      grouped:
        match[0].startsWith('各') ||
        DOSAGE_GROUP_RE.test(match[0]) ||
        /各/.test(segment.slice(0, match.index)) ||
        /[同和共与]/.test(segment.slice(0, match.index)),
    }
  }
  return null
}

function pushItem(items, item) {
  const existing = items.find((entry) => entry.herbId === item.herbId)
  if (!existing) {
    items.push(item)
    return item
  }
  if (existing.dosage === UNDETERMINED_DOSAGE && item.dosage !== UNDETERMINED_DOSAGE) {
    existing.dosage = item.dosage
  }
  if (item.note && !existing.note) existing.note = item.note
  return existing
}

const DECOCTION_RE =
  /(煎|煮|熬|研|为末|细末|共末|为丸|蜜丸|炼蜜|糊丸|为锭|收膏|熬膏|捣|浸|泡|烧|焙|炕|晒|阴干|蒸|炒|煅|去渣|取汁|过滤|研成|打成|为散|杵|锉|切片|打碎|水飞|醋制|酒制|炮制|共为|研为|杵为|为衣)/
const ADMIN_RE =
  /(每服|每用|每次|每日|日服|日三服|日二服|日一服|早晚|空心|空腹|食前|饭后|临卧|温服|冲服|调服|送下|送服|饮下|服之|服下|服完|分作|分成|分[二三四五六七八九十]次|忌|孕妇|小儿减半|量人|出汗|外用|敷|涂|搽|擦|洗|熏|点眼|吹|塞|含|漱|贴|抹|滴|疗程|一付|二付|三付|四付|五付|六付|七付|八付|九付|十付|剂|痊愈|立愈|自愈|见效|有效|病除|断根|不可加减|更佳|为引|引子|针法|代茶|常服|饮|少量|少许|频服|顿服|睡前|饭前|午前|午后|早|晚|隔日|症|证|延迟|提前|大寒|虚|实)/

function classifyChunk(chunk, decoctionSeen) {
  if (!chunk) return null
  if (DECOCTION_RE.test(chunk)) return 'decoction'
  if (ADMIN_RE.test(chunk) || /服|饮|送|忌/.test(chunk)) return 'administration'
  return decoctionSeen ? 'administration' : 'decoction'
}

function splitPreparation(rest, originalText) {
  const text = String(rest ?? '')
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩][^。；;]*[。；;]/g, '')
    .replace(/出处[：:].*$/, '')
    .replace(/注[：:].*$/, '')
    .replace(/方名[：:].*$/, '')
    .trim()
  if (!text) return { decoction: '', administration: '' }

  const chunks = text
    .split(/[。；;，,]/)
    .map((chunk) => chunk.replace(/^[、：:\s]+|[、：:\s]+$/g, '').trim())
    .filter(Boolean)
    .filter((chunk) => !/别名/.test(chunk) && !/^[）)]/.test(chunk) && !/编者注/.test(chunk))

  const decoction = []
  const administration = []
  let decoctionSeen = false
  for (const chunk of chunks) {
    const kind = classifyChunk(chunk, decoctionSeen)
    if (kind === 'decoction') {
      decoction.push(chunk)
      decoctionSeen = true
    } else if (kind === 'administration') {
      administration.push(chunk)
      decoctionSeen = true
    }
  }

  // 没有识别出任何剂型/服法时，宁可把原文留在煎煮块，也不丢原文。
  if (!decoction.length && !administration.length) {
    return { decoction: String(originalText ?? '').trim(), administration: '' }
  }

  return {
    decoction: decoction.join('；'),
    administration: administration.join('；'),
  }
}

/**
 * 从一条 OCR 原文里拆出 composition 与 preparation。
 * 无任何可识别药材时返回 dropped: true，由调用方决定是否保留条目。
 */
export function parseMijingziFormula(formula) {
  const originalText = String(formula?.originalText?.text ?? '')
  const sourceId = formula?.sourceCitationId ?? formula?.originalText?.citationIds?.[0] ?? ''
  const locator = formula?.originalText?.locator ?? ''
  const numberedCut = originalText.search(/[（(][0-9一二三四五六七八九十]+[）)]/)
  const footnoteCut = originalText.search(/[。；][①②③④⑤⑥⑦⑧⑨⑩]/)
  const cutPoints = [numberedCut, footnoteCut >= 0 ? footnoteCut + 1 : -1].filter(
    (index) => index > 0,
  )
  const sourceText = cutPoints.length ? originalText.slice(0, Math.min(...cutPoints)) : originalText
  const cleaned = cutModificationTail(cutEditorialTail(cleanText(sourceText)))
  const matches = scanHerbMatches(cleaned)
  const boundary = firstPreparationBoundary(cleaned)

  const items = []
  const warnings = []
  let pending = []
  let lastIngredientEnd = 0
  let previousMatchEnd = 0

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i]
    if (match.canonical === '牛黄' && cleaned.slice(match.end, match.end + 3) === '解毒片') continue
    const gapStart = previousMatchEnd
    const gap = cleaned.slice(gapStart, match.start)
    if (/[。；;]/.test(gap)) pending = []
    previousMatchEnd = match.end

    const next = matches[i + 1]
    const segmentEnd = next ? next.start : cleaned.length
    const segment = cleaned.slice(match.end, segmentEnd)
    const preGap = cleaned.slice(Math.max(gapStart, lastIngredientEnd), match.start)
    const dose = findDoseBefore(preGap) ?? findDose(segment)
    if (dose && /[同和共与]/.test(gap)) dose.grouped = true

    const afterWindow = cleaned.slice(match.start, match.start + 8)
    // “姜枣汤送下”“加姜汤送下”里的姜枣是送服汤头，不是本方药材。
    if (
      SERVING_VEHICLES.has(match.canonical) &&
      (isServingContext(cleaned, match.start) || /(汤送下|汤下|送下)/.test(afterWindow))
    ) {
      continue
    }
    // 糖、米等只在明确写了用量时才算组成，避免把送服汤头当药材。
    if (REQUIRE_DOSE.has(match.canonical) && !dose) continue
    // “用香附拌炒，去香附不用”里的香附是炮制辅料，不是本方药材。
    if (isProcessingAdjuvant(cleaned, match.start)) continue
    // 注文、脚注里的药名不是本方组成。
    if (isFootnoteContext(cleaned, match.start)) continue

    // 方后注、送服汤头里出现的药名，只有在同一条内又拿到明确剂量时才保留；
    // 否则先记为待定，循环结束后再剔除。
    const postBoundary = boundary >= 0 && match.start >= boundary
    if (postBoundary && isServingContext(cleaned, match.start)) continue

    const between = dose && !dose.before ? segment.slice(0, dose.index) : segment
    const processing = extractProcessing(between)
    const item = {
      herbId: herbIdFor(match.canonical),
      herbName: match.canonical,
      dosage: dose?.text ?? UNDETERMINED_DOSAGE,
      role: '未标注',
      roleCitationIds: [],
    }
    if (match.term !== match.canonical || processing) {
      item.note = `原文作“${match.term}${processing}”`
    }
    if (UNCERTAIN_TERMS.has(match.canonical)) {
      item.note = `${item.note ? `${item.note}；` : ''}地方名/OCR 残字，待考`
    }
    if (dose?.unclear || (dose && dose.text === UNDETERMINED_DOSAGE)) {
      item.note = `${item.note ? `${item.note}；` : ''}原文用量 OCR 不清，需按实际病症情况而定`
    }
    const followedByList = !dose && /^[、，等]/.test(cleaned.slice(match.end, match.end + 1))
    item.__postBoundaryNoDose = postBoundary && !dose && !followedByList

    const target = pushItem(items, item)
    if (dose) {
      lastIngredientEnd = Math.max(lastIngredientEnd, match.end + (dose.before ? 0 : dose.end))
      if (dose.grouped && pending.length) {
        const looseDose = DOSAGE_GROUP_RE.test(dose.text)
        const listContext =
          /[、各]/.test(gap) || /、/.test(segment.slice(0, dose.index)) || gap === ''
        if (!looseDose || listContext) {
          for (const pendingItem of pending) {
            if (pendingItem.dosage === UNDETERMINED_DOSAGE) pendingItem.dosage = dose.text
          }
        }
        pending = []
      } else {
        pending = []
      }
      if (dose.text === UNDETERMINED_DOSAGE) warnings.push(`${match.term} 未识别到明确用量`)
    } else {
      pending.push(target)
      lastIngredientEnd = Math.max(lastIngredientEnd, match.end)
    }
  }

  const finalItems = items.filter(
    (item) => !(item.__postBoundaryNoDose && item.dosage === UNDETERMINED_DOSAGE),
  )
  for (const item of finalItems) delete item.__postBoundaryNoDose

  if (!finalItems.length) {
    return {
      composition: [],
      preparation: null,
      dropped: true,
      warnings: ['未识别到药材'],
    }
  }

  // 只有方名、没有组成和用法的标题行（如“沉香快脾丸”），不单独成方。
  if (
    finalItems.length === 1 &&
    finalItems[0].dosage === UNDETERMINED_DOSAGE &&
    cleaned.length <= 12 &&
    /(丸|汤|散|丹|膏|锭|片)$/.test(cleaned) &&
    !/(当|煎|熬|磨|捣|研|服|涂|洗|敷|泡|烧|焙|为|用)/.test(cleaned)
  ) {
    return {
      composition: [],
      preparation: null,
      dropped: true,
      warnings: ['只有方名，未见组成'],
    }
  }

  const ingredientText = finalItems
    .map((item) =>
      item.dosage === UNDETERMINED_DOSAGE ? item.herbName : `${item.herbName}${item.dosage}`,
    )
    .join('、')

  const prepStart = boundary > 0 ? boundary : lastIngredientEnd
  const rest = cleaned
    .slice(prepStart)
    .replace(/^[，,、；;。：:\s]+/, '')
    .replace(/(每服|每用|每次|每日|日三服|日二服|日一服)/g, '；$1')
    .replace(/^；+/, '')
  const split = splitPreparation(rest, originalText)
  const citationIds = sourceId ? [sourceId] : []

  const preparation = {
    ingredients: {
      text: ingredientText,
      kind: 'paraphrase',
      citationIds,
      locator,
    },
    decoction: {
      text: split.decoction,
      kind: 'paraphrase',
      citationIds,
      locator,
    },
    administration: {
      text: split.administration,
      kind: 'paraphrase',
      citationIds,
      locator,
    },
    modernNote: '据原书 OCR 拆分；未作剂量换算，未补写原书未载的用法。',
  }

  return {
    composition: finalItems,
    preparation,
    dropped: false,
    warnings,
  }
}

export function hasComposition(result) {
  return Boolean(result && Array.isArray(result.composition) && result.composition.length)
}

export const lexiconTerms = lexTerms
