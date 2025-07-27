import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './auth.js';
import sessionsRouter from './sessions.js';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/sessions', sessionsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
}); 