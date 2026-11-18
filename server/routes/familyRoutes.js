const express = require('express');
const Family = require('../models/Family');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { generateSecretSantaAssignments } = require('../utils/secretSantaDraw');

const router = express.Router();

function generateInviteCode(prefix = 'NAV') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const cleanPrefix = prefix
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4) || 'NAVI';
  return `${cleanPrefix}-${randomPart}`;
}

function detectStoreName(urlStr) {
  if (!urlStr) return '';
  try {
    const u = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('amazon')) return 'Amazon';
    if (host.includes('mercadolibre') || host.includes('meli')) return 'MercadoLibre';
    if (host.includes('liverpool')) return 'Liverpool';
    if (host.includes('shein')) return 'SHEIN';
    if (host.includes('zara')) return 'Zara';
    if (host.includes('nike')) return 'Nike';
    if (host.includes('adidas')) return 'Adidas';
    if (host.includes('apple')) return 'Apple';
    if (host.includes('steam')) return 'Steam';
    if (host.includes('aliexpress')) return 'AliExpress';
    if (host.includes('walmart')) return 'Walmart';
    if (host.includes('coppel')) return 'Coppel';
    if (host.includes('falabella')) return 'Falabella';
    if (host.includes('elcorteingles')) return 'El Corte Inglés';
    const parts = host.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch (_) {
    return 'Enlace Web';
  }
}

