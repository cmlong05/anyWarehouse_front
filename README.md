## 开发环境准备（Linux / macOS）

```bash
curl -fsSL https://bun.sh/install | bash
```

## 克隆代码
```bash
git clone git@gitee.com:cmlong/anyWarehouse_front.git
cd anyWarehouse_front
```

## 安装依赖
```bash
bun install
```
如果卡在 resolving，可以检查网络或使用国内镜像（例如配置环境变量 `BUN_INSTALL` 或改用代理）。

## 配置环境变量
复制 `.env.example` 为 `.env` 并按需修改。

## 启动开发服务器
```bash
bun run dev
```

## 构建生产版本
```bash
bun run build
```

## 预览生产构建
```bash
bun run preview
```

## 运行已构建版本（Node 兼容 / Bun 原生）
```bash
bun run start
```

> 需要部署到不同平台时，可能要选择或配置合适的 SvelteKit adapter: https://svelte.dev/docs/kit/adapters

### 常用检查命令
```bash
bun run check        # 类型与 Svelte 校验
bun run check:watch  # 持续监控
```

### 说明
- 已统一使用 Bun 包管理与运行时（`packageManager` 字段已指向 Bun）。
- 不再提交 `yarn.lock` / `package-lock.json`，只保留 `bun.lock` 以保证可重复安装。
- 脚本使用 `bun x` 前缀保证调用本地依赖的可执行文件。
