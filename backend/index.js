const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Setup logging to file
const logFile = path.join(__dirname, 'server.log');
const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    console.log(logMessage);
    fs.appendFileSync(logFile, logMessage);
};

log('Server starting...');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(cors());

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads', { recursive: true });
}

// POST: /print
app.post('/print', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'Geen bestand ontvangen' });

    const {
        printer = 'MG5100',
        copies = 1,
        pageRange = 'all',
        color = 'color',
        duplex = false,
        paperSize = 'A4'
    } = req.body;

    let options = [`-d`, printer, `-n`, copies.toString()];
    if (color === 'mono') options.push('-o', 'ColorModel=Gray');
    if (duplex) options.push('-o', 'sides=two-sided-long-edge');
    if (pageRange !== 'all' && pageRange !== '') options.push('-P', pageRange);
    if (paperSize) options.push('-o', `media=${paperSize}`);

    const { spawn } = require('child_process');
    const printProc = spawn('lp', [...options, path.resolve(file.path)]);

    printProc.stdout.on('data', (data) => {
        process.stdout.write(`stdout: ${data}`);
    });

    printProc.stderr.on('data', (data) => {
        process.stderr.write(`stderr: ${data}`);
    });

    printProc.on('close', (code) => {
        console.log(`Printproces gestopt met code ${code}`);
        // Verwijder bestand na print
        fs.unlinkSync(file.path);

        if (code === 0) {
            res.json({ message: 'Printopdracht verzonden' });
        } else {
            res.status(500).json({ error: `Printproces faalde met code ${code}` });
        }
    });
});
// GET: /printers - Get available printers
app.get('/printers', (req, res) => {
    // Check if we're on Windows or Linux/Mac
    const isWindows = process.platform === 'win32';
    log(`Operating system: ${process.platform}`);

    // Use WSL for printer detection if requested
    const useWsl = req.query.wsl === 'true';

    if (isWindows && useWsl) {
        log('Using WSL for printer detection as requested');
        exec('wsl lpstat -p', (err, stdout, stderr) => {
            if (err) {
                log(`Error getting printers via WSL: ${err.message}`);
                log(`WSL stderr: ${stderr}`);
                return res.status(500).json({ error: 'Failed to get printer list via WSL: ' + (stderr || err.message) });
            }

            log(`WSL printer output: ${stdout}`);
            // Parse WSL printer list
            const printers = stdout
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => {
                    const match = line.match(/printer\s+([^\s]+)/i);
                    return match ? match[1] : null;
                })
                .filter(Boolean);

            log(`Parsed WSL printers: ${JSON.stringify(printers)}`);
            res.json({ printers });
        });
    } else if (isWindows) {
        log('Using Windows native command for printer detection');
        // Windows printer detection
        exec('wmic printer get name', (err, stdout, stderr) => {
            if (err) {
                log(`Error getting Windows printers: ${err.message}`);
                return res.status(500).json({ error: 'Failed to get printer list: ' + (stderr || err.message) });
            }

            log(`Windows printer output: ${stdout}`);
            // Parse Windows printer list - skip the header line and empty lines
            const printers = stdout
                .split('\r\n')
                .map(line => line.trim())
                .filter(line => line && line !== 'Name')
                .filter(Boolean);

            log(`Parsed Windows printers: ${JSON.stringify(printers)}`);
            res.json({ printers });
        });
    } else {
        // Linux/Mac printer detection
        log('Using Linux/Mac command for printer detection');
        exec('wsl lpstat -a', (err, stdout, stderr) => {
            if (err) {
                log(`Error getting UNIX printers: ${err.message}`);
                return res.status(500).json({ error: 'Failed to get printer list: ' + (stderr || err.message) });
            }

            // Parse Linux printer list
            const printers = stdout
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => line.split(' ')[0]);

            res.json({ printers });
        });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Print backend draait op poort ${PORT}`));
