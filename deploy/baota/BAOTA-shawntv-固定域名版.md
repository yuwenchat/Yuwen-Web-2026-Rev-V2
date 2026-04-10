# 语闻宝塔部署，ShawnTV 固定域名版

这份文档是直接按你的域名写死的版本。

如果你只想直接复制 `.env.production` 内容，不想自己拼配置，直接看：

- [deploy/baota/最终可直接粘贴的配置-ShawnTV.md](/Users/shawn/Library/CloudStorage/OneDrive-Personal/文档/New project/deploy/baota/最终可直接粘贴的配置-ShawnTV.md)

固定使用：

- 前端域名：`chat2.shawntv.co`
- API 域名：`yuwenapi2.shawntv.co`
- 项目目录：`/www/wwwroot/chat2.shawntv.co`

你这次部署时，直接照着做就行，不需要自己再替换域名。

先直接回答你这个问题：

- 可以，`服务器公网 IP`、`飞书邮箱`、`飞书 SMTP 授权码`、`管理员邮箱` 这几个信息，完全可以尽量用图形界面填写
- `服务器公网 IP`：是在 `Cloudflare` 后台图形界面里填
- `飞书邮箱 / SMTP 授权码 / 管理员邮箱`：是在 `宝塔文件管理器` 里打开 `.env.production` 文件直接编辑
- 也就是说，这几个值不一定要用命令行改

你可以把它理解成：

- Cloudflare 负责“填 IP”
- 宝塔负责“填邮箱和管理员”

---

## 1. Cloudflare 先加两条 DNS

登录 Cloudflare：

1. 打开你的域名
2. 点 `DNS`
3. 点 `Add record`

添加这两条：

### 前端

- Type：`A`
- Name：`chat2`
- IPv4：`你的服务器公网 IP`
- Proxy status：`DNS only`

### API

- Type：`A`
- Name：`yuwenapi2`
- IPv4：`你的服务器公网 IP`
- Proxy status：`DNS only`

这里先保持灰云，不要先开橙云。

---

## 2. 宝塔里创建两个网站

登录宝塔后：

1. 左边点 `网站`
2. 点 `添加站点`

### 第一个站点

- 域名：`chat2.shawntv.co`
- 根目录：让宝塔自动创建

创建后，目录一般就是：

```bash
/www/wwwroot/chat2.shawntv.co
```

### 第二个站点

- 域名：`yuwenapi2.shawntv.co`
- 根目录：让宝塔自动创建

注意这次最核心的思路：

- 语闻项目代码直接放在 `/www/wwwroot/chat2.shawntv.co`
- `yuwenapi2.shawntv.co` 这个站点主要用来做反向代理和 SSL

---

## 3. 宝塔软件商店安装这 4 个

去 `软件商店` 安装：

1. `Nginx`
2. `PM2管理器`
3. `Docker管理器`
4. `终端`

---

## 4. 在宝塔终端安装 Node 和 pnpm

