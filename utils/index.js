const fs = require('fs');
const { promisify } = require('util');

const unlink = promisify(fs.unlink);

function validCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
    let rest = 11 - (sum % 11);
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
    rest = 11 - (sum % 11);
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.charAt(10))) return false;

    return true;
}

function validCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    let digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result != digits.charAt(0)) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result != digits.charAt(1)) return false;

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

const showCurrentBRL = (value) => {
    return new Intl.NumberFormat('pt-BR', 
        { 
            style: 'currency', 
            currency: 'BRL' 
        })
        .format(parseFloat(value, 2));
};

function valuePresta(vlTotalCsv, qtPrestaCsv, vlPrestaCsv) {
    const qtPresta = parseInt(qtPrestaCsv);
    const vlTotal = parseFloat(vlTotalCsv, 2);
    const vlPresta = parseFloat(vlPrestaCsv, 2);

    const expectedVlPresta = parseFloat((vlTotal / qtPresta), 2);
    const isVlPrestaValid = expectedVlPresta === vlPresta

    return {
        value: expectedVlPresta,
        valid: isVlPrestaValid
    }
}

async function combineFiles(tempFiles, finalOutput) {
    const writeStream = fs.createWriteStream(finalOutput);

    for (const file of tempFiles) {
        const readStream = fs.createReadStream(file);
        await new Promise((resolve, reject) => {
            readStream.pipe(writeStream, { end: false });
            readStream.on('end', resolve);
            readStream.on('error', reject);
        });
        await unlink(file);
    }

    writeStream.end();
}

module.exports = {
    showCurrentBRL,
    valuePresta,
    validCPFOrCNPJ,
    combineFiles
}