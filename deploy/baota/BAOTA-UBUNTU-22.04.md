# 语闻最简单部署教程

适用场景：

- 服务器系统：`Ubuntu 22.04`
- 面板：`宝塔面板`
- 目标：让小白也能把语闻跑起来
- 方式：`宝塔面板 + Nginx + PM2 + Docker（只跑 PostgreSQL / Redis）`

这套方式是我给你挑的最省心路线：

- 网站和 API 都放在同一台服务器
- 宝塔只负责 `Nginx + 反向代理 + SSL + 文件管理`
- `PM2` 负责跑两个 Node 进程
- `Docker Compose` 只负责数据库和 Redis，避免你手动折腾 PostgreSQL 安装

推荐域名准备：

- 主站：`chat.your-domain.com`
- API：`api.your-domain.com`

不要一开始做单域名混合转发。对新手来说，两个子域名最稳、最容易排错。

## 1. 服务器最低建议

- `2核 4G` 起步
- 系统必须是干净的 `Ubuntu 22.04`
- 域名已经解析到服务器

云服务器安全组至少放行：

- `22`
- `80`
- `443`
- 宝塔面板端口

`3000` 和 `4000` 不需要对外开放，只给本机用。

## 2. 安装宝塔面板

用 SSH 登录服务器，执行宝塔官方安装命令：

```bash
if [ -f /usr/bin/curl ];then curl -sSO https://download.bt.cn/install/installStable.sh;else wget -O installStable.sh https://download.bt.cn/install/installStable.sh;fi;bash installStable.sh ed8484bec
```

安装过程中看到：

```bash
Do you want to install Bt-Panel to the /www directory now?(y/n)
```

输入：

```bash
y
```

装完以后，记下：

- 面板地址
- 面板账号
- 面板密码

第一次登录后：

1. 绑定宝塔账号
2. 把面板账号和密码改掉
3. 在安全组里放通宝塔端口

参考：

