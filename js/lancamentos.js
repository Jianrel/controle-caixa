let lancamentos = [];
let categorias = [];
let paginaAtual = 1;
const porPagina = 20;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await verificarAuth();
    if (!user) return;
    renderizarLayout('lancamentos');

    const { data: cats } = await supabase.from('categoria').select('*').eq('ativa', true).order('nome');
    categorias = cats || [];

    preencherFiltros();
    document.getElementById('form-filtros').addEventListener('submit', e => { e.preventDefault(); paginaAtual = 1; carregarLancamentos(); });

    await carregarLancamentos();
});

function preencherFiltros() {
    const selCat = document.getElementById('filtro-categoria');
    categorias.forEach(c => {
        selCat.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
    });
    const selForma = document.getElementById('filtro-forma');
    FORMAS_PAGAMENTO.forEach(f => {
        selForma.innerHTML += `<option value="${f.valor}">${f.nome}</option>`;
    });
}

async function carregarLancamentos() {
    const tipo = document.getElementById('filtro-tipo').value;
    const catId = document.getElementById('filtro-categoria').value;
    const forma = document.getElementById('filtro-forma').value;
    const dataInicio = document.getElementById('filtro-data-inicio').value;
    const dataFim = document.getElementById('filtro-data-fim').value;

    let query = supabase
        .from('lancamento')
        .select('*, categoria(nome, cor), paciente(nome, id)', { count: 'exact' })
        .order('data', { ascending: false })
        .order('criado_em', { ascending: false })
        .range((paginaAtual - 1) * porPagina, paginaAtual * porPagina - 1);

    if (tipo) query = query.eq('tipo', tipo);
    if (catId) query = query.eq('categoria_id', catId);
    if (forma) query = query.eq('forma_pagamento', forma);
    if (dataInicio) query = query.gte('data', dataInicio);
    if (dataFim) query = query.lte('data', dataFim);

    const { data, count } = await query;
    lancamentos = data || [];
    renderizarTabela(count || 0);
}

