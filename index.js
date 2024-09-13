const fs = require('fs');
const csv = require('csv-parser');
const { promisify } = require('util');
const fsPromises = fs.promises;

const mkdtemp = promisify(fs.mkdtemp);
const unlink = promisify(fs.unlink);

async function processCSV(csvInput, tempOutput) {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(tempOutput, { flags: 'a' });

        fs.createReadStream(csvInput)
            .pipe(csv())
            .on('headers', (headers) => {
                const headersExtra = 'documentType,documentError,vlPresta,vlPrestaError'
                const headerFinal = `${headers.join(',')},${headersExtra}\n`
                writeStream.write(`${headerFinal}`);
            })
            .on('data', (row) => {
                const dataExtra = `{documentType},{documentError},{vlPresta},{vlPrestaError}`
                const line = `${row},${dataExtra}`
                writeStream.write(line);
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
        await unlink(file); // Remove o arquivo temporário após a combinação
    }

    writeStream.end();
}

async function processAllCSVsInFolder(folderPath) {
    try {
        const files = await fsPromises.readdir(folderPath);
        const csvFiles = files.filter(file => file.endsWith('.csv'));

        const tempDir = await mkdtemp(folderPath + '/csv-');
        const tempFiles = await Promise.all(
            csvFiles.map(async (file) => {
                const inputFilePath = folderPath + '/' + file;
                const tempFilePath = tempDir + '/temp_' + file;
                await processCSV(inputFilePath, tempFilePath);
                return tempFilePath;
            })
        );

        const finalOutput = folderPath + '/final_output.csv';
        await combineTempFiles(tempFiles, finalOutput);

        console.log('Todos os arquivos CSV processados e combinados com sucesso.');
    } catch (err) {
        console.error('Erro ao processar arquivos:', err);
    }
}

await processAllCSVsInFolder('data');

