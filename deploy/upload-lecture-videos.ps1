$ErrorActionPreference = 'Stop'

$sourceDir = 'F:\中医\【1】人纪\01.人纪之《针灸大成》高清'
$preparedDir = Join-Path $env:TEMP 'qihuang-faststart'
$remoteDir = '/opt/qihuang-tcm/site/videos/lectures/renji-zhenjiudacheng'
$parallel = 4

$files = [ordered]@{
  '01.mp4' = '01.针灸大成01集.mp4'
  '02.mp4' = '02.针灸大成02集.mp4'
  '03.mp4' = '03.针灸大成03集.mp4'
  '04.mp4' = '04.针灸大成04集.mp4'
  '05.mp4' = '05.针灸大成05集.mp4'
  '06.mp4' = '06.针灸大成06集.mp4'
  '07.mp4' = '07.针灸大成07集.mp4'
  '12.mp4' = '12.针灸大成12集.mp4'
}

function Get-LocalVideo([string]$target) {
  $prepared = Join-Path $preparedDir $target
  if (Test-Path -LiteralPath $prepared) {
    return $prepared
  }
  return (Join-Path $sourceDir $files[$target])
}

Write-Host "==> 创建服务器视频目录 $remoteDir" -ForegroundColor Cyan
ssh xf "mkdir -p '$remoteDir'"

$queue = [System.Collections.Generic.Queue[object]]::new()
foreach ($target in $files.Keys) {
  $local = Get-LocalVideo $target
  if (-not (Test-Path -LiteralPath $local)) {
    throw "缺少本地视频：$local"
  }
  $localBytes = (Get-Item -LiteralPath $local).Length
  $remoteBytes = [long](ssh xf "stat -c%s '$remoteDir/$target' 2>/dev/null || echo 0")
  if ($remoteBytes -eq $localBytes) {
    Write-Host ("==> 已存在，跳过 {0}" -f $target) -ForegroundColor DarkGray
    continue
  }
  $queue.Enqueue([pscustomobject]@{
    Target = $target
    SourceName = $files[$target]
    Local = $local
    Bytes = $localBytes
  })
}

$active = [System.Collections.Generic.List[object]]::new()
$completed = 0
$total = $queue.Count

while ($queue.Count -gt 0 -or $active.Count -gt 0) {
  while ($active.Count -lt $parallel -and $queue.Count -gt 0) {
    $item = $queue.Dequeue()
    Write-Host ("==> 上传 {0} -> {1} ({2} MB)" -f $item.SourceName, $item.Target, [math]::Round($item.Bytes / 1MB, 1)) -ForegroundColor Cyan
    $process = Start-Process -FilePath 'ssh' `
      -ArgumentList @('xf', "cat > '$remoteDir/$($item.Target)'") `
      -RedirectStandardInput $item.Local `
      -NoNewWindow -PassThru
    $active.Add([pscustomobject]@{
      Process = $process
      Item = $item
      CheckAt = Get-Date
      FullSince = $null
    })
  }

  Start-Sleep -Milliseconds 400

  for ($i = $active.Count - 1; $i -ge 0; $i--) {
    $job = $active[$i]
    if (-not $job.Process.HasExited) {
      # 个别 ssh 在文件传完后仍不退出，会一直占住并发槽位。远端大小已等于本地时，
      # 短暂等待后结束挂起的 ssh；下一轮再按远端大小做完整性校验。
      if ((Get-Date) -ge $job.CheckAt) {
        $job.CheckAt = (Get-Date).AddSeconds(5)
        $remoteBytes = [long](ssh xf "stat -c%s '$remoteDir/$($job.Item.Target)' 2>/dev/null || echo 0")
        if ($remoteBytes -eq $job.Item.Bytes) {
          if ($null -eq $job.FullSince) {
            $job.FullSince = Get-Date
          } elseif (((Get-Date) - $job.FullSince).TotalSeconds -ge 8) {
            Write-Host ("   传输已完成但 ssh 未退出，结束挂起进程：{0}" -f $job.Item.Target) -ForegroundColor Yellow
            try { $job.Process.Kill() } catch {}
            $job.Process.WaitForExit()
          }
        } else {
          $job.FullSince = $null
        }
      }
      continue
    }
    $job.Process.WaitForExit()
    $remoteBytes = [long](ssh xf "stat -c%s '$remoteDir/$($job.Item.Target)' 2>/dev/null || echo 0")
    if ($remoteBytes -ne $job.Item.Bytes) {
      throw "上传不完整：$($job.Item.Target)，本地 $($job.Item.Bytes)，服务器 $remoteBytes"
    }
    $completed++
    Write-Host ("   完成 {0}/{1}：{2}" -f $completed, $total, $job.Item.Target) -ForegroundColor Green
    $active.RemoveAt($i)
  }
}

Write-Host '==> 校验服务器文件大小' -ForegroundColor Cyan
foreach ($target in $files.Keys) {
  $localBytes = (Get-Item -LiteralPath (Get-LocalVideo $target)).Length
  $remoteBytes = [long](ssh xf "stat -c%s '$remoteDir/$target'")
  if ($localBytes -ne $remoteBytes) {
    throw "文件大小不一致：$target 本地 $localBytes，服务器 $remoteBytes"
  }
  Write-Host ("   OK {0}  {1} bytes" -f $target, $remoteBytes)
}

ssh xf "ls -lh '$remoteDir'; du -sh '$remoteDir'"
Write-Host '==> 视频上传完成' -ForegroundColor Green
