const mineflayer = require('mineflayer');
const https = require('https');
const http = require('http');

// 1. Prosty serwer HTTP dla Rendera (zapobiega restartom usługi)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Aternos dziala poprawnie!');
}).listen(PORT, () => {
  console.log(`Serwer HTTP uruchomiony na porcie ${PORT}`);
});

// Nazwa Twojego kanału w aplikacji ntfy
const NTFY_TOPIC = 'moj-aternos-12033';

function sanitizeHeader(text) {
  return text
    .replace(/Ł/g, 'L').replace(/ł/g, 'l')
    .replace(/Ś/g, 'S').replace(/ś/g, 's')
    .replace(/Ć/g, 'C').replace(/ć/g, 'c')
    .replace(/Ą/g, 'A').replace(/ą/g, 'a')
    .replace(/Ę/g, 'E').replace(/ę/g, 'e')
    .replace(/Ż/g, 'Z').replace(/ż/g, 'z')
    .replace(/Ź/g, 'Z').replace(/ź/g, 'z')
    .replace(/Ń/g, 'N').replace(/ń/g, 'n')
    .replace(/Ó/g, 'O').replace(/ó/g, 'o');
}

function sendPhoneAlert(title, message) {
  const req = https.request(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Title': sanitizeHeader(title),
      'Priority': 'high'
    }
  });

  req.on('error', (err) => console.log('Błąd wysyłania alertu:', err.message));
  req.write(message);
  req.end();
}

let isConnecting = false;

function createBot() {
  if (isConnecting) return;
  isConnecting = true;

  console.log('Łączenie bota z serwerem...');

  const bot = mineflayer.createBot({
    host: 'gramyreazemLdd.aternos.me',
    port: 12033,
    username: 'SkoczekBot'
  });

  bot.on('spawn', () => {
    isConnecting = false;
    console.log('Bot wszedł na serwer!');
    sendPhoneAlert('Aternos: Bot Polaczony', 'Bot wszedl na serwer i rozpoczal skakanie.');

    setTimeout(() => {
      bot.chat('/survival');
    }, 2000);

    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 400);
    }, 5000);
  });

  bot.on('respawn', () => {
    console.log('Zmiana świata lub przeniesienie na inny serwer!');
    sendPhoneAlert('Aternos: Przeniesienie', 'Bot zmienil wymiar, swiat lub zostal przeniesiony na inny sub-serwer.');
  });

  bot.on('kicked', (reason) => {
    let parsedReason = typeof reason === 'object' ? JSON.stringify(reason) : reason;
    if (parsedReason.includes('duplicate_login')) {
      parsedReason = 'Podwójne logowanie (bot już był na serwerze)';
    }
    console.log('Bot wyrzucony/zabanowany:', parsedReason);
    sendPhoneAlert('Aternos: Bot Wyrzucony/Ban', `Powod: ${parsedReason}`);
  });

  bot.on('end', (reason) => {
    console.log('Połączenie zerwane:', reason);
    sendPhoneAlert('Aternos: Serwer Offline', `Serwer zostal wylaczony lub zerwano polaczenie! (Powod: ${reason})`);
    
    setTimeout(() => {
      isConnecting = false;
      createBot();
    }, 30000);
  });

  bot.on('error', (err) => {
    console.log('Błąd bota:', err.message);
    if (!err.message.includes('ECONNREFUSED') && !err.message.includes('protocol version')) {
      sendPhoneAlert('Aternos: Blad Polaczenia', `Blad: ${err.message}`);
    }
  });

  bot.on('death', () => {
    console.log('Bot zginął!');
    sendPhoneAlert('Aternos: Smierc Bota', 'Bot zginal na serwerze i wykonuje respawn.');
    bot.respawn();
  });
}

createBot();
