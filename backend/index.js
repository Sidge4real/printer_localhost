const express = require('express');
const multer = require('multer');
const { exec, spawn } = require('child_process');
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

log('Print server starting...');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.json());
app.use(cors());

// Ensure uploads directory exists
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads', { recursive: true });
}

// Helper function to execute WSL commands
const execWSL = (command) => {
    return new Promise((resolve, reject) => {
        log(`Executing WSL command: ${command}`);
        exec(`wsl ${command}`, (error, stdout, stderr) => {
            if (error) {
                log(`WSL command error: ${error.message}`);
                log(`WSL stderr: ${stderr}`);
                reject({ error: error.message, stderr });
                return;
            }
            log(`WSL command success: ${stdout}`);
            resolve(stdout);
        });
    });
};

// Helper function to execute PowerShell commands with admin rights
const execPowerShellAdmin = (command) => {
    return new Promise((resolve, reject) => {
        log(`Executing PowerShell admin command: ${command}`);
        const psCommand = `powershell -Command "Start-Process PowerShell -ArgumentList '-NoProfile -Command ${command}; Read-Host \\"Press Enter to continue\\"' -Verb RunAs -Wait"`;
        
        exec(psCommand, (error, stdout, stderr) => {
            if (error) {
                log(`PowerShell admin error: ${error.message}`);
                reject({ error: error.message, stderr });
                return;
            }
            log(`PowerShell admin success: ${stdout}`);
            resolve(stdout);
        });
    });
};

// Check USB devices and get printer busid
const getUSBPrinterInfo = async () => {
    try {
        const output = await new Promise((resolve, reject) => {
            exec('usbipd list', (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });

        // Parse usbipd list output to find Canon printer
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('Canon') && line.includes('MG5100')) {
                const match = line.match(/^(\d+-\d+)/);
                if (match) {
                    return {
                        busid: match[1],
                        found: true,
                        description: line.trim()
                    };
                }
            }
        }
        return { found: false };
    } catch (error) {
        log(`Error getting USB printer info: ${error.message}`);
        return { found: false, error: error.message };
    }
};

