require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const { router: seedRoutes, ensureDemoData } = require('./routes/seedRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Rutas de API
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/seed', seedRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'amigo-secreto-navidad',
    timestamp: new Date().toISOString(),
  });
});

// Archivos estáticos del Frontend
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Fallback SPA
app.use((req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

async function startServer() {
  try {
    await connectDB();
    if (process.env.SEED_DEMO !== 'false') {
      await ensureDemoData();
    }

    app.listen(PORT, HOST, () => {
      console.log(`Amigo Secreto corriendo en http://${HOST}:${PORT}`);
    });
  } catch (err) {
    console.error('Error fatal al iniciar el servidor:', err);
    process.exit(1);
  }
}

startServer();
