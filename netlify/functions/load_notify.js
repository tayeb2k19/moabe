const fetch = require('node-fetch');

// دالة ترميز الأحرف الخاصة بـ MarkdownV2 لـ Telegram (تم تصحيحها)
const escapeMarkdownV2 = (text) => {
    const replacements = {
        '\\': '\\\\', 
        '_': '\\_', 
        '*': '\\*', 
        '[': '\\[', 
        ']': '\\]', 
        '(': '\\(', 
        ')': '\\)', 
        '~': '\\~', 
        '`': '\\`', 
        '>': '\\>', 
        '#': '\\#', 
        '+': '\\+', 
        '-': '\\-', 
        '=': '\\=', 
        '|': '\\|', 
        '{': '\\{', 
        '}': '\\}', 
        '.': '\\.', 
        '!': '\\!'
    };
    // لا نحتاج لترميمز \n لأنها لا تفسد تنسيق MarkdownV2 هنا
    return text.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, match => replacements[match]);
};

exports.handler = async (event, context) => {
    // 1. التقاط بيانات الزائر
    const ip = event.headers['client-ip'] || 'غير متوفر';
    const userAgent = event.headers['user-agent'] || 'غير متوفر';
    const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); // تنسيق الوقت

    // 2. تطبيق الترميز
    const safe_userAgent = escapeMarkdownV2(userAgent);
    const safe_ip = escapeMarkdownV2(ip);
    const safe_time = escapeMarkdownV2(time);

    // 3. تشكيل الرسالة
    let message_text = `🚨 *NEW VISITOR ALERT \\(Donsaa\\)* 🚨\n\n`;
    message_text += `Time: \`${safe_time}\`\n`;
    message_text += `IP: \`${safe_ip}\`\n`;
    message_text += `Browser/OS: \`${safe_userAgent}\``;
    
    // إعدادات Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.error("Telegram credentials missing in environment variables.");
        return { statusCode: 200, body: "Error: Missing credentials" }; 
    }
    
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const data = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message_text,
        parse_mode: 'MarkdownV2',
    };

    // 4. إرسال الإشعار الصامت
    try {
        await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error("Error sending visitor notification to Telegram:", error);
    }

    return {
        statusCode: 200,
        body: "Visitor notified successfully",
    };
};
