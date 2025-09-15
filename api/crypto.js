const xhsCrypto = require('../GenXsAndCommon');
const { encryptSign } = require('../pgy_encryptSign');

module.exports = (req, res) => {
    if (req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ message: 'ok' }));
    }
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }

    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
        body += chunk;
    });
    req.on('end', () => {
        try {
            const jsonData = JSON.parse(body || '{}');

            let resMsg = '';
            if (jsonData.type === 'request_id') {
                const resObject = xhsCrypto.getRequestId();
                resMsg = JSON.stringify(resObject).replace(/"/g, '');
            } else if (jsonData.type === 'pgy') {
                const now = Date.now();
                const resObject = encryptSign(jsonData.route, undefined, now);
                resMsg = JSON.stringify(resObject).replace(/"/g, '');
            } else if (jsonData.type !== 'search_id') {
                const resObject = xhsCrypto.getXs(jsonData.url, jsonData.requestBody, jsonData.a1);
                resMsg = JSON.stringify(resObject);
            } else {
                const resObject = xhsCrypto.generate_search_id();
                resMsg = resObject;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ message: '请求成功', data: resMsg }));
        } catch (err) {
            console.error(err);
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
    });
};


