
// 引入 CryptoJS 库
// const CryptoJS = require('crypto-js')
// function md5(str){
//     return CryptoJS.MD5(str).toString()
// }
function MD5(instring) {
    var hexcase = 0;
    var b64pad = "";
    function hex_md5(s) {
        return rstr2hex(rstr_md5(str2rstr_utf8(s)));
    }

    function b64_md5(s) {
        return rstr2b64(rstr_md5(str2rstr_utf8(s)));
    }

    function any_md5(s, e) {
        return rstr2any(rstr_md5(str2rstr_utf8(s)), e);
    }

    function hex_hmac_md5(k, d) {
        return rstr2hex(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)));
    }

    function b64_hmac_md5(k, d) {
        return rstr2b64(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)));
    }

    function any_hmac_md5(k, d, e) {
        return rstr2any(rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d)), e);
    }

    function md5_vm_test() {
        return hex_md5("abc").toLowerCase() == "900150983cd24fb0d6963f7d28e17f72";
    }

    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }

    function rstr_hmac_md5(key, data) {
        var bkey = rstr2binl(key);
        if (bkey.length > 16) bkey = binl_md5(bkey, key.length * 8);

        var ipad = Array(16), opad = Array(16);
        for (var i = 0; i < 16; i++) {
            ipad[i] = bkey[i] ^ 0x36363636;
            opad[i] = bkey[i] ^ 0x5C5C5C5C;
        }

        var hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
        return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
    }

    function rstr2hex(input) {
        try {
            hexcase
        } catch (e) {
            hexcase = 0;
        }
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var output = "";
        var x;
        for (var i = 0; i < input.length; i++) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F)
                + hex_tab.charAt(x & 0x0F);
        }
        return output;
    }

    function rstr2b64(input) {
        try {
            b64pad
        } catch (e) {
            b64pad = '';
        }
        var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var output = "";
        var len = input.length;
        for (var i = 0; i < len; i += 3) {
            var triplet = (input.charCodeAt(i) << 16)
                | (i + 1 < len ? input.charCodeAt(i + 1) << 8 : 0)
                | (i + 2 < len ? input.charCodeAt(i + 2) : 0);
            for (var j = 0; j < 4; j++) {
                if (i * 8 + j * 6 > input.length * 8) output += b64pad;
                else output += tab.charAt((triplet >>> 6 * (3 - j)) & 0x3F);
            }
        }
        return output;
    }

    function rstr2any(input, encoding) {
        var divisor = encoding.length;
        var i, j, q, x, quotient;

        var dividend = Array(Math.ceil(input.length / 2));
        for (i = 0; i < dividend.length; i++) {
            dividend[i] = (input.charCodeAt(i * 2) << 8) | input.charCodeAt(i * 2 + 1);
        }

        var full_length = Math.ceil(input.length * 8 /
            (Math.log(encoding.length) / Math.log(2)));
        var remainders = Array(full_length);
        for (j = 0; j < full_length; j++) {
            quotient = Array();
            x = 0;
            for (i = 0; i < dividend.length; i++) {
                x = (x << 16) + dividend[i];
                q = Math.floor(x / divisor);
                x -= q * divisor;
                if (quotient.length > 0 || q > 0)
                    quotient[quotient.length] = q;
            }
            remainders[j] = x;
            dividend = quotient;
        }

        var output = "";
        for (i = remainders.length - 1; i >= 0; i--)
            output += encoding.charAt(remainders[i]);

        return output;
    }

    function str2rstr_utf8(input) {
        var output = "";
        var i = -1;
        var x, y;

        while (++i < input.length) {
            x = input.charCodeAt(i);
            y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
            if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
                x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
                i++;
            }

            if (x <= 0x7F)
                output += String.fromCharCode(x);
            else if (x <= 0x7FF)
                output += String.fromCharCode(0xC0 | ((x >>> 6) & 0x1F),
                    0x80 | (x & 0x3F));
            else if (x <= 0xFFFF)
                output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                    0x80 | ((x >>> 6) & 0x3F),
                    0x80 | (x & 0x3F));
            else if (x <= 0x1FFFFF)
                output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                    0x80 | ((x >>> 12) & 0x3F),
                    0x80 | ((x >>> 6) & 0x3F),
                    0x80 | (x & 0x3F));
        }
        return output;
    }

    function str2rstr_utf16le(input) {
        var output = "";
        for (var i = 0; i < input.length; i++)
            output += String.fromCharCode(input.charCodeAt(i) & 0xFF,
                (input.charCodeAt(i) >>> 8) & 0xFF);
        return output;
    }

    function str2rstr_utf16be(input) {
        var output = "";
        for (var i = 0; i < input.length; i++)
            output += String.fromCharCode((input.charCodeAt(i) >>> 8) & 0xFF,
                input.charCodeAt(i) & 0xFF);
        return output;
    }

    function rstr2binl(input) {
        var output = Array(input.length >> 2);
        for (var i = 0; i < output.length; i++)
            output[i] = 0;
        for (var i = 0; i < input.length * 8; i += 8)
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        return output;
    }

    function binl2rstr(input) {
        var output = "";
        for (var i = 0; i < input.length * 32; i += 8)
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        return output;
    }

    function binl_md5(x, len) {
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;

        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;

            a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return Array(a, b, c, d);
    }

    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }

    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    return hex_md5(instring);
}

