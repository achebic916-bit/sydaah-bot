const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const readline = require('readline');

const app = express();
const PORT = process.env.PORT || 3000;

// Server ya ku-keep bot alive kwa Render
app.get('/', (req, res) => {
  res.send('SYDAAH BOT IS RUNNING 🔥');
});
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Sydaah Bot", "Chrome", "1.0"]
  });

  // Pairing Code Logic - Render ita-ask namba yako kwenye logs
  if (!sock.authState.creds.registered) {
    console.log('\nBOT HAIJA-REGISTER BADO');
    // Kwa Render utaweka namba kwenye Environment Variable
    let phoneNumber = process.env.PHONE_NUMBER;

    if (!phoneNumber) {
      // Local testing
      phoneNumber = await question('Weka namba yako na code ya nchi (mf: 2547xxxx): ');
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(phoneNumber);
        console.log(`\nPAIRING CODE YAKO: ${code}`);
        console.log(`Nenda WhatsApp > Linked Devices > Link with phone number > weka code: ${code}\n`);
      } catch (e) {
        console.log('Error getting pairing code:', e.message);
      }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Connection closed, reconnecting...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('✅ SYDAAH BOT IME-CONNECT!');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const from = m.key.remoteJid;

    // Commands rahisi
    if (text.toLowerCase() === '.ping' || text.toLowerCase() === 'ping') {
      await sock.sendMessage(from, { text: 'Pong! 🏓 SYDAAH BOT IKO ONLINE' });
    }
    if (text.toLowerCase() === '.menu' || text.toLowerCase() === 'menu') {
      await sock.sendMessage(from, {
        text: `*SYDAAH BOT MENU 🔥*\n\n.ping - check bot\n.menu - hii menu\n.sticker - tengeneza sticker\n\nBot ya achebic916-bit`
      });
    }
  });
}

startBot();
