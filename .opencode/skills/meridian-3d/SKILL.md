---
name: Meridian 3D
description: 修改经络图、3D 人体、穴位坐标、经络走向、穴位标签和前后视图时使用。包含离线坐标管线、补穴流程与模型限制。
---

# 经络图与 3D 人体

## 何时使用

- 补全某条经络的穴位。
- 调整 3D 穴位位置、经络走向线、标签、前后视图。
- 修改人体模型、相机、旋转/缩放交互。
- 经络图页面出现穴位重叠、标签错位、模型穿模。

## 关键文件

| 文件 | 作用 |
|---|---|
| `src/views/MeridianView.vue` | 经络页面、筛选、穴位目录、详情面板 |
| `src/components/HumanBody.vue` | Three.js 场景、模型、穴位标记、标签、相机 |
| `src/three/bodyGeometry.ts` | MakeHuman 模型改造、头发、短裤、材质 |
| `src/three/createBody.ts` | 模型加载/创建入口 |
| `scripts/precompute-body.mts` | 离线把 guide 坐标投到人体表面 |
| `scripts/content/body_points.json` | 预计算后的穴位坐标与经络路径 |
| `scripts/content/acupoints.mjs` | 穴位数据 |
| `scripts/content/meridians.mjs` | 经络数据、标准穴数、路径 |

## 坐标规则

- 坐标框架：`makehuman-body-v2`，模型高度约 1.84。
- 运行时**不做**人体表面映射，只读 `body_points.json`。
- 穴位坐标由 `precompute-body.mts` 中的 `guides` 通过射线投到模型表面。
- 没有 guide 的穴位会使用 `acupoints.mjs` 里的 `coordinates` 原值；这通常不准。
- 改模型或缩放模型后，必须重新预计算，不能沿用旧坐标表。

## 补一个穴位

1. 在 `scripts/content/acupoints.mjs` 添加穴位：
   - `id`、`name`、`pinyin`、`meridianId`
   - `region`：`head-neck` / `trunk` / `upper-limb` / `lower-limb`
   - `pointTypes`：井、荥、输、经、合、原、络、郄、募、母、子等
   - `location`（GB/T 12346-2021）
   - `indications`（《针灸学》）
   - `coordinates` 先写近似值
   - 四肢穴位必须有 `orderFromDistal`
2. 在 `scripts/precompute-body.mts` 的 `guides` 添加：
   ```ts
   { id: 'LU11', x: 0.515, y: 1.05, z: 0, ray: 'front' }
   ```
3. 需要让经络线穿过该穴时，在 `paths.<meridian>` 里加对应路径点。
4. 运行：
   ```powershell
   npm run precompute:body
   npm run build:data
   npm run validate:data
   ```
5. 打开 `/meridians/<id>` 检查标记、标签、前后视图。

## 补一条完整经络

- 先确认标准穴数，写入 `meridians.mjs` 的 `standardPointCounts`。
- 按顺序补全穴位，`orderFromDistal` 从指/趾端向近端递增。
- 页面显示“收录 x / 标准总数”；未补全时保留“待逐条补入”，不要假装完整。
- 当前肺经已 11/11；其他经络仍是样例点。
- 不要用模型记忆批量硬填 300+ 穴位定位；宁可按经络分批核对。

## 经络路径

- `lung`、`ren`、`du`、`kidney`、`bladder`、`small-intestine` 已有路径。
- 其他经络没有 `path` 时，3D 只显示穴位，不显示完整走向线。
- 路径是示意线，不是解剖定位，也不是针刺路径。
- 页面已有提示“3D 走向为示意线”，不要删掉。

## 视图与交互

- 支持 360° 自动旋转、拖拽旋转、滚轮缩放。
- 正面/背面/左/右视图。
- 膀胱经、小肠经默认切背面；其他默认正面。
- 标签使用引线避让，仍可能重叠；调整时优先改 `HumanBody.vue` 的标签布局，不要改穴位数据来“对齐”。
- 移动端要保证 canvas 不溢出、按钮可点。

## 性能与资源

- Three.js 相关代码只在经络页面懒加载；不要把 Three.js 引入首页。
- 模型加载失败时有 procedural fallback，不要删除。
- 释放 geometry/material/texture，避免路由切换后 GPU 内存泄漏。
- 不要在每一帧重建标签 DOM。

## 验收

- `/meridians/lung` 显示 11/11 穴。
- 点击少商、鱼际、太渊、经渠、列缺、孔最、尺泽、天府、侠白、云门、中府，详情都有属性。
- 膀胱经、小肠经自动背面。
- 360° 按钮可自动旋转。
- console 无 WebGL/Three.js 报错。
