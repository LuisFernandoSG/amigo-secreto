import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import groupsRouter from './routes/groups.js';
import { connectDb } from './config/db.js';
import { CLIENT_ORIGIN, PORT } from './config/env.js';

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/groups', groupsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const start = async () => {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
};

start().catch((err) => {
  console.error('No se pudo iniciar el servidor', err);
  process.exit(1);
});
