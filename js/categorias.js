let categorias = [];

document.addEventListener('DOMContentLoaded', async () => {
    const user = await verificarAuth();
    if (!user) return;
    renderizarLayout('categorias');
    await carregarCategorias();
});

async function carregarCategorias() {
    const { data } = await supabase
        .from('categoria')
        .select('*')
        .order('tipo')
        .order('nome');

    categorias = data || [];
    renderizarTabela();
}

function renderizarTabela() {
    const tbody = document.getElementById('tabela-categorias');
    if (categorias.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Nenhuma categoria cadastrada</td></tr>';
        return;
    }

    tbody.innerHTML = categorias.map(c => `
        <tr${!c.ativa ? ' class="table-secondary"' : ''}>
            <td><span class="d-inline-block rounded-circle" style="width:20px;height:20px;background:${c.cor}"></span></td>
            <td class="fw-medium">${c.nome}</td>
            <td><span class="badge badge-${c.tipo}">${c.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
            <td class="text-muted">${c.descricao || '—'}</td>
            <td>${c.ativa ? '<span class="badge bg-success">Ativa</span>' : '<span class="badge bg-secondary">Inativa</span>'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-primary" onclick="editarCategoria(${c.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirCategoria(${c.id}, '${c.nome}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`).join('');
}

function abrirModal(categoria = null) {
    document.getElementById('modal-titulo').textContent = categoria ? 'Editar Categoria' : 'Nova Categoria';
    document.getElementById('cat-id').value = categoria ? categoria.id : '';
    document.getElementById('cat-nome').value = categoria ? categoria.nome : '';
    document.getElementById('cat-tipo').value = categoria ? categoria.tipo : 'entrada';
    document.getElementById('cat-descricao').value = categoria ? categoria.descricao || '' : '';
    document.getElementById('cat-cor').value = categoria ? categoria.cor : '#6c757d';
    new bootstrap.Modal(document.getElementById('modalCategoria')).show();
}

async function editarCategoria(id) {
    const cat = categorias.find(c => c.id === id);
    if (cat) abrirModal(cat);
}

async function salvarCategoria() {
    const id = document.getElementById('cat-id').value;
    const dados = {
        nome: document.getElementById('cat-nome').value.trim(),
        tipo: document.getElementById('cat-tipo').value,
        descricao: document.getElementById('cat-descricao').value.trim() || null,
        cor: document.getElementById('cat-cor').value,
    };

    if (!dados.nome) { mostrarAlerta('Preencha o nome da categoria.', 'danger'); return; }

    let error;
    if (id) {
        ({ error } = await supabase.from('categoria').update(dados).eq('id', id));
    } else {
        ({ error } = await supabase.from('categoria').insert(dados));
    }

    if (error) { mostrarAlerta('Erro ao salvar: ' + error.message, 'danger'); return; }

    bootstrap.Modal.getInstance(document.getElementById('modalCategoria')).hide();
    mostrarAlerta(id ? 'Categoria atualizada!' : 'Categoria criada!');
    await carregarCategorias();
}

async function excluirCategoria(id, nome) {
    if (!confirm(`Excluir a categoria "${nome}"?`)) return;

    const { count } = await supabase.from('lancamento').select('id', { count: 'exact', head: true }).eq('categoria_id', id);

    if (count > 0) {
        await supabase.from('categoria').update({ ativa: false }).eq('id', id);
        mostrarAlerta('Categoria desativada (possui lançamentos vinculados).', 'warning');
    } else {
        const { error } = await supabase.from('categoria').delete().eq('id', id);
        if (error) { mostrarAlerta('Erro ao excluir: ' + error.message, 'danger'); return; }
        mostrarAlerta('Categoria excluída!');
    }
    await carregarCategorias();
}
