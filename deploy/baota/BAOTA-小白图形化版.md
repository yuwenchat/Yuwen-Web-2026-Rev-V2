# 语闻宝塔部署，小白图形化版

这份就是给“第一次部署、只想照着点”的版本。

先直接回答你刚才那个关键问题：

- 是的，如果你在宝塔创建了网站 `chat2.shawntv.co`
- 宝塔一般会自动生成目录：`/www/wwwroot/chat2.shawntv.co`
- 对纯小白来说，最简单就是把语闻项目代码直接放进这个目录里运行

也就是说，这次我们就按这个思路来：

- 前端站点目录：`/www/wwwroot/chat2.shawntv.co`
- API 站点：单独再建一个，比如 `api.chat2.shawntv.co`
- 语闻项目代码：直接放在 `/www/wwwroot/chat2.shawntv.co`

注意：

- API 站点创建后也会有自己的文件夹
- 但 API 那个文件夹基本可以不管，它主要只是让宝塔帮你生成 Nginx 站点和证书
- 真正跑代码的项目目录，我们这次统一就放前端站点目录里

---

## 1. 你最终要准备两个域名

下面用这个例子讲：

- 前端：`chat2.shawntv.co`
- API：`api.chat2.shawntv.co`

如果你 API 域名不是这个，只要把下面所有 `api.chat2.shawntv.co` 换成你自己的 API 域名就行。

---

## 2. Cloudflare 里先加 2 条 DNS

登录 Cloudflare 后：

1. 点进你的域名
2. 打开 `DNS`
3. 点 `Add record`

添加两条：

### 第一条：前端

- Type：`A`
- Name：`chat2`
- IPv4：`你的服务器 IP`
- Proxy status：`DNS only`

### 第二条：API

- Type：`A`
- Name：`api.chat2`
  说明：如果 Cloudflare 不接受这种写法，就直接填 `api`
- IPv4：`你的服务器 IP`
- Proxy status：`DNS only`

这里先用灰云，也就是 `DNS only`，不要急着开橙云。

---

## 3. 宝塔里先创建 2 个网站

登录宝塔：

1. 左侧点 `网站`
2. 点 `添加站点`

创建第一个站点：

- 域名：`chat2.shawntv.co`
- 根目录：让宝塔自动生成

创建后你会看到类似目录：

```bash
/www/wwwroot/chat2.shawntv.co
```

再创建第二个站点：

- 域名：`api.chat2.shawntv.co`
- 根目录：让宝塔自动生成

这时宝塔就帮你把两个站点都建好了。

这里最重要的一句：

- 我们这次把语闻项目放进 `/www/wwwroot/chat2.shawntv.co`

---

## 4. 宝塔软件商店里安装这 4 个

进入 `软件商店`，安装：

1. `Nginx`
2. `PM2管理器`
3. `Docker管理器`
4. `终端`

---

## 5. 打开宝塔终端，只执行这几组命令

### 5.1 安装 Node.js 和 pnpm

把下面整段复制进去执行：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
corepack enable
corepack prepare pnpm@9.15.4 --activate
node -v
pnpm -v
```

如果最后看到了版本号，就继续下一步。

### 5.2 把项目代码放进前端站点目录

你有两种方式：

#### 方式 A：宝塔上传 zip

1. 本地把项目压成 zip
2. 上传到 `/www/wwwroot/chat2.shawntv.co`
3. 解压

#### 方式 B：终端 git clone

如果你的仓库在 Git 上：

```bash
cd /www/wwwroot/chat2.shawntv.co
git clone 你的仓库地址 .
```

注意最后那个点 `.` 不要漏，意思是直接拉到当前目录。

如果这里报“目录不是空的”，说明宝塔自动放了默认文件。最简单处理方式是：

1. 回宝塔文件管理器
2. 进入 `/www/wwwroot/chat2.shawntv.co`
3. 删除里面默认生成的测试文件
4. 再回来执行 `git clone`

如果你嫌麻烦，就直接用“上传 zip 解压”那种方式，最适合纯小白。

### 5.3 启动数据库和 Redis

进入项目目录：

```bash
cd /www/wwwroot/chat2.shawntv.co
docker compose up -d postgres redis
docker compose ps
```

只要看到：

- `postgres` 是 `Up`
- `redis` 是 `Up`

就行。

### 5.4 安装项目依赖

```bash
cd /www/wwwroot/chat2.shawntv.co
pnpm install
```

不要自己改成 `pnpm install --prod`。

---

## 6. 只改 2 个环境变量文件

### 6.1 前端环境变量

复制模板：

```bash
cd /www/wwwroot/chat2.shawntv.co
cp deploy/baota/web.env.production.example apps/web/.env.production
```

编辑：

```bash
nano apps/web/.env.production
```

把内容改成：

```env
NEXT_PUBLIC_API_BASE_URL="https://api.chat2.shawntv.co"
NEXT_PUBLIC_WS_URL="https://api.chat2.shawntv.co"
```

### 6.2 后端环境变量

复制模板：

```bash
cd /www/wwwroot/chat2.shawntv.co
cp deploy/baota/api.env.production.example apps/api/.env.production
```

编辑：

```bash
nano apps/api/.env.production
```

你主要只要改这几项：

```env
WEB_APP_URL="https://chat2.shawntv.co"
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的管理员邮箱"
```

你可以这样理解：

- `MAIL_FROM_ADDRESS`：发件邮箱，填你的飞书邮箱
- `MAIL_REPLY_TO`：回复邮箱，也填你的飞书邮箱
- `MAIL_SMTP_USER`：SMTP 登录账号，通常也是你的飞书邮箱
- `MAIL_SMTP_PASSWORD`：不是邮箱登录密码，通常是飞书邮箱的 SMTP 授权码
- `ADMIN_EMAILS`：谁能登录管理后台

最简单示例：

```env
WEB_APP_URL="https://chat2.shawntv.co"
MAIL_FROM_ADDRESS="hello@shawntv.co"
MAIL_REPLY_TO="hello@shawntv.co"
MAIL_SMTP_USER="hello@shawntv.co"
MAIL_SMTP_PASSWORD="这里填飞书 SMTP 授权码"
ADMIN_EMAILS="hello@shawntv.co"
```

如果你暂时还没弄好飞书 SMTP：

- 项目也能先跑起来
- 但是验证码和 Magic Link 邮件暂时发不出去

---

## 7. 初始化数据库

还是在宝塔终端里执行：

```bash
cd /www/wwwroot/chat2.shawntv.co
set -a
source apps/api/.env.production
set +a
pnpm db:generate
pnpm db:push
```

---

## 8. 构建前端和 API

```bash
cd /www/wwwroot/chat2.shawntv.co
pnpm build:web
pnpm --filter @yuwen/api build
```

如果这里任意一步报错，就先停下来，不要继续点 PM2。

---

## 9. 用 PM2 启动语闻

复制 PM2 模板：

```bash
cd /www/wwwroot/chat2.shawntv.co
cp deploy/baota/ecosystem.config.cjs.example ecosystem.config.cjs
```

编辑：

```bash
nano ecosystem.config.cjs
```

把这一行改成你自己的目录：

```js
const rootDir = "/www/wwwroot/chat2.shawntv.co";
```

再确认下面两行存在：

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

`pm2 startup` 执行完后，会给你一整条命令，再复制执行一次。

检查状态：

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

如果 `4000/me` 返回 `401 Unauthorized`，这是正常的。

---

## 10. 宝塔里给两个站点加反向代理

### 10.1 前端站点 `chat2.shawntv.co`

操作路径：

1. `网站`
2. 找到 `chat2.shawntv.co`
3. 点 `设置`
4. 点 `反向代理`
5. 点 `添加反向代理`

填写：

- 代理名称：`yuwen-web`
- 目标 URL：`http://127.0.0.1:3000`
- 发送域名：`$host`

