const fs = require('fs');
const csv = require('csv-parser');
const { promisify } = require('util');
const { showCurrentBRL, validCPFOrCNPJ, valuePresta } = require('./utils');


const fsPromises = fs.promises;
const mkdtemp = promisify(fs.mkdtemp);
const unlink = promisify(fs.unlink);
const rm = promisify(fs.rm);

async function processCSV(csvInput, tempOutput) {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(tempOutput, { flags: 'a' });

        fs.createReadStream(csvInput)
            .pipe(csv())
            .on('headers', (headers) => {
                const headersExtra = 'documentType;documentError;vlPrestaCalculated;vlPrestaCalculatedError'
                const headerFinal = `${headers.join(';')};${headersExtra}\n`
                writeStream.write(`${headerFinal}`);
            })
            .on('data', (row) => {

                const documentData = validCPFOrCNPJ(row.nrCpfCnpj)
                const valuePrestaData = valuePresta(row.vlTotal, row.qtPrestacoes, row.vlPresta)
                
                row.vlTotal = showCurrentBRL(row.vlTotal)
                row.vlPresta = showCurrentBRL(row.vlPresta)
                row.vlMora = showCurrentBRL(row.vlMora)
                row.vlMulta = showCurrentBRL(row.vlMulta)
                row.vlOutAcr = showCurrentBRL(row.vlOutAcr)
                row.vlDescon = showCurrentBRL(row.vlDescon)
                row.vlAtual = showCurrentBRL(row.vlAtual)
                row.vlIof = showCurrentBRL(row.vlIof)

                row['documentType'] = documentData.type
                row['documentError'] = documentData.valid
                row['vlPrestaCalculated'] = showCurrentBRL(valuePrestaData.value)
                row['vlPrestaCalculatedError'] = !valuePrestaData.valid

                const csvRow = Object.values(row).map(value => `${value}`).join(';') + '\n';
                writeStream.write(csvRow);
            })
            .on('end', () => {
                writeStream.end();
                resolve();
            })
            .on('error', (err) => {
                writeStream.end();
                reject(`Erro ao ler o CSV: ${err}`);
            });
    });
}

async function combineTempFiles(tempFiles, finalOutput) {
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

async function processAllCSVsInFolder(folderPath) {
    try {
        console.time('analyzeCSV')
       
        const tempDir = await mkdtemp(folderPath + '/csv-');
        const finalOutput = folderPath + '/final_output.csv';

        const finalOutputExist = fs.existsSync(finalOutput);

        if(finalOutputExist){
            await rm(finalOutput, { recursive: true, force: true });
        }

        const files = await fsPromises.readdir(folderPath);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        const tempFiles = await Promise.all(
            csvFiles.map(async (file) => {
                const inputFilePath = folderPath + '/' + file;
                const tempFilePath = tempDir + '/temp_' + file;
                await processCSV(inputFilePath, tempFilePath);
                return tempFilePath;
            })
        );

        await combineTempFiles(tempFiles, finalOutput);
        await rm(tempDir, { recursive: true, force: true });

        console.timeEnd('analyzeCSV')
        console.log('All csv files processed and combined with success');
    } catch (err) {
        console.error('Error on process files:', err);
    }
}

processAllCSVsInFolder('test'); // Multiple CSV

// processCSV('testcopy/data.csv', 'testcopy/output.csv') // Singles CSV