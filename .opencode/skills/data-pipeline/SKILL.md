---
name: Data Pipeline
description: 处理 scripts/content 数据、public/data 生成文件、数据校验错误和构建流程时使用。包含新增药材/方剂/穴位的数据链路与常见校验规则。
---

# 数据管线

## 何时使用

- 新增或修改药材、方剂、经络、穴位数据。
- `validate:data` 报错。
- 页面数据没有更新。
- 需要确认某个字段应该改源文件还是生成文件。

## 唯一数据源

```text
scripts/content/sources.mjs     出处
scripts/content/herbs.mjs       药材
scripts/content/formulas.mjs    方剂
scripts/content/meridians.mjs   经络
scripts/content/acupoints.mjs   穴位
scripts/content/body_points.json 3D 预计算坐标（生成）
```

生成文件：

```text
public/data/sample_data.json
```

**不要手改 `public/data/sample_data.json`。** 改 `scripts/content/*`，再运行 `node scripts/build-sample-data.mjs`。

## 构建流程

`npm run build` 依次执行：

```text
precompute:body  →  scripts/precompute-body.mts
build:data       →  scripts/build-sample-data.mjs
validate:data    →  scripts/validate-data.mjs
vite build
vue-tsc --noEmit
```

日常只改数据时：

```powershell
node scripts/build-sample-data.mjs
npm run validate:data
```

改页面/组件后：

```powershell
npm run typecheck
npm run build
```

## 新增药材

改 `scripts/content/herbs.mjs`：

- `id`、`name`、`pinyin`
- `flavorTags`、`meridianIds`
- `properties` 五项：性味、归经、功效、主治、禁忌
- `names`：古籍名、地域名
- `images` 必须正好 3 张
- `pairings`
- `verification`

图片文件放 `public/images/herbs/real/`，并补 `scripts/content/herb-photos.json` 或对应图片数据。每张图必须有 `credit`、`license`，实拍图还要 `sourceUrl`。

## 新增方剂

改 `scripts/content/formulas.mjs`：

- `sourceCitationId` 必须存在于 `sources.mjs`
- `originalText`、`symptoms` 用 `quote`
- `preparation` 三段原文用 `quote`
- `composition` 的每味药必须在 `herbs.mjs` 中存在
- `meaning.herbMeanings` 的 `herbId` 必须在组成中
- `corePairs` 两端必须在组成中
- `modifications` 每条都要有 `citationIds`
- 现代剂量、现代说明标 `analysis` 或明确“参考”

## 新增穴位

改 `scripts/content/acupoints.mjs`，并同步 3D：

1. 在 `acupoints.mjs` 加穴位。
2. 在 `scripts/precompute-body.mts` 的 `guides` 加坐标引导。
3. 运行 `npm run precompute:body`。
4. 运行 `npm run build:data`。
5. 运行 `npm run validate:data`。

四肢穴位必须有 `orderFromDistal`；任督脉穴位按躯干处理。

## 常见校验错误

| 错误 | 原因 | 修法 |
|---|---|---|
| `标为 quote，但引用原文中找不到该句` | 改写了原文或引用了错条 | 改成源 quote 的原样子串，或降为 `paraphrase` / `analysis` |
| `引用了不存在的出处` | citation id 拼错或未建 source | 补 `sources.mjs` 或改 id |
| `组成为空` | composition 未填 | 补药味 |
| `组成引用了不存在的药材` | herbId 拼错 | 对照 `herbs.mjs` |
| `必须正好 3 张图片` | 图片数量不对 | 补足 3 张，缺图用 pending 占位 |
| `图片文件不存在` | 路径写错 | 检查 `public` 下文件 |
| `核心药对端点不在组成中` | pair 用了方外药 | 改端点或删药对 |
| `十二正经数量应为 12` | meridians 改动破坏结构 | 恢复 12 条 regular |
| `奇经八脉数量应为 8` | 同上 | 恢复 8 条 extraordinary |
| `缺少穴位类型` | 特定穴覆盖被删 | 恢复原穴/募穴/八会/八脉交会等覆盖 |

## 出处规则

`sources.mjs` 每条至少要有：

```js
{
  id,
  type,      // classic | standard | textbook | image
  work,
  locator,
}
```

经典原文要有 `quote`；`quote` 会被用来校验所有 `kind: 'quote'` 的文本。

## 不要做的事

- 不手改 `public/data/sample_data.json`。
- 不用模型记忆补穴位定位、主治、剂量。
- 不跳过 `validate:data` 直接构建。
- 不把临时截图、测试页提交到 `public/`。
