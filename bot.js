import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { Necronomicon } from './necronomicon.config.js';

// Global variable to track the socket connection
let sock = null;

console.log(`
╔═══━━━───•••───━━━═══╗
    R A H L   X M D
    D A R K   E D I T I O N
    WITH QR PANEL
╚═══━━━───•••───━━━═══╝
👁️ The ancient ones are listening...`);

// Function to start the bot
async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: { level: 'warn' },
        browser: [Necronomicon.trueName, 'Abyss', Necronomicon.version],
        markOnlineOnConnect: true,
    });

    // Save credentials whenever they are updated
    sock.ev.on('creds.update', saveCreds);

    // Handle connection events
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Opened connection, bot is online.');
        }
    });

    // Handle incoming messages
    sock.ev.on('messages.upsert', ({ messages }) => {
        const message = messages[0];
        if (!message.message) return; // Ignore if there's no message content

        console.log('Received a message!');

        // Process commands and auto-reply here
        // ... (Your existing command handling logic)
    });
}

// Start the bot and keep the process alive
connectToWhatsApp().catch(err => {
    console.error('💀 Failed to start the bot:', err);
    process.exit(1);
});

// Keep the process alive
process.on('SIGINT', () => {
    console.log('⚰️ Dark entity retreats to the shadows...');
    process.exit(0);
});
