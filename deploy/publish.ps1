$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host '==> 构建站点' -ForegroundColor Cyan
npm run build
if (-not (Test-Path 'dist/index.html')) {
  throw '构建失败：没有找到 dist/index.html'
}

Write-Host '==> 上传到服务器 /opt/qihuang-tcm/site/' -ForegroundColor Cyan
scp -r dist/. xf:/opt/qihuang-tcm/site/

Write-Host '==> 启动/更新容器' -ForegroundColor Cyan
ssh xf 'cd /opt/qihuang-tcm && ./deploy.sh'

Write-Host '==> 完成：http://182.255.94.89:8081/' -ForegroundColor Green
