# ShawnTV 版 `.env.production` 直接粘贴内容

这份就是给你直接复制到宝塔里的。

你只需要改这些地方：

- `你的飞书邮箱`
- `你的飞书 SMTP 授权码`

如果你目前只有你自己一个管理员，那：

- `ADMIN_EMAILS` 也直接填你的飞书邮箱

---

## 1. 粘贴到前端文件

宝塔里打开这个文件：

```bash
/www/wwwroot/chat2.shawntv.co/apps/web/.env.production
```

把里面内容替换成：

```env
NEXT_PUBLIC_API_BASE_URL="https://yuwenapi2.shawntv.co"
NEXT_PUBLIC_WS_URL="https://yuwenapi2.shawntv.co"
```

这个文件你基本不用再改了。

---

## 2. 粘贴到后端文件

宝塔里打开这个文件：

```bash
/www/wwwroot/chat2.shawntv.co/apps/api/.env.production
```

把里面内容替换成下面这整段：

```env
PORT="4000"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/yuwen"
REDIS_URL="redis://127.0.0.1:6379"
WEB_APP_URL="https://chat2.shawntv.co"
ACCESS_TOKEN_TTL_MINUTES="15"
REFRESH_TOKEN_TTL_DAYS="30"
AUTH_CODE_TTL_MINUTES="10"
MAGIC_LINK_TTL_MINUTES="15"
FRIEND_CODE_LENGTH="8"
MAIL_FROM_NAME="语闻"
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_HOST="smtp.feishu.cn"
MAIL_SMTP_PORT="465"
MAIL_SMTP_SECURE="true"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的飞书邮箱"
```

---

## 3. 你真正只需要替换的内容

上面这一大段里，真正要手改的其实就 5 行：

```env
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的飞书邮箱"
```

最简单的做法就是：

- `MAIL_FROM_ADDRESS` 填你的飞书邮箱
- `MAIL_REPLY_TO` 填你的飞书邮箱
- `MAIL_SMTP_USER` 填你的飞书邮箱
- `MAIL_SMTP_PASSWORD` 填你的飞书 SMTP 授权码
- `ADMIN_EMAILS` 也先填你的飞书邮箱

---

## 4. 如果以后你想加第二个管理员

把这一行改成：

```env
ADMIN_EMAILS="你的飞书邮箱,第二个管理员邮箱"
```

中间用英文逗号分隔就行。

---

## 5. 改完以后要执行什么

在宝塔终端里执行：

```bash
cd /www/wwwroot/chat2.shawntv.co
set -a
source apps/api/.env.production
set +a
pnpm db:generate
pnpm db:push
pnpm build:web
pnpm --filter @yuwen/api build
pm2 restart yuwen-web
pm2 restart yuwen-api
```

如果这是第一次部署，还没启动过 PM2，那就执行：

```bash
cd /www/wwwroot/chat2.shawntv.co
cp deploy/baota/ecosystem.config.cjs.example ecosystem.config.cjs
pm2 start ecosystem.config.cjs --env production
pm2 save
```
