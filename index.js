const mineflayer = require('mineflayer');
const http = require('http');

// Serwer HTTP wymagany przez Render, aby usługa nie została uznana za uśpioną/zepsutą
http.createServer((req, res) => {
  res.write("Bot dziala!");
  res.end();
}).listen(process.env.PORT || 3000);

function createBot() {
  const bot = mineflayer.createBot({
    host: 'gramyreazemLdd.aternos.me:12033', // np. 'myserwer.pl' lub '123.45.67.89'
    port: 12033,                // port serwera (domyślnie 25565)
    username: 'Maksioreks_afk',
    version: false               // autodetekcja wersji Minecrafta (możesz też wpisać np. '1.20.1')
  });

  bot.on('spawn', () => {
    console.log('Bot wszedl na serwer!');
    
    // Pętla skakania co 5 sekund (5000 ms)
    setInterval(() => {
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, 500); // puszcza klawisz skoku po połowie sekundy
    }, 5000);
  });

  // Auto-reconnect w przypadku rozłączenia z serwerem
  bot.on('end', () => {
    console.log('Bot rozlaczony. Ponowne laczenie za 10 sekund...');
    setTimeout(createBot, 10000);
  });

  bot.on('error', (err) => console.log('Blad bota:', err));
}

createBot();
