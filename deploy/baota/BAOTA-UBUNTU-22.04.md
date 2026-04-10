# 语闻最简单部署教程

纯小白如果只想照着点击和复制命令走，先看：

- [deploy/baota/BAOTA-小白图形化版.md](/Users/shawn/Library/CloudStorage/OneDrive-Personal/文档/New project/deploy/baota/BAOTA-小白图形化版.md)

适用场景：

- 系统：`Ubuntu 22.04`
- 面板：`宝塔面板`
- 域名 DNS：`Cloudflare`
- 部署方式：`宝塔 + Nginx + PM2 + Docker`
- 目标：让第一次部署的人也能一步一步跑起来

这份文档默认你把：

- Web 前端跑在 `chat.your-domain.com`
- API 跑在 `api.your-domain.com`
- PostgreSQL 和 Redis 跑在同一台服务器的 Docker 里
- Web 和 API 用 `PM2` 直接跑在宿主机

不要一开始就做单域名 path 转发，也不要先折腾多机部署。对当前语闻仓库来说，`chat` 和 `api` 两个子域名是最稳、最好排查问题的方案。

---

## 0. 最终部署长什么样

推荐你先在脑子里建立这个结构：

```text
用户浏览器
  -> Cloudflare
    -> chat.your-domain.com
      -> 宝塔 Nginx 反代
        -> 127.0.0.1:3000
          -> 语闻 Web

用户浏览器
  -> Cloudflare
    -> api.your-domain.com
      -> 宝塔 Nginx 反代
        -> 127.0.0.1:4000
          -> 语闻 API + Socket.IO

语闻 API
  -> 127.0.0.1:5432 PostgreSQL (Docker)
  -> 127.0.0.1:6379 Redis (Docker)
```

你需要记住两个重点：

- `3000` 和 `4000` 是程序内部端口，不需要对公网开放
- 公网只需要开放 `80` 和 `443`，Cloudflare 也是通过这两个端口访问你的服务器

---

## 1. 开始前你要准备好什么

至少准备这些：

1. 一台干净的 `Ubuntu 22.04` 服务器
2. 一个已经接入 `Cloudflare` 的域名
3. 服务器公网 IP
4. 你的语闻项目代码
5. 飞书邮箱 SMTP 信息

服务器最低建议：

- `2 核 4G` 起步
- 硬盘至少 `40G`

云服务器安全组至少放行：

- `22`
- `80`
- `443`
- 宝塔面板端口

不需要放行：

- `3000`
- `4000`
- `5432`
- `6379`

如果你还开了系统防火墙 `ufw`，也要同步放行：

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 8888
ufw reload
```

如果你的宝塔端口不是 `8888`，就把上面最后一条换成你自己的端口。

---

## 2. 先把域名接到 Cloudflare

如果你的域名还没接入 Cloudflare，先完成这一步：

1. 登录 Cloudflare
2. `Add a domain / 添加站点`
3. 按提示把域名加入 Cloudflare
4. 到你的域名注册商后台，把 nameserver 改成 Cloudflare 给你的那两条
5. 等 Cloudflare 面板显示域名已激活

如果这一步还没完成，后面 DNS 记录是不会生效的。

---

## 3. 在 Cloudflare 里添加 DNS 记录

以下用 `your-domain.com` 举例。

### 3.1 打开 DNS 页面

进入：

- Cloudflare 后台
- 选择你的域名
- `DNS`
- `Records`

### 3.2 添加两个 A 记录

添加这两条：

#### 记录 1：聊天前端

- Type：`A`
- Name：`chat`
- IPv4 address：`你的服务器公网 IP`
- Proxy status：`DNS only`

#### 记录 2：API

- Type：`A`
- Name：`api`
- IPv4 address：`你的服务器公网 IP`
- Proxy status：`DNS only`

这里我特意建议你一开始先用 `DNS only`，也就是灰云，原因很简单：

- 先让源站直接可访问
- 先把宝塔和证书跑通
- 等 HTTPS 和反代都确认没问题了，再切回橙云

这会少很多新手常见问题。

### 3.3 为什么一开始不要直接开橙云

你当然可以一开始就开橙云，但对第一次部署的人来说，经常会遇到：

- 不知道报错来自 Cloudflare 还是来自源站
- Let's Encrypt 证书申请时更难判断问题
- 反代没配好时，看到的是 Cloudflare 错误页，不是源站真实错误

所以建议流程是：

1. 先灰云
2. 源站跑通
3. 源站证书跑通
4. 最后再开橙云

### 3.4 怎么确认 DNS 已经生效

在你自己的电脑终端，或者服务器终端里执行：

```bash
dig +short chat.your-domain.com
dig +short api.your-domain.com
```

如果当前还是灰云：

- 返回的应该是你的服务器公网 IP

如果你后面已经切成橙云：

- 返回的通常会变成 Cloudflare 的代理 IP

所以这里要记住：

- 灰云时，看见源站 IP 是正常的
- 橙云时，看不见源站 IP 也是正常的

---

## 4. 安装宝塔面板

SSH 登录服务器后，执行宝塔官方安装命令：

```bash
if [ -f /usr/bin/curl ];then curl -sSO https://download.bt.cn/install/installStable.sh;else wget -O installStable.sh https://download.bt.cn/install/installStable.sh;fi;bash installStable.sh ed8484bec
```

安装过程中如果看到：

```bash
Do you want to install Bt-Panel to the /www directory now?(y/n)
```

输入：

```bash
y
```

安装完成后，记下：

- 宝塔访问地址
- 用户名
- 密码

第一次登录宝塔后建议立刻做这几件事：

1. 修改宝塔登录密码
2. 绑定自己的宝塔账号
3. 在云服务器安全组里放行宝塔端口

参考：

- [宝塔官方安装文档](https://docs.bt.cn/10.0/getting-started/quick-installation-of-bt-panel)

---

## 5. 在宝塔里安装需要的软件

登录宝塔后，去 `软件商店` 安装：

1. `Nginx`
2. `PM2管理器`
3. `Docker管理器`
4. `终端`

如果宝塔提示安装某些运行环境，正常安装即可。

这里不建议你依赖宝塔里花哨的 Node 版本切换面板，语闻直接手动装 `Node 20` 会更稳。

---

## 6. 手动安装 Node.js 20 和 pnpm

在宝塔 `终端` 里执行：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v
npm -v
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm -v
```

