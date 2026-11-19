const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Family = require('../models/Family');
const { authMiddleware, signToken } = require('../middleware/auth');

const router = express.Router();

function sanitizeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar,
    bio: user.bio,
    sizes: user.sizes || {},
    globalWishlist: user.globalWishlist || [],
    createdAt: user.createdAt,
  };
}

// Registro de usuario (con opción de unirse directo a una familia por código o link)
router.post('/register', async (req, res) => {
  try {
    const { name, username, password, avatar, familyCode, nickname } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Por favor completa tu nombre, usuario/correo y contraseña.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    if (cleanUsername.length < 2) {
      return res.status(400).json({ message: 'El usuario debe tener al menos 2 caracteres.' });
    }

    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(400).json({
        message: 'Este usuario o correo ya está registrado. Si ya tienes cuenta, inicia sesión para unirte a otra familia.',
      });
    }

    let targetFamily = null;
    if (familyCode && String(familyCode).trim()) {
      const cleanCode = String(familyCode).trim().toUpperCase();
      targetFamily = await Family.findOne({ code: cleanCode });
      if (!targetFamily) {
        return res.status(404).json({
          message: `No encontramos ninguna familia con el código "${cleanCode}". Verifica el código o regístrate sin código para crear una.`,
        });
      }
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name).trim(),
      username: cleanUsername,
      passwordHash,
      avatar: avatar || 'santa',
    });

    let joinedFamilyId = null;
    if (targetFamily) {
      targetFamily.members.push({
        user: user._id,
        role: 'member',
        nickname: nickname ? String(nickname).trim() : user.name,
      });
      targetFamily.activityFeed.unshift({
        text: `${user.name} se unió a la familia navideña`,
        icon: '🎄',
      });
      // Si ya se había hecho el sorteo y entra alguien nuevo, avisamos en el feed
      await targetFamily.save();
      joinedFamilyId = targetFamily._id;
    }

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: sanitizeUser(user),
      joinedFamilyId,
    });
  } catch (err) {
    console.error('Error en /register:', err);
    return res.status(500).json({ message: 'Error al registrar el usuario.' });
  }
});

// Inicio de sesión (también permite auto-unirse si viene con un código de invitación)
router.post('/login', async (req, res) => {
  try {
    const { username, password, familyCode } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Ingresa tu usuario y contraseña.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(400).json({ message: 'Usuario no encontrado. ¿Quizás quieres registrarte?' });
    }

    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      return res.status(400).json({ message: 'Contraseña incorrecta.' });
    }

    let joinedFamilyId = null;
    if (familyCode && String(familyCode).trim()) {
      const cleanCode = String(familyCode).trim().toUpperCase();
      const family = await Family.findOne({ code: cleanCode });
      if (family) {
        const alreadyIn = family.members.some((m) => String(m.user) === String(user._id));
        if (!alreadyIn) {
          family.members.push({
            user: user._id,
            role: 'member',
            nickname: user.name,
          });
          family.activityFeed.unshift({
            text: `${user.name} se unió a la familia con invitación`,
            icon: '🦌',
          });
          await family.save();
        }
        joinedFamilyId = family._id;
      }
    }

    const token = signToken(user);
    return res.json({
      token,
      user: sanitizeUser(user),
      joinedFamilyId,
    });
  } catch (err) {
    console.error('Error en /login:', err);
    return res.status(500).json({ message: 'Error al iniciar sesión.' });
  }
});

// Obtener perfil actual
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ message: 'Error al obtener perfil.' });
  }
});

// Actualizar perfil, tallas y gustos generales
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, avatar, bio, sizes } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (name && String(name).trim()) {
      const newName = String(name).trim();
      user.name = newName;
      // Sincronizar también el nombre dentro de todas las familias donde participa
      await Family.updateMany(
        { 'members.user': user._id },
        { $set: { 'members.$[elem].nickname': newName } },
        { arrayFilters: [{ 'elem.user': user._id }] }
      );
    }
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) user.bio = String(bio).trim();
    if (sizes && typeof sizes === 'object') {
      user.sizes = {
        shirt: sizes.shirt !== undefined ? String(sizes.shirt).trim() : user.sizes?.shirt || '',
        pants: sizes.pants !== undefined ? String(sizes.pants).trim() : user.sizes?.pants || '',
        shoes: sizes.shoes !== undefined ? String(sizes.shoes).trim() : user.sizes?.shoes || '',
        favoriteColor:
          sizes.favoriteColor !== undefined ? String(sizes.favoriteColor).trim() : user.sizes?.favoriteColor || '',
        snacksAndDrinks:
          sizes.snacksAndDrinks !== undefined
            ? String(sizes.snacksAndDrinks).trim()
            : user.sizes?.snacksAndDrinks || '',
        avoidOrAllergies:
          sizes.avoidOrAllergies !== undefined
            ? String(sizes.avoidOrAllergies).trim()
            : user.sizes?.avoidOrAllergies || '',
      };
    }

    await user.save();
    return res.json({ user: sanitizeUser(user), message: '¡Perfil navideño actualizado!' });
  } catch (err) {
    return res.status(500).json({ message: 'Error al actualizar perfil.' });
  }
});

module.exports = router;
