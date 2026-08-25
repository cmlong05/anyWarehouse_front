# 前端代码规范 (anyWarehouse_front)

> ⚠️ **以下是硬性约束，AI 助手在本目录写代码时必须遵守。**
> 通用规则见项目根目录 `AGENTS.md`。

## 技术栈速览

- SvelteKit 2 (SSR, adapter-node) + TypeScript 5
- TailwindCSS 4.1（**唯一允许的样式方案**）
- Bun 作为运行时和包管理器
- 表单：sveltekit-superforms + Zod
- 选择器：svelecte

---

## 样式系统：必须使用 TailwindCSS

### ✅ 必须

- 所有样式使用 Tailwind 工具类：
  ```svelte
  <div class="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow">
  ```
- 主题色、间距、字号统一走 Tailwind v4 CSS-first 配置（`src/app.css` 中的 `--color-*` 等 CSS 变量，无 tailwind.config.js），不要硬编码 hex 色值
- 条件样式用 `class:` 指令或模板字符串拼 class，不要切换 `style`：
  ```svelte
  <button class:bg-blue-500={active} class:bg-gray-200={!active}>
  ```

### ❌ 禁止

- `<style>` 块（包括 `<style lang="postcss">`、scoped 样式）
- `style="..."` 内联样式
- 自定义 CSS 文件（`app.css` 中的全局基础样式除外，且改动需要审慎）

### 唯一例外

仅当 Tailwind 无法表达**运行时动态计算的值**时允许 `style`，例如：

```svelte
<!-- 进度条宽度由 props 计算 -->
<div class="h-2 bg-blue-500" style="width: {percent}%"></div>
```

使用时**必须在旁边写注释说明为什么 Tailwind 不行**。

---

## 组件复用

优先使用 `src/lib/components/` 下的既有组件，不要重新实现：

- `Button.svelte` — 按钮
- `Alert.svelte` — 提示/告警
- `Loading.svelte` — 加载状态
- `Breadcrumb.svelte` — 面包屑
- `DeleteNavigationModal.svelte` — 删除确认弹窗
- 各种 `*Form.svelte` — 业务表单

新增可复用 UI 时也放到 `src/lib/components/`。

---

## 表单

- 校验 schema 统一定义在 `src/lib/schemas.ts`，使用 Zod
- 表单使用 `sveltekit-superforms`，不要手撸 `bind:value` + 手动校验

---

## API 调用

- **必须**从 `$lib/api`（barrel）导入对应的 API 类：
  ```ts
  import { ItemAPI, ShipmentAPI } from '$lib/api';
  ```
- ❌ 不要直接 `fetch`
- ❌ 不要从 `$lib/api/client` 直接导入 `ApiClient`（让 BaseAPI 处理）
- 浏览器 vs SSR 的 base URL 切换由 `src/lib/config/index.ts` 自动处理，业务代码无需关心

---

## 类型

- 业务类型定义在 `src/lib/index.ts` 或 `src/lib/types/` 下
- 新增接口写到那里，不要在组件文件里就地定义业务类型
- 组件内部的临时 prop 类型可以就地写

---

## 工具函数

- 数值解析使用 `src/lib/utils/` 的 `safeParseFloat()` / `safeParseInt()`（定义在 `base.ts`，由 `index.ts` 导出）
- ❌ 不要直接 `parseFloat` / `parseInt`（NaN 会污染计算）

---

## 环境变量

- `VITE_*` 前缀 = 客户端可见（会打进 bundle）
- 无前缀（如 `INTERNAL_API_URL`）= 仅服务端
- 添加新变量时同步更新 `src/lib/config/index.ts` 的 Zod schema

---

## 提交前检查

```bash
bun run check    # TypeScript + Svelte 类型检查，必须通过
```