function renderizarTabela(total) {
    const tbody = document.getElementById('tabela-lancamentos');
    if (lancamentos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">Nenhum lançamento encontrado</td></tr>';
        document.getElementById('paginacao').innerHTML = '';
        return;
    }

    tbody.innerHTML = lancamentos.map(l => `
        <tr>
            <td>${formatarData(l.data)}</td>
            <td><span class="badge badge-${l.tipo}">${l.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
            <td>
                <span class="d-inline-block rounded-circle me-1" style="width:10px;height:10px;background:${l.categoria?.cor || '#ccc'}"></span>
                ${l.categoria?.nome || '—'}
            </td>
            <td>${l.descricao || '—'}</td>
            <td>${l.paciente ? `<a href="paciente-detalhe.html?id=${l.paciente.id}" class="text-decoration-none">${l.paciente.nome}</a>` : '—'}</td>
            <td>${nomeFormaPagamento(l.forma_pagamento)}</td>
            <td class="text-end fw-bold ${l.tipo === 'entrada' ? 'text-success' : 'text-danger'}">${formatarMoeda(l.valor)}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary" onclick="editarLancamento(${l.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirLancamento(${l.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`).join('');

    const totalPaginas = Math.ceil(total / porPagina);
    if (totalPaginas <= 1) { document.getElementById('paginacao').innerHTML = ''; return; }
    let html = '<ul class="pagination justify-content-center">';
    html += `<li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="irPagina(${paginaAtual - 1})">Anterior</a></li>`;
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<li class="page-item ${i === paginaAtual ? 'active' : ''}"><a class="page-link" href="#" onclick="irPagina(${i})">${i}</a></li>`;
    }
    html += `<li class="page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}"><a class="page-link" href="#" onclick="irPagina(${paginaAtual + 1})">Próximo</a></li></ul>`;
    document.getElementById('paginacao').innerHTML = html;
}

function irPagina(p) { paginaAtual = p; carregarLancamentos(); }

function limparFiltros() {
    document.getElementById('filtro-tipo').value = '';
    document.getElementById('filtro-categoria').value = '';
    document.getElementById('filtro-forma').value = '';
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    paginaAtual = 1;
    carregarLancamentos();
}

async function abrirModalLancamento(lancamento = null) {
    document.getElementById('modal-titulo').textContent = lancamento ? 'Editar Lançamento' : 'Novo Lançamento';
    document.getElementById('lanc-id').value = lancamento ? lancamento.id : '';
    document.getElementById('lanc-tipo').value = lancamento ? lancamento.tipo : 'entrada';
    document.getElementById('lanc-valor').value = lancamento ? lancamento.valor.toString().replace('.', ',') : '';
    document.getElementById('lanc-descricao').value = lancamento ? lancamento.descricao || '' : '';
    document.getElementById('lanc-data').value = lancamento ? lancamento.data : dataHoje();
    document.getElementById('lanc-observacoes').value = lancamento ? lancamento.observacoes || '' : '';

    // Preencher formas de pagamento
    const selForma = document.getElementById('lanc-forma');
    selForma.innerHTML = FORMAS_PAGAMENTO.map(f =>
        `<option value="${f.valor}" ${lancamento && lancamento.forma_pagamento === f.valor ? 'selected' : ''}>${f.nome}</option>`
    ).join('');

    // Preencher pacientes
    const { data: pacientes } = await supabase.from('paciente').select('id, nome, cpf').order('nome');
    const selPac = document.getElementById('lanc-paciente');
    selPac.innerHTML = '<option value="">— Nenhum —</option>';
    (pacientes || []).forEach(p => {
        selPac.innerHTML += `<option value="${p.id}" ${lancamento && lancamento.paciente_id == p.id ? 'selected' : ''}>${p.nome} (${p.cpf})</option>`;
    });

    atualizarCategoriasPorTipo(lancamento);
    document.getElementById('lanc-tipo').onchange = () => atualizarCategoriasPorTipo();
    atualizarVisibilidadePaciente();
    document.getElementById('lanc-tipo').addEventListener('change', atualizarVisibilidadePaciente);

    new bootstrap.Modal(document.getElementById('modalLancamento')).show();
}

function atualizarCategoriasPorTipo(lancamento = null) {
    const tipo = document.getElementById('lanc-tipo').value;
    const selCat = document.getElementById('lanc-categoria');
    const catsFiltradas = categorias.filter(c => c.tipo === tipo);
    selCat.innerHTML = catsFiltradas.map(c =>
        `<option value="${c.id}" ${lancamento && lancamento.categoria_id == c.id ? 'selected' : ''}>${c.nome}</option>`
    ).join('');
}

function atualizarVisibilidadePaciente() {
    const tipo = document.getElementById('lanc-tipo').value;
    document.getElementById('grupo-paciente').style.display = tipo === 'entrada' ? 'block' : 'none';
}

async function editarLancamento(id) {
    const lanc = lancamentos.find(l => l.id === id);
    if (lanc) await abrirModalLancamento(lanc);
}

async function salvarLancamento() {
    const id = document.getElementById('lanc-id').value;
    const tipo = document.getElementById('lanc-tipo').value;
    const valorStr = document.getElementById('lanc-valor').value;
    const valor = parseMoeda(valorStr);

    if (!valor || valor <= 0) { mostrarAlerta('Informe um valor válido.', 'danger'); return; }

    const pacienteId = document.getElementById('lanc-paciente').value;

    const dados = {
        tipo,
        valor,
        descricao: document.getElementById('lanc-descricao').value.trim() || null,
        data: document.getElementById('lanc-data').value,
        forma_pagamento: document.getElementById('lanc-forma').value,
        observacoes: document.getElementById('lanc-observacoes').value.trim() || null,
        categoria_id: parseInt(document.getElementById('lanc-categoria').value),
        paciente_id: tipo === 'entrada' && pacienteId ? parseInt(pacienteId) : null,
    };

    if (!dados.data) { mostrarAlerta('Informe a data.', 'danger'); return; }

    let error;
    if (id) {
        ({ error } = await supabase.from('lancamento').update(dados).eq('id', id));
    } else {
        ({ error } = await supabase.from('lancamento').insert(dados));
    }

    if (error) { mostrarAlerta('Erro ao salvar: ' + error.message, 'danger'); return; }

    bootstrap.Modal.getInstance(document.getElementById('modalLancamento')).hide();
    mostrarAlerta(id ? 'Lançamento atualizado!' : 'Lançamento criado!');
    await carregarLancamentos();
}

async function excluirLancamento(id) {
    if (!confirm('Excluir este lançamento?')) return;
    const { error } = await supabase.from('lancamento').delete().eq('id', id);
    if (error) { mostrarAlerta('Erro: ' + error.message, 'danger'); return; }
    mostrarAlerta('Lançamento excluído!');
    await carregarLancamentos();
}
