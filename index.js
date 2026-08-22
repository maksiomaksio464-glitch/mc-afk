const mineflayer = require('mineflayer');
const https = require('https');

// Nazwa Twójego kanału w aplikacji ntfy
const NTFY_TOPIC = 'moj-aternos-12033';

function sendPhoneAlert(title, message) {
  const req = https.request(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Title': title,
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
    username: 'SkoczekBot',
    version: '1.21'
  });

  // 1. Wejście na serwer
  bot.on('spawn', () => {
    console.log('Bot wszedł na serwer!');
    sendPhoneAlert('Aternos: Bot Połączony', 'Bot wszedł na serwer i rozpoczął skakanie.');

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

  // NEW: Powiadomienie o przeniesieniu na inny sub-serwer (BungeeCord / Velocity)
  bot.on('respawn', () => {
    console.log('Zmiana świata lub przeniesienie na inny serwer!');
    sendPhoneAlert('Aternos: Przeniesienie', 'Bot zmienił wymiar, świat lub został przeniesiony na inny sub-serwer.');
  });

  // 2. Wyrzucenie / Ban / Kicked
  bot.on('kicked', (reason) => {
    const parsedReason = typeof reason === 'object' ? JSON.stringify(reason) : reason;
    console.log('Bot wyrzucony/zabanowany:', parsedReason);
    sendPhoneAlert('Aternos: Bot Wyrzucony/Ban', `Powód: ${parsedReason}`);
  });

  // 3. Rozłączenie / Wyłączenie serwera
  bot.on('end', (reason) => {
    console.log('Połączenie zerwane:', reason);
    sendPhoneAlert('Aternos: Serwer Offline', `Serwer został wyłączony lub zerwano połączenie! (Powód: ${reason})`);
    
    // Ponowne łączenie za 30 sekund
    setTimeout(createBot, 30000);
  });

  // 4. Błędy połączenia / Sieci
  bot.on('error', (err) => {
    console.log('Błąd bota:', err.message);
    sendPhoneAlert('Aternos: Błąd Połączenia', `Błąd: ${err.message}`);
  });

  // 5. Śmierć bota w grze
  bot.on('death', () => {
    console.log('Bot zginął!');
    sendPhoneAlert('Aternos: Śmierć Bota', 'Bot zginął na serwerze i wykonuje respawn.');
    bot.respawn();
  });
}

createBot();
