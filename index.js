const mineflayer = require('mineflayer');
const https = require('https');

// Funkcja wysyłająca powiadomienie PUSH na telefon (ntfy.sh)
function sendPhoneAlert(message) {
  // Podmień 'moj-aternos-12033' na swoją unikalną nazwę z aplikacji w telefonie:
  const req = https.request('https://ntfy.sh/moj-aternos-12033', {
    method: 'POST',
  });
  req.on('error', (err) => console.log('Błąd wysyłania alertu:', err.message));
  req.write(`Aternos Alert: ${message}`);
  req.end();
}

function createBot() {
  const bot = mineflayer.createBot({
    host: 'gramyreazemLdd.aternos.me',
    port: 12033,
    username: 'SkoczekBot', // Twój nick bota
  });

  bot.on('spawn', () => {
    console.log('Bot wszedł na serwer!');

    // Przemieszczenie na właściwy tryb z lobby
    setTimeout(() => {
      bot.chat('/survival'); 
    }, 2000);

    // Pętla skakania
    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 400);
    }, 5000);
  });

  // Automatyczny respawn po śmierci
  bot.on('death', () => {
    console.log('Bot zginął, automatyczny respawn...');
    bot.respawn();
  });

  // TUTAJ DOPISUJEMY ALERT (wewnątrz createBot, pod zmienną 'bot'):
  bot.on('kicked', (reason) => {
    console.log('Bot wyrzucony:', reason);
    sendPhoneAlert(`Bot wyrzucony z serwera! Powód: ${reason}`);
  });

  bot.on('end', () => {
    console.log('Połączenie zerwane.');
    sendPhoneAlert('Serwer Aternos został wyłączony lub zerwano połączenie!');
    
    // Ponowne łączenie za 30 sekund
    setTimeout(createBot, 30000);
  });

  bot.on('error', (err) => {
    console.log('Błąd bota:', err);
  });
}

// Uruchomienie bota
createBot();
