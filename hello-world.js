const http = require('node:http');
const xhsCrypto = require('./GenXsAndCommon'); // 引入 GenXsAndCommon.js 文件
//const xhsCrypto = require('./xhsCrypto'); // 引入 xhsCrypto.js 文件
const { encryptSign } = require('./pgy_encryptSign');//蒲公英加密破解

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    // 设置接收数据的格式为 UTF-8
    req.setEncoding('utf8');

    // 接收数据片段并拼接
    req.on('data', chunk => {
      body += chunk;
    });

    // 数据接收完毕
    req.on('end', () => {
      try {
        const jsonData = JSON.parse(body); // 将字符串解析为 JSON
         console.log('请求参数:', jsonData);


        let resMsg = '';
          console.log('请求接口成功');
        if(jsonData.type == 'request_id'){
            console.log('进入request_id加密信息获取逻辑1111');
            var resObject= xhsCrypto.getRequestId(); // 调用 getRequestId 方法获取加密相关信息
            resMsg = JSON.stringify(resObject);
            resMsg = resMsg.replace(/"/g, '')
            console.log('request_id加密信息打印:', resMsg);
        }else if(jsonData.type == 'pgy'){
            console.log('进入 pgy 加密信息获取逻辑');
             let o = (new Date).getTime();
            var resObject= encryptSign(jsonData.route,undefined,o);
            resMsg = JSON.stringify(resObject);
            resMsg = resMsg.replace(/"/g, '')
            console.log('pgy 加密信息打印:', resMsg);
        }
        else if(jsonData.type != 'search_id'){
            console.log('进入加密信息获取逻辑');
            var resObject= xhsCrypto.getXs(jsonData.url, jsonData.requestBody,jsonData.a1); // 调用 getXs 方法获取加密相关信息
            resMsg = JSON.stringify(resObject);
            console.log('加密信息打印:', resMsg);
        }else{
            console.log('进入search_id获取逻辑');
            resMsg = xhsCrypto.generate_search_id();
            console.log('search_id信息打印:', resMsg);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: '请求成功', data: resMsg }));
      } catch (err) {
        console.error(err);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: '请求失败' }));
  }
});

const hostname = '0.0.0.0'; // 将应用绑定到所有可用的网络接口
const port = 9400;

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
