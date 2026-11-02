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
```

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

`publish.ps1` 会先构建，再上传 `dist/` 的全部内容，最后在服务器上重启容器。

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

- 本项目是纯静态站点，服务器不需要 Node.js。
- `site/` 只放构建产物，不放源码。
- 不要把 root 密码写进部署文件；现有 `deploy` 用户已可用 SSH key 登录。
- 8081 是临时预览端口；正式域名确定后应改为 80/443 的域名访问，并关闭不必要的公网端口。
