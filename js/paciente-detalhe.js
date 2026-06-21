document.addEventListener('DOMContentLoaded', async () => {
    const user = await verificarAuth();
    if (!user) return;
    renderizarLayout('pacientes');

    const id = getParam('id');
    if (!id) { window.location.href = 'pacientes.html'; return; }

    const { data: paciente } = await supabase.from('paciente').select('*').eq('id', id).single();
    if (!paciente) { window.location.href = 'pacientes.html'; return; }

    document.getElementById('pac-nome').textContent = paciente.nome;
    document.getElementById('pac-cpf').textContent = paciente.cpf;
    document.getElementById('pac-telefone').textContent = paciente.telefone || '—';
    document.getElementById('pac-email').textContent = paciente.email || '—';
    document.getElementById('pac-obs').textContent = paciente.observacoes || '';
    document.getElementById('pac-obs-row').style.display = paciente.observacoes ? 'block' : 'none';
    document.getElementById('pac-criado').textContent = new Date(paciente.criado_em).toLocaleDateString('pt-BR');
    document.getElementById('btn-editar').href = `pacientes.html?editar=${id}`;

    const { data: lancamentos } = await supabase
        .from('lancamento')
        .select('*, categoria(nome)')
        .eq('paciente_id', id)
        .order('data', { ascending: false });

    const tbody = document.getElementById('tabela-lancamentos');
    if (lancamentos && lancamentos.length > 0) {
        tbody.innerHTML = lancamentos.map(l => `
            <tr>
                <td>${formatarData(l.data)}</td>
                <td>${l.categoria?.nome || '—'}</td>
                <td>${l.descricao || '—'}</td>
                <td>${nomeFormaPagamento(l.forma_pagamento)}</td>
                <td class="text-end fw-bold text-success">${formatarMoeda(l.valor)}</td>
            </tr>`).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nenhum pagamento registrado</td></tr>';
    }
});
