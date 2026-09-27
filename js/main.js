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
    const supabaseUrl = 'https://mumaaekhqobcspzvvqqf.supabase.co';
    const supabaseKey = 'sb_publishable_KlUF1E3UDDNjXSRyHbdTWQ_q1NRIm70';
    try { window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey); } catch (e) { }
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

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(element => { element.innerHTML = i18next.t(element.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.placeholder = i18next.t(element.getAttribute('data-i18n-placeholder')); });
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
        // IMPORTANTE: Ajuste o caminho "./vidprotocolo.mp4" conforme necessário
        source.src = './vidprotocolo.mp4';
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
