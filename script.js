const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// Menu mobile
const menuBtn = document.getElementById('menu-btn');
const navMenu = document.getElementById('nav-menu');

menuBtn.addEventListener('click', () => navMenu.classList.toggle('aberto'));

document.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', () => navMenu.classList.remove('aberto'));
});

// Tema claro/escuro (respeita o sistema até o usuário escolher)
document.getElementById('tema-btn').addEventListener('click', () => {
    const escuroAtual = document.documentElement.dataset.theme
        ? document.documentElement.dataset.theme === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const novoTema = escuroAtual ? 'light' : 'dark';
    document.documentElement.dataset.theme = novoTema;
    try { localStorage.setItem('tema', novoTema); } catch (e) {}
});

// Barra de progresso da leitura
const progresso = document.getElementById('progresso');

function atualizarProgresso() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progresso.style.transform = `scaleX(${total > 0 ? window.scrollY / total : 0})`;
}

window.addEventListener('scroll', atualizarProgresso, { passive: true });
atualizarProgresso();

// Animação de entrada ao rolar. Depois de aparecer, a classe sai
// para não atrapalhar as transições de hover dos cards.
const observadorRevelar = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        const el = entrada.target;
        el.classList.add('visivel');
        observadorRevelar.unobserve(el);
        setTimeout(() => el.classList.remove('revelar', 'visivel'), 800);
    });
}, { threshold: 0.12 });

document.querySelectorAll('.revelar').forEach((el) => observadorRevelar.observe(el));

// Contagem dos números quando aparecem
const observadorNumeros = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        observadorNumeros.unobserve(entrada.target);
        if (reduzirMovimento) return;
        const el = entrada.target;
        const alvo = Number(el.dataset.contar);
        const inicio = performance.now();
        const duracao = 1100;
        const passo = (agora) => {
            const t = Math.min((agora - inicio) / duracao, 1);
            el.textContent = Math.round(alvo * (1 - Math.pow(1 - t, 3)));
            if (t < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
    });
}, { threshold: 0.6 });

document.querySelectorAll('[data-contar]').forEach((el) => observadorNumeros.observe(el));

// Destaca no menu a seção visível
const linksMenu = document.querySelectorAll('nav a');

const observadorSecao = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
            linksMenu.forEach((link) => {
                link.classList.toggle('ativo', link.getAttribute('href') === '#' + entrada.target.id);
            });
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });

document.querySelectorAll('main section[id]').forEach((secao) => observadorSecao.observe(secao));

// Luz que acompanha o mouse nos cards de projeto
document.querySelectorAll('.projeto').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
});

// Filtro de projetos
const botoesFiltro = document.querySelectorAll('.filtros button');
const cardsProjeto = document.querySelectorAll('.projeto[data-categorias]');
const semResultado = document.getElementById('sem-resultado');

botoesFiltro.forEach((botao) => {
    botao.addEventListener('click', () => {
        const filtro = botao.dataset.filtro;
        botoesFiltro.forEach((b) => b.classList.toggle('ativo', b === botao));

        let visiveis = 0;
        cardsProjeto.forEach((card) => {
            const mostrar = filtro === 'todos' || card.dataset.categorias.split(' ').includes(filtro);
            card.classList.toggle('oculto', !mostrar);
            if (mostrar) {
                visiveis++;
                card.classList.remove('revelar', 'visivel');
                if (!reduzirMovimento) {
                    card.animate(
                        [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
                        { duration: 350, easing: 'ease-out' }
                    );
                }
            }
        });
        semResultado.hidden = visiveis > 0;
    });
});

// Galeria de telas dos projetos
const galeria = document.getElementById('galeria');
const galeriaImg = document.getElementById('galeria-img');
const galeriaTitulo = document.getElementById('galeria-titulo');
const galeriaLegenda = document.getElementById('galeria-legenda');
const galeriaContador = document.getElementById('galeria-contador');
const galeriaAnterior = document.getElementById('galeria-anterior');
const galeriaProxima = document.getElementById('galeria-proxima');
let telas = [];
let telaAtual = 0;

function mostrarTela(indice) {
    telaAtual = (indice + telas.length) % telas.length;
    const [src, legenda] = telas[telaAtual];
    galeriaImg.src = src;
    galeriaImg.alt = legenda;
    galeriaLegenda.textContent = legenda;
    galeriaContador.textContent = telas.length > 1 ? `${telaAtual + 1} / ${telas.length}` : '';
}

document.querySelectorAll('.projeto-img[data-galeria]').forEach((botao) => {
    botao.addEventListener('click', () => {
        telas = JSON.parse(botao.dataset.galeria);
        galeriaTitulo.textContent = botao.dataset.titulo;
        galeriaAnterior.hidden = galeriaProxima.hidden = telas.length < 2;
        mostrarTela(0);
        galeria.showModal();
    });
});

galeriaAnterior.addEventListener('click', () => mostrarTela(telaAtual - 1));
galeriaProxima.addEventListener('click', () => mostrarTela(telaAtual + 1));
document.getElementById('galeria-fechar').addEventListener('click', () => galeria.close());

// Fecha ao clicar fora da imagem
galeria.addEventListener('click', (e) => {
    if (e.target === galeria) galeria.close();
});

galeria.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') mostrarTela(telaAtual - 1);
    if (e.key === 'ArrowRight') mostrarTela(telaAtual + 1);
});

