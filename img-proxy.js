const http = require('node:http');

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    if (url.pathname === '/proxy' && url.searchParams.has('url')) {
        const imageUrl = url.searchParams.get('url');

        // 检查 URL 是否以 http 开头
        if (!imageUrl.startsWith('http://')) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('Only HTTP URLs are supported');
        }

        // 发送 HTTP GET 请求
        http.get(imageUrl, (imageRes) => {
            if (imageRes.statusCode === 200) {
                res.writeHead(200, { 'Content-Type': imageRes.headers['content-type'] });
                imageRes.pipe(res); // 将图片数据直接管道到响应
            } else {
                res.writeHead(imageRes.statusCode, { 'Content-Type': 'text/plain' });
                res.end('Error fetching the image');
            }
        }).on('error', (err) => {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error fetching the image');
        });
    } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Image URL is required');
    }
});

// 监听所有可用网络接口
const hostname = '0.0.0.0';
const PORT = 9400;
server.listen(PORT, hostname, () => {
    console.log(`Image proxy server running at http://${hostname}:${PORT}/`);
});