打开宝塔 `终端`，复制执行：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
corepack enable
corepack prepare pnpm@9.15.4 --activate
node -v
pnpm -v
```

看见版本号就继续。

---

## 5. 把项目代码放进前端站点目录

项目目录固定就是：

```bash
/www/wwwroot/chat2.shawntv.co
```

### 方式 A：上传 zip

1. 本地把项目压缩成 zip
2. 上传到 `/www/wwwroot/chat2.shawntv.co`
3. 解压

### 方式 B：git clone

```bash
cd /www/wwwroot/chat2.shawntv.co
git clone 你的仓库地址 .
```

如果提示目录不是空的：

1. 回宝塔文件管理器
2. 删除这个目录里宝塔自动生成的默认文件
3. 再执行一次 `git clone`

如果你怕麻烦，直接用上传 zip 最稳。

---

## 6. 启动数据库和 Redis

在宝塔终端执行：

```bash
cd /www/wwwroot/chat2.shawntv.co
docker compose up -d postgres redis
docker compose ps
```

看到：

- `postgres` 是 `Up`
- `redis` 是 `Up`

就可以继续。

---

## 7. 安装项目依赖

```bash
cd /www/wwwroot/chat2.shawntv.co
pnpm install
```

不要改成 `pnpm install --prod`。

---

## 8. 配置前端环境变量

先复制模板：

```bash
cd /www/wwwroot/chat2.shawntv.co
cp deploy/baota/web.env.shawntv.最终填写版.example apps/web/.env.production
```

复制完以后，不一定要用命令行改。

你可以直接在宝塔图形界面里改：

1. 左侧点 `文件`
2. 进入 `/www/wwwroot/chat2.shawntv.co/apps/web/`
3. 找到 `.env.production`
4. 点 `编辑`

如果你想用命令行，也可以再打开：

```bash
nano apps/web/.env.production
```

里面应该是：

```env
NEXT_PUBLIC_API_BASE_URL="https://yuwenapi2.shawntv.co"
NEXT_PUBLIC_WS_URL="https://yuwenapi2.shawntv.co"
```

---

## 9. 配置后端环境变量

先复制模板：

```bash
cd /www/wwwroot/chat2.shawntv.co
cp deploy/baota/api.env.shawntv.最终填写版.example apps/api/.env.production
```

复制完以后，推荐你直接用宝塔图形界面修改：

1. 左侧点 `文件`
2. 进入 `/www/wwwroot/chat2.shawntv.co/apps/api/`
3. 找到 `.env.production`
4. 点 `编辑`

如果你想用命令行，也可以再编辑：

```bash
nano apps/api/.env.production
```

你主要改这几项：

```env
WEB_APP_URL="https://chat2.shawntv.co"
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的管理员邮箱"
```

最简单示例：

```env
WEB_APP_URL="https://chat2.shawntv.co"
MAIL_FROM_ADDRESS="hello@shawntv.co"
MAIL_REPLY_TO="hello@shawntv.co"
MAIL_SMTP_USER="hello@shawntv.co"
MAIL_SMTP_PASSWORD="这里填飞书 SMTP 授权码"
ADMIN_EMAILS="hello@shawntv.co"
```

如果你还没准备好飞书 SMTP：

- 项目可以先跑起来
- 只是验证码和 Magic Link 邮件暂时发不出去

### 9.1 你现在真正只要改这 4 个值

在宝塔图形界面打开：

```bash
/www/wwwroot/chat2.shawntv.co/apps/api/.env.production
```

然后只改这几行：

```env
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的管理员邮箱"
```

说明非常简单：

- `MAIL_FROM_ADDRESS`：发件邮箱
- `MAIL_REPLY_TO`：收件人点击“回复”时回到哪个邮箱
- `MAIL_SMTP_USER`：SMTP 登录账号
- `MAIL_SMTP_PASSWORD`：SMTP 授权码
- `ADMIN_EMAILS`：谁能进管理后台

如果目前你只打算自己先用：

```env
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的飞书邮箱"
```

也就是说，最简单情况下：

- 飞书邮箱，填 4 次
- SMTP 授权码，填 1 次
- 管理员邮箱，填 1 次

### 9.2 服务器公网 IP 在哪里填

这个不是在项目文件里填。

它是在 `Cloudflare -> DNS` 页面里填到这两条 A 记录里：

- `chat2`
- `yuwenapi2`

所以你不用去宝塔文件里找“服务器公网 IP”这个配置项。

---

## 10. 初始化数据库

```bash
cd /www/wwwroot/chat2.shawntv.co
set -a
source apps/api/.env.production
set +a
pnpm db:generate
pnpm db:push
```

---

## 11. 构建前端和 API

```bash
cd /www/wwwroot/chat2.shawntv.co
pnpm build:web
pnpm --filter @yuwen/api build
```

如果这里任意一步报错，先停下来，不要继续下一步。

---

## 12. 用 PM2 启动语闻

复制模板：

```bash
cd /www/wwwroot/chat2.shawntv.co
cp deploy/baota/ecosystem.config.cjs.example ecosystem.config.cjs
```

编辑：

```bash
nano ecosystem.config.cjs
```

确认这一行是：

```js
const rootDir = "/www/wwwroot/chat2.shawntv.co";
```

再确认下面两行分别是：

```js
args: "--filter @yuwen/web exec next start --hostname 127.0.0.1 --port 3000",
```

```js
args: "--filter @yuwen/api exec tsx dist/apps/api/src/main.js",
```

然后启动：

```bash
cd /www/wwwroot/chat2.shawntv.co
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

`pm2 startup` 执行完后，终端会给你一整条命令，再复制执行一次。

检查：

```bash
pm2 list
```

你要看到：

- `yuwen-web` 是 `online`
- `yuwen-api` 是 `online`

本机再检查一次：

