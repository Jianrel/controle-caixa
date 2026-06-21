function formatarMoeda(valor) {
    if (valor == null) return 'R$ 0,00';
    return 'R$ ' + Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarData(dataStr) {
    if (!dataStr) return '—';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function dataHoje() {
    return new Date().toISOString().split('T')[0];
}

function parseMoeda(valor) {
    if (!valor) return 0;
    return parseFloat(valor.toString().replace(/\./g, '').replace(',', '.').replace('R$', '').trim());
}

function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    for (let i = 9; i <= 10; i++) {
        let soma = 0;
        for (let j = 0; j < i; j++) soma += parseInt(cpf[j]) * ((i + 1) - j);
        let digito = (soma * 10 % 11) % 10;
        if (parseInt(cpf[i]) !== digito) return false;
    }
    return true;
}

function formatarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function mascaraCPF(input) {
    input.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '').substring(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        this.value = v;
    });
}

function mascaraTelefone(input) {
    input.addEventListener('input', function () {
        let v = this.value.replace(/\D/g, '').substring(0, 11);
        if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        this.value = v;
    });
}

function mostrarAlerta(msg, tipo = 'success') {
    const container = document.getElementById('alert-container');
    if (!container) return;
    container.innerHTML = `
        <div class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>`;
    setTimeout(() => container.innerHTML = '', 5000);
}

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

const FORMAS_PAGAMENTO = [
    { valor: 'dinheiro', nome: 'Dinheiro' },
    { valor: 'pix', nome: 'PIX' },
    { valor: 'cartao_credito', nome: 'Cartão de Crédito' },
    { valor: 'cartao_debito', nome: 'Cartão de Débito' },
    { valor: 'boleto', nome: 'Boleto' },
    { valor: 'transferencia', nome: 'Transferência Bancária' },
];

function nomeFormaPagamento(valor) {
    const fp = FORMAS_PAGAMENTO.find(f => f.valor === valor);
    return fp ? fp.nome : valor;
}