function normalizeUrl(urlStr) {
  if (!urlStr || !String(urlStr).trim()) return '';
  const trimmed = String(urlStr).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isRevealAllowed(family) {
  if (family.drawStatus !== 'completed') return false;
  const mode = family.settings?.revealMode || 'immediate';
  if (mode === 'manual_locked') return false;
  if (mode === 'scheduled' && family.settings?.revealDate) {
    return new Date() >= new Date(family.settings.revealDate);
  }
  return true;
}

function formatFamilyForUser(family, currentUserId) {
  const uid = String(currentUserId);
  const isCreator = String(family.creator?._id || family.creator) === uid;
  const myMemberObj = family.members.find((m) => String(m.user?._id || m.user) === uid);
  const isAdmin = isCreator || (myMemberObj && myMemberObj.role === 'admin');
  const canRevealNow = isRevealAllowed(family);

  // Encontrar mi asignación (a quién le regalo yo)
  const myAssignmentRecord =
    family.drawStatus === 'completed'
      ? family.assignments.find((a) => String(a.giver?._id || a.giver) === uid)
      : null;

  // Encontrar quién me regala a mí (SOLO para enrutar mensajes anónimos internamente, NUNCA exponer su identidad)
  const mySantaRecord =
    family.drawStatus === 'completed'
      ? family.assignments.find((a) => String(a.receiver?._id || a.receiver) === uid)
      : null;

  const myGifteeId = myAssignmentRecord ? String(myAssignmentRecord.receiver?._id || myAssignmentRecord.receiver) : null;
  const mySantaId = mySantaRecord ? String(mySantaRecord.giver?._id || mySantaRecord.giver) : null;

  // Formatear miembros
  const members = family.members.map((m) => {
    const u = m.user && m.user._id ? m.user : { _id: m.user, name: 'Familiar', avatar: 'santa', sizes: {} };
    const memberUid = String(u._id);
    const wishCount = family.wishlist.filter((w) => String(w.user?._id || w.user) === memberUid).length;
    return {
      _id: m._id,
      user: {
        _id: u._id,
        name: u.name,
        username: u.username,
        avatar: u.avatar || 'santa',
        bio: u.bio || '',
        sizes: u.sizes || {},
      },
      role: m.role,
      nickname: m.nickname || u.name,
      joinedAt: m.joinedAt,
      hasRevealed: Boolean(m.hasRevealed),
      revealedAt: m.revealedAt,
      giftStatus: m.giftStatus || 'pending',
      wishCount,
    };
  });

  // Formatear lista de deseos cuidando de no spoilear al dueño si su Amigo Secreto reservó un deseo
  const wishlist = family.wishlist.map((w) => {
    const ownerId = String(w.user?._id || w.user);
    const ownerMember = members.find((m) => String(m.user._id) === ownerId);
    const isMine = ownerId === uid;
    return {
      _id: w._id,
      user: ownerId,
      ownerName: ownerMember ? ownerMember.nickname || ownerMember.user.name : 'Familiar',
      ownerAvatar: ownerMember ? ownerMember.user.avatar : 'santa',
      title: w.title,
      description: w.description,
      url: w.url,
      storeName: w.storeName || detectStoreName(w.url),
      priceEstimate: w.priceEstimate,
      priority: w.priority,
      category: w.category,
      // Si es mi propio deseo, nunca veo si fue reservado para mantener la sorpresa
      reservedBySecretSanta: isMine ? false : Boolean(w.reservedBySecretSanta),
      isMyGifteeWish: Boolean(canRevealNow && myGifteeId && ownerId === myGifteeId),
      createdAt: w.createdAt,
    };
  });

  // Información de la persona que me tocó (solo si el administrador ya permite revelar)
  let myGiftee = null;
  if (canRevealNow && myGifteeId) {
    const gifteeMember = members.find((m) => String(m.user._id) === myGifteeId);
    if (gifteeMember) {
      myGiftee = {
        ...gifteeMember.user,
        nickname: gifteeMember.nickname,
        giftStatus: myMemberObj?.giftStatus || 'pending',
        wishes: wishlist.filter((w) => String(w.user) === myGifteeId),
      };
    }
  }

  // Filtrar y anonimizar mensajes para que ni por DevTools se pueda descubrir al Amigo Secreto
  const formattedMessages = [];
  for (const msg of family.messages || []) {
    const senderId = String(msg.sender?._id || msg.sender);
    const recipientId = msg.recipient ? String(msg.recipient?._id || msg.recipient) : null;
    const senderMember = members.find((m) => String(m.user._id) === senderId);

    if (msg.type === 'family_wall') {
      formattedMessages.push({
        _id: msg._id,
        type: 'family_wall',
        isMine: senderId === uid,
        senderName: senderMember ? senderMember.nickname || senderMember.user.name : 'Familiar',
        senderAvatar: senderMember ? senderMember.user.avatar : 'santa',
        text: msg.text,
        createdAt: msg.createdAt,
      });
    } else if (msg.type === 'to_giftee') {
      // Mensaje enviado por un Amigo Secreto a su ahijado/asignado
      if (senderId === uid) {
        formattedMessages.push({
          _id: msg._id,
          type: 'chat_with_giftee',
          direction: 'outgoing',
          senderLabel: 'Tú (como Amigo Secreto 🎅)',
          text: msg.text,
          createdAt: msg.createdAt,
        });
      } else if (recipientId === uid) {
        formattedMessages.push({
          _id: msg._id,
          type: 'chat_with_santa',
          direction: 'incoming',
          senderLabel: '🎅 Tu Amigo Secreto Anónimo',
          text: msg.text,
          createdAt: msg.createdAt,
        });
      }
    } else if (msg.type === 'to_santa') {
      // Mensaje enviado por una persona hacia su Amigo Secreto desconocido
      if (senderId === uid) {
        formattedMessages.push({
          _id: msg._id,
          type: 'chat_with_santa',
          direction: 'outgoing',
          senderLabel: 'Tú',
          text: msg.text,
          createdAt: msg.createdAt,
        });
      } else if (recipientId === uid || (myGifteeId && senderId === myGifteeId)) {
        formattedMessages.push({
          _id: msg._id,
          type: 'chat_with_giftee',
          direction: 'incoming',
          senderLabel: senderMember ? `🎁 ${senderMember.nickname}` : '🎁 Tu Persona Asignada',
          text: msg.text,
          createdAt: msg.createdAt,
        });
      }
    }
  }

  return {
    _id: family._id,
    name: family.name,
    description: family.description,
    code: family.code,
    creator: family.creator?._id || family.creator,
    isCreator,
    isAdmin,
    settings: family.settings,
    drawStatus: family.drawStatus,
    drawnAt: family.drawnAt,
    drawHistoryCount: family.drawHistoryCount || 0,
    canRevealNow,
    myMember: myMemberObj
      ? {
          role: myMemberObj.role,
          nickname: myMemberObj.nickname,
          hasRevealed: Boolean(myMemberObj.hasRevealed),
          revealedAt: myMemberObj.revealedAt,
          giftStatus: myMemberObj.giftStatus || 'pending',
        }
      : null,
    myGiftee,
    hasAssignment: Boolean(myAssignmentRecord),
    members,
    exclusions: (family.exclusions || []).map((ex) => {
      const fromM = members.find((m) => String(m.user._id) === String(ex.fromUser));
      const toM = members.find((m) => String(m.user._id) === String(ex.toUser));
      return {
        _id: ex._id,
        fromUser: ex.fromUser,
        toUser: ex.toUser,
        fromName: fromM ? fromM.nickname : 'Familiar',
        toName: toM ? toM.nickname : 'Familiar',
        bidirectional: ex.bidirectional,
        reason: ex.reason,
      };
    }),
    wishlist,
    messages: formattedMessages,
    activityFeed: (family.activityFeed || []).slice(0, 25),
    stats: {
      totalMembers: members.length,
      revealedCount: members.filter((m) => m.hasRevealed).length,
      giftsReadyCount: members.filter((m) => m.giftStatus === 'wrapped' || m.giftStatus === 'ready').length,
      totalWishes: wishlist.length,
    },
  };
}

// Vista previa pública de una familia por código (para links de invitación ?join=CODIGO)
router.get('/preview/:code', async (req, res) => {
  try {
    const cleanCode = String(req.params.code || '').trim().toUpperCase();
    const family = await Family.findOne({ code: cleanCode }).populate('creator', 'name avatar');
    if (!family) {
      return res.status(404).json({ message: 'No se encontró ninguna familia con ese código de invitación.' });
    }

    return res.json({
      family: {
        _id: family._id,
        name: family.name,
        description: family.description,
        code: family.code,
        creatorName: family.creator?.name || 'Organizador Familiar',
        memberCount: family.members.length,
        budgetMin: family.settings?.budgetMin,
        budgetMax: family.settings?.budgetMax,
        recommendedAmount: family.settings?.recommendedAmount,
        currency: family.settings?.currency,
        exchangeDate: family.settings?.exchangeDate,
        drawStatus: family.drawStatus,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al consultar la invitación familiar.' });
  }
});

// Listar todas las familias donde participa el usuario actual
router.get('/', authMiddleware, async (req, res) => {
  try {
    const families = await Family.find({ 'members.user': req.user.id })
      .populate('members.user', 'name username avatar bio sizes')
      .sort({ updatedAt: -1 });

    const summaries = families.map((f) => {
      const formatted = formatFamilyForUser(f, req.user.id);
      return {
        _id: formatted._id,
        name: formatted.name,
        description: formatted.description,
        code: formatted.code,
        isCreator: formatted.isCreator,
        isAdmin: formatted.isAdmin,
        drawStatus: formatted.drawStatus,
        canRevealNow: formatted.canRevealNow,
        settings: formatted.settings,
        myMember: formatted.myMember,
        stats: formatted.stats,
        memberAvatars: formatted.members.slice(0, 6).map((m) => ({
          name: m.nickname,
          avatar: m.user.avatar,
        })),
      };
    });

    return res.json({ families: summaries });
  } catch (err) {
    console.error('Error listando familias:', err);
    return res.status(500).json({ message: 'Error al obtener tus familias.' });
  }
});

// Crear una nueva familia
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      customCode,
      budgetMin,
      budgetMax,
      recommendedAmount,
      currency,
      exchangeDate,
      exchangeLocation,
      revealMode,
      revealDate,
      nickname,
      themeBanner,
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'El nombre de la familia es obligatorio.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    let code = customCode ? String(customCode).trim().toUpperCase().replace(/\s+/g, '-') : '';
    if (code) {
      const exists = await Family.findOne({ code });
      if (exists) {
        return res.status(400).json({ message: `El código "${code}" ya está en uso por otra familia. Elige otro.` });
      }
    } else {
      for (let i = 0; i < 10; i++) {
        const candidate = generateInviteCode(name);
        const exists = await Family.findOne({ code: candidate });
        if (!exists) {
          code = candidate;
          break;
        }
      }
    }

    const family = await Family.create({
      name: String(name).trim(),
      description: description
        ? String(description).trim()
        : '¡Bienvenidos al intercambio navideño de nuestra familia!',
      code,
      creator: user._id,
      settings: {
        budgetMin: budgetMin !== undefined ? Number(budgetMin) : 20,
        budgetMax: budgetMax !== undefined ? Number(budgetMax) : 50,
        recommendedAmount: recommendedAmount !== undefined ? Number(recommendedAmount) : 35,
        currency: currency || 'USD ($)',
        exchangeDate: exchangeDate ? new Date(exchangeDate) : new Date(new Date().getFullYear(), 11, 24, 21, 0, 0),
        exchangeLocation: exchangeLocation || 'Cena de Nochebuena en Familia',
        revealMode: revealMode || 'immediate',
        revealDate: revealDate ? new Date(revealDate) : null,
        themeBanner: themeBanner || 'classic_red',
      },
      members: [
        {
          user: user._id,
          role: 'admin',
          nickname: nickname ? String(nickname).trim() : user.name,
        },
      ],
      activityFeed: [
        {
          text: `${user.name} creó la familia "${String(name).trim()}"`,
          icon: '🎅',
        },
      ],
    });

    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.status(201).json({
      family: formatFamilyForUser(populated, req.user.id),
      message: '¡Familia creada con éxito! Comparte el código o enlace con tus familiares.',
    });
  } catch (err) {
    console.error('Error creando familia:', err);
    return res.status(500).json({ message: 'Error al crear la familia.' });
  }
});

// Unirse a una familia existente por código (un mismo usuario puede estar en múltiples familias)
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { code, nickname } = req.body;
    if (!code || !String(code).trim()) {
      return res.status(400).json({ message: 'Por favor ingresa el código de la familia.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const family = await Family.findOne({ code: cleanCode });
    if (!family) {
      return res.status(404).json({
        message: `No encontramos ninguna familia con el código "${cleanCode}". Verifica que esté bien escrito.`,
      });
    }

    const user = await User.findById(req.user.id);
    const alreadyMember = family.members.find((m) => String(m.user) === String(user._id));

    if (alreadyMember) {
      const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
      return res.json({
        family: formatFamilyForUser(populated, req.user.id),
        alreadyMember: true,
        message: `Ya eres parte de "${family.name}". ¡Te llevamos directo!`,
      });
    }

    family.members.push({
      user: user._id,
      role: 'member',
      nickname: nickname && String(nickname).trim() ? String(nickname).trim() : user.name,
    });

    family.activityFeed.unshift({
      text: `${nickname && String(nickname).trim() ? String(nickname).trim() : user.name} se unió a la familia`,
      icon: '🎄',
    });

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');

    return res.status(201).json({
      family: formatFamilyForUser(populated, req.user.id),
      message: `¡Te has unido a "${family.name}"!`,
    });
  } catch (err) {
    console.error('Error uniéndose a familia:', err);
    return res.status(500).json({ message: 'Error al unirse a la familia.' });
  }
});

// Obtener detalle completo de una familia
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id).populate('members.user', 'name username avatar bio sizes');
    if (!family) {
      return res.status(404).json({ message: 'Familia no encontrada.' });
    }

    const isMember = family.members.some((m) => String(m.user?._id || m.user) === String(req.user.id));
    if (!isMember) {
      return res.status(403).json({ message: 'No perteneces a esta familia todavía.' });
    }

    return res.json({ family: formatFamilyForUser(family, req.user.id) });
  } catch (err) {
    console.error('Error obteniendo familia:', err);
    return res.status(500).json({ message: 'Error al cargar los datos de la familia.' });
  }
});