```bash
curl -I http://127.0.0.1:3000
curl -i http://127.0.0.1:4000/me
```

你预期看到：

- `3000` 返回网页响应
- `4000/me` 返回 `401 Unauthorized` 也正常，说明 API 已经活了，只是还没登录

---

## 13. 宝塔里配置反向代理

### 前端站点 `chat2.shawntv.co`

路径：

1. `网站`
2. 找到 `chat2.shawntv.co`
3. `设置`
4. `反向代理`
5. `添加反向代理`

填写：

- 代理名称：`yuwen-web`
- 目标 URL：`http://127.0.0.1:3000`
- 发送域名：`$host`

### API 站点 `yuwenapi2.shawntv.co`

路径：

1. `网站`
2. 找到 `yuwenapi2.shawntv.co`
3. `设置`
4. `反向代理`
5. `添加反向代理`

填写：

- 代理名称：`yuwen-api`
- 目标 URL：`http://127.0.0.1:4000`
- 发送域名：`$host`

### API 站点要确认 WebSocket

在：

- `yuwenapi2.shawntv.co`
- `设置`
- `配置文件`

确认里面有：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

如果你在主配置文件里没看到，也先不要慌。

宝塔的反向代理通常会单独写进这个 `include` 目录里：

```nginx
include /www/server/panel/vhost/nginx/proxy/yuwenapi2.shawntv.co/*.conf;
```

也就是说：

- 主配置文件里看不到这三行，不代表没有反向代理
- 这三行很可能在 `反向代理` 生成的单独 `.conf` 文件里

最简单的检查方法：

1. 先确认你已经在宝塔里给 `yuwenapi2.shawntv.co` 添加了反向代理
2. 再看目录 `/www/server/panel/vhost/nginx/proxy/yuwenapi2.shawntv.co/`
3. 打开里面的 `.conf` 文件，检查是否含有上面三行

如果这个目录里根本没有 `.conf` 文件，通常说明：

- 你还没有真正保存反向代理
- 或者宝塔还没生成该站点的反向代理规则

---

## 14. 宝塔里申请 SSL

这时 Cloudflare 还是灰云。

### 给前端申请

1. `网站`
2. `chat2.shawntv.co`
3. `SSL`
4. `Let's Encrypt`
5. `申请`
6. 打开 `强制 HTTPS`

### 给 API 申请

1. `网站`
2. `yuwenapi2.shawntv.co`
3. `SSL`
4. `Let's Encrypt`
5. `申请`
6. 打开 `强制 HTTPS`

---

## 15. 先直接测试

先不要开橙云。

浏览器测试：

1. `https://chat2.shawntv.co`
2. `https://yuwenapi2.shawntv.co/me`

你预期看到：

- 前端页面能打开
- API 不是 `502`
- `/me` 返回未登录也没关系

---

## 16. 最后再回 Cloudflare 开橙云

前面都正常后，再去 Cloudflare：

1. 打开 `DNS`
2. 把 `chat2` 那条从灰云改成橙云
3. 把 `yuwenapi2` 那条从灰云改成橙云

然后去：

1. `SSL/TLS`
2. `Overview`
3. 模式改成 `Full (strict)`

再去：

1. `Network`
2. 确认 `WebSockets` 已开启

---

## 17. 最后检查

服务器里执行：

```bash
pm2 list
docker compose ps
```

浏览器检查：

1. `https://chat2.shawntv.co`
2. `https://chat2.shawntv.co/admin`
3. `https://yuwenapi2.shawntv.co/me`

---

## 18. 以后更新

```bash
cd /www/wwwroot/chat2.shawntv.co
git pull
pnpm install
pnpm db:generate
pnpm build:web
pnpm --filter @yuwen/api build
pm2 restart yuwen-api
pm2 restart yuwen-web
```

如果数据库结构有变化，再加这段：

```bash
cd /www/wwwroot/chat2.shawntv.co
set -a
source apps/api/.env.production
set +a
pnpm db:push
pnpm --filter @yuwen/api build
pm2 restart yuwen-api
pm2 restart yuwen-web
```

---

## 19. 你这次部署只要记住一句话

这次就按这个做：

- 代码放进 `/www/wwwroot/chat2.shawntv.co`
- 前端域名是 `chat2.shawntv.co`
- API 域名是 `yuwenapi2.shawntv.co`

这样是最适合你现在宝塔使用习惯的。
