// netlify/functions/telegram_callback.js
const fetch = require('node-fetch');
const url = require('url');

exports.handler = async (event, context) => {
    
    if (event.httpMethod !== "POST") { return { statusCode: 405, body: "Method Not Allowed" }; }

    const payload = JSON.parse(event.body);
    
    if (payload.callback_query) {
        
        const callbackQuery = payload.callback_query;
        const dataString = callbackQuery.data;
        const messageId = callbackQuery.message.message_id;
        const chatId = callbackQuery.message.chat.id;

        const params = new URLSearchParams(dataString);
        const action = params.get('action'); // 'approve' or 'reject'
        const sessionId = params.get('id');
        
        if (action && sessionId) {
            
            // **TODO: هنا يجب تحديث حالة الجلسة في قاعدة بياناتك الخارجية**
            // db.collection('sessions').updateOne({ id: sessionId }, { $set: { status: action } });
            
            // ----------------------------------------------------------------
            // إرسال رد لـ Telegram لإخفاء الأزرار
            // ----------------------------------------------------------------
            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
            const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`;

            try {
                const confirmationText = (action === 'approve') ? '✅ تم الموافقة على الدخول.' : '❌ تم رفض الدخول.';
                
                // تعديل الرسالة لإزالة الأزرار وإظهار حالة القرار
                await fetch(TELEGRAM_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        // إزالة الأزرار
                        reply_markup: { inline_keyboard: [[]] }, 
                        // يمكن تعديل نص الرسالة هنا (editMessageText) إذا أردت تغيير النص بالكامل
                    })
                });
                 // الرد على callback_query برسالة منبثقة (اختياري)
                 const alertUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
                 await fetch(alertUrl, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                         callback_query_id: callbackQuery.id,
                         text: confirmationText,
                         show_alert: true
                     })
                 });

            } catch (error) {
                console.error("Error editing Telegram message:", error);
            }
        }
    }
    
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