// GET: /printer-status - Check printer connection status
app.get('/printer-status', async (req, res) => {
    try {
        log('Checking printer status...');
        
        // Check USB connection
        const usbInfo = await getUSBPrinterInfo();
        
        // Check WSL printer status
        let wslStatus = null;
        try {
            const wslOutput = await execWSL('lpstat -p MG5100');
            wslStatus = {
                connected: true,
                status: wslOutput.trim()
            };
        } catch (error) {
            wslStatus = {
                connected: false,
                error: error.error || error.message
            };
        }

        // Check if USB device is visible in WSL
        let usbInWSL = null;
        try {
            const lsusbOutput = await execWSL('lsusb');
            usbInWSL = {
                visible: lsusbOutput.includes('Canon') && lsusbOutput.includes('MG5100'),
                devices: lsusbOutput.trim()
            };
        } catch (error) {
            usbInWSL = {
                visible: false,
                error: error.error || error.message
            };
        }

        res.json({
            usb: usbInfo,
            wsl: wslStatus,
            usbInWSL: usbInWSL,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log(`Error checking printer status: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// POST: /connect-printer - Connect USB printer to WSL
app.post('/connect-printer', async (req, res) => {
    try {
        log('Connecting printer to WSL...');
        
        // Get USB printer info
        const usbInfo = await getUSBPrinterInfo();
        
        if (!usbInfo.found) {
            return res.status(404).json({ 
                error: 'Canon MG5100 printer not found in USB devices',
                details: usbInfo.error || 'No Canon MG5100 detected'
            });
        }

        log(`Found printer at busid: ${usbInfo.busid}`);

        // Execute bind and attach commands with admin rights
        const bindCommand = `usbipd bind --busid ${usbInfo.busid}; usbipd attach --busid ${usbInfo.busid} --wsl Ubuntu`;
        
        try {
            await execPowerShellAdmin(bindCommand);
            
            // Wait a moment for the USB device to be available
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify connection
            const verifyOutput = await execWSL('lsusb');
            const connected = verifyOutput.includes('Canon') && verifyOutput.includes('MG5100');
            
            if (connected) {
                log('Printer successfully connected to WSL');
                res.json({ 
                    success: true, 
                    message: 'Printer connected to WSL successfully',
                    busid: usbInfo.busid,
                    verification: verifyOutput.trim()
                });
            } else {
                log('Printer connection verification failed');
                res.status(500).json({ 
                    error: 'Printer connection could not be verified',
                    verification: verifyOutput.trim()
                });
            }

        } catch (adminError) {
            log(`Admin command failed: ${adminError.error}`);
            res.status(500).json({ 
                error: 'Failed to execute admin commands',
                details: adminError.error,
                busid: usbInfo.busid
            });
        }

    } catch (error) {
        log(`Error connecting printer: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

// POST: /print - Print a file
app.post('/print', upload.single('file'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'No file received' });
    }

    const {
        printer = 'MG5100',
        copies = 1,
        pageRange = 'all',
        color = 'color',
        duplex = false,
        paperSize = 'A4',
        connectPrinter = false
    } = req.body;

    log(`Print request received for file: ${file.originalname}`);
    log(`Printer settings: ${JSON.stringify({ printer, copies, pageRange, color, duplex, paperSize, connectPrinter })}`);

    try {
        // Step 1: Connect printer if requested
        if (connectPrinter || connectPrinter === 'true') {
            log('Auto-connecting printer before printing...');
            
            const usbInfo = await getUSBPrinterInfo();
            if (usbInfo.found) {
                const bindCommand = `usbipd bind --busid ${usbInfo.busid}; usbipd attach --busid ${usbInfo.busid} --wsl Ubuntu`;
                try {
                    await execPowerShellAdmin(bindCommand);
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for connection
                    log('Printer auto-connected successfully');
                } catch (adminError) {
                    log(`Auto-connect failed: ${adminError.error}`);
                    // Continue with printing anyway
                }
            }
        }

        // Step 2: Prepare print options
        let options = ['-d', printer, '-n', copies.toString()];
        
        if (color === 'mono') options.push('-o', 'ColorModel=Gray');
        if (duplex) options.push('-o', 'sides=two-sided-long-edge');
        if (pageRange !== 'all' && pageRange !== '') options.push('-P', pageRange);
        if (paperSize) options.push('-o', `media=${paperSize}`);

        // Step 3: Execute print command in WSL
        const printCommand = `lp ${options.join(' ')} "${path.resolve(file.path).replace(/\\/g, '/')}"`;
        
        try {
            const printOutput = await execWSL(printCommand);
            
            // Extract job ID from output
            const jobMatch = printOutput.match(/request id is ([^\s]+)/);
            const jobId = jobMatch ? jobMatch[1] : 'unknown';
            
            log(`Print job submitted successfully: ${jobId}`);
            
            // Clean up uploaded file
            fs.unlinkSync(file.path);
            
            res.json({ 
                success: true,
                message: 'Print job submitted successfully',
                jobId: jobId,
                output: printOutput.trim()
            });

        } catch (printError) {
            log(`Print command failed: ${printError.error}`);
            // Clean up uploaded file
            fs.unlinkSync(file.path);
            
            res.status(500).json({ 
                error: 'Print command failed',
                details: printError.error,
                stderr: printError.stderr
            });
        }

    } catch (error) {
        log(`Print process error: ${error.message}`);
        // Clean up uploaded file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// GET: /print-queue - Check print queue status
app.get('/print-queue', async (req, res) => {
    try {
        const queueOutput = await execWSL('lpstat -o');
        
        // Parse queue output
        const jobs = queueOutput.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 4) {
                    return {
                        jobId: parts[0],
                        user: parts[1],
                        size: parts[2],
                        time: parts.slice(3).join(' ')
                    };
                }
                return null;
            })
            .filter(Boolean);

        res.json({ 
            queue: jobs,
            count: jobs.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        // Empty queue or error
        res.json({ 
            queue: [],
            count: 0,
            message: error.error || 'Queue is empty',
            timestamp: new Date().toISOString()
        });
    }
});

// GET: /printers - Get available printers
app.get('/printers', async (req, res) => {
    try {
        const printersOutput = await execWSL('lpstat -p');
        
        // Parse printer list
        const printers = printersOutput.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => {
                const match = line.match(/printer\s+([^\s]+)\s+(.+)/i);
                if (match) {
                    return {
                        name: match[1],
                        status: match[2]
                    };
                }
                return null;
            })
            .filter(Boolean);

        res.json({ 
            printers,
            count: printers.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        log(`Error getting printers: ${error.error}`);
        res.status(500).json({ 
            error: 'Failed to get printer list',
            details: error.error
        });
    }
});

// DELETE: /print-queue/:jobId - Cancel a specific print job
app.delete('/print-queue/:jobId', async (req, res) => {
    const { jobId } = req.params;
    
    try {
        await execWSL(`cancel ${jobId}`);
        log(`Print job ${jobId} cancelled successfully`);
        
        res.json({ 
            success: true,
            message: `Print job ${jobId} cancelled`,
            jobId
        });

    } catch (error) {
        log(`Error cancelling job ${jobId}: ${error.error}`);
        res.status(500).json({ 
            error: `Failed to cancel job ${jobId}`,
            details: error.error
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        timestamp: new Date().toISOString(),
        platform: process.platform,
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    log(`Print backend server running on port ${PORT}`);
    console.log(`Print backend server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Printer status: http://localhost:${PORT}/printer-status`);
});
