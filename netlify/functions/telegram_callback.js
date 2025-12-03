const fetch = require('node-fetch');
const url = require('url');

exports.handler = async (event, context) => {
    
    if (event.httpMethod !== "POST") { return { statusCode: 405, body: "Method Not Allowed" }; }

    const payload = JSON.parse(event.body);
    
    // التحقق مما إذا كانت الرسالة هي رد على زر (callback_query)
    if (payload.callback_query) {
        
        const callbackQuery = payload.callback_query;
        const dataString = callbackQuery.data; // action=approved&id=...
        const messageId = callbackQuery.message.message_id;
        const chatId = callbackQuery.message.chat.id;

        // تحليل البيانات المرسلة من الزر
        const params = new URLSearchParams(dataString);
        const action = params.get('action'); // 'approved' or 'rejected'
        const sessionId = params.get('id');
        
        if (action && sessionId && (action === 'approved' || action === 'rejected')) {
            
            // **TODO: هنا يجب تحديث حالة الجلسة في قاعدة بياناتك الخارجية**
            // يتم استخدام قيمة الـ action (approved أو rejected) مباشرة كحالة.
            // مثال: 
            // await db.collection('sessions').updateOne({ id: sessionId }, { $set: { status: action } });
            
            // ----------------------------------------------------------------
            // تحديث رسالة Telegram لإزالة الأزرار
            // ----------------------------------------------------------------
            const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
            const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`;

            try {
                // إرسال رسالة لتحديث الرسالة وإزالة الأزرار
                await fetch(TELEGRAM_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        reply_markup: {
                            inline_keyboard: [[]] // لوحة مفاتيح فارغة لإزالتها
                        }
                    })
                });
            } catch (error) {
                console.error("Error editing Telegram message:", error);
            }
        }
    }
    
    // يجب أن ترد بـ 200 OK فوراً على Telegram
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