// Panel de Administración: Actualizar ajustes, monto de regalo, fechas y cuándo se puede ver el Amigo Secreto
router.put('/:id/settings', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) {
      return res.status(404).json({ message: 'Familia no encontrada.' });
    }

    const isCreator = String(family.creator) === String(req.user.id);
    const myMember = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!isCreator && (!myMember || myMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Solo el creador o administrador de la familia puede modificar estos ajustes.' });
    }

    const {
      name,
      description,
      code,
      budgetMin,
      budgetMax,
      recommendedAmount,
      currency,
      exchangeDate,
      exchangeLocation,
      revealMode,
      revealDate,
      customRules,
      themeBanner,
    } = req.body;

    if (name && String(name).trim()) family.name = String(name).trim();
    if (description !== undefined) family.description = String(description).trim();

    if (code && String(code).trim()) {
      const cleanCode = String(code).trim().toUpperCase().replace(/\s+/g, '-');
      if (cleanCode !== family.code) {
        const duplicate = await Family.findOne({ code: cleanCode, _id: { $ne: family._id } });
        if (duplicate) {
          return res.status(400).json({ message: `El código "${cleanCode}" ya está en uso por otra familia.` });
        }
        family.code = cleanCode;
      }
    }

    if (budgetMin !== undefined) family.settings.budgetMin = Number(budgetMin);
    if (budgetMax !== undefined) family.settings.budgetMax = Number(budgetMax);
    if (recommendedAmount !== undefined) family.settings.recommendedAmount = Number(recommendedAmount);
    if (currency !== undefined) family.settings.currency = String(currency).trim();
    if (exchangeDate !== undefined) family.settings.exchangeDate = exchangeDate ? new Date(exchangeDate) : null;
    if (exchangeLocation !== undefined) family.settings.exchangeLocation = String(exchangeLocation).trim();
    if (revealMode !== undefined) family.settings.revealMode = revealMode;
    if (revealDate !== undefined) family.settings.revealDate = revealDate ? new Date(revealDate) : null;
    if (customRules !== undefined) family.settings.customRules = String(customRules).trim();
    if (themeBanner !== undefined) family.settings.themeBanner = themeBanner;

    family.activityFeed.unshift({
      text: 'El organizador actualizó las reglas y configuración del intercambio',
      icon: '⚙️',
    });

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: '¡Configuración de la familia guardada correctamente!',
    });
  } catch (err) {
    console.error('Error actualizando settings:', err);
    return res.status(500).json({ message: 'Error al guardar la configuración.' });
  }
});

