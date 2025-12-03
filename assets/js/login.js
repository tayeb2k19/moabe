/* --- login.js --- */
document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailGroup = document.getElementById('emailGroup');
    const passwordGroup = document.getElementById('passwordGroup');
    const emailWrapper = emailInput.parentElement;
    const passwordWrapper = passwordInput.parentElement;
    const form = document.getElementById('loginForm');
    const btnNext = document.getElementById('btnNext');

    // 1. دالة التحقق المتقدمة (Email ODER Phone)
    function isValidEmailOrPhone(input) {
        // Regex بسيط للبريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Regex بسيط لرقم الهاتف
        const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
        
        return emailRegex.test(input) || phoneRegex.test(input);
    }
    
    // 2. دوال مساعدة لحالة الحقول العائمة (Floating Labels)
    const inputFields = [
        {input: emailInput, wrapper: emailWrapper, group: emailGroup}, 
        {input: passwordInput, wrapper: passwordWrapper, group: passwordGroup}
    ];

    function updateLabelState(input, wrapper) {
        if (input.value.trim() !== '') {
            wrapper.classList.add('has-value');
        } else {
            wrapper.classList.remove('has-value');
        }
    }
    
    // دالة التحقق الفوري عند الابتعاد عن الحقل (للتفاعل الاحترافي)
    function validateField(input, group) {
        const isEmailField = (input.id === 'email');
        const isPassField = (input.id === 'password');
        const val = input.value.trim();
        
        group.classList.remove('error');

        if (!val) {
             // لا نظهر خطأ "Erforderlich" إلا عند الإرسال
        } else if (isEmailField && !isValidEmailOrPhone(val)) {
            group.classList.add('error');
            group.querySelector('.error-text').textContent = 'Ungültige E-Mail- oder Telefonnummer.';
        } else if (isPassField && val.length < 4) { 
            group.classList.add('error');
            group.querySelector('.error-text').textContent = 'Passwort ist zu kurz.';
        }
    }


    // 3. تطبيق السلوك التفاعلي (Focus/Blur/Input)
    inputFields.forEach(({input, wrapper, group}) => {
        
        input.addEventListener('focus', () => {
            wrapper.classList.add('focused', 'has-value');
        });

        input.addEventListener('blur', () => {
            wrapper.classList.remove('focused');
            updateLabelState(input, wrapper);
            validateField(input, group); // التحقق الفوري عند الابتعاد
        });
        
        input.addEventListener('input', () => {
            group.classList.remove('error');
            wrapper.classList.remove('error');
            group.querySelector('.error-text').textContent = 'Erforderlich'; 
            updateLabelState(input, wrapper);
        });

        setTimeout(() => updateLabelState(input, wrapper), 100);
    });


    // 4. منطق التحقق والإرسال النهائي
    form.addEventListener('submit', function(e) {
        e.preventDefault(); // نمنع الإرسال المباشر للتحكم في التحقق

        const emailVal = emailInput.value.trim();
        const passVal = passwordInput.value.trim();
        let hasError = false;

        // التحقق النهائي من حقل الإيميل/الهاتف
        if (!emailVal || !isValidEmailOrPhone(emailVal)) {
            emailGroup.classList.add('error');
            emailGroup.querySelector('.error-text').textContent = 'Ungültige E-Mail- oder Telefonnummer.';
            hasError = true;
        } else {
            emailGroup.classList.remove('error');
        }

        // التحقق النهائي من حقل كلمة المرور
        if (!passVal) {
            passwordGroup.classList.add('error');
            hasError = true;
        } else {
            passwordGroup.classList.remove('error');
        }
        
        if (hasError) {
            return; 
        }
        
        // 5. جمع بيانات البصمة وإضافتها كحقل مخفي (للحظر المتقدم)
        if (typeof Security !== 'undefined' && Security.getFingerprint) {
            const fpData = Security.getFingerprint();
            const fpInput = document.createElement('input');
            fpInput.type = 'hidden';
            fpInput.name = 'security_fingerprint';
            fpInput.value = JSON.stringify(fpData);
            form.appendChild(fpInput);
        }

        // 6. بدء التحميل والإرسال (الإرسال فوري)
        btnNext.classList.add('loading');

        // إرسال النموذج فوراً بعد التحقق (تمت إزالة الـ setTimeout)
        form.submit(); 
    });
});
