const ADMIN_CODES_KEY = 'secret-santa-admin-codes';
const PARTICIPANT_CODES_KEY = 'secret-santa-participant-codes';
const GROUP_PARTICIPANTS_KEY = 'secret-santa-group-participants';

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

export const rememberAdminCode = (joinCode, adminCode) => {
  if (!joinCode || !adminCode) return;
  const map = readMap(ADMIN_CODES_KEY);
  map[normalizeCode(joinCode)] = normalizeCode(adminCode);
  writeMap(ADMIN_CODES_KEY, map);
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

export const rememberParticipantForGroup = (joinCode, participantId) => {
  if (!joinCode || !participantId) return;
  const map = readMap(GROUP_PARTICIPANTS_KEY);
  const normalizedCode = normalizeCode(joinCode);
  const current = new Set(map[normalizedCode] || []);
  current.add(participantId);
  map[normalizedCode] = Array.from(current);
  writeMap(GROUP_PARTICIPANTS_KEY, map);
};

export const getKnownParticipantsForGroup = (joinCode) => {
  if (!joinCode) return [];
  const map = readMap(GROUP_PARTICIPANTS_KEY);
  return map[normalizeCode(joinCode)] || [];
};
