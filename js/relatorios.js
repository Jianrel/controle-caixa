let chartMensal = null;
let chartEntradas = null;
let chartSaidas = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await verificarAuth();
    if (!user) return;
    renderizarLayout('relatorios');

    const hoje = new Date();
    document.getElementById('sel-mes').value = hoje.getMonth() + 1;
    document.getElementById('sel-ano').value = hoje.getFullYear();

    document.getElementById('form-periodo').addEventListener('submit', e => { e.preventDefault(); carregarRelatorio(); });
    document.getElementById('btn-exportar').addEventListener('click', exportarCSV);

    await carregarRelatorio();
});

async function carregarRelatorio() {
    const mes = parseInt(document.getElementById('sel-mes').value);
    const ano = parseInt(document.getElementById('sel-ano').value);

    const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0];

    const { data: lancamentos } = await supabase
        .from('lancamento')
        .select('*, categoria(nome, cor)')
        .gte('data', primeiroDia)
        .lte('data', ultimoDia)
        .order('data');

    const dados = lancamentos || [];

    // Resumo
    let totalEntradas = 0, totalSaidas = 0;
    dados.forEach(l => {
        if (l.tipo === 'entrada') totalEntradas += Number(l.valor);
        else totalSaidas += Number(l.valor);
    });

    document.getElementById('r-entradas').textContent = formatarMoeda(totalEntradas);
    document.getElementById('r-saidas').textContent = formatarMoeda(totalSaidas);
    document.getElementById('r-saldo').textContent = formatarMoeda(totalEntradas - totalSaidas);
    document.getElementById('r-saldo').className = `stat-value ${(totalEntradas - totalSaidas) >= 0 ? 'text-success' : 'text-danger'}`;
    document.getElementById('r-total').textContent = dados.length;

    // Gráfico por dia
    const porDia = {};
    dados.forEach(l => {
        if (!porDia[l.data]) porDia[l.data] = { entradas: 0, saidas: 0 };
        if (l.tipo === 'entrada') porDia[l.data].entradas += Number(l.valor);
        else porDia[l.data].saidas += Number(l.valor);
    });

    const datas = Object.keys(porDia).sort();
    if (chartMensal) chartMensal.destroy();
    if (datas.length > 0) {
        chartMensal = new Chart(document.getElementById('grafico-mensal').getContext('2d'), {
            type: 'bar',
            data: {
                labels: datas.map(d => d.split('-')[2] + '/' + d.split('-')[1]),
                datasets: [
                    { label: 'Entradas', data: datas.map(d => porDia[d].entradas), backgroundColor: 'rgba(40,167,69,0.7)', borderRadius: 4 },
                    { label: 'Saídas', data: datas.map(d => porDia[d].saidas), backgroundColor: 'rgba(220,53,69,0.7)', borderRadius: 4 },
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) } } }
            }
        });
    }

    // Por categoria
    const porCat = { entradas: {}, saidas: {} };
    dados.forEach(l => {
        const catNome = l.categoria?.nome || 'Sem categoria';
        const catCor = l.categoria?.cor || '#6c757d';
        const grupo = l.tipo === 'entrada' ? 'entradas' : 'saidas';
        if (!porCat[grupo][catNome]) porCat[grupo][catNome] = { total: 0, cor: catCor };
        porCat[grupo][catNome].total += Number(l.valor);
    });

    renderizarPieChart('grafico-entradas', porCat.entradas, chartEntradas, c => chartEntradas = c);
    renderizarPieChart('grafico-saidas', porCat.saidas, chartSaidas, c => chartSaidas = c);
    renderizarListaCategoria('lista-entradas', porCat.entradas, 'text-success');
    renderizarListaCategoria('lista-saidas', porCat.saidas, 'text-danger');

    // Por forma de pagamento
    const porForma = {};
    dados.forEach(l => {
        const nome = nomeFormaPagamento(l.forma_pagamento);
        if (!porForma[nome]) porForma[nome] = { total: 0, qtd: 0 };
        porForma[nome].total += Number(l.valor);
        porForma[nome].qtd++;
    });

    const listaForma = document.getElementById('lista-formas');
    const formas = Object.entries(porForma).sort((a, b) => b[1].total - a[1].total);
    if (formas.length > 0) {
        listaForma.innerHTML = formas.map(([nome, d]) => `
            <div class="list-group-item d-flex justify-content-between">
                <span>${nome} <small class="text-muted">(${d.qtd}x)</small></span>
                <strong>${formatarMoeda(d.total)}</strong>
            </div>`).join('');
    } else {
        listaForma.innerHTML = '<div class="list-group-item text-center text-muted py-3">Sem dados</div>';
    }
}

function renderizarPieChart(canvasId, dados, chartRef, setRef) {
    if (chartRef) chartRef.destroy();
    const entries = Object.entries(dados);
    if (entries.length === 0) return;

    const chart = new Chart(document.getElementById(canvasId).getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: entries.map(([n]) => n),
            datasets: [{
                data: entries.map(([, d]) => d.total),
                backgroundColor: entries.map(([, d]) => d.cor),
                borderWidth: 2, borderColor: '#fff',
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { padding: 10 } },
                tooltip: { callbacks: { label: ctx => ctx.label + ': ' + formatarMoeda(ctx.raw) } }
            }
        }
    });
    setRef(chart);
}

function renderizarListaCategoria(elementId, dados, corClass) {
    const el = document.getElementById(elementId);
    const entries = Object.entries(dados).sort((a, b) => b[1].total - a[1].total);
    if (entries.length === 0) {
        el.innerHTML = '<div class="text-center text-muted py-3">Sem dados</div>';
        return;
    }
    el.innerHTML = entries.map(([nome, d]) => `
        <div class="d-flex justify-content-between py-2 border-bottom">
            <span><span class="d-inline-block rounded-circle me-2" style="width:12px;height:12px;background:${d.cor}"></span>${nome}</span>
            <strong class="${corClass}">${formatarMoeda(d.total)}</strong>
        </div>`).join('');
}

async function exportarCSV() {
    const mes = parseInt(document.getElementById('sel-mes').value);
    const ano = parseInt(document.getElementById('sel-ano').value);
    const primeiroDia = `${ano}-${String(mes).padStart(2, '0')}-01`;
    const ultimoDia = new Date(ano, mes, 0).toISOString().split('T')[0];

    const { data } = await supabase
        .from('lancamento')
        .select('*, categoria(nome), paciente(nome)')
        .gte('data', primeiroDia)
        .lte('data', ultimoDia)
        .order('data', { ascending: false });

    if (!data || data.length === 0) { mostrarAlerta('Sem dados para exportar.', 'warning'); return; }

    let csv = '﻿Data,Tipo,Categoria,Descrição,Valor,Forma Pagamento,Paciente\n';
    data.forEach(l => {
        csv += `${formatarData(l.data)},${l.tipo === 'entrada' ? 'Entrada' : 'Saída'},${l.categoria?.nome || ''},${l.descricao || ''},${Number(l.valor).toFixed(2).replace('.', ',')},${nomeFormaPagamento(l.forma_pagamento)},${l.paciente?.nome || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lancamentos_${mes}_${ano}.csv`;
    link.click();
}
