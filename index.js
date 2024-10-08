const fs = require('fs');
const csv = require('csv-parser');
const { promisify } = require('util');
const { showCurrentBRL, validCPFOrCNPJ, valuePresta, combineFiles } = require('./utils');

const fsPromises = fs.promises;
const mkdtemp = promisify(fs.mkdtemp);
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
                row.vlIof = showCurrentBRL(row.vlIof) // R$ 10.300,93

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
                reject(`Error on read the file: ${err}`);
            });
    });
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

        await combineFiles(tempFiles, finalOutput);
        await rm(tempDir, { recursive: true, force: true });

        console.timeEnd('analyzeCSV')
        console.log('All csv files processed and combined with success');
    } catch (err) {
        console.error('Error on process files:', err);
    }
}

// processAllCSVsInFolder('data'); // Multiple CSV

processCSV('single/output.csv', 'single/output_single.csv') // Singles CSV
