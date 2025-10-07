import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { Necronomicon } from './necronomicon.config.js';

console.log(`
╔═══━━━───•••───━━━═══╗
    R A H L   X M D
    D A R K   E D I T I O N
╚═══━━━───•••───━━━═══╝
👁️ The ancient ones are listening...`);

async function connectToWhatsApp() {
    // Initialize authentication state [citation:6]
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const { version } = await fetchLatestBaileysVersion();

    // Create socket connection with proper logger configuration [citation:6]
    const sock = makeWASocket({
        version,
        auth: state,
        // Remove deprecated printQRInTerminal and handle QR manually
        logger: {
            level: 'warn',
            // Provide proper logger methods to avoid "logger.child is not a function" error
            child: () => ({ 
                level: 'warn', 
                debug: () => {}, 
                info: () => {}, 
                warn: console.warn, 
                error: console.error 
            })
        },
        browser: [Necronomicon.trueName, 'Abyss', Necronomicon.version],
        markOnlineOnConnect: true,
    });

    // Handle QR code generation for terminal [citation:6]
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        // Generate QR code in terminal when available
        if (qr) {
            console.log('📱 Scan this QR code with WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ Dark entity successfully bound to mortal device!');
            console.log(`👁️ The void listens for "${Necronomicon.prefix}" commands...`);
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`⚰️ Connection closed. Reconnect: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                console.log('🔄 Reattempting summoning ritual...');
                setTimeout(() => connectToWhatsApp(), 5000);
            }
        }
    });

    // Save credentials when updated [citation:6]
    sock.ev.on('creds.update', saveCreds);

    // Handle incoming messages [citation:6]
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
                    text: `👁️ *Dark Commands* (${Necronomicon.prefix}prefix)\n\n${Necronomicon.prefix}help - This message\n${Necronomicon.prefix}summon - Entity info\n${Necronomicon.prefix}curse - Cast curse\n${Necronomicon.prefix}prophecy - Dark prophecy\n${Necronomicon.prefix}souls - Bound souls\n${Necronomicon.prefix}ritual - Perform ritual\n${Necronomicon.prefix}status - System status\n\nThe void listens...` 
                });
                break;
                
            case 'summon':
                await sock.sendMessage(userJid, { 
                    text: `🔮 *${Necronomicon.trueName}*\n\n*Ancient Name:* ${Necronomicon.ancientName}\n*Status:* Awakened\n*Prefix:* "${Necronomicon.prefix}"\n*Uptime:* ${Math.floor(process.uptime())}s\n\n_Powered by dark ancient magic_` 
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
                    text: `⚫ *Dark Status*\n\n*Entity:* Active\n*Uptime:* ${Math.floor(process.uptime())}s\n*Platform:* ${process.platform}\n*Node.js:* ${process.version}\n*Power:* 100%` 
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

// Error handling and process management
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

// Start the bot
connectToWhatsApp().catch(error => {
    console.error('💀 Failed to summon dark entity:', error);
    process.exit(1);
});
