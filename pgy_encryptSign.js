// md5_native.js
const crypto = require('crypto');
/**
 * 计算任意输入的 MD5（32 位十六进制）
 * @param {string|Buffer} input
 * @returns {string} 32 位 hex
 */
function md5Native(input) {
  const _buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
  return crypto.createHash('md5').update(_buf).digest('hex');
}


function encryptSign(e, t,o) {
  const n = "A4NjFqYu5wPHsO0XTdDgMa2r1ZQocVte9UJBvk6/7=yRnhISGKblCWi+LpfE8xzm3";
  var r = "iamspam";

  // 浏览器探测（保持与原逻辑一致）
  const i = (typeof window === "undefined") ? globalThis : window;
  if (i && i.navigator && i.navigator.userAgent && i.alert) {
    r = "test";
  }
  r = "test";

  const isObjOrArr =
    Object.prototype.toString.call(t) === "[object Object]" ||
    Object.prototype.toString.call(t) === "[object Array]";

  const plain = [o, r, e, isObjOrArr ? JSON.stringify(t) : ""].join("");

  /* 1. MD5 计算 */
  const hash = md5Native(plain);
 console.log('检测------------plain---------'+plain);
 console.log('检测------------md5---------'+hash);

  /* 2. 自定义 base64 编码 */
  var c = "";
  for (var u = 0; u < hash.length; ) {
    const t = hash.charCodeAt(u++);
    const r = hash.charCodeAt(u++);
    const o = hash.charCodeAt(u++);

    const i = t >> 2;
    const a = ((t & 3) << 4) | (r >> 4);
    var s = ((r & 15) << 2) | (o >> 6);
    var l = o & 63;

    if (isNaN(r)) s = l = 64;
    else if (isNaN(o)) l = 64;

    c +=
      n.charAt(i) +
      n.charAt(a) +
      n.charAt(s) +
      n.charAt(l);
  }

  return {
    "Xs": c,
    "Xt": o
  };
}

module.exports = { encryptSign };