// Panel de Administración: Agregar exclusión (ej. parejas que no deben tocarse entre sí)
router.post('/:id/exclusions', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const isCreator = String(family.creator) === String(req.user.id);
    const myMember = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!isCreator && (!myMember || myMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Solo el administrador puede gestionar restricciones.' });
    }

    const { fromUser, toUser, bidirectional = true, reason = 'Restricción familiar' } = req.body;
    if (!fromUser || !toUser || String(fromUser) === String(toUser)) {
      return res.status(400).json({ message: 'Selecciona dos familiares distintos para la restricción.' });
    }

    family.exclusions.push({
      fromUser,
      toUser,
      bidirectional: Boolean(bidirectional),
      reason: String(reason).trim(),
    });

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: 'Restricción de sorteo agregada.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al agregar restricción.' });
  }
});

// Panel de Administración: Eliminar exclusión
router.delete('/:id/exclusions/:exclusionId', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const isCreator = String(family.creator) === String(req.user.id);
    const myMember = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!isCreator && (!myMember || myMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Solo el administrador puede eliminar restricciones.' });
    }

    family.exclusions = family.exclusions.filter((ex) => String(ex._id) !== String(req.params.exclusionId));
    await family.save();

    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: 'Restricción eliminada.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al eliminar restricción.' });
  }
});

