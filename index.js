const mineflayer = require('mineflayer');
const https = require('https');

// Nazwa Twojego kanału w aplikacji ntfy
const NTFY_TOPIC = 'moj-aternos-12033';

// Bezpieczne czyszczenie tekstu z polskich znaków dla nagłówków HTTP
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
      'Title': sanitizeHeader(title), // Czyszczenie tytułu zapobiega awarii Node.js
      'Priority': 'high'
    }
  });

  req.on('error', (err) => console.log('Błąd wysyłania alertu:', err.message));
  req.write(message);
  req.end();
}

function createBot() {
  console.log('Łączenie bota z serwerem...');

  const bot = mineflayer.createBot({
    host: 'gramyreazemLdd.aternos.me',
    port: 12033,
    username: 'SkoczekBot'
    // Usuwamy sztywną wersję – auto-detekcja po włączeniu serwera
  });

  // 1. Wejście na serwer
  bot.on('spawn', () => {
    console.log('Bot wszedł na serwer!');
    sendPhoneAlert('Aternos: Bot Polaczony', 'Bot wszedl na serwer i rozpoczal skakanie.');

    setTimeout(() => {
      bot.chat('/survival');
    }, 2000);

    // Skakanie co 5 sekund (anty-AFK)
    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 400);
    }, 5000);
  });

  // 2. Przeniesienie / Zmiana świata
  bot.on('respawn', () => {
    console.log('Zmiana świata lub przeniesienie na inny serwer!');
    sendPhoneAlert('Aternos: Przeniesienie', 'Bot zmienil wymiar, swiat lub zostal przeniesiony na inny sub-serwer.');
  });

  // 3. Wyrzucenie / Ban / Kicked
  bot.on('kicked', (reason) => {
    const parsedReason = typeof reason === 'object' ? JSON.stringify(reason) : reason;
    console.log('Bot wyrzucony/zabanowany:', parsedReason);
    sendPhoneAlert('Aternos: Bot Wyrzucony/Ban', `Powod: ${parsedReason}`);
  });

  // 4. Rozłączenie / Wyłączenie serwera
  bot.on('end', (reason) => {
    console.log('Połączenie zerwane:', reason);
    sendPhoneAlert('Aternos: Serwer Offline', `Serwer zostal wylaczony lub zerwano polaczenie! (Powod: ${reason})`);
    
    // Ponowne łączenie za 30 sekund
    setTimeout(createBot, 30000);
  });

  // 5. Błędy połączenia / Sieci
  bot.on('error', (err) => {
    console.log('Błąd bota:', err.message);
    // Ignorowanie błędów prób łączenia gdy serwer jest offline, by nie spamować bota
    if (!err.message.includes('ECONNREFUSED') && !err.message.includes('protocol version')) {
      sendPhoneAlert('Aternos: Blad Polaczenia', `Blad: ${err.message}`);
    }
  });

  // 6. Śmierć bota w grze
  bot.on('death', () => {
    console.log('Bot zginął!');
    sendPhoneAlert('Aternos: Smierc Bota', 'Bot zginal na serwerze i wykonuje respawn.');
    bot.respawn();
  });
}

createBot();