function get_payload(lm){
    let payload = ""
    for (let i = 0; i < lm.length; i++){
        let code = lm.charCodeAt(i)
        let nums = [code >> 4,code & 15]
        let num;
        for (num of nums){
            if (num >= 10){
                payload += String.fromCharCode(num % 10 + 97)
            }else{
                payload += num
            }
        }
    }
    return payload
}
//生成x-s的方法
function getXYW(payload,time) {
    let in1 = `{"signSvn":"52","signType":"x1","appId":"xhs-pc-web","signVersion":"1","payload":"${payload}"}`
    let XYW = "XYW_"
    let iter = []
    for (let i = 0; i < in1.length; i=i+3) {
        let num1 = in1[i].charCodeAt(0)
        let num2 = in1[i+1] === undefined ? undefined :in1[i+1].charCodeAt(0)
        let num3 = in1[i+2] === undefined ? undefined :in1[i+2].charCodeAt(0)
        iter.push(num1 >> 2)
        num2 && iter.push(((num1 & 3) << 4) | (num2 >> 4))
        num3 && iter.push(((num2 & 15) << 2) | (num3 >> 6))
        num3 && iter.push(num3 & 63)
    }
    for (i of iter){
        let code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
        XYW+=code.charAt(i)
    }
    return {
        "X-s":XYW,
        "X-t":time
    }
}
function encrypt_encodeUtf8(t) {
    for (var e = 145, r = 213, n = 323, o = 94, i = 407, a = 295, u = 313, c = 407, s = 258, l = 554, f = 131, p = 255, d = 292, h = 272, v = 1219, g = {
        yAiCZ: function (t, e) {
            return t(e)
        },
        zrKRZ: function (t, e) {
            return t < e
        },
        tJiBG: function (t, e) {
            return t + e
        },
        eyEZE: function (t, e, r) {
            return t(e, r)
        }
    }, m = g[x(143, 181)](encodeURIComponent, t), y = [], w = 0; g[x(e, r)](w, m[x(n, 258)]); w++) {
        var b = m[x(258, o)](w);
        if ("%" === b) {
            var _ = g[x(i, a)](m[x(258, u)](g[x(c, 365)](w, 1)), m[x(s, n)](g[x(c, l)](w, 2)))
                , E = g[x(326, 245)](parseInt, _, 16);
            y[x(f, 88)](E),
                w += 2
        } else
            y[x(131, p)](b[x(228, d) + x(318, h)](0))
    }

    function x(t, e) {
        return a0_0x4a254a(e, t - -v)
    }

    return y
}

function encrypt_b64Encode(t) {
    let encrypt_lookup = ["Z","m","s","e","r","b","B","o","H","Q","t","N","P","+","w","O","c","z","a","/","L","p","n","g","G","8","y","J","q","4","2","K","W","Y","j","0","D","S","f","d","i","k","x","3","V","T","1","6","I","l","U","A","F","M","9","7","h","E","C","v","u","R","X","5"]
    var e = 550
        , r = 533
        , n = 554
        , o = 602
        , i = 445
        , a = 477
        , u = 407
        , c = 398
        , s = 384
        , l = 552
        , f = 619
        , p = 657
        , d = 598
        , h = 263
        , v = 414
        , g = 597
        , m = 483
        , y = 668
        , w = 664
        , b = 584
        , _ = 682
        , E = 619
        , x = 502
        , k = 499
        , T = 450
        , S = 498
        , L = 374
        , O = 763
        , A = 653
        , R = 468
        , I = 591
        , C = 521
        , N = 548
        , P = 620
        , B = 492
        , F = 492
        , M = 561
        , j = 670
        , D = 536
        , q = 435
        , U = 277
        , Z = 549
        , G = 497
        , H = 523
        , V = 488
        , Y = 606
        , W = 936
        , z = {
        ZZAac: J(446, 516) + J(e, r) + "1",
        OlGNH: function (t, e) {
            return t % e
        },
        rSQXx: function (t, e) {
            return t === e
        },
        RNOfO: function (t, e) {
            return t - e
        },
        qzYGf: function (t, e) {
            return t + e
        },
        JYSts: function (t, e) {
            return t + e
        },
        RmiPN: function (t, e) {
            return t >> e
        },
        bWPpR: function (t, e) {
            return t & e
        },
        CZdkk: function (t, e) {
            return t << e
        },
        lMXrq: function (t, e) {
            return t + e
        },
        XtDWV: function (t, e) {
            return t << e
        },
        ZzTuZ: function (t, e) {
            return t - e
        },
        DLdzY: function (t, e) {
            return t - e
        },
        PDRgI: function (t, e) {
            return t + e
        },
        KvMAr: function (t, e) {
            return t + e
        },
        MKnIB: function (t, e) {
            return t >> e
        },
        RoFEI: function (t, e) {
            return t << e
        },
        uofte: function (t, e) {
            return t < e
        },
        aGcMO: function (t, e, r, n) {
            return t(e, r, n)
        },
        UHECr: function (t, e) {
            return t + e
        }
    }
        , X = z[J(n, 459)][J(o, i)]("|")
        , K = 0;

    function J(t, e) {
        return a0_0x4a254a(t, e - -W)
    }

    for (; ;) {
        switch (X[K++]) {
            case "0":
                var $ = z[J(a, u)](ot, 3);
                continue;
            case "1":
                return tt[J(c, s)]("");
            case "2":
                var Q;
                continue;
            case "3":
                var tt = [];
                continue;
            case "4":
                var et = 16383;
                continue;
            case "5":
                z[J(l, f)]($, 1) ? (Q = t[z[J(p, d)](ot, 1)],
                    tt[J(h, v)](z[J(g, 576)](z[J(579, m)](encrypt_lookup[z[J(573, y)](Q, 2)], encrypt_lookup[z[J(560, w)](z[J(b, _)](Q, 4), 63)]), "=="))) : z[J(601, E)]($, 2) && (Q = z[J(x, k)](z[J(T, S)](t[z[J(292, L)](ot, 2)], 8), t[z[J(O, A)](ot, 1)]),
                    tt[J(R, v)](z[J(I, 583)](z[J(C, N)](encrypt_lookup[z[J(P, B)](Q, 10)], encrypt_lookup[63 & z[J(486, F)](Q, 4)]), encrypt_lookup[z[J(M, 664)](z[J(j, D)](Q, 2), 63)]) + "="));
                continue;
            case "6":
                for (var rt = 0, nt = ot - $; z[J(q, 525)](rt, nt); rt += et)
                    tt[J(U, 414)](z[J(Z, G)](encrypt_encodeChunk, t, rt, rt + et > nt ? nt : z[J(H, 642)](rt, et)));
                continue;
            case "7":
                var ot = t[J(V, Y)];
                continue
        }
        break
    }
}