// Panel de Administración: REALIZAR SORTEO ALEATORIO DE AMIGO SECRETO
router.post('/:id/draw', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const isCreator = String(family.creator) === String(req.user.id);
    const myMember = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!isCreator && (!myMember || myMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Solo el creador o administrador puede realizar el sorteo.' });
    }

    if (family.members.length < 2) {
      return res.status(400).json({
        message: 'Se necesitan al menos 2 miembros en la familia para realizar el sorteo de Amigo Secreto.',
      });
    }

    const memberUserIds = family.members.map((m) => String(m.user));
    let assignments;
    try {
      assignments = generateSecretSantaAssignments(memberUserIds, family.exclusions);
    } catch (drawErr) {
      return res.status(400).json({ message: drawErr.message });
    }

    family.assignments = assignments;
    family.drawStatus = 'completed';
    family.drawnAt = new Date();
    family.drawHistoryCount = (family.drawHistoryCount || 0) + 1;

    // Reiniciar estado de revelación y reserva de regalos al hacer un nuevo sorteo
    family.members.forEach((m) => {
      m.hasRevealed = false;
      m.revealedAt = null;
      m.giftStatus = 'pending';
    });
    family.wishlist.forEach((w) => {
      w.reservedBySecretSanta = false;
    });

    family.activityFeed.unshift({
      text: `🎲 ¡Se ha realizado el sorteo oficial del Amigo Secreto entre ${family.members.length} familiares!`,
      icon: '🎲',
    });

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: '¡Sorteo navideño realizado con éxito! Cada participante tiene un Amigo Secreto único.',
    });
  } catch (err) {
    console.error('Error en sorteo:', err);
    return res.status(500).json({ message: 'Error al realizar el sorteo.' });
  }
});

