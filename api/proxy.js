const http = require('node:http');
const https = require('node:https');

module.exports = (req, res) => {
    if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('Method Not Allowed');
    }

    const host = req.headers.host || 'localhost';
    const url = new URL(req.url, `http://${host}`);

    if (url.pathname === '/api/proxy' && url.searchParams.has('url')) {
        const imageUrl = url.searchParams.get('url');

        // 仅允许 http/https 协议
        if (!/^https?:\/\//i.test(imageUrl)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain');
            return res.end('Only HTTP/HTTPS URLs are supported');
        }

        const fetchAndPipe = (targetUrl, redirectCount = 0) => {
            if (redirectCount > 3) {
                res.statusCode = 508;
                res.setHeader('Content-Type', 'text/plain');
                return res.end('Too many redirects');
            }

            const isHttps = targetUrl.startsWith('https://');
            const client = isHttps ? https : http;
            const options = new URL(targetUrl);
            options.headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
            };

            const request = client.get(options, (imageRes) => {
                // 跟随 3xx 跳转
                if (imageRes.statusCode && imageRes.statusCode >= 300 && imageRes.statusCode < 400 && imageRes.headers.location) {
                    const redirectUrl = imageRes.headers.location.startsWith('http')
                        ? imageRes.headers.location
                        : new URL(imageRes.headers.location, targetUrl).toString();
                    imageRes.resume(); // 丢弃当前响应数据
                    return fetchAndPipe(redirectUrl, redirectCount + 1);
                }

                if (imageRes.statusCode && imageRes.statusCode >= 200 && imageRes.statusCode < 300) {
                    res.statusCode = 200;
                    if (imageRes.headers['content-type']) {
                        res.setHeader('Content-Type', imageRes.headers['content-type']);
                    } else {
                        res.setHeader('Content-Type', 'application/octet-stream');
                    }
                    if (imageRes.headers['cache-control']) {
                        res.setHeader('Cache-Control', imageRes.headers['cache-control']);
                    }
                    if (imageRes.headers['content-length']) {
                        res.setHeader('Content-Length', imageRes.headers['content-length']);
                    }
                    imageRes.pipe(res);
                } else {
                    res.statusCode = imageRes.statusCode || 502;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Error fetching the image');
                }
            });

            request.on('error', (err) => {
                console.error(err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error fetching the image');
            });
        };

        fetchAndPipe(imageUrl);
    } else {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Image URL is required');
    }
};