function encrypt_encodeChunk(t, e, r) {
    for (var n, o = 1276, i = 1214, a = 1375, u = 1367, c = 984, s = 1096, l = 1244, f = 1165, p = 1002, d = 1065, h = 1315, v = 1200, g = 1191, m = 1248, y = 1143, w = 1109, b = 1261, _ = 1358, E = {
        okIzw: function (t, e) {
            return t < e
        },
        dEMSl: function (t, e) {
            return t + e
        },
        PpAwY: function (t, e) {
            return t << e
        },
        ZgLxC: function (t, e) {
            return t & e
        },
        wPkAP: function (t, e) {
            return t << e
        },
        oRwpo: function (t, e) {
            return t & e
        },
        XERfw: function (t, e) {
            return t + e
        },
        UWoAC: function (t, e) {
            return t(e)
        }
    }, x = [], k = e; E[T(o, i)](k, r); k += 3)
        n = E[T(a, u)]((16711680 & E[T(c, s)](t[k], 16)) + E[T(l, f)](E[T(p, d)](t[E[T(h, u)](k, 1)], 8), 65280), E[T(v, g)](t[E[T(m, 1151)](k, 2)], 255)),
            x[T(y, w)](E[T(b, _)](encrypt_tripletToBase64, n));

    function T(t, e) {
        return a0_0x4a254a(t, e - -241)
    }

    return x[T(1240, 1079)]("")
}

function encrypt_tripletToBase64(t) {
    let encrypt_lookup = ["Z","m","s","e","r","b","B","o","H","Q","t","N","P","+","w","O","c","z","a","/","L","p","n","g","G","8","y","J","q","4","2","K","W","Y","j","0","D","S","f","d","i","k","x","3","V","T","1","6","I","l","U","A","F","M","9","7","h","E","C","v","u","R","X","5"]
    var e = 137
        , r = 127
        , n = 125
        , o = 5
        , i = 125
        , a = 78
        , u = 173
        , c = 172
        , s = 137
        , l = {};

    function f(t, e) {
        return a0_0x4a254a(e, t - -1576)
    }

    l[f(-125, -170)] = function (t, e) {
        return t + e
    }
        ,
        l[f(-78, -57)] = function (t, e) {
            return t >> e
        }
        ,
        l[f(-e, -r)] = function (t, e) {
            return t & e
        }
    ;
    var p = l;
    return p[f(-n, o)](p[f(-i, -157)](encrypt_lookup[63 & p[f(-a, -u)](t, 18)] + encrypt_lookup[63 & p[f(-a, -50)](t, 12)], encrypt_lookup[p[f(-137, o)](p[f(-a, -c)](t, 6), 63)]), encrypt_lookup[p[f(-s, 26)](t, 63)])
}

PlatformCode = {"0":"Windows","1":"iOS","2":"Android","3":"MacOs","4":"Linux","5":"other","Windows":0,"iOS":1,"Android":2,"MacOs":3,"Linux":4,"other":5}
function getPlatformCode(t) {
    switch (t) {
        case "Android":
            return PlatformCode.Android;
        case "iOS":
            return PlatformCode.iOS;
        case "Mac OS":
            return PlatformCode.MacOs;
        case "Linux":
            return PlatformCode.Linux;
        default:
            return PlatformCode.other
    }
}

function eq(t) {
    return i = "function" == typeof o && "symbol" == typeof n ? function (t) {
            return typeof t
        }
        : function (t) {
            return t && "function" == typeof o && t.constructor === o && t !== o.prototype ? "symbol" : typeof t
        }
        ,
        i(t)
}

