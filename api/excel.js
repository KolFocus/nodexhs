const http = require('http');
const https = require('https');

let ExcelJS = null;
let imageSize = null;
async function ensureDeps() {
    if (!ExcelJS) {
        try { ExcelJS = require('exceljs'); } catch (e) { throw new Error('DEPENDENCY_MISSING: exceljs'); }
    }
    if (!imageSize) {
        try { imageSize = require('image-size'); } catch (e) { throw new Error('DEPENDENCY_MISSING: image-size'); }
    }
}

/**
 * 读取请求体为 Buffer（用于接收前端直接 POST 的二进制 .xlsx 文件）
 */
function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let total = 0;
        const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB 上限，避免超大文件触发平台限制
        req.on('data', (c) => {
            total += c.length;
            if (total > MAX_UPLOAD_BYTES) {
                reject(new Error('FILE_TOO_LARGE'));
                req.destroy();
                return;
            }
            chunks.push(c);
        });
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
        const req = client.get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchImageBuffer(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
            const chunks = [];
            let total = 0;
            const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 单图 2MB 上限
            res.on('data', (c) => {
                total += c.length;
                if (total > MAX_IMAGE_BYTES) {
                    reject(new Error('IMAGE_TOO_LARGE'));
                    req.destroy();
                    return;
                }
                chunks.push(c);
            });
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        // 8 秒超时
        req.setTimeout(8000, () => {
            req.destroy(new Error('TIMEOUT'));
        });
        req.on('error', reject);
    });
}

/** 判断图片类型，仅返回 'png' | 'jpeg'，其他返回 null */
function detectPngOrJpeg(buffer) {
    if (!buffer || buffer.length < 12) return null;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'png';
    // JPEG: FF D8 ... FF D9（这里只检测开头）
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpeg';
    return null;
}

/**
 * 主处理：
 * - 仅支持 .xlsx（ExcelJS 不支持 .xls）
 * - 规则：
 *   1) 表头包含“链接”或“主页”的列，将单元格文本设为超链接（显示为 "Link"）
 *   2) 表头包含“图”或“头像”的列，将文本视为图片 URL，抓取并插入图片
 */
async function processWorkbook(buffer) {
    await ensureDeps();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    workbook.eachSheet((worksheet) => {
        const headerRow = worksheet.getRow(1);
        if (!headerRow || headerRow.cellCount === 0) return;

        const maxRow = worksheet.rowCount;
        const maxCol = worksheet.columnCount;

        let insertedCount = 0;
        const MAX_IMAGES = 30; // 单工作表最多插入 30 张图片
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
                    if (insertedCount >= MAX_IMAGES) {
                        continue; // 超出上限，跳过插图
                    }
                    try {
                        const imgBuf = await fetchImageBuffer(cellText);
                        const type = detectPngOrJpeg(imgBuf);
                        if (!type) {
                            // 非 PNG/JPEG，不插入，避免 ExcelJS 抛错
                            continue;
                        }
                        let dimensions = { width: 120, height: 120 };
                        try {
                            const size = imageSize(imgBuf);
                            if (size && size.width && size.height) {
                                // 限制最大尺寸，避免过大图片导致体积/渲染异常
                                const MAX = 480;
                                let w = size.width;
                                let h = size.height;
                                const scale = Math.min(1, MAX / Math.max(w, h));
                                dimensions = { width: Math.round(w * scale), height: Math.round(h * scale) };
                            }
                        } catch (_) {}

                        const imageId = workbook.addImage({ buffer: imgBuf, extension: type });
                        worksheet.addImage(imageId, {
                            tl: { col: c - 1, row: r - 1 },
                            ext: { width: dimensions.width, height: dimensions.height },
                            editAs: 'oneCell'
                        });
                        cell.value = '';
                        insertedCount++;
                    } catch (e) {
                        // 单元格级别吞错，继续处理其他单元格
                        console.error('Image insert error at row ' + r + ', col ' + c + ':', e && e.message ? e.message : e);
                    }
                }
            }
        }
    });

    const out = await workbook.xlsx.writeBuffer();
    return Buffer.from(out);
}

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.end('excel api ok');
    }
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

        let processed;
        try {
            processed = await processWorkbook(data);
        } catch (e) {
            console.error('Workbook load/process error:', e && e.message ? e.message : e);
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end('Excel 解析失败，请确认为有效的 .xlsx');
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="processed.xlsx"');
        res.end(processed);
    } catch (e) {
        const msg = e && e.message ? e.message : String(e);
        console.error(e);
        if (msg.startsWith('DEPENDENCY_MISSING')) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end('依赖缺失，请确认已安装 exceljs 与 image-size');
        }
        if (msg === 'FILE_TOO_LARGE') {
            res.statusCode = 413;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end('文件过大，最大 15MB');
        }
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('服务器错误: ' + msg);
    }
};


