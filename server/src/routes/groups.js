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

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { value, error } = createGroupSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const joinCode = nanoid(8).toUpperCase();
    const group = await Group.create({
      name: value.name,
      ownerName: value.ownerName,
      ownerEmail: value.ownerEmail,
      joinCode
    });

    res.status(201).json({
      id: group._id,
      joinCode: group.joinCode,
      allowReveal: group.allowReveal,
      name: group.name,
      ownerName: group.ownerName,
      ownerEmail: group.ownerEmail
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async (req, res, next) => {
  try {
    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() }).lean();
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    res.json({
      id: group._id,
      name: group.name,
      joinCode: group.joinCode,
      ownerName: group.ownerName,
      ownerEmail: group.ownerEmail,
      allowReveal: group.allowReveal,
      assignmentsGenerated: group.assignmentsGenerated,
      participants: group.participants,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:code/participants', async (req, res, next) => {
  try {
    const { value, error } = addParticipantSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    group.participants.push({
      name: value.name,
      email: value.email
    });
    await group.save();

    const newParticipant = group.participants[group.participants.length - 1];

    res.status(201).json({ participant: newParticipant });
  } catch (err) {
    next(err);
  }
});

router.get('/:code/participants/:participantId', async (req, res, next) => {
  try {
    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() }).lean();
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    const participant = group.participants.find((p) => p._id.toString() === req.params.participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participante no encontrado' });
    }

    res.json({ participant });
  } catch (err) {
    next(err);
  }
});

router.patch('/:code/settings', async (req, res, next) => {
  try {
    const { value, error } = updateSettingsSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    group.allowReveal = value.allowReveal;
    await group.save();

    res.json({
      allowReveal: group.allowReveal,
      assignmentsGenerated: group.assignmentsGenerated
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:code/assignments', async (req, res, next) => {
  try {
    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    if (group.participants.length < 2) {
      return res.status(400).json({ message: 'Se necesitan al menos dos participantes' });
    }

    const assignments = generateAssignments(group.participants);
    group.participants.forEach((participant) => {
      participant.assignedParticipantId = assignments.get(participant._id.toString());
    });
    group.assignmentsGenerated = true;
    await group.save();

    res.json({
      assignmentsGenerated: group.assignmentsGenerated,
      allowReveal: group.allowReveal
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:code/participants/:participantId/assignment', async (req, res, next) => {
  try {
    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() }).lean();
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    if (!group.assignmentsGenerated) {
      return res.status(409).json({ message: 'Las asignaciones aún no han sido generadas' });
    }

    if (!group.allowReveal) {
      return res.status(403).json({ message: 'El administrador aún no habilita las revelaciones' });
    }

    const participant = group.participants.find((p) => p._id.toString() === req.params.participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participante no encontrado' });
    }

    const assigned = group.participants.find((p) => p._id.toString() === participant.assignedParticipantId?.toString());
    if (!assigned) {
      return res.status(404).json({ message: 'El amigo secreto no está disponible' });
    }

    res.json({
      participant: {
        _id: assigned._id,
        name: assigned.name,
        email: assigned.email,
        wishlist: assigned.wishlist
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:code/participants/:participantId/wishlist', async (req, res, next) => {
  try {
    const { value, error } = wishlistItemSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    const participant = group.participants.id(req.params.participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participante no encontrado' });
    }

    participant.wishlist.push(value);
    await group.save();

    res.status(201).json({ wishlist: participant.wishlist });
  } catch (err) {
    next(err);
  }
});

router.delete('/:code/participants/:participantId/wishlist/:itemId', async (req, res, next) => {
  try {
    const group = await Group.findOne({ joinCode: req.params.code.toUpperCase() });
    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    const participant = group.participants.id(req.params.participantId);
    if (!participant) {
      return res.status(404).json({ message: 'Participante no encontrado' });
    }

    const item = participant.wishlist.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    item.remove();
    await group.save();

    res.json({ wishlist: participant.wishlist });
  } catch (err) {
    next(err);
  }
});

export default router;
