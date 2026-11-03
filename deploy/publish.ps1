$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '==> 构建站点' -ForegroundColor Cyan
npm run build
if (-not (Test-Path 'dist/index.html')) {
  throw '构建失败：没有找到 dist/index.html'
}

Write-Host '==> 上传站点到 /opt/qihuang-tcm/site/' -ForegroundColor Cyan
scp -r dist/. xf:/opt/qihuang-tcm/site/

Write-Host '==> 上传公开标注服务与部署配置' -ForegroundColor Cyan
scp deploy/compose.yaml deploy/Caddyfile xf:/opt/qihuang-tcm/
scp -r server xf:/opt/qihuang-tcm/
ssh xf 'mkdir -p /opt/qihuang-tcm/data'

Write-Host '==> 启动/更新容器' -ForegroundColor Cyan
ssh xf 'cd /opt/qihuang-tcm && ./deploy.sh'

Write-Host '==> 完成：http://182.255.94.89:8081/' -ForegroundColor Green
