#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

docker compose pull
docker compose up -d
docker compose ps

echo
echo "已更新。站点目录：$(pwd)/site"
