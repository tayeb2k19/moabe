/* --- security_check.js --- */

const Security = (() => {
    // حالة التفاعل
    let isHuman = false;
    let interactionCount = 0;
    
    // ---------------------------------------------------
    // 1. مراقبة التفاعل البشري (Human Interaction Monitoring)
    // ---------------------------------------------------

    const monitorInteraction = () => {
        const events = ['mousemove', 'scroll', 'keydown', 'mousedown'];
        events.forEach(event => {
            document.addEventListener(event, () => {
                // نعتبر أي حركة أو ضغطة أو سكرول تفاعلاً بشرياً
                if (!isHuman) {
                    isHuman = true;
                }
                interactionCount++;
            }, { once: false, passive: true });
        });
    };
    
    // ---------------------------------------------------
    // 2. دوال جمع البصمات الرقمية (Fingerprinting Functions)
    // ---------------------------------------------------

    // A. Canvas Fingerprint
    const getCanvasFingerprint = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 280; canvas.height = 100;
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.fillStyle = "#f60";
            ctx.fillRect(10, 10, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("Netlify Security Check 1.0", 2, 15);
            return canvas.toDataURL();
        } catch (e) {
            return "canvas_error";
        }
    };

    // B. WebGL/GPU Renderer (مُحسّن)
    const getWebGLFingerprint = () => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                const vendor = gl.getParameter(gl.VENDOR); // جلب اسم المورد
                const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
                // دمج المورد والمُصَيِّر
                return `${vendor}|${renderer}` || "webgl_supported"; 
            }
            return "webgl_unsupported";
        } catch (e) {
            return "webgl_error";
        }
    };
    
    // C. Audio Fingerprint
    const getAudioFingerprint = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const analyser = context.createAnalyser();
            const compressor = context.createDynamicsCompressor();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = 10000;
            
            oscillator.connect(compressor);
            compressor.connect(analyser);
            
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.attack.value = 0.005;
            compressor.release.value = 0.050;
            
            oscillator.start(0);
            
            const buffer = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(buffer);
            
            oscillator.stop(0);
            
            const sum = buffer.reduce((a, b) => a + b, 0);
            return sum.toFixed(3);
        } catch (e) {
            return "audio_unsupported";
        }
    };

    // D. جلب البيانات الأساسية الأخرى
    const getStandardFingerprint = () => {
        const d = window.screen;
        return {
            userAgent: navigator.userAgent,
            webdriver: navigator.webdriver ? "Yes" : "No", // للكشف عن بيئات الأتمتة
            headless: /HeadlessChrome/.test(navigator.userAgent) ? "Yes" : "No", // كشف الـ Headless Chrome
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: `${d.width}x${d.height}x${d.colorDepth}`,
            plugins: Array.from(navigator.plugins).map(p => p.name).join('; '),
            platform: navigator.platform
        };
    };
    
    // ---------------------------------------------------
    // 3. التجميع والإخراج (Public API)
    // ---------------------------------------------------

    monitorInteraction(); // ابدأ المراقبة فوراً عند تحميل الملف

    return {
        // الوظيفة التي ستُستخدم في login.js
        getFingerprint: () => {
            const standard = getStandardFingerprint();
            const canvas = getCanvasFingerprint();
            const webgl = getWebGLFingerprint();
            const audio = getAudioFingerprint();
            
            return {
                ...standard,
                canvasHash: canvas.substring(0, 100) + '...', 
                webglRenderer: webgl.substring(0, 100) + '...', // <--- تم اختصار السلسلة
                audioHash: audio,
                isHuman: isHuman, 
                interactionCount: interactionCount
            };
        }
    };
})();
