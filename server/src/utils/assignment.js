export const generateAssignments = (participants) => {
  if (participants.length < 2) {
    throw new Error('Se necesitan al menos dos participantes para generar asignaciones');
  }

  const shuffled = [...participants];

  // Fisher-Yates
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Ensure no self assignment; if so, rotate.
  for (let i = 0; i < shuffled.length; i += 1) {
    if (shuffled[i]._id.toString() === participants[i]._id.toString()) {
      const nextIndex = (i + 1) % shuffled.length;
      [shuffled[i], shuffled[nextIndex]] = [shuffled[nextIndex], shuffled[i]];
    }
  }

  // Final check to avoid duplicates and self assignment.
  for (let i = 0; i < participants.length; i += 1) {
    const giver = participants[i];
    const receiver = shuffled[i];
    if (giver._id.toString() === receiver._id.toString()) {
      throw new Error('No se pudo generar asignaciones válidas, intente nuevamente');
    }
  }

  const assignments = new Map();
  for (let i = 0; i < participants.length; i += 1) {
    assignments.set(participants[i]._id.toString(), shuffled[i]._id.toString());
  }

  return assignments;
};