const http = require('node:http');
const https = require('node:https');
const ExcelJS = require('exceljs');
const imageSize = require('image-size');

/**
 * 读取请求体为 Buffer（用于接收前端直接 POST 的二进制 .xlsx 文件）
 */
function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

/**
 * 下载远程图片为 Buffer
 */
function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        if (!/^https?:\/\//i.test(url)) return reject(new Error('Only http/https supported'));
        const client = url.startsWith('https://') ? https : http;
        client.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * 主处理：
 * - 仅支持 .xlsx（ExcelJS 不支持 .xls）
 * - 规则：
 *   1) 表头包含“链接”或“主页”的列，将单元格文本设为超链接（显示为 "Link"）
 *   2) 表头包含“图”或“头像”的列，将文本视为图片 URL，抓取并插入图片
 */
async function processWorkbook(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    workbook.eachSheet((worksheet) => {
        const headerRow = worksheet.getRow(1);
        if (!headerRow || headerRow.cellCount === 0) return;

        const maxRow = worksheet.rowCount;
        const maxCol = worksheet.columnCount;

        for (let r = 2; r <= maxRow; r++) {
            const row = worksheet.getRow(r);
            for (let c = 1; c <= maxCol; c++) {
                const cell = row.getCell(c);
                const headerCell = headerRow.getCell(c);
                const headerName = String(headerCell.value || '').trim();
                const cellText = cell.text ? String(cell.text).trim() : '';
                if (!cellText) continue;

                // 1) 超链接
                if (headerName.includes('链接') || headerName.includes('主页')) {
                    // ExcelJS 超链接：使用富文本/值对象设置
                    cell.value = { text: 'Link', hyperlink: cellText }; // 显示文本 Link
                    // 样式：蓝色下划线
                    cell.font = { color: { argb: 'FF0000FF' }, underline: true };
                    continue;
                }

                // 2) 插入图片
                if (headerName.includes('图') || headerName.includes('头像')) {
                    try {
                        const imgBuf = await fetchImageBuffer(cellText);
                        let dimensions = { width: 120, height: 120 };
                        try {
                            const size = imageSize(imgBuf);
                            if (size && size.width && size.height) {
                                dimensions = { width: size.width, height: size.height };
                            }
                        } catch (_) {}

                        // 统一转为 PNG，ExcelJS 需要指定图片类型
                        // 这里不强制转换格式，仅按最常见类型判断，无法判断则按 PNG 处理
                        const lower = cellText.toLowerCase();
                        const extType = lower.endsWith('.jpg') || lower.endsWith('.jpeg') ? 'jpeg' : lower.endsWith('.webp') ? 'png' : lower.endsWith('.gif') ? 'gif' : 'png';
                        const imageId = workbook.addImage({ buffer: imgBuf, extension: extType });

                        // ExcelJS 坐标从 0 开始；将图片锚定在当前单元格左上角
                        worksheet.addImage(imageId, {
                            tl: { col: c - 1, row: r - 1 },
                            ext: { width: dimensions.width, height: dimensions.height },
                            editAs: 'oneCell'
                        });

                        // 清空文本
                        cell.value = '';
                    } catch (_) {
                        // 下载失败则保留原文本
                    }
                }
            }
        }
    });

    const out = await workbook.xlsx.writeBuffer();
    return Buffer.from(out);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('仅支持 POST');
    }

    try {
        const data = await readRequestBody(req);
        // 简单校验是否为 xlsx（ZIP 头：PK\x03\x04）
        if (!data || data.length < 4 || !(data[0] === 0x50 && data[1] === 0x4B)) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end('请上传 .xlsx 文件（不支持 .xls）');
        }

        const processed = await processWorkbook(data);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="processed.xlsx"');
        res.end(processed);
    } catch (e) {
        console.error(e);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('服务器错误: ' + (e && e.message ? e.message : String(e)));
    }
};