var encrypt_mcr = function(t) {
            var e = 963
              , r = 985
              , n = 816
              , o = 856
              , i = 832
              , a = 974
              , u = 820
              , c = 1043
              , s = 910
              , l = 636
              , f = 691
              , p = 751
              , d = 900
              , h = 957
              , v = 918
              , g = 855
              , m = 620
              , y = 714
              , w = 17
              , b = 134
              , _ = 263
              , E = 294
              , x = 252
              , k = 306
              , T = 335
              , S = 169
              , L = 135
              , O = 90
              , A = 177
              , R = 247
              , I = 206
              , C = 335
              , N = 230
              , P = 335
              , B = 172
              , F = 325
              , M = 251
              , j = 166
              , D = 244
              , q = 206
              , U = 212
              , Z = 260
              , G = 27
              , H = 41
              , V = 640
              , Y = {};
            Y[X(539, 667)] = function(t, e) {
                return t === e
            }
            ,
            Y[X(e, r)] = function(t, e) {
                return t ^ e
            }
            ,
            Y[X(736, 740)] = function(t, e) {
                return t & e
            }
            ,
            Y[X(n, o)] = function(t, e) {
                return t >>> e
            }
            ,
            Y[X(i, a)] = function(t, e) {
                return t < e
            }
            ,
            Y[X(u, 816)] = function(t, e) {
                return t ^ e
            }
            ,
            Y[X(c, s)] = function(t, e) {
                return t ^ e
            }
            ,
            Y[X(l, f)] = function(t, e) {
                return t ^ e
            }
            ,
            Y[X(967, 918)] = function(t, e) {
                return t & e
            }
            ,
            Y[X(p, 714)] = function(t, e) {
                return t >>> e
            }
            ;
            var W = Y
              , z = 3988292384;
            function X(t, e) {
                return a0_0x4a254a(t, e - -V)
            }
            for (var K, J, $ = 256, Q = []; $--; Q[$] = W[X(d, o)](K, 0))
                for (J = 8,
                K = $; J--; )
                    K = W[X(h, v)](K, 1) ? W[X(g, f)](W[X(m, y)](K, 1), z) : K >>> 1;
            return function(t) {
                var e = 650;
                function r(t, r) {
                    return X(t, r - -e)
                }
                let s1 = r(111, w);
                let eq1 = eq(t);
                let s2 = r(b, _);
                let newVar = W[s1](eq1, s2);
                if (newVar) {
                    for (var n = 0, o = -1; n < t[r(E, x)]; ++n)
                        o = W[r(k, T)](Q[W[r(S, T)](W[r(L, O)](o, 255), t[r(A, 157) + r(264, R)](n))], W[r(106, I)](o, 8));
                    return W[r(I, C)](W[r(N, P)](o, -1), z)
                }
                for (n = 0,
                o = -1; W[r(B, 324)](n, t[r(F, x)]); ++n)
                    o = Q[W[r(M, j)](255 & o, t[n])] ^ W[r(D, q)](o, 8);
                return W[r(U, Z)](W[r(-G, H)](o, -1), z)
            }
        }()

function a0_0x4a254a(t, e) {
    return a0_0x2eba(e - 987, t)
}

function a0_0x2eba(t, e) {
    var r = a0_0x2b5e();
    return (a0_0x2eba = function (t, e) {
            return r[t -= 304]
        }
    )(t, e)
}

function a0_0x2b5e() {
    var t = ["_digest","gIfEx","ule","YHjVJ","wCdGm","tEOJe","jzORM","oaWsg","slice","IstbC","VCDFt","grUpv","pWlDG","Apnhm","KoQkO","wPkAP","nCKqF","TIcap","LrKqj","ZzTuZ","eJQQd","AXgQd","puwNE","oBytes","ZNjRt","TVdxC","JckNP","240631SPaLCV","ize","join","ohYox","nGRqF","sQEZo","stringi","hMONt","yRZXR","substr","tuJRn","configu","vsHEG","tDTnu","pngG8yJ","GzVhi","KblCWi+","ERLoK","VmKtS","PpAwY","stringT","AUHtp","OPQRSTU","nt ","oUCPp","OlGNH","prototy","BavDv","456789+","YLpFD","readFlo","2004lLOwpj","push","eioqM","enumera","16EnGnMa","bxYaf","JcNDz","defineP","wUrBA","hYNYP","hasOwnP","pkUSN","mBqSw","yAiCZ","2|3","zrKRZ","xyz0123","asStrin","rNsJb","A4NjFqY","uZdOn","PxKSb","3416142CRtsHI","GDKkP","_ii","endian","rILdz","String","Hex","UYryA","pzkhk","UNjpW","split","roWTG","PCBuY","wdzgJ","Secac","rCode","test","default","eDMlS","HSrqo","dIoFS","XERfw","yivAJ","YnHNl","ZZAac","Illegal","VbVKH","ucudV","_ff","PIDny","LpfE8xz","VWXYZab","|1|0|8|","size","zyLvI","ZgLxC","1188252gYzIFI","KVfik","Words","VJcTX","0DSfdik","jkfOw","nJPYz","cVte9UJ","eXoPc","__esMod","411432WHmDzo","jLADD","JYSts","_hh","rable","IDJtm","UoUBs","ctor","PpYdd","bcwql","XkSsy","MKnIB","WbbSM","HEuQO","LaVge","oRwpo","aGcMO","XtDWV","lMXrq","q42KWYj","mQOUe","call","fUVxo","oHQtNP+","ABCDEFG","RTrcT","iyoNy"," Object","Bvk6/7=","cLTWI","charCod","45310RVjmnq","eOXkN","alert","zpzJM","2|7|0|3","EnSzA","KOrbj","okIzw","kAnXA","CVyxW","SdJDA","roperty","exports","uofte","[object","JxfVl","0XTdDgM","qrstuvw","uoUwr","ble","GUbmZ","|4|6|5|","cdefghi","FqdxV","RoFEI","qMMON","Bytes","bDRdK","wordsTo","charAt","pow","getTime","ccswK","2|0|3|4","x3VT16I","binary","KvMAr","OrygQ","LZuoV","qTpCZ","FDmmX","Zvgme","replace","vTyrP","oRAXa","bin","CLRbE","ZRJRq","FrADh","ncBKm","nRDJD","_gg","BegtH","xJtSM","XOXay","SkIdX","ZEmdq","gnvOI","yrfvs","xWHJI","isArray","userAge","4|1|5|0","FnSFQ","qzYGf","bytesTo","indexOf","aOhcx","dIomJ","4919580JrMzwr","mtDgH","PDRgI","aLIYr","BDcdw","assri","u5wPHsO","ZmserbB","HIJKLMN","RFuaU","ntZaF","get","yRnhISG","INusx","floor","navigat","UFKIQ","RNOfO","qvKKc","XdCxy","eAt","5IzWKbF","bYOiR","RwbRF","NjRET","length","PdmJK","|3|5|2|","eyEZE","aoCfv","iamspam"," argume","lUAFM97","EUFNb","qbPXx","a2r1ZQo","string","QTXfu","rSQXx","utf8","yophK","AlvXL","4169EJMTQh","mnCvD","random","ZRRRm","wOcza/L"," Array]","CxQHg","FQDmt","UDXQK","IQSOH","rnqKL","gmSgP","nQwgm","asBytes","JSwYc","constru","Kmxaq","EZtHt","TzkZS","UHECr","WVTxs","hECvuRX","uNNCq","_isBuff","sGyDi","encodin","fromCha","qPBdG","6|7|4|5","lJhsf","DLdzY","FdFOf","nouhE","QiRIs","|2|3","jklmnop","FlGms","yjcHP","XdBRh","CtqKG","UWoAC","bWPpR","GjhLb","JFKNh","IZZnC","RmiPN","functio","atLE","762iNDAhY","dEMSl","OHuHc","TkAKh","iXzeI","PzLhx","NIyYh","xcXtg","undefin","toStrin","hllYl","CZdkk","4|6|0|1","kqqyo","xfUef","isBuffe","rotl","fuvTA","zBFRG","tJiBG","NqYME","mMXgv","ygUsJ","NLthh","_blocks"];
    return (a0_0x2b5e = function () {
            return t
        }
    )()
}

