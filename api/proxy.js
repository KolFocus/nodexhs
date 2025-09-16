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

        const client = imageUrl.startsWith('https://') ? https : http;

        const request = client.get(imageUrl, (imageRes) => {
            // 处理 3xx 跳转（追踪一次或有限次避免循环）
            if (imageRes.statusCode && imageRes.statusCode >= 300 && imageRes.statusCode < 400 && imageRes.headers.location) {
                const redirectUrl = imageRes.headers.location;
                const nextClient = redirectUrl.startsWith('https://') ? https : http;
                return nextClient.get(redirectUrl, (redirectRes) => {
                    if (redirectRes.statusCode === 200) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', redirectRes.headers['content-type'] || 'application/octet-stream');
                        redirectRes.pipe(res);
                    } else {
                        res.statusCode = redirectRes.statusCode || 502;
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('Error fetching the image');
                    }
                }).on('error', (err) => {
                    console.error(err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Error fetching the image');
                });
            }
            if (imageRes.statusCode === 200) {
                res.statusCode = 200;
                res.setHeader('Content-Type', imageRes.headers['content-type'] || 'application/octet-stream');
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
    } else {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Image URL is required');
    }
};


