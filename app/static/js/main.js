document.addEventListener('DOMContentLoaded', function () {

    // Filtro dinâmico de categorias por tipo no formulário de lançamento
    const tipoSelect = document.getElementById('tipo');
    const categoriaSelect = document.getElementById('categoria_id');
    const pacienteGroup = document.getElementById('paciente-group');

    if (tipoSelect && categoriaSelect) {
        tipoSelect.addEventListener('change', function () {
            const tipo = this.value;

            fetch(`/lancamentos/api/categorias/${tipo}`)
                .then(response => response.json())
                .then(categorias => {
                    categoriaSelect.innerHTML = '';
                    categorias.forEach(cat => {
                        const option = document.createElement('option');
                        option.value = cat.id;
                        option.textContent = cat.nome;
                        categoriaSelect.appendChild(option);
                    });
                });

            if (pacienteGroup) {
                pacienteGroup.style.display = tipo === 'entrada' ? 'block' : 'none';
            }
        });

        // Disparar no carregamento para filtrar categorias iniciais
        if (tipoSelect.value) {
            tipoSelect.dispatchEvent(new Event('change'));
        }
    }

    // Máscara simples para campo de valor monetário
    const valorInput = document.getElementById('valor');
    if (valorInput) {
        valorInput.addEventListener('blur', function () {
            let val = this.value.replace(/[^\d,\.]/g, '');
            if (val) {
                val = val.replace('.', ',');
                this.value = val;
            }
        });
    }

    // Máscara para CPF
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function () {
            let val = this.value.replace(/\D/g, '');
            if (val.length > 11) val = val.substring(0, 11);
            if (val.length > 9) {
                val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
            } else if (val.length > 6) {
                val = val.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
            } else if (val.length > 3) {
                val = val.replace(/(\d{3})(\d{1,3})/, '$1.$2');
            }
            this.value = val;
        });
    }

    // Máscara para telefone
    const telInput = document.getElementById('telefone');
    if (telInput) {
        telInput.addEventListener('input', function () {
            let val = this.value.replace(/\D/g, '');
            if (val.length > 11) val = val.substring(0, 11);
            if (val.length > 10) {
                val = val.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (val.length > 6) {
                val = val.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else if (val.length > 2) {
                val = val.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            }
            this.value = val;
        });
    }

    // Confirmação de exclusão
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function (e) {
            if (!confirm('Tem certeza que deseja excluir?')) {
                e.preventDefault();
            }
        });
    });
});