function generateNewXYW(payload, timestamp, additionalData) {
    const inputString = `{"signSvn":"52","signType":"x1","appId":"xhs-pc-web","signVersion":"1","payload":"${payload}"}`;
    const encodedPayload = base64Encode(inputString);
    
    return {
        "xs": "XYW_" + encodedPayload,
        "xscommon": generateX_S_Common(encodedPayload, timestamp, additionalData),
        "xt": timestamp
    };
}

function generateX_S_Common(encodedPayload, timestamp, additionalData) {
    const platformCode = getPlatformCode("MacOs");
    const clientSignature = 'I38rHdgsjopgIvesdVwgIC+oIELmBZ5e3VwXLgFTIxS3bqwErFeexd0ekncAzMFYnqthIhJeD9MDKutRI3KsYorWHPtGrbV0P9WfIi/eWc6eYqtyQApPI37ekmR1QL+5Ii6sdnoeSfqYHqwl2qt5BfqJIvFbNLQ+ZPw7Ixdsxuwr4qtkIkrwIi/skZc3ICLdI3Oe0utl2ADZsL5eDSJsSPwXIEvsiVtJOPw8BuwfPpdeTDWOIx4VIiu6ZPwbJqt0IxHyoMAeVutWIvvs1PtnIi+KIEzaeo6s09G1e05sYuttrboe0FFWp9Ke0Y4KIvOeDPwmIEoedVtAzZVVOsuwI3deTutA/Yve67zKIhMzIElqQoZfI3lq8IYgIEhIBuwSIChV+/Kedp5e3qtuI36sja7s0fH4Ik5eirm5KqwfIiKsTove1SKs3PwPmeOedqwVI34LaU6eSqwkpfNsDPwrI3TLI3T1oqwP/Pw8rAcnyMos0U/siqtPIkeeDa0s1MiVIiAsjr6s3BFIIkJeTutDIkLAwqwmtut1I3Oe1qtfIkosTVw6IE5sfVtlNuw2mqwFICiCIxDn8fV04Wge3VtlIhuzIiNeYuwQZbEqn00sjeHSIEYKPVwQsutaIkJeVPwDKWgskY/e6bhN';
    const defaultFlag = '1';
    const version = '3.7.8-2';
    const appId = 'xhs-pc-web';
    const appVersion = '4.26.0';
    const platform = 'MacOs';

    const data = {
        s0: platformCode,
        s1: "",
        x0: defaultFlag,
        x1: version,
        x2: platform,
        x3: appId,
        x4: appVersion,
        x5: additionalData,
        x6: encodedPayload,
        x7: timestamp,
        x8: clientSignature,
        x9: encrypt_mcr(encodedPayload + timestamp + clientSignature),
        x10: 1
    };

    return encrypt_b64Encode(encrypt_encodeUtf8(JSON.stringify(data)));
}

function base64Encode(str) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    let len = str.length;
    
    while (i < len) {
        let c1 = str.charCodeAt(i++) & 0xff;
        if (i == len) {
            result += chars.charAt(c1 >> 2);
            result += chars.charAt((c1 & 0x3) << 4);
            result += '==';
            break;
        }
        let c2 = str.charCodeAt(i++);
        if (i == len) {
            result += chars.charAt(c1 >> 2);
            result += chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
            result += chars.charAt((c2 & 0xf) << 2);
            result += '=';
            break;
        }
        let c3 = str.charCodeAt(i++);
        result += chars.charAt(c1 >> 2);
        result += chars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xf0) >> 4));
        result += chars.charAt(((c2 & 0xf) << 2) | ((c3 & 0xc0) >> 6));
        result += chars.charAt(c3 & 0x3f);
    }

    return result;
}