// Panel de Administración: Reiniciar sorteo (por si faltó algún familiar por registrarse)
router.post('/:id/reset-draw', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const isCreator = String(family.creator) === String(req.user.id);
    const myMember = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!isCreator && (!myMember || myMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Solo el administrador puede reiniciar el sorteo.' });
    }

    family.assignments = [];
    family.drawStatus = 'pending';
    family.drawnAt = null;
    family.members.forEach((m) => {
      m.hasRevealed = false;
      m.revealedAt = null;
      m.giftStatus = 'pending';
    });

    family.activityFeed.unshift({
      text: '🔄 El organizador reinició el sorteo para ajustar participantes.',
      icon: '🔄',
    });

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: 'El sorteo ha sido reiniciado.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al reiniciar el sorteo.' });
  }
});

// Acción del Participante: Abrir su caja de regalo digital y marcar como revelado
router.post('/:id/reveal', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    if (!isRevealAllowed(family)) {
      return res.status(403).json({
        message: 'Todavía no está habilitado ver a quién te tocó. ¡Espera a la fecha programada por el organizador!',
      });
    }

    const member = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!member) {
      return res.status(403).json({ message: 'No eres miembro de esta familia.' });
    }

    if (!member.hasRevealed) {
      member.hasRevealed = true;
      member.revealedAt = new Date();
      family.activityFeed.unshift({
        text: '✨ ¡Un familiar acaba de abrir su sobre secreto y ya sabe a quién le regala!',
        icon: '🎁',
      });
      await family.save();
    }

    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: '¡Has descubierto a tu Amigo Secreto!',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al revelar tu Amigo Secreto.' });
  }
});

// Actualizar mi estado del regalo o apodo en la familia
router.put('/:id/my-status', authMiddleware, async (req, res) => {
  try {
    const { giftStatus, nickname } = req.body;
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const member = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!member) return res.status(403).json({ message: 'No eres miembro de esta familia.' });

    if (nickname !== undefined && String(nickname).trim()) {
      member.nickname = String(nickname).trim();
    }

    if (giftStatus && ['pending', 'shopping', 'wrapped', 'ready'].includes(giftStatus)) {
      const prev = member.giftStatus;
      member.giftStatus = giftStatus;
      if (prev !== giftStatus && (giftStatus === 'wrapped' || giftStatus === 'ready')) {
        family.activityFeed.unshift({
          text: '🎄 ¡Un Amigo Secreto ya tiene su regalo comprado y listo para el árbol!',
          icon: '🎁',
        });
      }
    }

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: '¡Estado actualizado!',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al actualizar estado.' });
  }
});

