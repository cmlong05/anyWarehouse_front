```
1.安装bun环境
# windows
powershell -c "irm bun.sh/install.ps1 | iex"
# Linux
curl -fsSL https://bun.sh/install | bash

2.clone git 仓库 （无需新建项目）
git clone git@gitee.com:cmlong/anyWarehouse_front.git

3. 安装依赖
# 网络问题会导致安装处于resolving状态
bun install

4. 复制配置文件
.env.example -- .env # 做相应修改

4. 运行项目
bun run dev

```

## Building 
# Note we switched to Bun
To create a production version of your app:

```bash 
yarn run build
```
You can preview the production build with `yarn run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
