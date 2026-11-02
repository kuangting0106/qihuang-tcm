---
name: TCM Content
description: 新增或修改中药材、方剂、经络、穴位、治法、医案、古法锻炼内容时使用。强制出处、原文/摘录/后世方解分层，禁止编造中医事实。
---

# 中医内容编写规则

## 何时使用

- 新增或修改药材、方剂、经络、穴位、治法、医案、古法锻炼内容。
- 调整方义、现代解说、现代剂量、原文注解。
- 检查某条内容是否有出处、是否把后世归纳写成了经典原文。

## 不可违反的规则

1. 每条中医内容必须有 `citationIds`，没有出处的字段不进入页面。
2. 区分三种文本：
   - `quote` 原文：必须是 `sources.mjs` 中 `quote` 的子串，不能改写。
   - `paraphrase` 摘录：药典、标准、教材的归纳。
   - `analysis` 后世方解：君臣佐使、方义、现代解说、核心药对。
3. 经典出处写具体书名：
   - 张仲景《伤寒杂病论》伤寒部分写《伤寒论》。
   - 杂病部分写《金匮要略》。
   - 傅青主写具体书名，如《傅青主女科》。
   - 不得用“方剂学”代替古籍出处；教材只能出现在 `analysis` 的后世方解里。
4. 不确定的定位、剂量、主治、穴位属性，宁可不写或标“待补”，不要用模型记忆补全。
5. 现代剂量、现代煎服法必须标“参考”，并提示“不等同实际处方”。

## 数据文件

- 源数据：`scripts/content/*.mjs`
- 类型：`src/types/tcm.ts`
- 生成数据：`public/data/sample_data.json`（禁止手改）
- 内容说明：`docs/tcm-content-sources.md`
- 图片授权：`docs/PHOTO-CREDITS.md`、`docs/ASSET-LICENSE.md`

## 方剂内容

在 `scripts/content/formulas.mjs` 中维护：

- `sourceCitationId`：原条出处，如 `src-shanghan-12`。
- `originalText`、`symptoms`：原文与方证，`kind: 'quote'`。
- `preparation`：原文药材、煎煮、服法，均为 `quote`；现代用法用：
  - `modernDecoction`
  - `modernAdministration`
  - `modernNote`
- `composition`：药味、原文用量、君臣佐使、原文比例、今用剂量。
- `meaning`：方义解说。
  - `herbMeanings`：逐味说明本方中的作用。
  - `summary`：诸药合用与主治。
  - 全部标 `analysis`，不冒充原文。
- `modernExplanation`：现代病症解说，可留空；未填时页面显示“待补充”。
- `originalAnnotations`：原文悬浮注解，`phrase` 必须和原文完全一致。
- `commentaries`：真实历代医家/古籍解说；未收到内容时保留 `commentarySlots` 占位。
- `corePairs`：只收后世方书或教材明确归纳的药对。

小柴胡汤的今用配比保留 `5:3:3:5:3:3`，不要改成其他比例。

## 药材内容

在 `scripts/content/herbs.mjs` 中维护：

- 性味、归经、功效、主治、禁忌分别有出处。
- 名称分：古籍名、现代别名、地域名/商品名，并标名字出处。
- 必须正好 3 张图：`whole` / `part` / `medicinal`。
- 没有授权切片图时使用 `pending-medicinal.svg`，不拿相似图替代。
- 配伍关系标“后世方解”，不写成《伤寒论》原文。

## 经络与穴位内容

- 经络：`scripts/content/meridians.mjs`
- 穴位：`scripts/content/acupoints.mjs`
- 属性：井、荥、输、经、合、原、络、郄、募、母、子、八会、八脉交会等。
- 定位引用 `GB/T 12346-2021`，主治引用《针灸学》。
- 当前肺经已补齐 11 穴；其他经络用 `totalPoints` 显示“收录 x / 标准总数”，未补全不要假装完整。
- 补穴位的 3D 坐标流程见 `meridian-3d` skill。

## 治法、医案、古法锻炼

- 目前栏目框架已建，正文待收。
- 未录入前显示“待收录”，不写空泛的方药和操作。
- 古法锻炼只收自有、授权或官方公开的视频/图片。
- 张至顺、倪海厦写“所传/讲授版本”，不写原作者。
- 五禽戏传统上多记于华佗；孙思邈的导引养生单列，不混为同一作者。

## 修改后的固定流程

```powershell
node scripts/build-sample-data.mjs
npm run validate:data
npm run typecheck
```

涉及页面展示时再运行：

```powershell
npm run build
```

## 交付前自查

- 有没有新增没有出处的 `text`？
- `quote` 是否能在 source 的 `quote` 中原样找到？
- 方剂出处是否写成了具体古籍？
- 后世方解、现代解说、现代剂量是否标清楚？
- 是否把“待补”写成了确定事实？
- 图片是否有 credit、license、sourceUrl？