// Agregar un deseo a la lista de deseos de la familia (con soporte para links directos y replicación opcional a otras familias)
router.post('/:id/wishes', authMiddleware, async (req, res) => {
  try {
    const { title, description, url, priceEstimate, priority, category, applyToAllMyFamilies } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Escribe el nombre o idea de tu deseo.' });
    }

    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const member = family.members.find((m) => String(m.user) === String(req.user.id));
    if (!member) return res.status(403).json({ message: 'No perteneces a esta familia.' });

    const cleanUrl = normalizeUrl(url);
    const wishData = {
      user: req.user.id,
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      url: cleanUrl,
      storeName: detectStoreName(cleanUrl),
      priceEstimate:
        priceEstimate !== undefined && priceEstimate !== '' && priceEstimate !== null ? Number(priceEstimate) : null,
      priority: priority || 'high',
      category: category || 'other',
    };

    family.wishlist.unshift(wishData);
    family.activityFeed.unshift({
      text: `${member.nickname || req.user.name} agregó un nuevo deseo: "${wishData.title}"`,
      icon: '⭐',
    });
    await family.save();

    // Si el usuario juega en varias familias y activó "Agregar también a mis otras familias"
    if (applyToAllMyFamilies) {
      await Family.updateMany(
        {
          _id: { $ne: family._id },
          'members.user': req.user.id,
        },
        {
          $push: {
            wishlist: {
              $each: [wishData],
              $position: 0,
            },
          },
        }
      );
    }

    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.status(201).json({
      family: formatFamilyForUser(populated, req.user.id),
      message: applyToAllMyFamilies
        ? '¡Deseo agregado a esta y todas tus familias!'
        : '¡Deseo agregado a tu carta navideña!',
    });
  } catch (err) {
    console.error('Error agregando deseo:', err);
    return res.status(500).json({ message: 'Error al guardar el deseo.' });
  }
});

// Editar un deseo propio
router.put('/:id/wishes/:wishId', authMiddleware, async (req, res) => {
  try {
    const { title, description, url, priceEstimate, priority, category } = req.body;
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const wish = family.wishlist.id(req.params.wishId);
    if (!wish) return res.status(404).json({ message: 'Deseo no encontrado.' });

    if (String(wish.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Solo puedes editar tus propios deseos.' });
    }

    if (title && String(title).trim()) wish.title = String(title).trim();
    if (description !== undefined) wish.description = String(description).trim();
    if (url !== undefined) {
      wish.url = normalizeUrl(url);
      wish.storeName = detectStoreName(wish.url);
    }
    if (priceEstimate !== undefined) {
      wish.priceEstimate = priceEstimate !== '' && priceEstimate !== null ? Number(priceEstimate) : null;
    }
    if (priority) wish.priority = priority;
    if (category) wish.category = category;

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: 'Deseo actualizado.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al actualizar el deseo.' });
  }
});

// Eliminar un deseo propio
router.delete('/:id/wishes/:wishId', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const wish = family.wishlist.id(req.params.wishId);
    if (!wish) return res.status(404).json({ message: 'Deseo no encontrado.' });

    if (String(wish.user) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Solo puedes eliminar tus propios deseos.' });
    }

    family.wishlist = family.wishlist.filter((w) => String(w._id) !== String(req.params.wishId));
    await family.save();

    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: 'Deseo eliminado.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al eliminar el deseo.' });
  }
});

// Amigo Secreto: Marcar un deseo de mi persona asignada como "Reservado / Lo voy a comprar"
router.post('/:id/wishes/:wishId/toggle-reserve', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const wish = family.wishlist.id(req.params.wishId);
    if (!wish) return res.status(404).json({ message: 'Deseo no encontrado.' });

    if (String(wish.user) === String(req.user.id)) {
      return res.status(400).json({ message: 'No puedes reservar tu propio deseo.' });
    }

    wish.reservedBySecretSanta = !wish.reservedBySecretSanta;
    await family.save();

    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: wish.reservedBySecretSanta
        ? '🎁 ¡Marcaste este deseo como elegido! (Tu asignado no verá esta marca para mantener la sorpresa)'
        : 'Marca de reserva quitada.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al marcar el deseo.' });
  }
});

