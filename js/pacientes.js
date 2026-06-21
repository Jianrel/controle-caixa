let pacientes = [];
let paginaAtual = 1;
const porPagina = 20;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await verificarAuth();
    if (!user) return;
    renderizarLayout('pacientes');

    document.getElementById('form-busca').addEventListener('submit', e => {
        e.preventDefault();
        paginaAtual = 1;
        carregarPacientes();
    });

    await carregarPacientes();
});

async function carregarPacientes() {
    const busca = document.getElementById('busca').value.trim();

    let query = supabase
        .from('paciente')
        .select('*', { count: 'exact' })
        .order('nome')
        .range((paginaAtual - 1) * porPagina, paginaAtual * porPagina - 1);

    if (busca) {
        query = query.or(`nome.ilike.%${busca}%,cpf.ilike.%${busca}%`);
    }

    const { data, count } = await query;
    pacientes = data || [];
    renderizarTabela(count || 0);
}

function renderizarTabela(total) {
    const tbody = document.getElementById('tabela-pacientes');
    const busca = document.getElementById('busca').value.trim();

    if (pacientes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">
            ${busca ? `Nenhum paciente encontrado para "${busca}"` : 'Nenhum paciente cadastrado'}</td></tr>`;
        document.getElementById('paginacao').innerHTML = '';
        return;
    }

    tbody.innerHTML = pacientes.map(p => `
        <tr>
            <td class="fw-medium">
                <a href="paciente-detalhe.html?id=${p.id}" class="text-decoration-none">${p.nome}</a>
            </td>
            <td>${p.cpf}</td>
            <td>${p.telefone || '—'}</td>
            <td>${p.email || '—'}</td>
            <td class="text-end">
                <a href="paciente-detalhe.html?id=${p.id}" class="btn btn-sm btn-outline-info"><i class="bi bi-eye"></i></a>
                <button class="btn btn-sm btn-outline-primary" onclick="editarPaciente(${p.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirPaciente(${p.id}, '${p.nome}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>`).join('');

    renderizarPaginacao(total);
}

function renderizarPaginacao(total) {
    const totalPaginas = Math.ceil(total / porPagina);
    if (totalPaginas <= 1) { document.getElementById('paginacao').innerHTML = ''; return; }

    let html = '<ul class="pagination justify-content-center">';
    html += `<li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="irPagina(${paginaAtual - 1})">Anterior</a></li>`;
    for (let i = 1; i <= totalPaginas; i++) {
        html += `<li class="page-item ${i === paginaAtual ? 'active' : ''}">
            <a class="page-link" href="#" onclick="irPagina(${i})">${i}</a></li>`;
    }
    html += `<li class="page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="irPagina(${paginaAtual + 1})">Próximo</a></li></ul>`;
    document.getElementById('paginacao').innerHTML = html;
}

function irPagina(p) { paginaAtual = p; carregarPacientes(); }

function abrirModalPaciente(paciente = null) {
    document.getElementById('modal-titulo').textContent = paciente ? 'Editar Paciente' : 'Novo Paciente';
    document.getElementById('pac-id').value = paciente ? paciente.id : '';
    document.getElementById('pac-nome').value = paciente ? paciente.nome : '';
    document.getElementById('pac-cpf').value = paciente ? paciente.cpf : '';
    document.getElementById('pac-telefone').value = paciente ? paciente.telefone || '' : '';
    document.getElementById('pac-email').value = paciente ? paciente.email || '' : '';
    document.getElementById('pac-observacoes').value = paciente ? paciente.observacoes || '' : '';

    const cpfInput = document.getElementById('pac-cpf');
    const telInput = document.getElementById('pac-telefone');
    mascaraCPF(cpfInput);
    mascaraTelefone(telInput);

    new bootstrap.Modal(document.getElementById('modalPaciente')).show();
}

async function editarPaciente(id) {
    const pac = pacientes.find(p => p.id === id);
    if (pac) abrirModalPaciente(pac);
}

async function salvarPaciente() {
    const id = document.getElementById('pac-id').value;
    const cpfRaw = document.getElementById('pac-cpf').value;

    if (!validarCPF(cpfRaw)) { mostrarAlerta('CPF inválido.', 'danger'); return; }

    const dados = {
        nome: document.getElementById('pac-nome').value.trim(),
        cpf: formatarCPF(cpfRaw),
        telefone: document.getElementById('pac-telefone').value.trim() || null,
        email: document.getElementById('pac-email').value.trim() || null,
        observacoes: document.getElementById('pac-observacoes').value.trim() || null,
    };

    if (!dados.nome) { mostrarAlerta('Preencha o nome.', 'danger'); return; }

    let error;
    if (id) {
        ({ error } = await supabase.from('paciente').update(dados).eq('id', id));
    } else {
        ({ error } = await supabase.from('paciente').insert(dados));
    }

    if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
            mostrarAlerta('Já existe um paciente com este CPF.', 'danger');
        } else {
            mostrarAlerta('Erro ao salvar: ' + error.message, 'danger');
        }
        return;
    }

    bootstrap.Modal.getInstance(document.getElementById('modalPaciente')).hide();
    mostrarAlerta(id ? 'Paciente atualizado!' : 'Paciente cadastrado!');
    await carregarPacientes();
}

async function excluirPaciente(id, nome) {
    if (!confirm(`Excluir o paciente "${nome}"?`)) return;

    const { count } = await supabase.from('lancamento').select('id', { count: 'exact', head: true }).eq('paciente_id', id);
    if (count > 0) {
        mostrarAlerta('Não é possível excluir paciente com lançamentos vinculados.', 'danger');
        return;
    }

    const { error } = await supabase.from('paciente').delete().eq('id', id);
    if (error) { mostrarAlerta('Erro: ' + error.message, 'danger'); return; }

    mostrarAlerta('Paciente excluído!');
    await carregarPacientes();
}
