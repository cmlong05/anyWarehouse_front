```
1.安装bun环境
powershell -c "irm bun.sh/install.ps1 | iex"

2.clone git 仓库 （无需新建项目）
git clone git@gitee.com:cmlong/anyWarehouse_front.git

3. 安装依赖
bun install

4. 运行项目
bun run dev

```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
yarn run dev
```

## Building

To create a production version of your app:

```bash
yarn run build
```
You can preview the production build with `yarn run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