如果都能打印出版本号，就说明安装成功。

---

## 7. 上传语闻代码

建议把项目放到这里：

```bash
/www/wwwroot/yuwen
```

你可以二选一：

### 方式 A：宝塔文件管理器上传压缩包

1. 本地把项目压缩成 zip
2. 上传到 `/www/wwwroot/`
3. 解压到 `/www/wwwroot/yuwen`

### 方式 B：服务器拉代码

```bash
cd /www/wwwroot
git clone 你的仓库地址 yuwen
cd yuwen
```

上传完成后，你应该能看到这些目录：

- `apps/web`
- `apps/api`
- `packages`
- `deploy/baota`
- `compose.yml`

---

## 8. 用 Docker 启动 PostgreSQL 和 Redis

进入项目目录：

```bash
cd /www/wwwroot/yuwen
docker compose up -d postgres redis
docker compose ps
```

你应该看到：

- `postgres` 是 `Up`
- `redis` 是 `Up`

如果这里报 `docker compose: command not found`，说明 Docker Compose 插件还没装好，需要先修 Docker。

参考：

- [Docker Engine Ubuntu 安装](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose Linux 安装](https://docs.docker.com/compose/install/linux/)
- [宝塔 Docker 文档](https://docs.bt.cn/user-guide/docker/website/docker-website-tutorial)

---

## 9. 安装项目依赖

```bash
cd /www/wwwroot/yuwen
pnpm install
```

第一次会慢一点，正常。

这里不要自己改成：

```bash
pnpm install --prod
```

原因是当前仓库的构建和 API 启动还会用到开发依赖；如果你装成纯生产依赖，后面 `pnpm build:web` 或 `pm2 start` 很可能会失败。

如果这里失败，先不要继续点宝塔，先把依赖装成功。

---

## 10. 配置环境变量

### 10.1 配置 Web 环境变量

复制模板：

```bash
cd /www/wwwroot/yuwen
cp deploy/baota/web.env.production.example apps/web/.env.production
```

编辑文件：

```bash
nano apps/web/.env.production
```

改成你的真实域名：

```env
NEXT_PUBLIC_API_BASE_URL="https://api.your-domain.com"
NEXT_PUBLIC_WS_URL="https://api.your-domain.com"
```

### 10.2 配置 API 环境变量

复制模板：

```bash
cd /www/wwwroot/yuwen
cp deploy/baota/api.env.production.example apps/api/.env.production
```

编辑文件：

```bash
nano apps/api/.env.production
```

至少要改这些：

```env
PORT="4000"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/yuwen"
REDIS_URL="redis://127.0.0.1:6379"
WEB_APP_URL="https://chat.your-domain.com"
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的 SMTP 授权码"
ADMIN_EMAILS="你的管理员邮箱"
```

说明：

- `MAIL_SMTP_PASSWORD` 通常不是邮箱登录密码，而是 SMTP 授权码
- 飞书后台要先确认 SMTP / 第三方客户端能力已开启
- `ADMIN_EMAILS` 是管理员邮箱白名单，多个邮箱用英文逗号分隔
- 这些邮箱注册或登录后，会自动获得 `ADMIN` 角色

示例：

```env
ADMIN_EMAILS="founder@your-domain.com,ops@your-domain.com"
```

---

## 11. 初始化数据库

当前仓库首发部署先走 `db push`，执行：

```bash
cd /www/wwwroot/yuwen
set -a
source apps/api/.env.production
set +a
pnpm db:generate
pnpm db:push
```

如果这里成功，说明：

- Prisma Client 生成成功
- 数据库表结构已经推到 PostgreSQL

---

## 12. 构建前端和 API

```bash
cd /www/wwwroot/yuwen
pnpm build:web
pnpm --filter @yuwen/api build
```

如果这里任意一步报错，不要继续做 PM2。先把构建错误解决。

---

## 13. 配置 PM2

仓库里已经有模板：

- [deploy/baota/ecosystem.config.cjs.example](/Users/shawn/Library/CloudStorage/OneDrive-Personal/文档/New project/deploy/baota/ecosystem.config.cjs.example)

复制：

```bash
cd /www/wwwroot/yuwen
cp deploy/baota/ecosystem.config.cjs.example ecosystem.config.cjs
```

打开检查：

```bash
nano ecosystem.config.cjs
```

通常你只需要确认这一行：

```js
const rootDir = "/www/wwwroot/yuwen";
```

如果你的项目就放在这个目录，不用改。

再确认下面两行分别是：

```js
args: "--filter @yuwen/web exec next start --hostname 127.0.0.1 --port 3000",
```

```js
args: "--filter @yuwen/api exec tsx dist/apps/api/src/main.js",
```

### 13.1 启动 PM2

```bash
cd /www/wwwroot/yuwen
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

执行 `pm2 startup` 后，终端会返回一整条命令，你必须再复制执行那一条，PM2 才会真正设置为开机自启。

### 13.2 检查 PM2 状态

```bash
pm2 list
pm2 logs yuwen-web
pm2 logs yuwen-api
```

你理想中应该看到：

- `yuwen-web` 是 `online`
- `yuwen-api` 是 `online`

此时本机应该已经有两个内部服务：

- `127.0.0.1:3000`
- `127.0.0.1:4000`

你可以用下面命令快速自检：

```bash
curl -I http://127.0.0.1:3000
curl -i http://127.0.0.1:4000/me
```

如果第二条返回 `401 Unauthorized`，这是正常的，说明 API 已经启动成功。

参考：

- [宝塔 PM2 部署文档](https://docs.bt.cn/practical-tutorials/nodejs-pm2-deployment)
- [PM2 Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Ecosystem 文档](https://pm2.keymetrics.io/docs/usage/application-declaration/)

---

## 14. 在宝塔里创建两个站点

现在开始做 Nginx 反代。

进入：

- 宝塔面板
- `网站`
- `添加站点`

你需要创建两个站点：

### 站点 1：前端

- 域名：`chat.your-domain.com`
- 根目录：`/www/wwwroot/_sites/chat`

### 站点 2：API

- 域名：`api.your-domain.com`
- 根目录：`/www/wwwroot/_sites/api`

说明：

- 这里的目录只是为了让宝塔创建站点，不是程序真正运行目录
- 真正的程序目录仍然是 `/www/wwwroot/yuwen`

如果宝塔要求你选择 PHP 版本，选：

- `纯静态`
- 或者选不启用 PHP

不要把站点目录直接指到 Next.js 项目目录。

参考：

- [宝塔创建站点文档](https://docs.bt.cn/getting-started/create-web)

---

## 15. 给两个站点配置反向代理

### 15.1 配置 chat.your-domain.com

进入：

- `网站`
- 找到 `chat.your-domain.com`
- `设置`
- `反向代理`
- `添加反向代理`

填写建议：

- 代理名称：`yuwen-web`
- 目标 URL：`http://127.0.0.1:3000`
- 发送域名：`$host`

保存后，访问：

- `http://chat.your-domain.com`

如果此时是灰云，并且 PM2 正常运行，你应该已经能看到 Web 页面。

### 15.2 配置 api.your-domain.com

进入：

- `网站`
- 找到 `api.your-domain.com`
- `设置`
- `反向代理`
- `添加反向代理`

填写建议：

- 代理名称：`yuwen-api`
- 目标 URL：`http://127.0.0.1:4000`
- 发送域名：`$host`

### 15.3 API 站点必须确认 WebSocket

语闻 API 后面会跑 Socket.IO，所以 `api` 站点要支持 WebSocket。

宝塔生成的反向代理配置里，建议确认有这些内容：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
```

如果你不知道在哪看：

1. 打开 `api.your-domain.com`
2. `设置`
3. `配置文件`
4. 搜索 `location` 或 `proxy_set_header`

Cloudflare 官方文档说明：

- Cloudflare 支持代理 WebSocket
- 在 Cloudflare `Network` 页面里可以确认 `WebSockets` 已开启

---

## 16. 先在灰云状态下申请源站 SSL

这一步非常重要。

当前建议顺序：

1. 先保持 `chat` 和 `api` 两条 DNS 为 `DNS only`
2. 先在宝塔给两个站点申请证书
3. 确认源站 HTTPS 正常
4. 再切回 Cloudflare 橙云

### 16.1 给 chat.your-domain.com 申请证书

进入：

- `网站`
- `chat.your-domain.com`
- `SSL`
- 选择 `Let's Encrypt`
- 勾选域名
- `申请`

申请成功后：

- 打开 `强制 HTTPS`

### 16.2 给 api.your-domain.com 申请证书

同样操作一遍：

- `网站`
- `api.your-domain.com`
- `SSL`
- `Let's Encrypt`
- `申请`
- 打开 `强制 HTTPS`

如果申请失败，先检查：

- DNS 记录是否已经指向这台服务器
- Cloudflare 是否还是灰云
- `80` 端口是否放通
- 站点是否已经创建成功

参考：

- [宝塔 SSL 文档](https://docs.bt.cn/getting-started/deploy-ssl)

---

## 17. 源站先自检一次

证书成功后，先直接检查：

1. 浏览器打开 `https://chat.your-domain.com`
2. 浏览器打开 `https://api.your-domain.com`

你预期看到的结果：

- `chat` 能打开站点
- `api` 至少不是 `502`
- 如果打开 `https://api.your-domain.com/me`，可能返回未登录或鉴权错误，这是正常的

如果这一步都没通，先不要开 Cloudflare 橙云。

---

## 18. 切回 Cloudflare 橙云

当灰云状态下已经确认：

- Web 可打开
- API 可访问
- HTTPS 正常
- PM2 正常

这时再回到 Cloudflare：

- `DNS`
- `Records`

把这两条记录从 `DNS only` 改为 `Proxied`：

- `chat`
- `api`

也就是把灰云切成橙云。

---

## 19. 配置 Cloudflare SSL/TLS

现在回到 Cloudflare 面板：

- 选择你的域名
- `SSL/TLS`
- `Overview`

把模式设置为：

- `Full (strict)`

为什么推荐这个模式：

- 浏览器到 Cloudflare 是 HTTPS
- Cloudflare 到你的源站也是 HTTPS
- Cloudflare 还会校验证书是否有效

如果你开了橙云但没给源站配有效证书，Cloudflare 很容易报 `526`。

### 19.1 推荐再检查这两个页面

#### `SSL/TLS -> Edge Certificates`

建议：

- 打开 `Always Use HTTPS`

#### `Network`

确认：

- `WebSockets` 为 `On`

Cloudflare 官方说明：

- DNS 记录可在 `DNS -> Records -> Add record` 里创建
- WebSocket 支持代理
- `Full (strict)` 需要源站 `443` 正常且证书有效

---

## 20. 最终联调检查

现在按这个顺序检查：

### 20.1 服务器侧

```bash
docker compose ps
pm2 list
pm2 logs yuwen-web --lines 50
pm2 logs yuwen-api --lines 50
```

### 20.2 浏览器侧

打开：

1. `https://chat.your-domain.com`
2. `https://api.your-domain.com/me`
3. `https://chat.your-domain.com/admin`

### 20.3 功能侧

依次测：

1. 登录页能打开
2. 管理员邮箱能登录后台
3. 普通用户不能进后台
4. 验证码邮件能发出
5. Magic Link 邮件能发出

---

## 21. Cloudflare + 宝塔 最常见报错

这里我把最容易踩的坑单独列出来。

### 1) Cloudflare 报 521

常见原因：

- 宝塔 Nginx 没启动
- `80` 或 `443` 没放行
- 站点没创建成功

先查：

```bash
systemctl status nginx
```

然后检查：

- 云服务器安全组
- 宝塔站点是否存在
- `chat` 和 `api` 域名是否指向这台服务器

### 2) Cloudflare 报 522

常见原因：

- Cloudflare 能解析到你的 IP
- 但连不上你的源站

通常是：

- 防火墙没放行
- 服务器网络问题
- Nginx 监听异常

### 3) Cloudflare 报 526

这是非常典型的 `Full (strict)` 问题。

意思通常是：

- 你已经开了 `Full (strict)`
- 但源站证书无效、过期，或域名不匹配

修复思路：

1. 回宝塔确认 `chat` 和 `api` 都已经有有效证书
2. 源站浏览器直接访问 HTTPS 是否正常
3. 再检查 Cloudflare SSL/TLS 模式是不是 `Full (strict)`

### 4) 宝塔站点打开 502

常见原因：

- `yuwen-web` 没启动
- `yuwen-api` 没启动
- 反代目标端口写错

先查：

```bash
pm2 list
pm2 logs yuwen-web
pm2 logs yuwen-api
```

### 5) 前端能打开，但接口请求错到 localhost

说明你构建 Web 前，`apps/web/.env.production` 没配好。

修复：

```bash
cd /www/wwwroot/yuwen
pnpm build:web
pm2 restart yuwen-web
```

### 6) 邮件发不出去

常见原因：

- 飞书 SMTP 没开
- SMTP 授权码写错
- 发件人地址不一致

重点检查：

- `MAIL_SMTP_USER`
- `MAIL_SMTP_PASSWORD`
- `MAIL_FROM_ADDRESS`
- `MAIL_REPLY_TO`

### 7) Socket.IO 连不上

先查三件事：

1. `NEXT_PUBLIC_WS_URL` 是否写成 `https://api.your-domain.com`
2. 宝塔 `api` 站点反代里是否包含 WebSocket 升级头
3. Cloudflare `Network -> WebSockets` 是否开启

---

## 22. 以后怎么更新项目

### 22.1 普通更新

如果只是前后端代码更新，没有数据库结构变化：

```bash
cd /www/wwwroot/yuwen
git pull
pnpm install
pnpm build:web
pm2 restart yuwen-api
pm2 restart yuwen-web
```

### 22.2 如果 Prisma schema 变了

多加一步：

```bash
cd /www/wwwroot/yuwen
set -a
source apps/api/.env.production
set +a
pnpm db:push
pm2 restart yuwen-api
pm2 restart yuwen-web
```

### 22.3 更新后检查什么

至少检查：

1. `pm2 list`
2. `https://chat.your-domain.com`
3. `https://api.your-domain.com/me`
4. 登录功能
5. 管理后台

---

## 23. 我建议你这样理解整套流程

如果你是第一次部署，记住这个最稳顺序：

1. 先把 Cloudflare DNS 配成灰云
2. 安装宝塔、Node、Docker
3. 启动 PostgreSQL / Redis
4. 配环境变量
5. 初始化数据库
6. PM2 跑起 Web / API
7. 宝塔站点反代到 `3000` / `4000`
8. 宝塔申请 `Let's Encrypt`
9. 先确认源站 HTTPS 正常
10. 再把 Cloudflare 切回橙云
11. Cloudflare SSL/TLS 设成 `Full (strict)`

这个顺序排错最轻松。

---

## 24. 官方参考

- [宝塔安装文档](https://docs.bt.cn/10.0/getting-started/quick-installation-of-bt-panel)
- [宝塔创建站点文档](https://docs.bt.cn/getting-started/create-web)
- [宝塔 SSL 文档](https://docs.bt.cn/getting-started/deploy-ssl)
- [宝塔 PM2 部署文档](https://docs.bt.cn/practical-tutorials/nodejs-pm2-deployment)
- [Docker Engine Ubuntu 安装](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose Linux 安装](https://docs.docker.com/compose/install/linux/)
- [PM2 Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Ecosystem 文档](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [Cloudflare DNS 记录文档](https://developers.cloudflare.com/dns/manage-dns-records/)
- [Cloudflare 创建 DNS 记录步骤](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- [Cloudflare Full (strict) 文档](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/)
- [Cloudflare WebSockets 文档](https://developers.cloudflare.com/network/websockets/)
