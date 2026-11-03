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

`public/images/herbs/lecture/` 收录讲义条目的单张配图，来自 iNaturalist 开放数据：

- 每味药只配 1 张可核实的授权图，不强行凑齐“原型 / 入药部位 / 切片”三格；
- 如果只有炮制后的饮片图，也只放这一张；
- 找不到可核实、许可允许再利用的图片时，页面保留“图片待补”，不拿相似药材替代；
- 图片文件、作者、许可证与 iNaturalist 分类页链接见 `scripts/content/herb-image-credits.json` 与 `docs/PHOTO-CREDITS.md`；
- CC BY-NC / BY-NC-SA 图片仅用于非商业学习原型，商业使用需替换授权图片。

## 字体

页面使用系统字体回退：

- 宋体/思源宋体：标题、经典原文
- 微软雅黑/思源黑体：界面文字

不打包外部字体文件。

## 代码

项目代码为原型代码；引用经典原文、药典与教材内容时，请同时遵守相应原书的版权与引用规范。
