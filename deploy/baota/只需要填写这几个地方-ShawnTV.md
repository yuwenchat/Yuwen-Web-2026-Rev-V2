# 语闻部署时，你只需要填写这几个地方

这份是最短版本。

你的固定域名已经是：

- 前端：`chat2.shawntv.co`
- API：`yuwenapi2.shawntv.co`

所以你真正需要自己填的，只有下面这些。

---

## 1. 在 Cloudflare 里填服务器公网 IP

打开 Cloudflare：

1. 进入你的域名
2. 点 `DNS`
3. 找到这两条 A 记录

### 记录 1

- Name：`chat2`
- IPv4：填你的服务器公网 IP

### 记录 2

- Name：`yuwenapi2`
- IPv4：填你的服务器公网 IP

注意：

- 这里一开始先保持 `DNS only`
- 不要先开橙云

---

## 2. 在宝塔里填邮箱和管理员

打开宝塔：

1. 左边点 `文件`
2. 打开这个文件：

```bash
/www/wwwroot/chat2.shawntv.co/apps/api/.env.production
```

然后只改下面几行：

```env
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的管理员邮箱"
```

如果你目前只有自己一个管理员，最简单就是：

```env
MAIL_FROM_ADDRESS="你的飞书邮箱"
MAIL_REPLY_TO="你的飞书邮箱"
MAIL_SMTP_USER="你的飞书邮箱"
MAIL_SMTP_PASSWORD="你的飞书 SMTP 授权码"
ADMIN_EMAILS="你的飞书邮箱"
```

也就是说：

- 飞书邮箱：填 4 次
- SMTP 授权码：填 1 次
- 管理员邮箱：填 1 次

---

## 3. 前端 API 地址你基本不用再改

这个文件：

```bash
/www/wwwroot/chat2.shawntv.co/apps/web/.env.production
```

固定应该就是：

```env
NEXT_PUBLIC_API_BASE_URL="https://yuwenapi2.shawntv.co"
NEXT_PUBLIC_WS_URL="https://yuwenapi2.shawntv.co"
```

只要你 API 域名不改，这里就不用动。

---

## 4. 你只要记住一句话

你现在需要自己填的，其实就两类：

- Cloudflare 里填服务器公网 IP
- 宝塔里填飞书邮箱、SMTP 授权码和管理员邮箱

其他内容我已经在固定域名版里帮你写死了。