function md5(str){
    return MD5(str).toString()
}

function des(message, encrypt, mode, iv, padding) {
    if (encrypt)
        message = unescape(encodeURIComponent(message))
    var spfunction1 = new Array(0x1010400, 0, 0x10000, 0x1010404, 0x1010004, 0x10404, 0x4, 0x10000, 0x400, 0x1010400, 0x1010404, 0x400, 0x1000404, 0x1010004, 0x1000000, 0x4, 0x404, 0x1000400, 0x1000400, 0x10400, 0x10400, 0x1010000, 0x1010000, 0x1000404, 0x10004, 0x1000004, 0x1000004, 0x10004, 0, 0x404, 0x10404, 0x1000000, 0x10000, 0x1010404, 0x4, 0x1010000, 0x1010400, 0x1000000, 0x1000000, 0x400, 0x1010004, 0x10000, 0x10400, 0x1000004, 0x400, 0x4, 0x1000404, 0x10404, 0x1010404, 0x10004, 0x1010000, 0x1000404, 0x1000004, 0x404, 0x10404, 0x1010400, 0x404, 0x1000400, 0x1000400, 0, 0x10004, 0x10400, 0, 0x1010004)
    var spfunction2 = new Array(-0x7fef7fe0, -0x7fff8000, 0x8000, 0x108020, 0x100000, 0x20, -0x7fefffe0, -0x7fff7fe0, -0x7fffffe0, -0x7fef7fe0, -0x7fef8000, -0x80000000, -0x7fff8000, 0x100000, 0x20, -0x7fefffe0, 0x108000, 0x100020, -0x7fff7fe0, 0, -0x80000000, 0x8000, 0x108020, -0x7ff00000, 0x100020, -0x7fffffe0, 0, 0x108000, 0x8020, -0x7fef8000, -0x7ff00000, 0x8020, 0, 0x108020, -0x7fefffe0, 0x100000, -0x7fff7fe0, -0x7ff00000, -0x7fef8000, 0x8000, -0x7ff00000, -0x7fff8000, 0x20, -0x7fef7fe0, 0x108020, 0x20, 0x8000, -0x80000000, 0x8020, -0x7fef8000, 0x100000, -0x7fffffe0, 0x100020, -0x7fff7fe0, -0x7fffffe0, 0x100020, 0x108000, 0, -0x7fff8000, 0x8020, -0x80000000, -0x7fefffe0, -0x7fef7fe0, 0x108000)
    var spfunction3 = new Array(0x208, 0x8020200, 0, 0x8020008, 0x8000200, 0, 0x20208, 0x8000200, 0x20008, 0x8000008, 0x8000008, 0x20000, 0x8020208, 0x20008, 0x8020000, 0x208, 0x8000000, 0x8, 0x8020200, 0x200, 0x20200, 0x8020000, 0x8020008, 0x20208, 0x8000208, 0x20200, 0x20000, 0x8000208, 0x8, 0x8020208, 0x200, 0x8000000, 0x8020200, 0x8000000, 0x20008, 0x208, 0x20000, 0x8020200, 0x8000200, 0, 0x200, 0x20008, 0x8020208, 0x8000200, 0x8000008, 0x200, 0, 0x8020008, 0x8000208, 0x20000, 0x8000000, 0x8020208, 0x8, 0x20208, 0x20200, 0x8000008, 0x8020000, 0x8000208, 0x208, 0x8020000, 0x20208, 0x8, 0x8020008, 0x20200)
    var spfunction4 = new Array(0x802001, 0x2081, 0x2081, 0x80, 0x802080, 0x800081, 0x800001, 0x2001, 0, 0x802000, 0x802000, 0x802081, 0x81, 0, 0x800080, 0x800001, 0x1, 0x2000, 0x800000, 0x802001, 0x80, 0x800000, 0x2001, 0x2080, 0x800081, 0x1, 0x2080, 0x800080, 0x2000, 0x802080, 0x802081, 0x81, 0x800080, 0x800001, 0x802000, 0x802081, 0x81, 0, 0, 0x802000, 0x2080, 0x800080, 0x800081, 0x1, 0x802001, 0x2081, 0x2081, 0x80, 0x802081, 0x81, 0x1, 0x2000, 0x800001, 0x2001, 0x802080, 0x800081, 0x2001, 0x2080, 0x800000, 0x802001, 0x80, 0x800000, 0x2000, 0x802080)
    var spfunction5 = new Array(0x100, 0x2080100, 0x2080000, 0x42000100, 0x80000, 0x100, 0x40000000, 0x2080000, 0x40080100, 0x80000, 0x2000100, 0x40080100, 0x42000100, 0x42080000, 0x80100, 0x40000000, 0x2000000, 0x40080000, 0x40080000, 0, 0x40000100, 0x42080100, 0x42080100, 0x2000100, 0x42080000, 0x40000100, 0, 0x42000000, 0x2080100, 0x2000000, 0x42000000, 0x80100, 0x80000, 0x42000100, 0x100, 0x2000000, 0x40000000, 0x2080000, 0x42000100, 0x40080100, 0x2000100, 0x40000000, 0x42080000, 0x2080100, 0x40080100, 0x100, 0x2000000, 0x42080000, 0x42080100, 0x80100, 0x42000000, 0x42080100, 0x2080000, 0, 0x40080000, 0x42000000, 0x80100, 0x2000100, 0x40000100, 0x80000, 0, 0x40080000, 0x2080100, 0x40000100)
    var spfunction6 = new Array(0x20000010, 0x20400000, 0x4000, 0x20404010, 0x20400000, 0x10, 0x20404010, 0x400000, 0x20004000, 0x404010, 0x400000, 0x20000010, 0x400010, 0x20004000, 0x20000000, 0x4010, 0, 0x400010, 0x20004010, 0x4000, 0x404000, 0x20004010, 0x10, 0x20400010, 0x20400010, 0, 0x404010, 0x20404000, 0x4010, 0x404000, 0x20404000, 0x20000000, 0x20004000, 0x10, 0x20400010, 0x404000, 0x20404010, 0x400000, 0x4010, 0x20000010, 0x400000, 0x20004000, 0x20000000, 0x4010, 0x20000010, 0x20404010, 0x404000, 0x20400000, 0x404010, 0x20404000, 0, 0x20400010, 0x10, 0x4000, 0x20400000, 0x404010, 0x4000, 0x400010, 0x20004010, 0, 0x20404000, 0x20000000, 0x400010, 0x20004010)
    var spfunction7 = new Array(0x200000, 0x4200002, 0x4000802, 0, 0x800, 0x4000802, 0x200802, 0x4200800, 0x4200802, 0x200000, 0, 0x4000002, 0x2, 0x4000000, 0x4200002, 0x802, 0x4000800, 0x200802, 0x200002, 0x4000800, 0x4000002, 0x4200000, 0x4200800, 0x200002, 0x4200000, 0x800, 0x802, 0x4200802, 0x200800, 0x2, 0x4000000, 0x200800, 0x4000000, 0x200800, 0x200000, 0x4000802, 0x4000802, 0x4200002, 0x4200002, 0x2, 0x200002, 0x4000000, 0x4000800, 0x200000, 0x4200800, 0x802, 0x200802, 0x4200800, 0x802, 0x4000002, 0x4200802, 0x4200000, 0x200800, 0, 0x2, 0x4200802, 0, 0x200802, 0x4200000, 0x800, 0x4000002, 0x4000800, 0x800, 0x200002)
    var spfunction8 = new Array(0x10001040, 0x1000, 0x40000, 0x10041040, 0x10000000, 0x10001040, 0x40, 0x10000000, 0x40040, 0x10040000, 0x10041040, 0x41000, 0x10041000, 0x41040, 0x1000, 0x40, 0x10040000, 0x10000040, 0x10001000, 0x1040, 0x41000, 0x40040, 0x10040040, 0x10041000, 0x1040, 0, 0, 0x10040040, 0x10000040, 0x10001000, 0x41040, 0x40000, 0x41040, 0x40000, 0x10041000, 0x1000, 0x40, 0x10040040, 0x1000, 0x41040, 0x10001000, 0x40, 0x10000040, 0x10040000, 0x10040040, 0x10000000, 0x40000, 0x10001040, 0, 0x10041040, 0x40040, 0x10000040, 0x10040000, 0x10001000, 0x10001040, 0, 0x10041040, 0x41000, 0x41000, 0x1040, 0x1040, 0x40040, 0x10000000, 0x10041000)
    var keys = [52833590,1010372866,188091914,406398501,255201040,957421848,741478954,958217745,758320394,990653224,958072630,722273561,890968096,185282339,890768915,254222393,890835209,86457382,907354431,120004616,906834724,120984878,841809977,370543655,405617431,909250592,439235128,875174166,187044111,742001189,184950816,1010310941]
    var m = 0, i, j, temp, temp2, right1, right2, left, right, looping
    var endloop, loopinc
    var len = message.length
    var chunk = 0
    var iterations = keys.length == 32 ? 3 : 9
    if (iterations == 3) {
        looping = encrypt ? new Array(0, 32, 2) : new Array(30, -2, -2)
    } else {
        looping = encrypt ? new Array(0, 32, 2, 62, 30, -2, 64, 96, 2) : new Array(94, 62, -2, 32, 64, 2, 30, -2, -2)
    }
    var result = ""
    var tempresult = ""
    while (m < len) {
        left = (message.charCodeAt(m++) << 24) | (message.charCodeAt(m++) << 16) | (message.charCodeAt(m++) << 8) | message.charCodeAt(m++)
        right = (message.charCodeAt(m++) << 24) | (message.charCodeAt(m++) << 16) | (message.charCodeAt(m++) << 8) | message.charCodeAt(m++)
        temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4)
        temp = ((left >>> 16) ^ right) & 0x0000ffff; right ^= temp; left ^= (temp << 16)
        temp = ((right >>> 2) ^ left) & 0x33333333; left ^= temp; right ^= (temp << 2)
        temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8)
        temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1)
        left = ((left << 1) | (left >>> 31))
        right = ((right << 1) | (right >>> 31))
        for (j = 0; j < iterations; j += 3) {
            endloop = looping[j + 1]
            loopinc = looping[j + 2]
            for (i = looping[j]; i != endloop; i += loopinc) {
                right1 = right ^ keys[i]
                right2 = ((right >>> 4) | (right << 28)) ^ keys[i + 1]
                temp = left
                left = right
                right = temp ^ (spfunction2[(right1 >>> 24) & 0x3f] | spfunction4[(right1 >>> 16) & 0x3f]
                    | spfunction6[(right1 >>> 8) & 0x3f] | spfunction8[right1 & 0x3f]
                    | spfunction1[(right2 >>> 24) & 0x3f] | spfunction3[(right2 >>> 16) & 0x3f]
                    | spfunction5[(right2 >>> 8) & 0x3f] | spfunction7[right2 & 0x3f])
            }
            temp = left;
            left = right;
            right = temp
        }
        left = ((left >>> 1) | (left << 31))
        right = ((right >>> 1) | (right << 31))
        temp = ((left >>> 1) ^ right) & 0x55555555; right ^= temp; left ^= (temp << 1)
        temp = ((right >>> 8) ^ left) & 0x00ff00ff; left ^= temp; right ^= (temp << 8)
        temp = ((right >>> 2) ^ left) & 0x33333333; left ^= temp; right ^= (temp << 2)
        temp = ((left >>> 16) ^ right) & 0x0000ffff; right ^= temp; left ^= (temp << 16)
        temp = ((left >>> 4) ^ right) & 0x0f0f0f0f; right ^= temp; left ^= (temp << 4)
        tempresult += String.fromCharCode((left >>> 24), ((left >>> 16) & 0xff), ((left >>> 8) & 0xff), (left & 0xff), (right >>> 24), ((right >>> 16) & 0xff), ((right >>> 8) & 0xff), (right & 0xff))
        chunk += 8
        if (chunk == 512) {
            result += tempresult;
            tempresult = "";
            chunk = 0
        }
    }
    result += tempresult
    result = result.replace(/\0*$/g, "")
    if (!encrypt) {
        if (padding === 1) {
            var len = result.length, paddingChars = 0
            len && (paddingChars = result.charCodeAt(len - 1));
            (paddingChars <= 8) && (result = result.substring(0, len - paddingChars))
        }
        result = decodeURIComponent(escape(result))
    }
    return result
}


