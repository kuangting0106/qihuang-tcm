# 第三方 Skills 来源

## obra/superpowers

- 仓库：https://github.com/obra/superpowers
- 许可证：MIT
- 采用提交：`2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`
- 采用日期：2026-11-02

本项目复制了以下 skills，保留原始目录结构和说明文件：

- `writing-plans`
- `executing-plans`
- `subagent-driven-development`
- `dispatching-parallel-agents`
- `systematic-debugging`
- `verification-before-completion`
- `test-driven-development`
- `writing-skills`
- `requesting-code-review`
- `receiving-code-review`

说明：

- 这些 skill 来自开源项目，不是本项目原创。
- `executing-plans`、`subagent-driven-development` 带有 Bash 辅助脚本，Windows 下需在 Git Bash 或 WSL 中运行；不在 Git Bash 中时按 SKILL.md 的文字流程手动执行。
- 升级或修改第三方 skill 时，先对照上游仓库，不要把项目专用规则直接覆盖进去。
- MIT 许可证文本见上游仓库 `LICENSE`。

## anthropics/skills

- 仓库：https://github.com/anthropics/skills
- 许可证：Apache License 2.0
- 采用提交：`main` 分支（2026-11-03 取用）
- 采用日期：2026-11-03

本项目复制了以下 skill，保留原始目录结构和许可证文件：

- `frontend-design`

说明：

- 该 skill 用于前端视觉方向、字体、配色与版式判断，帮助避免模板化的默认样式。
- 许可证全文见 `.opencode/skills/frontend-design/LICENSE.txt`。
- 升级时先对照上游 `skills/frontend-design`，不要覆盖项目自己的设计规范。
