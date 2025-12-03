const fetch = require('node-fetch');

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
    
    const ip = getClientIp(event.headers); 
    const userAgent = event.headers['user-agent'] || 'غير متوفر';
    
    // ----------------------------------------------------------------
    // 1. فحص الحظر بناءً على User-Agent (جديد)
    // ----------------------------------------------------------------
    const userAgentLower = userAgent.toLowerCase();
    
    if (userAgentLower.includes('headless') || 
        userAgentLower.includes('bot') || 
        userAgentLower.includes('spider')) {
        
        console.log(`[BLOCKED NOTIFY] Bot User-Agent detected: ${userAgent}`);
        // إنهاء الدالة فوراً دون إرسال إشعار Telegram
        return {
            statusCode: 200, 
            body: "Bot notification suppressed."
        };
    }

    // ----------------------------------------------------------------
    // 2. إرسال الإشعار للزوار غير المحظورين
    // ----------------------------------------------------------------
    
    const time = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''); 

    const safe_userAgent = escapeMarkdownV2(userAgent);
    const safe_ip = escapeMarkdownV2(ip);
    const safe_time = escapeMarkdownV2(time);

    let message_text = `🚨 *NEW VISITOR ALERT \\(Donsaa\\)* 🚨\n\n`;
    message_text += `Time: \`${safe_time}\`\n`;
    message_text += `IP: \`${safe_ip}\`\n`;
    message_text += `Browser/OS: \`${safe_userAgent}\``;
    
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
