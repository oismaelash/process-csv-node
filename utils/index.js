function validaCPF(cpf) {
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

function validaCNPJ(cnpj) {
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

function validaCPFouCNPJ(valor) {
    valor = valor.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos

    let resultado = {
        tipo: '',
        valido: false
    };

    if (valor.length === 11) {
        resultado.tipo = 'CPF';
        resultado.valido = validaCPF(valor);
    } else if (valor.length === 14) {
        resultado.tipo = 'CNPJ';
        resultado.valido = validaCNPJ(valor);
    }

    return resultado;
}

const formatBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function valuePrestaIsOk(vlTotal, qtPrestacoes, vlPrestaCsv) {
    const vlTotal = parseFloat(vlTotal);
    const qtPrestacoes = parseInt(qtPrestacoes, 2);

    // Calcular o valor da prestação esperado
    const expectedVlPresta = parseInt(vlTotal / qtPrestacoes, 2);

    // Verificar se o valor calculado é igual ao valor da prestação fornecido
    const isCalculationConsistent = expectedVlPresta === vlPrestaCsv
    return isCalculationConsistent
}

module.exports = {
    formatBRL,
    valuePrestaIsOk,
    validaCPFouCNPJ
}