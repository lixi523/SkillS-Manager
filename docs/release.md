# Release 流程 — SkillS Manager

## 本地构建产物

```bash
npm run dist        # 生成 SkillManager.exe + SkillManager.zip (含 agents.json, translations.json)
```

产物位于项目根目录：`SkillManager.exe`（~93MB）、`SkillManager.zip`（~34MB）。

## 发布到 GitHub Releases

> 需要 `gh` CLI 且已 `gh auth login`，或拥有 GitHub Token（PAT）。

### 方式 A：gh CLI

```bash
# 打 tag
git tag v1.0.0
git push origin v1.0.0

# 创建 Release 并上传 zip
gh release create v1.0.0 SkillManager.zip \
  --title "SkillS Manager v1.0.0" \
  --notes "多 Agent Skill 看板：扫描、排序、搜索、中文翻译、独立 exe"
```

### 方式 B：GitHub Web 界面

1. 打开 https://github.com/lixi523/SkillS-Manager/releases/new
2. 选择/创建 Tag（如 `v1.0.0`）
3. 标题填写版本号
4. 拖拽 `SkillManager.zip` 上传
5. 点击 "Publish release"

## 数字签名（可选）

exe 默认未签名。若要消除 SmartScreen 警告：

```bash
# 持有代码签名证书后
signtool sign /fd SHA256 SkillManager.exe
# 再重新打包 zip 并上传
```

## 版本号约定

- 主版本号变化：架构/构建方式变更
- 次版本号变化：新增功能（排序、弹窗、命令搜索等）
- 修订号变化：修复、翻译补充、新增 agent
