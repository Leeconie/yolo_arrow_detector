# 服务器配置文档

本文档说明如何在Ubuntu服务器上直接配置Nginx（不使用Docker）。

## 一、安装Nginx

### 1.1 更新包列表

```bash
sudo apt update
```

### 1.2 安装Nginx

```bash
sudo apt install nginx -y
```

### 1.3 验证安装

```bash
nginx -v
```

## 二、配置Nginx

### 2.1 复制配置文件

```bash
# 备份原配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 复制新配置（根据实际情况调整）
sudo cp resources/server/nginx/nginx.conf /etc/nginx/nginx.conf
```

### 2.2 创建站点配置

```bash
# 创建站点配置目录
sudo mkdir -p /etc/nginx/sites-available
sudo mkdir -p /etc/nginx/sites-enabled

# 创建站点配置文件
sudo nano /etc/nginx/sites-available/aimeasurearchery
```

站点配置示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/aimeasurearchery/dist;
    index index.html;

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML文件不缓存
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

### 2.3 启用站点

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/aimeasurearchery /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载Nginx
sudo systemctl reload nginx
```

## 三、配置Gzip压缩

Gzip压缩已在主配置文件中启用，无需额外配置。

验证Gzip是否启用：

```bash
curl -H "Accept-Encoding: gzip" -I http://localhost
```

应该看到 `Content-Encoding: gzip` 响应头。

## 四、配置Brotli压缩（可选）

### 4.1 安装Brotli模块

```bash
# Ubuntu 20.04+
sudo apt install nginx-module-brotli -y
```

### 4.2 加载Brotli模块

在 `/etc/nginx/nginx.conf` 文件顶部添加：

```nginx
load_module modules/ngx_http_brotli_filter_module.so;
load_module modules/ngx_http_brotli_static_module.so;
```

### 4.3 启用Brotli

在 `http` 块中添加Brotli配置（参考 `resources/server/nginx/nginx.conf`）。

### 4.4 重新加载Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 五、部署应用

### 5.1 构建应用

```bash
# 在项目目录执行
pnpm build
```

### 5.2 复制构建产物

```bash
# 创建目标目录
sudo mkdir -p /var/www/aimeasurearchery

# 复制构建产物
sudo cp -r dist/* /var/www/aimeasurearchery/

# 设置权限
sudo chown -R www-data:www-data /var/www/aimeasurearchery
sudo chmod -R 755 /var/www/aimeasurearchery
```

## 六、HTTPS配置（可选）

### 6.1 使用Let's Encrypt

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx -y

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

### 6.2 更新站点配置

certbot会自动更新Nginx配置，添加SSL相关配置。

## 七、防火墙配置

### 7.1 允许HTTP和HTTPS

```bash
sudo ufw allow 'Nginx Full'
# 或分别允许
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 7.2 启用防火墙

```bash
sudo ufw enable
```

## 八、监控和维护

### 8.1 查看Nginx状态

```bash
sudo systemctl status nginx
```

### 8.2 查看日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 8.3 重新加载配置

```bash
# 测试配置
sudo nginx -t

# 重新加载（不中断服务）
sudo systemctl reload nginx

# 重启（会中断服务）
sudo systemctl restart nginx
```

## 九、性能优化

### 9.1 调整worker进程数

在 `/etc/nginx/nginx.conf` 中：

```nginx
worker_processes auto;  # 自动检测CPU核心数
```

### 9.2 调整连接数

```nginx
events {
    worker_connections 2048;  # 根据服务器性能调整
}
```

### 9.3 启用文件缓存

在站点配置中添加：

```nginx
open_file_cache max=1000 inactive=20s;
open_file_cache_valid 30s;
open_file_cache_min_uses 2;
open_file_cache_errors on;
```

## 十、安全建议

1. **隐藏Nginx版本**：已在配置中设置 `server_tokens off;`
2. **限制请求大小**：添加 `client_max_body_size 10m;`
3. **防止DDoS**：配置 `limit_req` 和 `limit_conn`
4. **安全头**：添加安全响应头（已在Docker配置中示例）

## 十一、更新记录

- 2026-01-08: 初始版本创建