// Importar mis deseos desde otra familia donde participo hacia esta familia
router.post('/:id/import-wishes', authMiddleware, async (req, res) => {
  try {
    const { sourceFamilyId } = req.body;
    const targetFamily = await Family.findById(req.params.id);
    const sourceFamily = await Family.findById(sourceFamilyId);

    if (!targetFamily || !sourceFamily) {
      return res.status(404).json({ message: 'Familia no encontrada.' });
    }

    const mySourceWishes = sourceFamily.wishlist.filter((w) => String(w.user) === String(req.user.id));
    if (mySourceWishes.length === 0) {
      return res.status(400).json({ message: 'No tienes deseos registrados en esa otra familia para importar.' });
    }

    const existingTitles = new Set(
      targetFamily.wishlist
        .filter((w) => String(w.user) === String(req.user.id))
        .map((w) => w.title.toLowerCase())
    );

    let importedCount = 0;
    for (const w of mySourceWishes) {
      if (!existingTitles.has(w.title.toLowerCase())) {
        targetFamily.wishlist.push({
          user: req.user.id,
          title: w.title,
          description: w.description,
          url: w.url,
          storeName: w.storeName,
          priceEstimate: w.priceEstimate,
          priority: w.priority,
          category: w.category,
        });
        importedCount++;
      }
    }

    await targetFamily.save();
    const populated = await Family.findById(targetFamily._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message:
        importedCount > 0
          ? `¡Se importaron ${importedCount} deseos de "${sourceFamily.name}"!`
          : 'Todos los deseos de esa familia ya estaban en esta lista.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al importar deseos.' });
  }
});

// Enviar mensajes (Anónimos al ahijado, anónimos a mi Amigo Secreto, o en el Muro Navideño Familiar)
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { type, text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Escribe un mensaje antes de enviar.' });
    }

    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const uid = String(req.user.id);
    const isMember = family.members.some((m) => String(m.user) === uid);
    if (!isMember) return res.status(403).json({ message: 'No perteneces a esta familia.' });

    if (type === 'family_wall') {
      family.messages.push({
        type: 'family_wall',
        sender: req.user.id,
        recipient: null,
        text: String(text).trim(),
      });
    } else if (type === 'to_giftee') {
      // Yo (Amigo Secreto) le escribo de forma anónima a la persona que me tocó
      const myAssign = family.assignments.find((a) => String(a.giver) === uid);
      if (!myAssign) {
        return res.status(400).json({ message: 'Aún no hay una persona asignada para enviarle mensaje.' });
      }
      family.messages.push({
        type: 'to_giftee',
        sender: req.user.id,
        recipient: myAssign.receiver,
        text: String(text).trim(),
      });
    } else if (type === 'to_santa') {
      // Yo le escribo una pista o respuesta a mi Amigo Secreto (sin saber quién es)
      const mySanta = family.assignments.find((a) => String(a.receiver) === uid);
      if (!mySanta) {
        return res.status(400).json({ message: 'El sorteo aún no se ha realizado.' });
      }
      family.messages.push({
        type: 'to_santa',
        sender: req.user.id,
        recipient: mySanta.giver,
        text: String(text).trim(),
      });
    } else {
      return res.status(400).json({ message: 'Tipo de mensaje inválido.' });
    }

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.status(201).json({
      family: formatFamilyForUser(populated, req.user.id),
      message: '¡Mensaje enviado!',
    });
  } catch (err) {
    console.error('Error enviando mensaje:', err);
    return res.status(500).json({ message: 'Error al enviar el mensaje.' });
  }
});

// Eliminar un miembro (solo Admin y antes del sorteo, o salir voluntariamente)
router.delete('/:id/members/:memberUserId', authMiddleware, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Familia no encontrada.' });

    const targetUid = String(req.params.memberUserId);
    const requesterUid = String(req.user.id);
    const isCreator = String(family.creator) === requesterUid;

    if (!isCreator && targetUid !== requesterUid) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar a este miembro.' });
    }

    if (String(family.creator) === targetUid) {
      return res.status(400).json({ message: 'El creador de la familia no puede eliminarse a sí mismo.' });
    }

    family.members = family.members.filter((m) => String(m.user) !== targetUid);
    family.wishlist = family.wishlist.filter((w) => String(w.user) !== targetUid);
    family.exclusions = family.exclusions.filter(
      (ex) => String(ex.fromUser) !== targetUid && String(ex.toUser) !== targetUid
    );

    // Si ya había un sorteo hecho, lo pasamos a pendiente para que el admin vuelva a sortear limpio
    if (family.drawStatus === 'completed') {
      family.drawStatus = 'pending';
      family.assignments = [];
    }

    await family.save();
    const populated = await Family.findById(family._id).populate('members.user', 'name username avatar bio sizes');
    return res.json({
      family: formatFamilyForUser(populated, req.user.id),
      message: 'Participante retirado de la familia.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al retirar miembro.' });
  }
});

module.exports = router;
