# 岐黄图鉴 · 服务器部署

这是独立于 `/opt/xuefeng` 的 Docker 部署目录，不修改、不复用 xuefeng 的 Compose 配置和 Caddy。

## 当前访问地址

- 临时地址：<http://182.255.94.89:8081/>
- 服务器目录：`/opt/qihuang-tcm`
- 容器：`qihuang-tcm-web`（`caddy:2-alpine`）
- 端口：宿主机 `8081` → 容器 `80`

## 服务器上有什么

```text
/opt/qihuang-tcm/
├── compose.yaml       # 独立 Compose 栈
├── Caddyfile          # 静态站点 + SPA 回退 + 缓存/安全头
├── deploy.sh          # 拉镜像并启动
└── site/              # 正式构建产物放在这里
    └── videos/        # 讲堂视频（单独上传，不在 dist/Git 中）
```

讲堂视频不放进 `dist/`，避免每次发布重复上传。当前课程：

```text
site/videos/lectures/renji-zhenjiudacheng/01.mp4 ... 07.mp4, 12.mp4
```

上传命令：

```powershell
powershell -ExecutionPolicy Bypass -File deploy/upload-lecture-videos.ps1
```

脚本会按 4 路并行上传，已存在且大小一致的文件会跳过。若 `%TEMP%\qihuang-faststart\` 下有同名文件，会优先上传该版本；建议先用 `ffmpeg -c copy -movflags +faststart` 把 `moov` 移到文件头，避免浏览器等到文件末尾才能取元数据。

## 发布正式版本

在本地项目根目录执行：

```powershell
npm run build
scp -r dist/. xf:/opt/qihuang-tcm/site/
ssh xf "cd /opt/qihuang-tcm && ./deploy.sh"
```

也可以直接运行：

```powershell
powershell -ExecutionPolicy Bypass -File deploy/publish.ps1
```

`publish.ps1` 会先构建，再上传 `dist/`、`server/`、`compose.yaml`、`Caddyfile` 和只读数据库 `data/qihuang.db`，最后在服务器上重启容器。

## 公开标注与只读数据 API

方剂页的“方中作用”和原文划线注解可以通过 API 发布给所有访客；方剂列表、方剂详情、药材与本草讲义通过只读 SQLite 按需读取，不再在首屏下载整份 `sample_data.json`。服务是零依赖 Node 程序 `server/notes-server.mjs`，由 Caddy 反代 `/api/*`：

- 公开标注写在服务器 `/opt/qihuang-tcm/data/notes.json`。
- 只读内容来自 `/opt/qihuang-tcm/data/qihuang.db`，由 `npm run build:db` 在本地生成后随发布上传，容器内只读打开。

首次部署时在服务器创建编辑口令：

```bash
ssh xf
cd /opt/qihuang-tcm
printf 'QIHUANG_EDIT_KEY=%s\n' "$(openssl rand -base64 24)" > .env
chmod 600 .env
cd /opt/qihuang-tcm && ./deploy.sh
```

查看或修改口令：

```bash
ssh xf "cat /opt/qihuang-tcm/.env"
```

页面保存时会要求输入编辑口令，口令只存在访客浏览器的 `localStorage.qihuang.editKey`，不写入前端代码。没有口令或 API 不可用时，内容只保存在本机浏览器。

检查 API：

```bash
curl.exe http://182.255.94.89:8081/api/health
curl.exe http://182.255.94.89:8081/api/notes
```

## 常用检查

```powershell
ssh xf "cd /opt/qihuang-tcm && docker compose ps"
ssh xf "cd /opt/qihuang-tcm && docker compose logs --tail=100 web"
curl.exe -I http://182.255.94.89:8081/
```

## 域名与 HTTPS（后加）

现在 80/443 由 xuefeng 的 Caddy 占用，因此本项目先用 8081 独立运行，不碰 xuefeng。

加域名时有两个方案：

1. **推荐：独立前置代理**
   新增一个只负责域名分流的 Caddy/Nginx，把 `tcm.example.com` 转到本项目的 `127.0.0.1:8081`，其他域名仍转 xuefeng。这样两个项目仍各自独立。
2. **迁移 xuefeng 的 Caddy**
   把 xuefeng 的 Caddy 改成共享入口，再增加本项目的域名站点。这个方案会改动现有项目，必须单独确认后再做。

无论哪种方案，都需要先把域名 A 记录指向 `182.255.94.89`，并放行 80/443。

## 注意

- 静态站点由 Caddy 提供；公开标注与只读数据 API 是独立的 `node:24-alpine` 容器（使用内置 `node:sqlite`，无额外依赖）。
- `site/` 只放构建产物，不放源码。
- `data/` 只存运行时公开标注与只读数据库，不提交 Git；备份时复制 `/opt/qihuang-tcm/data/notes.json`。
- 不要把 root 密码写进部署文件；现有 `deploy` 用户已可用 SSH key 登录。
- 8081 是临时预览端口；正式域名确定后应改为 80/443 的域名访问，并关闭不必要的公网端口。
