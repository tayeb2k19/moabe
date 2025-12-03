// netlify/functions/check_status.js
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
    }
    
    const sessionId = event.queryStringParameters.id;

    if (!sessionId) {
        return { statusCode: 400, body: JSON.stringify({ error: "Session ID missing" }) };
    }

    // **TODO: هنا يجب الاتصال بقاعدة بياناتك وجلب حالة الجلسة**
    // يجب أن يعيد هذا المنطق قيمة status: 'pending', 'approved', أو 'rejected'.

    let currentStatus = 'pending'; 

    // مثال محاكاة: يجب تعديله ليتصل بـ DB الحقيقية
    // const sessionData = await db.collection('sessions').findOne({ id: sessionId });
    // if (sessionData) {
    //     currentStatus = sessionData.status;
    // }
    
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            id: sessionId,
            status: currentStatus 
        }),
    };
};
