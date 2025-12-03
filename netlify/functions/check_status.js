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
    // قم باستبدال هذا المنطق بمنطق قراءة الحالة من مخزنك الخارجي
    
    let currentStatus = 'pending'; 
    
    // مثال:
    // const sessionData = await db.collection('sessions').findOne({ id: sessionId });
    // if (sessionData) {
    //     currentStatus = sessionData.status; // سيتم سحب: 'pending', 'approved', 'rejected'
    // }

    // في حال فشل الاتصال بقاعدة البيانات أو عدم العثور على الجلسة، سنعيد 'pending'
    
    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*" // للسماح لصفحة HTML بالاتصال
        },
        body: JSON.stringify({ 
            id: sessionId,
            status: currentStatus 
        }),
    };
};
