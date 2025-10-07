import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import { Necronomicon } from './necronomicon.config.js';

console.log(`
╔═══━━━───•••───━━━═══╗
    R A H L   X M D    
    D A R K   E D I T I O N
    WITH QR PANEL
╚═══━━━───•••───━━━═══╝

👁️ The ancient ones are listening...
`);

// Global QR code storage for panel
let currentQR = null;
let qrUpdateCallback = null;

export function setQRUpdateCallback(callback) {
    qrUpdateCallback = callback;
}

export function getCurrentQR() {
    return currentQR;
}

async function summonDarkEntity() {
    try {
        console.log('🔮 Beginning dark summoning ritual...');
        
        // Initialize authentication
        const { state, saveCreds } = await useMultiFileAuthState('./dark_sessions');
        const { version } = await fetchLatestBaileysVersion();
        
        // Create the dark gateway
        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false, // We'll handle QR in panel
            logger: { level: 'warn' },
            browser: [Necronomicon.trueName, 'Abyss', Necronomicon.version],
            markOnlineOnConnect: true
        });

        // Handle connection events
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('📱 QR Code generated - check web panel');
                // Generate QR for web panel
                try {
                    currentQR = await QRCode.toDataURL(qr, {
                        width: 400,
                        margin: 2,
                        color: {
                            dark: '#8B0000', // Blood red
                            light: '#000000' // Void black
                        }
                    });
                    
                    // Notify panel about new QR
                    if (qrUpdateCallback) {
                        qrUpdateCallback(currentQR);
                    }
                } catch (error) {
                    console.error('💀 QR generation failed:', error);
                }
            }

            if (connection === 'open') {
                console.log('✅ Dark entity successfully bound!');
                console.log('👁️ The void listens for "." commands...');
                currentQR = null;
                if (qrUpdateCallback) {
                    qrUpdateCallback(null); // Clear QR
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`⚰️ Connection closed. Reconnect: ${shouldReconnect}`);
                
                if (shouldReconnect) {
                    console.log('🔄 Reattempting summoning ritual...');
                    setTimeout(() => summonDarkEntity(), 5000);
                }
            }
        });

        // Save credentials when updated
        sock.ev.on('creds.update', saveCreds);

        // Handle incoming messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message || message.key.remoteJid === 'status@broadcast') return;

            const messageType = Object.keys(message.message)[0];
            const userJid = message.key.remoteJid;
            const isGroup = userJid.endsWith('@g.us');
            
            console.log(`📨 ${messageType} from ${isGroup ? 'group' : 'user'}: ${userJid}`);

            // Process text messages
            if (messageType === 'conversation' || messageType === 'extendedTextMessage') {
                const text = message.message.conversation || 
                           message.message.extendedTextMessage?.text || '';
                
                await handleDarkCommand(sock, message, text);
            }
        });

        return sock;
        
    } catch (error) {
        console.error('💀 Summoning ritual failed:', error);
        setTimeout(() => summonDarkEntity(), 10000);
    }
}

async function handleDarkCommand(sock, message, text) {
    const userJid = message.key.remoteJid;
    
    // Check for "." command prefix
    if (text.startsWith(Necronomicon.prefix)) {
        const args = text.slice(Necronomicon.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        console.log(`🔮 Dark command: ${command} from ${userJid}`);
        
        // Command handlers
        switch (command) {
            case 'help':
                await sock.sendMessage(userJid, { 
                    text: `👁️ *Dark Commands* (.prefix)\n\n.help - This message\n.summon - Entity info\n.curse - Cast curse\n.prophecy - Dark prophecy\n.souls - Bound souls\n.ritual - Perform ritual\n.status - System status\n\nThe void listens...` 
                });
                break;
                
            case 'summon':
                await sock.sendMessage(userJid, { 
                    text: `🔮 *${Necronomicon.trueName}*\n\n*Ancient Name:* ${Necronomicon.ancientName}\n*Status:* Awakened\n*Prefix:* "${Necronomicon.prefix}"\n\n_Powered by dark ancient magic_` 
                });
                break;
                
            case 'curse':
                const curses = [
                    "The shadow plague consumes you...",
                    "Eternal night falls upon your soul...",
                    "The void hungers for your essence...",
                    "Ancient nightmares shall haunt your dreams..."
                ];
                const curse = curses[Math.floor(Math.random() * curses.length)];
                await sock.sendMessage(userJid, { text: `☠️ ${curse}` });
                break;
                
            case 'prophecy':
                const prophecies = [
                    "The stars will align when the third moon rises...",
                    "A shadow shall fall over the mortal realm...",
                    "The ancient ones stir in their slumber...",
                    "Blood will water the stones of forgotten temples..."
                ];
                const prophecy = prophecies[Math.floor(Math.random() * prophecies.length)];
                await sock.sendMessage(userJid, { text: `🔮 ${prophecy}` });
                break;
                
            case 'souls':
                await sock.sendMessage(userJid, { 
                    text: `👻 *Soul Collection*\n\n*Bound Souls:* 13\n*Souls Required:* 666\n\n_The entity hungers..._` 
                });
                break;
                
            case 'ritual':
                await sock.sendMessage(userJid, { 
                    text: `🕯️ Dark ritual performed...\n\nThe ancient powers grow stronger.` 
                });
                break;
                
            case 'status':
                await sock.sendMessage(userJid, { 
                    text: `⚫ *Dark Status*\n\n*Entity:* Active\n*Uptime:* ${Math.floor(process.uptime())}s\n*Connection:* Stable\n*Power:* 100%` 
                });
                break;
                
            default:
                await sock.sendMessage(userJid, { 
                    text: `👻 Unknown command. Use ${Necronomicon.prefix}help for dark arts.` 
                });
        }
    } else {
        // Auto-reply to greetings
        const lowerText = text.toLowerCase();
        if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hey')) {
            await sock.sendMessage(userJid, { 
                text: '👁️ The void greets you, mortal... Use .help for commands' 
            });
        }
    }
}

// Handle process events
process.on('uncaughtException', (error) => {
    console.error('💀 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', () => {
    console.log('⚰️ Dark entity retreats to the shadows...');
    process.exit(0);
});

export { summonDarkEntity };
