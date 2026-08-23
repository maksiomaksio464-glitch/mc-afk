const mineflayer = require('mineflayer');
const https = require('https');
const http = require('http');
const url = require('url');

const NTFY_TOPIC = 'moj-aternos-12033';
let botInstance = null;
let isConnecting = false;
let jumpInterval = null;
let isJumpingEnabled = true;

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

function startJumping(bot) {
  if (jumpInterval) clearInterval(jumpInterval);
  jumpInterval = setInterval(() => {
    if (bot && bot.entity && isJumpingEnabled) {
      bot.setControlState('jump', true);
      setTimeout(() => {
        if (bot) bot.setControlState('jump', false);
      }, 400);
    }
  }, 5000);
}

function createBot() {
  if (isConnecting || botInstance) return;
  isConnecting = true;

  console.log('Łączenie bota z serwerem...');

  const bot = mineflayer.createBot({
    host: 'gramyreazemLdd.aternos.me',
    port: 12033,
    username: 'Maksioreks_afk'
  });

  botInstance = bot;

  bot.on('spawn', () => {
    isConnecting = false;
    console.log('Bot wszedł na serwer!');
    sendPhoneAlert('Aternos: Bot Polaczony', 'Bot wszedl na serwer i rozpoczal skakanie.');

    setTimeout(() => {
      if (botInstance) botInstance.chat('/survival');
    }, 2000);

    startJumping(botInstance);
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
    if (jumpInterval) clearInterval(jumpInterval);
    botInstance = null;
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

// ---------------- PANEL HTTP / WWW ----------------
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  const reqUrl = url.parse(req.url, true);

  // API do sterowania botem
  if (reqUrl.pathname === '/api/control') {
    const action = reqUrl.query.action;
    const value = reqUrl.query.value;

    if (!botInstance && action !== 'connect') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'error', message: 'Bot nie jest połączony!' }));
    }

    switch (action) {
      case 'quit':
        botInstance.quit();
        botInstance = null;
        break;

      case 'connect':
        if (!botInstance) createBot();
        break;

      case 'chat':
        if (value) botInstance.chat(value);
        break;

      case 'move':
        // value: forward, back, left, right, jump
        if (value) {
          botInstance.setControlState(value, true);
          setTimeout(() => {
            if (botInstance) botInstance.setControlState(value, false);
          }, 1000);
        }
        break;

      case 'toggle_jump':
        isJumpingEnabled = !isJumpingEnabled;
        break;

      case 'look':
        // obrót bota w losowym kierunku
        const yaw = Math.random() * Math.PI * 2;
        botInstance.look(yaw, 0);
        break;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      status: 'ok', 
      isOnline: !!botInstance, 
      jumping: isJumpingEnabled 
    }));
  }

  // Wyświetlanie interfejsu panelu WWW
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Panel Bota Maksioreks_afk</title>
      <style>
        body { font-family: Arial, sans-serif; background: #121212; color: #fff; text-align: center; padding: 20px; }
        .card { background: #1e1e1e; max-width: 450px; margin: 0 auto; padding: 20px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        button { background: #007bff; color: white; border: none; padding: 10px 15px; margin: 5px; border-radius: 6px; cursor: pointer; font-size: 14px; }
        button:hover { background: #0056b3; }
        button.danger { background: #dc3545; }
        button.danger:hover { background: #a71d2a; }
        button.success { background: #28a745; }
        button.success:hover { background: #1e7e34; }
        input { padding: 10px; width: 70%; border-radius: 6px; border: 1px solid #444; background: #222; color: white; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; max-width: 200px; margin: 15px auto; }
        .status { font-weight: bold; padding: 8px; border-radius: 4px; display: inline-block; margin-bottom: 15px; }
        .online { background: #28a745; }
        .offline { background: #dc3545; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Panel Bota MC</h2>
        <div class="status ${botInstance ? 'online' : 'offline'}">
          Status: ${botInstance ? 'POŁĄCZONY' : 'ROZŁĄCZONY'}
        </div>
        
        <div>
          <button class="success" onclick="send('connect')">Wjedź na serwer</button>
          <button class="danger" onclick="send('quit')">Wyjdź z serwera</button>
        </div>

        <hr style="border-color: #333; margin: 20px 0;">

        <h3>Ruch bota</h3>
        <div class="grid">
          <div></div>
          <button onclick="send('move', 'forward')">▲ Przód</button>
          <div></div>
          <button onclick="send('move', 'left')">◄ Lewo</button>
          <button onclick="send('move', 'jump')">Skok</button>
          <button onclick="send('move', 'right')">Prawo ►</button>
          <div></div>
          <button onclick="send('move', 'back')">▼ Tył</button>
          <div></div>
        </div>
        <button onclick="send('look')">Obruć bota</button>

        <hr style="border-color: #333; margin: 20px 0;">

        <h3>Wiądomość / Komenda</h3>
        <input type="text" id="chatInput" placeholder="/survival lub cześć...">
        <button onclick="sendChat()">Wyślij</button>

        <hr style="border-color: #333; margin: 20px 0;">

        <h3>Zadania</h3>
        <button onclick="send('toggle_jump')">Włącz/Wyłącz Auto-Skakane</button>
      </div>

      <script>
        function send(action, value = '') {
          fetch('/api/control?action=' + action + '&value=' + value)
            .then(res => res.json())
            .then(() => setTimeout(() => location.reload(), 500));
        }

        function sendChat() {
          const val = document.getElementById('chatInput').value;
          if (val) send('chat', encodeURIComponent(val));
        }
      </script>
    </body>
    </html>
  `);
}).listen(PORT, () => {
  console.log(`Serwer HTTP uruchomiony na porcie ${PORT}`);
});

createBot();
