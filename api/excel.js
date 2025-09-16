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

/** 判断图片类型，返回 'png' | 'jpeg' | 'webp'，其他返回 null */
function detectImageType(buffer) {
    if (!buffer || buffer.length < 12) return null;
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'png';
    
    // JPEG: FF D8 ... FF D9（这里只检测开头）
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) return 'jpeg';
    
    // WebP: RIFF....WEBP (更宽松的检测)
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
        // 检查是否包含WEBP标识
        for (let i = 8; i < Math.min(buffer.length, 20); i++) {
            if (buffer[i] === 0x57 && buffer[i+1] === 0x45 && buffer[i+2] === 0x42 && buffer[i+3] === 0x50) {
                return 'webp';
            }
        }
    }
    
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

    // 收集所有工作表的处理任务
    const sheetPromises = [];
    workbook.eachSheet((worksheet) => {
        const sheetPromise = processWorksheet(worksheet, workbook);
        sheetPromises.push(sheetPromise);
    });

    // 等待所有工作表处理完成
    await Promise.all(sheetPromises);

    const out = await workbook.xlsx.writeBuffer();
    return Buffer.from(out);
}

async function processWorksheet(worksheet, workbook) {
    console.log('Processing worksheet:', worksheet.name);
    const headerRow = worksheet.getRow(1);
    if (!headerRow || headerRow.cellCount === 0) {
        console.log('No header row or empty worksheet');
        return;
    }

    const maxRow = worksheet.rowCount;
    const maxCol = worksheet.columnCount;
    console.log(`Worksheet dimensions: ${maxRow} rows x ${maxCol} columns`);

    let insertedCount = 0;
    // 删除图片数量限制，处理所有图片
    for (let r = 2; r <= maxRow; r++) {
        console.log(`📊 Processing row ${r}/${maxRow}`);
        const row = worksheet.getRow(r);
        for (let c = 1; c <= maxCol; c++) {
            const cell = row.getCell(c);
            const headerCell = headerRow.getCell(c);
            const headerName = String(headerCell.value || '').trim();
            const cellText = cell.text ? String(cell.text).trim() : '';
            if (!cellText) continue;

            // 调试日志 - 打印所有行和列的信息
            console.log(`Row ${r}, Col ${c}: header="${headerName}", text="${cellText}"`);

            // 1) 超链接
            if (headerName.includes('链接') || headerName.includes('主页')) {
                console.log(`Found link column: "${headerName}" with value: "${cellText}"`);
                // ExcelJS 超链接：使用富文本/值对象设置
                cell.value = { text: 'Link', hyperlink: cellText }; // 显示文本 Link
                // 样式：蓝色下划线
                cell.font = { color: { argb: 'FF0000FF' }, underline: true };
                continue;
            }

            // 2) 插入图片 - 扩展匹配条件
            if (headerName.includes('图') || headerName.includes('头像') || 
                headerName.includes('图片') || headerName.includes('照片') || 
                headerName.includes('image') || headerName.includes('photo') ||
                headerName.includes('img') || headerName.includes('pic') ||
                headerName.includes('链接') || headerName.includes('url') ||
                headerName.includes('地址') || headerName.includes('link')) {
                console.log(`🎯 Found image column: "${headerName}" with value: "${cellText}"`);
                try {
                    console.log(`📥 Fetching image from: ${cellText}`);
                    const imgBuf = await fetchImageBuffer(cellText);
                    console.log(`✅ Image fetched successfully, size: ${imgBuf.length} bytes`);
                    
                    // 打印文件头信息用于调试
                    const header = Array.from(imgBuf.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ');
                    console.log(`🔍 File header (hex): ${header}`);
                    
                    const type = detectImageType(imgBuf);
                    console.log(`🔍 Image type detected: ${type}`);
                    if (!type) {
                        console.log('❌ Image type not supported (not PNG/JPEG/WebP), skipping');
                        // 非支持的格式，不插入，避免 ExcelJS 抛错
                        continue;
                    }
                    // 固定图片尺寸：宽50px，高120px
                    let dimensions = { width: 50, height: 120 };

                    console.log(`Adding image to workbook with dimensions: ${dimensions.width}x${dimensions.height}`);
                    const imageId = workbook.addImage({ buffer: imgBuf, extension: type });
                    console.log(`Image added to workbook with ID: ${imageId}`);
                    // 调整单元格大小以适应图片
                    const row = worksheet.getRow(r);
                    const col = worksheet.getColumn(c);
                    
                    // 设置行高和列宽以适应图片
                    const rowHeight = Math.max(dimensions.height + 10, row.height || 20); // 图片高度 + 10px 边距
                    const colWidth = Math.max(dimensions.width + 10, col.width || 64); // 图片宽度 + 10px 边距
                    
                    row.height = rowHeight;
                    col.width = colWidth;
                    
                    worksheet.addImage(imageId, {
                        tl: { col: c - 1, row: r - 1 },
                        br: { col: c, row: r }, // 设置右下角位置，让图片填充整个单元格
                        editAs: 'oneCell'
                    });
                    console.log(`Image added to worksheet at position: col=${c-1}, row=${r-1}, size: ${dimensions.width}x${dimensions.height}`);
                    
                    // 清空单元格内容，删除原先的链接文本
                    cell.value = '';
                    cell.text = '';
                    
                    insertedCount++;
                    console.log(`✅ Image processing completed. Total images inserted: ${insertedCount}`);
                } catch (e) {
                    // 单元格级别吞错，继续处理其他单元格
                    console.error('❌ Image insert error at row ' + r + ', col ' + c + ':', e && e.message ? e.message : e);
                    console.error('❌ Error stack:', e && e.stack ? e.stack : 'No stack trace');
                    console.error('❌ Failed URL:', cellText);
                }
            }
        }
    }
    console.log(`🏁 Worksheet processing completed. Total images inserted: ${insertedCount}`);
}

module.exports = async (req, res) => {
    console.log('Excel API called:', { method: req.method, url: req.url, headers: req.headers });
    
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
        console.log('Starting to read request body...');
        const data = await readRequestBody(req);
        console.log('Request body read, size:', data ? data.length : 'null');
        
        // 简单校验是否为 xlsx（ZIP 头：PK\x03\x04）
        if (!data || data.length < 4 || !(data[0] === 0x50 && data[1] === 0x4B)) {
            console.log('Invalid file format detected');
            res.statusCode = 400;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.end('请上传 .xlsx 文件（不支持 .xls）');
        }

        console.log('Starting workbook processing...');
        let processed;
        try {
            processed = await processWorkbook(data);
            console.log('Workbook processing completed, output size:', processed ? processed.length : 'null');
        } catch (e) {
            console.error('Workbook load/process error:', e && e.message ? e.message : e);
            console.error('Error stack:', e && e.stack ? e.stack : 'No stack trace');
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
        console.error('Top-level error:', e);
        console.error('Error stack:', e && e.stack ? e.stack : 'No stack trace');
        console.error('Error message:', msg);
        
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