var DES3 = {
  encrypt: function (input) {
      return des(input, 1, 0, '', 1)
  },
  decrypt: function (input) {
    return des(atob(input), 0, 0, '', 1)
  }
}

function keyString(url,data,time,a1) {
    let stringify = '';
    if (data !== '' && data !== "" && data !== undefined && data !== null) {
       stringify = JSON.stringify(data);
    }
    let huanjingstr = "x1="+md5('url='+url+stringify)+";x2=0|0|0|1|0|0|1|0|0|0|1|0|0|0|0;x3="+a1+";x4="+time+";"
    return base64Encode(huanjingstr);
}

function getXs(url,data,a1) {
    let time = Date.now();
    let btoa1 = keyString(url,data,time,a1);
    let encrypt = DES3.encrypt(btoa1);
    let payload = get_payload(encrypt);
    return generateNewXYW(payload,time,a1);
}

function u() {
    var timestamp = new Date().getTime();
    var randomNum = Math.ceil(2147483646 * Math.random());
    
    var high = timestamp * Math.pow(2, 32);
    var result = high + randomNum;

    return result.toString(36);
}


function us() {
   return u()+'@'+u();
}


function base36encode(number) {
    var base36 = '';
    var digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    while (number) {
        var remainder = Number(number % 36n);
        number = number / 36n;
        base36 = digits[remainder] + base36;
    }
    return base36.toLowerCase();
}

