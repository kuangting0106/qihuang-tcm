---
name: Visual QA
description: 改完页面、组件、样式或交互后使用。启动开发服务器，检查关键路由、console 报错、横向溢出、截图和交互回归。
---

# 页面验收

## 何时使用

- 修改 Vue 组件、CSS、路由、交互后。
- 修改方剂、经络、本草页面展示后。
- 提交前需要确认没有 console error、没有布局溢出。

## 先决条件

1. 优先加载内置 `browser` skill。
2. 确认开发服务器：

```powershell
npm run dev -- --host 127.0.0.1
```

默认地址：

```text
http://127.0.0.1:5173/
```

如果端口被占用，Vite 会换端口，以终端输出为准。

## 关键路由

| 页面 | 路由 |
|---|---|
| 首页 | `/` |
| 治疗法门 | `/methods` |
| 经络图 | `/meridians/lung` |
| 全身穴位 | `/meridians/all` |
| 本草列表 | `/herbs` |
| 药材详情 | `/herbs/gancao` |
| 方剂列表 | `/formulas` |
| 桂枝汤 | `/formulas/guizhi-tang` |
| 小柴胡汤 | `/formulas/xiao-chai-hu-tang` |
| 医案 | `/cases` |
| 古法锻炼 | `/exercises` |
| 五禽戏 | `/exercises/wuqinxi` |
| 名家讲堂 | `/lectures` |
| 药材的炮制 | `/processing` |
| 医家经典古籍 | `/classics` |
| 大方布局演示 | `/lab/formula-scale` |

## 每次必查

1. **Console error**：打开 DevTools 或 browser.console，level=error。
2. **横向溢出**：`document.documentElement.scrollWidth > clientWidth`。
3. **关键文案存在**：用 `browser.wait` 等文本，而不是只看标题。
4. **关键按钮可点**：不要只截图，实际点击一次。
5. **移动端宽度**：至少看 390px；桌面看 1440px。

## 交互回归清单

### 方剂

- “现代剂量仅供参考”按钮：原文用量 ↔ 克/片/个切换。
- “切换古代用量”按钮：今用剂量 ↔ 古籍原方切换。
- 方义解说：逐味卡片数量与组成一致，总结文字存在。
- 原文下划线词悬停/点击：注解弹层出现，含“非原文”。
- 图谱药材悬停：显示“后世方解，该药材在方中作用思路”。
- 加减法、核心药对、历代医家解说占位卡片。

### 经络

- 页头显示“收录 x / 标准总数”。
- 肺经显示 11/11。
- 点击穴位目录，详情有定位、主治、穴位类型。
- 膀胱经、小肠经自动背面。
- 360° 自动旋转、前后视图、缩放按钮。

### 本草

- 列表一行 5 个。
- “热”筛选可用。
- 详情页三张图：全株 / 部位 / 药材。
- 古籍名、现代别名、地域名、禁忌存在。

## 截图

使用内置 browser skill 的 screenshot，或 headless Chrome：

```powershell
$chrome='C:\Program Files\Google\Chrome\Application\chrome.exe'
& $chrome --headless=new --hide-scrollbars --enable-unsafe-swiftshader --use-gl=angle --use-angle=swiftshader --window-size=1440,1600 --virtual-time-budget=12000 --screenshot='E:\code\qihuang-tcm\docs\check.png' 'http://127.0.0.1:5173/meridians/lung'
```

- 3D 页面需要 `--enable-unsafe-swiftshader`，否则 WebGL 可能空白。
- 临时截图用完删除，不要提交 `check.png`、`tmp-*.png`。
- 正式预览图命名 `docs/preview-*.png`。

## 常见问题

| 现象 | 可能原因 |
|---|---|
| 页面 404 | 路由不存在或开发服务器没启动 |
| 数据不更新 | 改了 `scripts/content/*` 但没跑 `node scripts/build-sample-data.mjs` |
| 3D 空白 | WebGL 被禁用，或模型加载失败 |
| 穴位没出现 | 没跑 `precompute:body`，或 `visibleIds` 过滤掉了 |
| 标签重叠 | 标签布局问题，不是穴位数据问题 |
| console 报错 `Identifier has already been declared` | 组件脚本有重复变量 |

## 交付格式

简短报告：

```text
检查页面：
- /formulas/...：无 console error，切换按钮正常，无横向溢出
- /meridians/lung：11/11 穴，点击详情正常
构建：npm run build 通过
```
