const mongoose = require('mongoose');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

const DEFAULT_PORT = 27017;
const DEFAULT_URI = process.env.MONGODB_URI || `mongodb://127.0.0.1:${DEFAULT_PORT}/amigo_secreto_navidad`;

let mongoProcess = null;

function checkPortOpen(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const done = (result) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(result);
      }
    };

    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

function findMongodBinary() {
  const candidates = [
    process.env.MONGOD_PATH,
    'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const serverRoot = 'C:\\Program Files\\MongoDB\\Server';
  if (fs.existsSync(serverRoot)) {
    try {
      const versions = fs.readdirSync(serverRoot).sort().reverse();
      for (const ver of versions) {
        const exe = path.join(serverRoot, ver, 'bin', 'mongod.exe');
        if (fs.existsSync(exe)) return exe;
      }
    } catch (_) {}
  }

  return null;
}

async function ensureLocalMongoRunning() {
  if (process.platform !== 'win32') return;

  const isOpen = await checkPortOpen(DEFAULT_PORT);
  if (isOpen) {
    return;
  }

  const mongodBin = findMongodBinary();
  if (!mongodBin) return;

  const dbPath = path.join(__dirname, '..', '..', '.mongodb-data');
  const logPath = path.join(dbPath, 'mongod.log');
  if (!fs.existsSync(dbPath)) {
    fs.mkdirSync(dbPath, { recursive: true });
  }

  console.log(`Iniciando servidor MongoDB local (${mongodBin})...`);

  mongoProcess = spawn(
    mongodBin,
    ['--dbpath', dbPath, '--port', String(DEFAULT_PORT), '--bind_ip', '127.0.0.1', '--logpath', logPath],
    {
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    }
  );

  mongoProcess.unref();

  for (let i = 0; i < 24; i++) {
    const ready = await checkPortOpen(DEFAULT_PORT);
    if (ready) {
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function connectDB() {
  const isLocalhost =
    DEFAULT_URI.includes('127.0.0.1') || DEFAULT_URI.includes('localhost');

  if (isLocalhost && process.platform === 'win32') {
    await ensureLocalMongoRunning();
  }

  // Reintentos automáticos (ideal para contenedores en Dokploy / Docker Compose mientras inicia Mongo)
  const maxRetries = 10;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(DEFAULT_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`Conectado a MongoDB exitosamente.`);
      return;
    } catch (err) {
      console.warn(
        `Intento ${attempt}/${maxRetries} de conexión a MongoDB falló (${err.message}). Reintentando en 2s...`
      );
      if (attempt === maxRetries) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

module.exports = { connectDB };
