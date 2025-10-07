import express from 'express';
import { summonDarkEntity, setQRUpdateCallback, getCurrentQR } from './bot.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static('public'));

let panelStatus = 'awaiting_ritual';
let currentQR = null;

// Set up QR update callback from bot
setQRUpdateCallback((qr) => {
    currentQR = qr;
    if (qr) {
        panelStatus = 'awaiting_qr';
        console.log('📱 QR Code available in web panel');
    } else {
        panelStatus = 'connected';
        console.log('✅ QR Cleared - Bot connected');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/status', (req, res) => {
    res.json({
        status: panelStatus,
        hasQR: !!currentQR,
        qr: currentQR
    });
});

app.get('/start', (req, res) => {
    if (panelStatus === 'awaiting_ritual') {
        panelStatus = 'summoning';
        console.log('🔮 Starting bot from web panel...');
        summonDarkEntity();
    }
    res.json({ status: 'started' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🔮 Dark QR Panel: http://localhost:${PORT}`);
    console.log(`👁️ Bot will use "." prefix for commands`);
    
    // Auto-start the bot when panel starts
    setTimeout(() => {
        if (panelStatus === 'awaiting_ritual') {
            console.log('🔮 Auto-starting dark entity...');
            summonDarkEntity();
        }
    }, 1000);
});