// Copiar e-mail
const aviso = document.getElementById('aviso');
let avisoTimer;

function mostrarAviso(texto) {
    aviso.textContent = texto;
    aviso.classList.add('visivel');
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => aviso.classList.remove('visivel'), 2200);
}

document.getElementById('copiar-email').addEventListener('click', async (e) => {
    const botao = e.currentTarget;
    try {
        await navigator.clipboard.writeText(botao.dataset.email);
        mostrarAviso('E-mail copiado');
        botao.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => { botao.innerHTML = '<i class="far fa-copy"></i>'; }, 2000);
    } catch (erro) {
        mostrarAviso(botao.dataset.email);
    }
});

// Terminal do hero: demonstra os projetos rodando
const terminal = document.querySelector('#terminal code');
const abasTerminal = document.querySelectorAll('.terminal-abas button');

const rotinas = {
    escritorio: [
        { tipo: 'cmd', texto: 'unepdf unir --pasta notas/' },
        { tipo: 'passo', texto: '▸ PDFs unidos com marcadores', fim: 'ok' },
        { tipo: 'cmd', texto: 'clareza sync --erp omie' },
        { tipo: 'passo', texto: '▸ fluxo de caixa projetado', fim: 'ok' },
        { tipo: 'cmd', texto: 'regime consultar cnpjs.xlsx' },
        { tipo: 'passo', texto: '▸ regimes lidos na BrasilAPI', fim: 'ok' },
        { tipo: 'cmd', texto: 'monitor-certificados' },
        { tipo: 'aviso', texto: '! A1 vencendo → aviso no WhatsApp' },
        { tipo: 'ok', texto: '✓ rotinas do escritório em dia' }
    ],
    projetos: [
        { tipo: 'cmd', texto: 'ecovision diagnosticar --estufa 1' },
        { tipo: 'passo', texto: '▸ folha analisada com TFLite', fim: 'ok' },
        { tipo: 'passo', texto: '▸ alerta enviado ao app', fim: 'ok' },
        { tipo: 'cmd', texto: 'satvision comparar 2020 2024' },
        { tipo: 'passo', texto: '▸ mapa de vegetação gerado', fim: 'ok' },
        { tipo: 'cmd', texto: 'java -jar gerenciador-estoque.jar' },
        { tipo: 'passo', texto: '▸ estoque carregado do SQLite', fim: 'ok' },
        { tipo: 'ok', texto: '✓ projetos pessoais rodando' }
    ]
};

const ordemRotinas = Object.keys(rotinas);
const LARGURA = 33;
let rotinaAtual = 'escritorio';
let execucao = 0;
let escolhaManual = false;

function montarLinha(linha) {
    if (linha.tipo === 'cmd') {
        return `<span class="t-prompt">$</span> <span class="t-cmd">${linha.texto}</span>`;
    }
    if (linha.fim) {
        const pontos = ' ' + '.'.repeat(Math.max(2, LARGURA - linha.texto.length)) + ' ';
        return `<span class="t-passo">${linha.texto}${pontos}</span><span class="t-ok">${linha.fim}</span>`;
    }
    return `<span class="t-${linha.tipo}">${linha.texto}</span>`;
}

function marcarAba(nome) {
    abasTerminal.forEach((aba) => {
        const ativa = aba.dataset.rotina === nome;
        aba.classList.toggle('ativa', ativa);
        aba.setAttribute('aria-selected', ativa);
    });
}

async function rodarRotina(nome) {
    const minhaExecucao = ++execucao;
    const cancelada = () => minhaExecucao !== execucao;
    rotinaAtual = nome;
    marcarAba(nome);

    const linhas = rotinas[nome];
    if (reduzirMovimento) {
        terminal.innerHTML = linhas.map(montarLinha).join('\n');
        return;
    }

    let html = '';
    for (const linha of linhas) {
        if (linha.tipo === 'cmd') {
            // Digita o comando letra por letra
            for (let i = 1; i <= linha.texto.length; i++) {
                if (cancelada()) return;
                terminal.innerHTML = html + montarLinha({ ...linha, texto: linha.texto.slice(0, i) }) + '<span class="t-cursor"></span>';
                await esperar(40);
            }
            await esperar(350);
        } else {
            if (cancelada()) return;
            terminal.innerHTML = html + '<span class="t-cursor"></span>';
            await esperar(linha.fim ? 600 : 850);
        }
        if (cancelada()) return;
        html += montarLinha(linha) + '\n';
        terminal.innerHTML = html + '<span class="t-cursor"></span>';
    }

    // Sem interação, passa sozinho para a próxima rotina
    await esperar(4000);
    if (cancelada()) return;
    const proxima = escolhaManual
        ? rotinaAtual
        : ordemRotinas[(ordemRotinas.indexOf(rotinaAtual) + 1) % ordemRotinas.length];
    rodarRotina(proxima);
}

abasTerminal.forEach((aba) => {
    aba.addEventListener('click', () => {
        escolhaManual = true;
        rodarRotina(aba.dataset.rotina);
    });
});

document.getElementById('terminal-repetir').addEventListener('click', () => rodarRotina(rotinaAtual));

rodarRotina('escritorio');
