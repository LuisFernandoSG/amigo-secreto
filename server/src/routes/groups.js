import express from 'express';
import { nanoid } from 'nanoid';
import { Group } from '../models/Group.js';
import {
  addParticipantSchema,
  createGroupSchema,
  updateSettingsSchema,
  wishlistItemSchema
} from '../utils/validators.js';
import { generateAssignments } from '../utils/assignment.js';
import { broadcastGroupEvent } from '../services/realtime.js';

const router = express.Router();

const sanitizeWishlist = (wishlist = []) =>
  wishlist.map((item) => ({
    id: item._id.toString(),
    title: item.title,
    url: item.url,
    imageUrl: item.imageUrl,
    note: item.note,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));

const participantForAdmin = (participant) => ({
  id: participant._id.toString(),
  name: participant.name,
  email: participant.email,
  wishlist: sanitizeWishlist(participant.wishlist),
  wishlistCount: participant.wishlist.length,
  isOwner: participant.isOwner || false,
  createdAt: participant.createdAt,
  updatedAt: participant.updatedAt
});

const participantForSelf = (participant) => ({
  id: participant._id.toString(),
  name: participant.name,
  email: participant.email,
  isOwner: participant.isOwner || false,
  wishlist: sanitizeWishlist(participant.wishlist),
  createdAt: participant.createdAt,
  updatedAt: participant.updatedAt
});

const participantForPeers = (participant) => ({
  id: participant._id.toString(),
  name: participant.name,
  isOwner: participant.isOwner || false,
  wishlist: sanitizeWishlist(participant.wishlist)
});

router.param('code', async (req, res, next, code) => {
  try {
    const group = await Group.findOne({ joinCode: code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }
    req.group = group;
    return next();
  } catch (err) {
    return next(err);
  }
});

const requireAdmin = (req, res, next) => {
  const adminCode = String(req.headers['x-admin-code'] || '').toUpperCase();
  if (!adminCode) {
    return res.status(403).json({ message: 'Código de administrador requerido' });
  }
  if (req.group.adminCode !== adminCode) {
    return res.status(403).json({ message: 'Código de administrador inválido' });
  }
  return next();
};

const requireParticipantAccess = (req, res, next) => {
  const participant = req.group.participants.id(req.params.participantId);
  if (!participant) {
    return res.status(404).json({ message: 'Participante no encontrado' });
  }
  const accessCode = String(req.headers['x-access-code'] || '').toUpperCase();
  if (!accessCode) {
    return res.status(403).json({ message: 'Código de acceso requerido' });
  }
  if (participant.accessCode !== accessCode) {
    return res.status(403).json({ message: 'Código de acceso inválido' });
  }
  req.participant = participant;
  return next();
};

router.post('/', async (req, res, next) => {
  try {
    const { value, error } = createGroupSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const joinCode = nanoid(8).toUpperCase();
    const adminCode = nanoid(12).toUpperCase();
    const hostAccessCode = nanoid(12).toUpperCase();

    const group = await Group.create({
      name: value.name,
      joinCode,
      ownerName: value.ownerName,
      ownerEmail: value.ownerEmail,
      adminCode
    });

    group.participants.push({
      name: value.ownerName,
      email: value.ownerEmail,
      accessCode: hostAccessCode,
      isOwner: true
    });
    group.ownerParticipantId = group.participants[0]._id;

    await group.save();

    const ownerParticipant = group.participants.id(group.ownerParticipantId);

    res.status(201).json({
      id: group._id.toString(),
      name: group.name,
      joinCode: group.joinCode,
      adminCode: group.adminCode,
      allowReveal: group.allowReveal,
      assignmentsGenerated: group.assignmentsGenerated,
      ownerName: group.ownerName,
      ownerEmail: group.ownerEmail,
      hostParticipant: {
        id: ownerParticipant._id.toString(),
        name: ownerParticipant.name,
        email: ownerParticipant.email,
        accessCode: hostAccessCode
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:code', requireAdmin, (req, res) => {
  const group = req.group;
  const participants = group.participants.map(participantForAdmin);

  res.json({
    id: group._id.toString(),
    name: group.name,
    joinCode: group.joinCode,
    ownerName: group.ownerName,
    ownerEmail: group.ownerEmail,
    ownerParticipantId: group.ownerParticipantId?.toString(),
    allowReveal: group.allowReveal,
    assignmentsGenerated: group.assignmentsGenerated,
    participants,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt
  });
});

router.post('/:code/participants', async (req, res, next) => {
  try {
    const { value, error } = addParticipantSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const group = req.group;
    const accessCode = nanoid(12).toUpperCase();

    const participant = group.participants.create({
      name: value.name,
      email: value.email,
      accessCode
    });

    group.participants.push(participant);
    group.assignmentsGenerated = false;
    group.allowReveal = false;

    await group.save();

    broadcastGroupEvent(group.joinCode, 'participants:added', {
      participantId: participant._id.toString()
    });

    res.status(201).json({
      participant: participantForSelf(participant),
      accessCode
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:code/settings', requireAdmin, async (req, res, next) => {
  try {
    const { value, error } = updateSettingsSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    req.group.allowReveal = value.allowReveal;
    await req.group.save();

    broadcastGroupEvent(req.group.joinCode, 'settings:updated', {
      allowReveal: req.group.allowReveal
    });

    res.json({
      allowReveal: req.group.allowReveal,
      assignmentsGenerated: req.group.assignmentsGenerated
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:code/assignments', requireAdmin, async (req, res, next) => {
  try {
    const group = req.group;
    if (group.participants.length < 2) {
      return res.status(400).json({ message: 'Se necesitan al menos dos participantes' });
    }

    const assignments = generateAssignments(group.participants);
    group.participants.forEach((participant) => {
      participant.assignedParticipantId = assignments.get(participant._id.toString());
    });
    group.assignmentsGenerated = true;
    group.allowReveal = false;

    await group.save();

    broadcastGroupEvent(group.joinCode, 'assignments:generated', {
      assignmentsGenerated: true
    });

    res.json({
      assignmentsGenerated: group.assignmentsGenerated,
      allowReveal: group.allowReveal
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:code', requireAdmin, async (req, res, next) => {
  try {
    const joinCode = req.group.joinCode;
    await req.group.deleteOne();

    broadcastGroupEvent(joinCode, 'group:deleted', {});

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get('/:code/participants/:participantId', requireParticipantAccess, (req, res) => {
  const group = req.group;
  const participant = req.participant;

  const peers = group.participants
    .filter((peer) => !peer._id.equals(participant._id))
    .map(participantForPeers);

  res.json({
    group: {
      id: group._id.toString(),
      name: group.name,
      joinCode: group.joinCode,
      allowReveal: group.allowReveal,
      assignmentsGenerated: group.assignmentsGenerated
    },
    participant: participantForSelf(participant),
    peers
  });
});

router.get('/:code/participants/:participantId/assignment', requireParticipantAccess, (req, res) => {
  const group = req.group;
  const participant = req.participant;

  if (!group.assignmentsGenerated) {
    return res.status(409).json({ message: 'Las asignaciones aún no han sido generadas' });
  }

  if (!group.allowReveal) {
    return res.status(403).json({ message: 'El administrador aún no habilita las revelaciones' });
  }

  const assigned = group.participants.id(participant.assignedParticipantId);
  if (!assigned) {
    return res.status(404).json({ message: 'El amigo secreto no está disponible' });
  }

  res.json({
    friend: {
      id: assigned._id.toString(),
      name: assigned.name,
      wishlist: sanitizeWishlist(assigned.wishlist)
    }
  });
});

router.post('/:code/participants/:participantId/wishlist', requireParticipantAccess, async (req, res, next) => {
  try {
    const { value, error } = wishlistItemSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    req.participant.wishlist.push(value);
    await req.group.save();

    broadcastGroupEvent(req.group.joinCode, 'wishlist:updated', {
      participantId: req.participant._id.toString()
    });

    res.status(201).json({ wishlist: sanitizeWishlist(req.participant.wishlist) });
  } catch (err) {
    next(err);
  }
});

router.delete(
  '/:code/participants/:participantId/wishlist/:itemId',
  requireParticipantAccess,
  async (req, res, next) => {
    try {
      const item = req.participant.wishlist.id(req.params.itemId);
      if (!item) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      item.remove();
      await req.group.save();

      broadcastGroupEvent(req.group.joinCode, 'wishlist:updated', {
        participantId: req.participant._id.toString()
      });

      res.json({ wishlist: sanitizeWishlist(req.participant.wishlist) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
