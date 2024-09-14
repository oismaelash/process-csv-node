function validCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false; // Verifica se tem 11 dígitos e se todos são iguais

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
}

function validCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false; // Verifica se tem 14 dígitos e se todos são iguais

    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(1)) return false;

    return true;
}

function validCPFOrCNPJ(value) {
    value = value.replace(/[^\d]+/g, '');

    let result = {
        type: 'unknow',
        valid: false
    };

    if (value.length === 11) {
        result.type = 'cpf';
        result.valid = validCPF(value);
    } else if (value.length === 14) {
        result.type = 'cnpj';
        result.valid = validCNPJ(value);
    }

    return result;
}

const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function valuePresta(vlTotalCsv, qtPrestacoesCsv, vlPrestaCsv) {
    const vlTotal = parseFloat(vlTotalCsv, 2);
    const qtPrestacoes = parseInt(qtPrestacoesCsv);
    const vlPresta = parseFloat(vlPrestaCsv, 2);

    const expectedVlPresta = parseFloat((vlTotal / qtPrestacoes), 2);

    const isCalculationConsistent = expectedVlPresta === vlPresta

    return {
        value: expectedVlPresta,
        valid: isCalculationConsistent
    }
}

module.exports = {
    formatBRL,
    valuePresta,
    validCPFOrCNPJ
}