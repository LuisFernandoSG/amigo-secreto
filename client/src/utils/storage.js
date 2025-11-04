const ADMIN_CODES_KEY = 'secret-santa-admin-codes';
const PARTICIPANT_CODES_KEY = 'secret-santa-participant-codes';
const GROUP_PARTICIPANTS_KEY = 'secret-santa-group-participants';
const GROUP_PROFILES_KEY = 'secret-santa-group-profiles';

const readMap = (key) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('No se pudo leer desde localStorage', error);
    return {};
  }
};

const writeMap = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeCode = (code) => String(code || '').toUpperCase();

const ensureProfile = (profiles, normalizedCode) => {
  const profile = profiles[normalizedCode] || { joinCode: normalizedCode, participants: {} };
  profile.participants = profile.participants || {};
  profiles[normalizedCode] = profile;
  return profile;
};

export const rememberGroupProfile = (joinCode, { name } = {}) => {
  if (!joinCode) return;
  const normalized = normalizeCode(joinCode);
  const profiles = readMap(GROUP_PROFILES_KEY);
  const profile = ensureProfile(profiles, normalized);
  if (name) {
    profile.name = name;
  }
  profile.lastViewedAt = new Date().toISOString();
  writeMap(GROUP_PROFILES_KEY, profiles);
};

export const rememberParticipantProfile = (joinCode, participant) => {
  if (!joinCode || !participant?.id) return;
  const normalized = normalizeCode(joinCode);
  const profiles = readMap(GROUP_PROFILES_KEY);
  const profile = ensureProfile(profiles, normalized);
  profile.participants[participant.id] = {
    id: participant.id,
    name: participant.name || 'Participante',
    lastViewedAt: new Date().toISOString()
  };
  if (participant.isOwner) {
    profile.ownerParticipantId = participant.id;
  }
  writeMap(GROUP_PROFILES_KEY, profiles);
};

export const rememberAdminCode = (joinCode, adminCode, metadata = {}) => {
  if (!joinCode || !adminCode) return;
  const map = readMap(ADMIN_CODES_KEY);
  const normalizedCode = normalizeCode(joinCode);
  map[normalizedCode] = normalizeCode(adminCode);
  writeMap(ADMIN_CODES_KEY, map);
  rememberGroupProfile(normalizedCode, { name: metadata.name });
};

export const getAdminCode = (joinCode) => {
  if (!joinCode) return null;
  const map = readMap(ADMIN_CODES_KEY);
  return map[normalizeCode(joinCode)] || null;
};

export const rememberParticipantAccess = (participantId, accessCode) => {
  if (!participantId || !accessCode) return;
  const map = readMap(PARTICIPANT_CODES_KEY);
  map[participantId] = normalizeCode(accessCode);
  writeMap(PARTICIPANT_CODES_KEY, map);
};

export const getParticipantAccess = (participantId) => {
  if (!participantId) return null;
  const map = readMap(PARTICIPANT_CODES_KEY);
  return map[participantId] || null;
};

export const rememberParticipantForGroup = (joinCode, participant) => {
  if (!joinCode || !participant) return;
  const normalizedCode = normalizeCode(joinCode);
  const participantId = typeof participant === 'string' ? participant : participant.id;
  if (!participantId) return;
  const map = readMap(GROUP_PARTICIPANTS_KEY);
  const current = new Set(map[normalizedCode] || []);
  current.add(participantId);
  map[normalizedCode] = Array.from(current);
  writeMap(GROUP_PARTICIPANTS_KEY, map);
  if (typeof participant === 'object') {
    rememberParticipantProfile(normalizedCode, participant);
  }
  rememberGroupProfile(normalizedCode);
};

export const getKnownParticipantsForGroup = (joinCode) => {
  if (!joinCode) return [];
  const map = readMap(GROUP_PARTICIPANTS_KEY);
  return map[normalizeCode(joinCode)] || [];
};

export const forgetGroup = (joinCode) => {
  if (!joinCode) return;
  const normalizedCode = normalizeCode(joinCode);

  const adminMap = readMap(ADMIN_CODES_KEY);
  delete adminMap[normalizedCode];
  writeMap(ADMIN_CODES_KEY, adminMap);

  const participantsByGroup = readMap(GROUP_PARTICIPANTS_KEY);
  const participantIds = participantsByGroup[normalizedCode] || [];
  delete participantsByGroup[normalizedCode];
  writeMap(GROUP_PARTICIPANTS_KEY, participantsByGroup);

  if (participantIds.length) {
    const participantCodes = readMap(PARTICIPANT_CODES_KEY);
    participantIds.forEach((id) => {
      delete participantCodes[id];
    });
    writeMap(PARTICIPANT_CODES_KEY, participantCodes);
  }

  const profiles = readMap(GROUP_PROFILES_KEY);
  delete profiles[normalizedCode];
  writeMap(GROUP_PROFILES_KEY, profiles);
};

const byRecency = (a, b) => {
  const timeA = a.lastViewedAt ? Date.parse(a.lastViewedAt) || 0 : 0;
  const timeB = b.lastViewedAt ? Date.parse(b.lastViewedAt) || 0 : 0;
  return timeB - timeA;
};

export const getRememberedAdminGroups = () => {
  const adminMap = readMap(ADMIN_CODES_KEY);
  const profiles = readMap(GROUP_PROFILES_KEY);
  const participantCodes = readMap(PARTICIPANT_CODES_KEY);

  return Object.entries(adminMap)
    .map(([joinCode, adminCode]) => {
      const profile = profiles[joinCode] || {};
      const ownerParticipantId = profile.ownerParticipantId;
      const participants = profile.participants || {};
      return {
        joinCode,
        adminCode,
        name: profile.name || `Grupo ${joinCode}`,
        lastViewedAt: profile.lastViewedAt || null,
        ownerParticipantId,
        ownerParticipantName: ownerParticipantId ? participants[ownerParticipantId]?.name : null,
        ownerAccessCode: ownerParticipantId ? participantCodes[ownerParticipantId] || null : null
      };
    })
    .sort(byRecency);
};

export const getRememberedParticipantLinks = () => {
  const participantsByGroup = readMap(GROUP_PARTICIPANTS_KEY);
  const participantCodes = readMap(PARTICIPANT_CODES_KEY);
  const profiles = readMap(GROUP_PROFILES_KEY);

  const entries = [];

  Object.entries(participantsByGroup).forEach(([joinCode, participantIds]) => {
    const profile = profiles[joinCode] || {};
    const participants = profile.participants || {};
    participantIds.forEach((participantId) => {
      const accessCode = participantCodes[participantId];
      if (!accessCode) return;
      const participantProfile = participants[participantId] || {};
      entries.push({
        joinCode,
        participantId,
        accessCode,
        groupName: profile.name || `Grupo ${joinCode}`,
        participantName: participantProfile.name || 'Participante',
        lastViewedAt: participantProfile.lastViewedAt || profile.lastViewedAt || null
      });
    });
  });

  return entries.sort(byRecency);
};