保存。

### 10.2 API 站点 `api.chat2.shawntv.co`

操作路径：

1. `网站`
2. 找到 `api.chat2.shawntv.co`
3. 点 `设置`
4. 点 `反向代理`
5. 点 `添加反向代理`

填写：

- 代理名称：`yuwen-api`
- 目标 URL：`http://127.0.0.1:4000`
- 发送域名：`$host`

保存。

### 10.3 API 要确认支持 WebSocket

还是在 `api.chat2.shawntv.co -> 设置 -> 配置文件` 里，确认反代配置里有这些：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

这个是为了后面的 Socket.IO。

---

## 11. 宝塔里申请 SSL

这一步先保持 Cloudflare 灰云不变。

### 11.1 给前端申请证书

路径：

1. `网站`
2. `chat2.shawntv.co`
3. `SSL`
4. 选择 `Let's Encrypt`
5. 点 `申请`
6. 打开 `强制 HTTPS`

### 11.2 给 API 申请证书

路径：

1. `网站`
2. `api.chat2.shawntv.co`
3. `SSL`
4. 选择 `Let's Encrypt`
5. 点 `申请`
6. 打开 `强制 HTTPS`

---

## 12. 先直接打开测试

现在先不要开 Cloudflare 橙云。

先测试：

1. 打开 `https://chat2.shawntv.co`
2. 打开 `https://api.chat2.shawntv.co/me`

你预期看到：

- 前端页面能开
- API 页面不是 502
- `/me` 返回未登录或鉴权错误也没关系，这是正常的

---

## 13. 最后才回 Cloudflare 开橙云

前面都正常后，再去 Cloudflare：

1. 打开 `DNS`
2. 把 `chat2` 那条记录从灰云改成橙云
3. 把 API 那条记录也从灰云改成橙云

然后去：

1. `SSL/TLS`
2. `Overview`
3. 模式改成 `Full (strict)`

再去：

1. `Network`
2. 确认 `WebSockets` 是开启状态

---

## 14. 最后检查一次

服务器终端里执行：

```bash
pm2 list
docker compose ps
```

浏览器里检查：

1. `https://chat2.shawntv.co`
2. `https://chat2.shawntv.co/admin`
3. `https://api.chat2.shawntv.co/me`

功能检查：

1. 前端能打开
2. 管理员邮箱能登录后台
3. 普通邮箱不能进后台
4. 如果飞书 SMTP 已填好，验证码和 Magic Link 能发邮件

---

## 15. 以后更新，只用这几条命令

```bash
cd /www/wwwroot/chat2.shawntv.co
git pull
pnpm install
pnpm build:web
pm2 restart yuwen-api
pm2 restart yuwen-web
```

如果数据库结构变了，再多加这一段：

```bash
cd /www/wwwroot/chat2.shawntv.co
set -a
source apps/api/.env.production
set +a
pnpm db:push
pm2 restart yuwen-api
pm2 restart yuwen-web
```

---

## 16. 你只要记住一句话

对你现在这种宝塔部署方式，最简单就是：

- 宝塔先创建前端网站
- 直接用宝塔生成的前端站点目录放语闻代码
- API 再单独建一个站点做反向代理

所以像你说的这个目录：

```bash
/www/wwwroot/chat2.shawntv.co
```

完全可以作为你这次语闻项目的实际运行目录，而且对小白来说，这是最不容易绕晕的方式。