- [宝塔官方安装面板文档](https://docs.bt.cn/10.0/getting-started/quick-installation-of-bt-panel)

## 3. 宝塔里先安装这 4 个东西

登录宝塔面板后，去 `软件商店` 安装：

1. `Nginx`
2. `PM2管理器`
3. `Docker管理器`
4. `终端`

这里不建议你依赖宝塔自带的 Node 版本切换来赌运气。语闻直接手动装 `Node 20`，更稳。

## 4. 手动安装 Node.js 20 和 pnpm

在宝塔面板打开 `终端`，执行：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm -v
```

如果最后能看到版本号，就说明成功了。

## 5. 上传语闻代码

建议把项目放在：

```bash
/www/wwwroot/yuwen
```

你可以用两种方式：

### 方式 A：宝塔上传压缩包

1. 本地把项目压成 zip
2. 上传到 `/www/wwwroot/`
3. 解压成 `/www/wwwroot/yuwen`

### 方式 B：服务器 git clone

如果你的仓库已经在 Git 上：

```bash
cd /www/wwwroot
git clone 你的仓库地址 yuwen
cd yuwen
```

## 6. 用 Docker 启动 PostgreSQL 和 Redis

语闻仓库根目录已经有 `compose.yml`。

进入项目目录：

```bash
cd /www/wwwroot/yuwen
docker compose up -d postgres redis
docker compose ps
```

看到 `postgres` 和 `redis` 都是 `Up` 就可以。

如果 `docker compose` 命令不可用，请按 Docker 官方文档把 Docker Engine 和 Compose 插件装好。

参考：

- [Docker Engine 官方 Ubuntu 安装文档](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose Linux 插件官方文档](https://docs.docker.com/compose/install/linux/)
- [宝塔 Docker 文档](https://docs.bt.cn/user-guide/docker/website/docker-website-tutorial)

## 7. 安装项目依赖

进入项目根目录：

```bash
cd /www/wwwroot/yuwen
pnpm install
```

第一次安装会慢一点，耐心等。

## 8. 配置生产环境变量

### 8.1 Web 环境变量

复制模板：

```bash
cp deploy/baota/web.env.production.example apps/web/.env.production
```

然后编辑：

```bash
nano apps/web/.env.production
```

至少改这两个值：

```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_WS_URL=https://api.your-domain.com
```

### 8.2 API 环境变量

复制模板：

```bash
cp deploy/baota/api.env.production.example apps/api/.env.production
```

然后编辑：

```bash
nano apps/api/.env.production
```

你至少要改这些：

```env
WEB_APP_URL=https://chat.your-domain.com
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/yuwen
REDIS_URL=redis://127.0.0.1:6379
MAIL_FROM_ADDRESS=你的飞书邮箱
MAIL_REPLY_TO=你的飞书邮箱
MAIL_SMTP_USER=你的飞书邮箱
MAIL_SMTP_PASSWORD=你的SMTP授权码
```

注意：

- `MAIL_SMTP_PASSWORD` 这里一般不是邮箱登录密码，而是 SMTP 授权码
- 飞书邮箱上线前要先确认第三方客户端 / SMTP 已开启

## 9. 初始化数据库

当前仓库还没有正式 migration 文件，所以首发部署先直接 `db push`：

```bash
cd /www/wwwroot/yuwen
set -a
source apps/api/.env.production
set +a
pnpm --filter @yuwen/api prisma:generate
pnpm --filter @yuwen/api exec prisma db push --schema apps/api/prisma/schema.prisma
```

## 10. 构建 Web

Next.js 需要先构建：

```bash
cd /www/wwwroot/yuwen
pnpm build:web
```

如果这里报错，先不要点 PM2，先把报错解决。

## 11. 配置 PM2

仓库里已经给你准备了模板：

- [deploy/baota/ecosystem.config.cjs.example](/Users/shawn/Library/CloudStorage/OneDrive-Personal/文档/New project/deploy/baota/ecosystem.config.cjs.example)

复制：

```bash
cd /www/wwwroot/yuwen
cp deploy/baota/ecosystem.config.cjs.example ecosystem.config.cjs
```

然后编辑：

```bash
nano ecosystem.config.cjs
```

默认只需要确认一项：

- `rootDir`

如果你的项目就是放在：

```bash
/www/wwwroot/yuwen
```

那连这项都不用改。

这个 PM2 模板会自动读取：

- `apps/web/.env.production`
- `apps/api/.env.production`

所以你前面填好的域名、数据库、Redis、飞书 SMTP 配置都会直接被 PM2 用上，不需要重复抄第二遍。

启动：

```bash
cd /www/wwwroot/yuwen
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

执行 `pm2 startup` 后，终端会返回一条命令，让你再复制执行一次。把那条命令执行掉，PM2 才会开机自启。

查看状态：

```bash
pm2 list
pm2 logs yuwen-api
pm2 logs yuwen-web
```

参考：

- [宝塔 PM2 部署文档](https://docs.bt.cn/practical-tutorials/nodejs-pm2-deployment)
- [PM2 Ecosystem 官方文档](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Quick Start 官方文档](https://pm2.keymetrics.io/docs/usage/quick-start/)

## 12. 在宝塔里创建两个站点

去 `网站` 新建两个站点：

1. `chat.your-domain.com`
2. `api.your-domain.com`

站点目录可以随便选一个空目录，因为这里主要是拿宝塔做 Nginx 反代，不是拿来直接跑静态文件。

参考：

- [宝塔快速创建站点文档](https://docs.bt.cn/getting-started/create-web)

## 13. 给两个站点做反向代理

### 13.1 chat.your-domain.com

进入站点设置，添加反向代理：

- 目标 URL：`http://127.0.0.1:3000`
- 发送域名：`$host`

### 13.2 api.your-domain.com

进入站点设置，添加反向代理：

- 目标 URL：`http://127.0.0.1:4000`
- 发送域名：`$host`

API 站点要确保支持 WebSocket。

如果你用的是宝塔默认反代模板，一般它会自动带上升级头；如果没有，就在反代配置里确认有这些内容：

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_http_version 1.1;
```

## 14. 开启 SSL

两个站点都去 `SSL` 里开启证书。

如果你还没有正式证书，新手直接用：

- `Let's Encrypt`

开启后，再把：

- `强制HTTPS`

也打开。

参考：

- [宝塔 SSL 证书文档](https://docs.bt.cn/getting-started/deploy-ssl)

## 15. 最后检查

按这个顺序检查：

1. `docker compose ps`
2. `pm2 list`
3. 浏览器打开 `https://chat.your-domain.com`
4. 浏览器打开 `https://api.your-domain.com/me` 应该返回未登录或鉴权错误，不应该是 502
5. 在语闻登录页测试验证码和 magic link

## 16. 最常见的报错

### 1) 页面 502

通常是：

- PM2 没启动
- 反向代理目标端口写错
- `yuwen-web` 或 `yuwen-api` 启动失败

先看：

```bash
pm2 logs yuwen-web
pm2 logs yuwen-api
```

### 2) 前端能开，接口请求打到 localhost:4000

说明你在构建前没把 `apps/web/.env.production` 配好。

修复方法：

```bash
cd /www/wwwroot/yuwen
pnpm build:web
pm2 restart yuwen-web
```

### 3) 发不出验证码邮件

通常是：

- 飞书 SMTP 没开
- SMTP 用户名写错
- 用了邮箱登录密码，不是授权码
- 发件邮箱和 `MAIL_FROM_ADDRESS` 不一致

### 4) Prisma 连不上数据库

先检查：

```bash
docker compose ps
```

再检查：

```bash
cat apps/api/.env.production
```

确认 `DATABASE_URL` 是：

```env
postgresql://postgres:postgres@127.0.0.1:5432/yuwen
```

## 17. 以后怎么更新

以后更新项目，最简单流程就是：

```bash
cd /www/wwwroot/yuwen
git pull
pnpm install
pnpm build:web
pm2 restart yuwen-api
pm2 restart yuwen-web
```

如果 Prisma schema 有变化，再加一步：

```bash
set -a
source apps/api/.env.production
set +a
pnpm --filter @yuwen/api exec prisma db push --schema apps/api/prisma/schema.prisma
pm2 restart yuwen-api
```

## 18. 我给你的最终建议

如果你是第一次部署，不要一开始就折腾：

- CDN
- WAF
- 多机部署
- 单域名 path 转发
- Docker 全容器化

先把最小可用版本跑起来：

- `chat.xxx.com -> 3000`
- `api.xxx.com -> 4000`
- PostgreSQL/Redis 本机 Docker
- Web/API 本机 PM2

这是最适合当前语闻仓库的小白方案。
