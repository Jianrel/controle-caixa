document.addEventListener('DOMContentLoaded', async () => {
    const user = await verificarAuth();
    if (!user) return;
    renderizarLayout('dashboard');

    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia = hoje.toISOString().split('T')[0];

    const { data: lancamentos } = await supabase
        .from('lancamento')
        .select('*, categoria(nome, cor)')
        .gte('data', primeiroDia)
        .lte('data', ultimoDia)
        .order('data', { ascending: false });

    const dados = lancamentos || [];

    let totalEntradas = 0, totalSaidas = 0;
    dados.forEach(l => {
        if (l.tipo === 'entrada') totalEntradas += Number(l.valor);
        else totalSaidas += Number(l.valor);
    });
    const saldo = totalEntradas - totalSaidas;

    document.getElementById('total-entradas').textContent = formatarMoeda(totalEntradas);
    document.getElementById('total-saidas').textContent = formatarMoeda(totalSaidas);
    document.getElementById('saldo').textContent = formatarMoeda(saldo);
    document.getElementById('saldo').className = `stat-value ${saldo >= 0 ? 'text-success' : 'text-danger'}`;
    document.getElementById('total-lancamentos').textContent = dados.length;

    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('mes-atual').textContent = meses[hoje.getMonth()] + '/' + hoje.getFullYear();

    // Últimos lançamentos
    const { data: ultimos } = await supabase
        .from('lancamento')
        .select('*, categoria(nome)')
        .order('data', { ascending: false })
        .order('criado_em', { ascending: false })
        .limit(10);

    const lista = document.getElementById('ultimos-lancamentos');
    if (ultimos && ultimos.length > 0) {
        lista.innerHTML = ultimos.map(l => `
            <div class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                    <div class="fw-medium">${l.descricao || l.categoria?.nome || '—'}</div>
                    <small class="text-muted">${formatarData(l.data)}</small>
                </div>
                <span class="fw-bold ${l.tipo === 'entrada' ? 'text-success' : 'text-danger'}">
                    ${l.tipo === 'entrada' ? '+' : '-'}${formatarMoeda(l.valor)}
                </span>
            </div>`).join('');
    } else {
        lista.innerHTML = '<div class="list-group-item text-center text-muted py-4">Nenhum lançamento encontrado</div>';
    }

    // Gráfico
    const porDia = {};
    dados.forEach(l => {
        if (!porDia[l.data]) porDia[l.data] = { entradas: 0, saidas: 0 };
        if (l.tipo === 'entrada') porDia[l.data].entradas += Number(l.valor);
        else porDia[l.data].saidas += Number(l.valor);
    });

    const datas = Object.keys(porDia).sort();
    if (datas.length > 0) {
        new Chart(document.getElementById('graficoDiario').getContext('2d'), {
            type: 'bar',
            data: {
                labels: datas.map(d => { const p = d.split('-'); return p[2] + '/' + p[1]; }),
                datasets: [
                    { label: 'Entradas', data: datas.map(d => porDia[d].entradas), backgroundColor: 'rgba(40,167,69,0.7)', borderRadius: 4 },
                    { label: 'Saídas', data: datas.map(d => porDia[d].saidas), backgroundColor: 'rgba(220,53,69,0.7)', borderRadius: 4 },
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) } } }
            }
        });
    }
});
