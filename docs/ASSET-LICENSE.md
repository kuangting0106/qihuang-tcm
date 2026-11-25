# 资产许可

## 3D 人体模型

主模型使用 MakeHuman 的 CC0 基础人体网格：

- 来源：<https://github.com/makehumancommunity/makehuman>
- 文件：`public/models/makehuman-base.obj`
- 许可：MakeHuman assets 为 CC0 1.0
- 改造：`src/three/bodyGeometry.ts` 做男性化比例、青色腰布/头巾、面部细节与材质处理
- 说明：裸露上身、青色腰布、无性器官细节，仅用于经络穴位学习

`src/three/createBody.ts` 是加载失败时的程序化人体兜底，本项目原创，按 CC0 释出。

如果后续替换模型，必须：

1. 确认许可证允许公开使用与修改；
2. 保留作者、来源、许可证文件；
3. 重新运行 `npm run precompute:body`，并更新 `bodyModel.coordinateFrame`。

## 本草实拍图片

`public/images/herbs/real/` 共 27 张，来自 iNaturalist 开放数据：

- 每味药 3 张实拍照片；
- 逐张记录作者、许可证、观察记录链接；
- 详见 `docs/PHOTO-CREDITS.md`；
- CC BY-NC 图片仅用于非商业学习原型；商业使用需替换为相应授权图片。

如果替换图片，必须同步更新 `scripts/content/herb-photos.json` 与 `docs/PHOTO-CREDITS.md`。

## 讲义药材配图

`public/images/herbs/lecture/` 收录讲义条目的配图，多数来自 iNaturalist 开放数据，少数为用户提供：

- 一般每味药只配 1 张可核实的授权图，不强行凑齐“原型 / 入药部位 / 切片”三格；
- 用户提供植株/药材与饮片对照图时，可为每味 2 张；
- 如果只有炮制后的饮片图，也只放这一张；
- 找不到可核实、许可允许再利用的图片时，页面保留“图片待补”，不拿相似药材替代；
- 图片文件、作者、许可证与 iNaturalist 分类页链接见 `scripts/content/herb-image-credits.json` 与 `docs/PHOTO-CREDITS.md`；
- 用户提供图只标“用户提供 · 仅站内学习”，不伪造外部授权链接；
- CC BY-NC / BY-NC-SA 图片仅用于非商业学习原型，商业使用需替换授权图片。

## 针灸速查图与教程文本

- `public/images/acupuncture/12-meridians.jpg` 为用户提供的《12经穴位速查》图，页面按原图展示并逐格整理为结构化表格，只作学习使用。
- 病症常针、31 条透针透穴及医案来自用户提供的 `215条针灸经验穴位和31条透针透穴.md`，仓库副本在 `scripts/content/nihaixia-acupuncture-quickref.md`。
- 倪海厦针灸教程文本据用户提供的《倪海厦人纪系列之针灸教程》PDF 文本层整理，中间数据在 `scripts/content/nihaixia-acupuncture-pages.json` 与 `nihaixia-acupuncture-toc.json`；页面只作学习与文献整理，不构成操作指导。

## 经络图版

- `public/images/acupuncture/kidney-meridian.jpg` 为用户提供的《足少阴肾经之图》书页照片，仅用于本站学习原型；版权与再分发授权待确认，未经授权不得单独提取使用。
- `public/images/acupuncture/lung-meridian.jpg` 为用户自制并提供的《手太阴肺经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/large-intestine-meridian.jpg` 为用户自制并提供的《手阳明大肠经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/stomach-meridian.jpg` 为用户自制并提供的《足阳明胃经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/heart-meridian.jpg` 为用户自制并提供的《手少阴心经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/small-intestine-meridian.jpg` 为用户自制并提供的《手太阳小肠经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/spleen-meridian.jpg` 为用户自制并提供的《足太阴脾经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/pericardium-meridian.jpg` 为用户自制并提供的《手厥阴心包经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/gallbladder-meridian.jpg` 为用户自制并提供的《足少阳胆经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/triple-burner-meridian.jpg` 为用户自制并提供的《手少阳三焦经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/liver-meridian.jpg` 为用户自制并提供的《足厥阴肝经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/ren-meridian.jpg` 为用户自制并提供的《任脉》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/du-meridian.jpg` 为用户自制并提供的《督脉》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- `public/images/acupuncture/bladder-meridian.jpg` 为用户自制并提供的《足太阳膀胱经》图，授权本站用于学习原型展示；如需再分发请另行取得作者同意。
- 图上的穴位定位与主治文字另据 GB/T 12346-2021 与《针灸学》整理，不随图版授权。

## 金刚功动作图

- `public/images/exercises/jingang/` 的 24 张动作页图，来自用户提供的《张至顺老道长金刚功（三校）》PDF，仅用于本站学习原型；版权与再分发授权待确认，未经授权不得单独提取使用。
- 页面文字为原书功理、步骤的整理摘录；动作细节以原书、师传与专业老师指导为准。

## 民间偏方扫描页

- `public/images/remedy-scans/QZ01/` 的 279 张 WebP，来自用户提供的《泉州民间偏方验方选辑》扫描页，仅用于本站学习原型；版权与再分发授权待确认，未经授权不得单独提取使用。
- 扫描页 OCR 文本由 Windows.Media.Ocr 生成，标“机器识别·待校”，不冒充权威原文；引用以扫描原图为准。
- 赤脚医生手册、重庆草药等其余扫描本目前只保留 OCR 文本索引，原图未入库。

## 字体

页面使用系统字体回退：

- 宋体/思源宋体：标题、经典原文
- 微软雅黑/思源黑体：界面文字

不打包外部字体文件。

## 代码

项目代码为原型代码；引用经典原文、药典与教材内容时，请同时遵守相应原书的版权与引用规范。
