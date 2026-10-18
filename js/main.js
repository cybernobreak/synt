document.addEventListener("DOMContentLoaded", () => {
    const userLang = navigator.language || navigator.userLanguage;
    let defaultLang = 'pt';
    if (userLang.toLowerCase().startsWith('en')) defaultLang = 'en';
    if (userLang.toLowerCase().startsWith('es')) defaultLang = 'es';
    function startI18n() {
        // Proteção: em páginas que não carregam i18next/translations (ex.: protocolo.html),
        // esta função nunca deve rodar de fato.
        if (typeof i18next === 'undefined' || typeof translations === 'undefined') return;
        i18next.init({ lng: defaultLang, fallbackLng: 'pt', resources: translations }).then(function() {
            updateContent();
            updateFlag(defaultLang);
        });
    }
    if (window.__i18nextReady) { startI18n(); } else { window.__i18nextInitFn = startI18n; }
    initLazyFormScripts();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    document.querySelectorAll('.hero-anim').forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.12}s`;
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-visible')));
    });
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));
});

// =========================================================
// Supabase + Cloudflare Turnstile só são baixados quando o
// visitante chega perto do formulário (#contact) ou interage
// com ele. Antes eram baixados/executados em toda visita,
// mesmo para quem nunca chegava no formulário.
// =========================================================
const SUPABASE_URL = 'https://mumaaekhqobcspzvvqqf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KlUF1E3UDDNjXSRyHbdTWQ_q1NRIm70';
let formScriptsPromise = null;

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.async = true;
        el.onload = resolve;
        el.onerror = () => reject(new Error('Falha ao carregar ' + src));
        document.head.appendChild(el);
    });
}

function loadFormScripts() {
    if (formScriptsPromise) return formScriptsPromise;
    formScriptsPromise = Promise.all([
        loadScriptOnce('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'),
        loadScriptOnce('https://challenges.cloudflare.com/turnstile/v0/api.js')
    ]).then(() => {
        try { window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch (e) { }
    }).catch(() => { formScriptsPromise = null; }); // permite tentar de novo
    return formScriptsPromise;
}

function initLazyFormScripts() {
    const contact = document.getElementById('contact');
    if (!contact) return; // páginas sem formulário (protocolo.html, 404) não baixam nada
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries.some(e => e.isIntersecting)) { loadFormScripts(); io.disconnect(); }
        }, { rootMargin: '800px 0px' });
        io.observe(contact);
    } else {
        window.addEventListener('load', loadFormScripts);
    }
    contact.addEventListener('focusin', loadFormScripts, { once: true });
}

// Só troca o texto se a tradução existir e for texto simples; caso contrário mantém o texto original do HTML
function safeT(key) {
    if (!i18next.exists(key)) return null;
    const v = i18next.t(key, { returnObjects: true });
    return typeof v === 'string' ? v : null;
}
function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => { const v = safeT(element.getAttribute('data-i18n')); if (v !== null) element.innerHTML = v; });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { const v = safeT(element.getAttribute('data-i18n-placeholder')); if (v !== null) element.placeholder = v; });
}
function changeLang(lang) { i18next.changeLanguage(lang).then(() => { updateContent(); updateFlag(lang); }); }
function updateFlag(lang) {
    const flagEl = document.getElementById('current-flag');
    if (!flagEl) return;
    if(lang === 'pt') flagEl.innerText = '🇧🇷';
    else if(lang === 'en') flagEl.innerText = '🇺🇸';
    else if(lang === 'es') flagEl.innerText = '🇪🇸';
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang;
}

async function enviarCadastro() {
    const btn = document.querySelector('button[onclick="enviarCadastro()"]');
    if(!btn) return;
    const span = btn.querySelector('span');
    const originalText = span.innerText;
    await loadFormScripts();
    let turnstileToken;
    try { turnstileToken = turnstile.getResponse(); } catch (e) { alert("O sistema de segurança está inicializando."); return; }
    if (!turnstileToken) { alert("Aguarde a verificação de segurança."); return; }
    if (!window.supabaseClient) { alert("A conexão com o banco está sendo iniciada."); return; }
    const pin = document.getElementById('inputPin').value.trim();
    const nome = document.getElementById('inputNome').value.trim();
    const cel = document.getElementById('inputCelular').value.trim();
    const cons = document.getElementById('inputConsultor').value.trim();
    if(!pin || !nome || !cel || !cons) { alert("Preencha todos os campos."); return; }
    span.innerText = "Processando...";
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    try {
        const { data, error } = await window.supabaseClient.rpc('validar_e_cadastrar', { p_pin: pin, p_nome: nome, p_celular: cel, p_vendedor: cons });
        if (error) { alert("Erro na conexão."); } 
        else if (data === 'SUCESSO') { alert("Cadastro realizado com sucesso!"); document.getElementById('inputPin').value = ''; document.getElementById('inputNome').value = ''; document.getElementById('inputCelular').value = ''; document.getElementById('inputConsultor').value = '';} 
        else { alert(data); }
        try { turnstile.reset(); } catch(e){}
    } catch (err) { alert("Erro inesperado."); try { turnstile.reset(); } catch(e){}
    } finally { span.innerText = originalText; btn.classList.remove('opacity-50', 'cursor-not-allowed'); }
}

// =========================================================
// Carregamento condicional do vídeo, adiado até o usuário
// rolar até perto do player (evita baixar o .mp4 para quem
// nunca chega a essa seção da página).
// =========================================================
document.addEventListener('DOMContentLoaded', function() {
    const videoElement = document.getElementById('protocol-video');
    const loadingMsg = document.getElementById('loading-video-msg');
    if (!videoElement || !loadingMsg) return;

    function loadVideo() {
        const source = document.createElement('source');
        // O arquivo fica em /images (antes apontava para a raiz e o vídeo nunca carregava)
        source.src = './images/vidprotocolo.mp4';
        source.type = 'video/mp4';
        videoElement.appendChild(source);

        videoElement.addEventListener('canplay', function() {
            loadingMsg.classList.add('hidden');
            videoElement.classList.remove('hidden');
        });

        videoElement.load();
    }

    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadVideo();
                    obs.disconnect();
                }
            });
        }, { rootMargin: '300px 0px' });
        videoObserver.observe(videoElement.parentElement || videoElement);
    } else {
        // Fallback para navegadores sem suporte a IntersectionObserver
        loadVideo();
    }
});
