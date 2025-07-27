import express from 'express';
import prisma from './prisma.js';
import { requireAuth } from './middleware.js';

const router = express.Router();

// List all sessions for the authenticated user
router.get('/', requireAuth, async (req, res) => {
  const sessions = await prisma.session.findMany({
    where: { userId: req.user.userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, createdAt: true, updatedAt: true }
  });
  res.json(sessions);
});

// Create a new session
router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  const session = await prisma.session.create({
    data: {
      userId: req.user.userId,
      name: name || 'Untitled',
      chat: JSON.stringify([]),
      code: '',
      uiState: JSON.stringify({})
    }
  });
  res.json(session);
});

// Get a specific session
router.get('/:id', requireAuth, async (req, res) => {
  const session = await prisma.session.findUnique({
    where: { id: req.params.id },
  });
  if (!session || session.userId !== req.user.userId) return res.status(404).json({ error: 'Not found' });
  res.json(session);
});

// Update a session (chat, code, uiState)
router.put('/:id', requireAuth, async (req, res) => {
  const { chat, code, uiState, name } = req.body;
  const session = await prisma.session.findUnique({ where: { id: req.params.id } });
  if (!session || session.userId !== req.user.userId) return res.status(404).json({ error: 'Not found' });
  const updated = await prisma.session.update({
    where: { id: req.params.id },
    data: { 
      chat: chat ? JSON.stringify(chat) : undefined, 
      code, 
      uiState: uiState ? JSON.stringify(uiState) : undefined, 
      name 
    }
  });
  res.json(updated);
});

export default router; 