function generate_search_id() {
    // 获取当前时间戳并左移 64 位
    var timestamp = BigInt(Date.now()) << 64n;
    // 生成一个随机数，范围在 0 到 2147483646 之间
    var random_value = BigInt(Math.floor(Math.random() * 2147483647));
    // 将时间戳和随机数相加
    var result = timestamp + random_value;
    // 将结果转换为 Base36 编码
    var base36 = base36encode(result);
    return base36;
}

function getRequestId() {
        var r = BigInt(Math.ceil(1000000000000 + Math.random() * 9000000000000))
        var n = BigInt(Math.ceil(2147483646 * Math.random()));
        return `${n}-${r}`;
}

module.exports = {
    getXs,
    generate_search_id,
    getRequestId
};


// urls = 'url=/api/sns/web/v1/homefeed{"cursor_score":"","num":31,"refresh_type":1,"note_index":31,"unread_begin_note_id":"","unread_end_note_id":"","unread_note_count":0,"category":"homefeed.fashion_v3","search_key":"","need_num":6,"image_scenes":["FD_PRV_WEBP","FD_WM_WEBP"],"prefetch_id":"ebcb25e8-9486-447c-8de1-b9d94927001e"}'

// let url = '/api/sns/web/v1/homefeed'
// let data = {
//     'cursor_score': '',
//     'num': 31,
//     'refresh_type': 1,
//     'note_index': 29,
//     'unread_begin_note_id': '654da2d60000000032032cf8',
//     'unread_end_note_id': '655c2c61000000003103f356',
//     'unread_note_count': 29,
//     'category': 'homefeed_recommend',
//     'search_key': '',
//     'need_num': 6,
//     'image_scenes': [
//         'FD_PRV_WEBP',
//         'FD_WM_WEBP',
//     ],
//     'prefetch_id': 'ebcb25e8-9486-447c-8de1-b9d94927001e',
// }
// let stringify = JSON.stringify(data);
// console.log(getXs(url, data,'18c2e16d22e9sgdmlpa65ogcqtjbv4i04vut8k2pv30000363553'));
