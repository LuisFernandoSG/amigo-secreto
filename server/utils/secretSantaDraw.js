/**
 * Algoritmo de Sorteo de Amigo Secreto (Derangement / Ciclo Hamiltoniano Aleatorio con Exclusiones)
 */

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildForbiddenSet(exclusions = []) {
  const forbidden = new Set();
  for (const ex of exclusions) {
    const from = String(ex.fromUser);
    const to = String(ex.toUser);
    forbidden.add(`${from}->${to}`);
    if (ex.bidirectional) {
      forbidden.add(`${to}->${from}`);
    }
  }
  return forbidden;
}

function generateSecretSantaAssignments(memberUserIds, exclusions = []) {
  const ids = memberUserIds.map((id) => String(id));
  const n = ids.length;

  if (n < 2) {
    throw new Error('Se necesitan al menos 2 participantes en la familia para realizar el sorteo.');
  }

  const forbidden = buildForbiddenSet(exclusions);

  // Intento 1: Buscar un Ciclo Hamiltoniano aleatorio (A -> B -> C -> D -> A)
  // Esto evita que dos personas se regalen mutuamente (A <-> B) cuando hay 3 o más personas.
  for (let attempt = 0; attempt < 300; attempt++) {
    const cycle = shuffleArray(ids);
    let valid = true;

    for (let i = 0; i < n; i++) {
      const giver = cycle[i];
      const receiver = cycle[(i + 1) % n];
      if (giver === receiver || forbidden.has(`${giver}->${receiver}`)) {
        valid = false;
        break;
      }
    }

    if (valid) {
      return cycle.map((giver, i) => ({
        giver,
        receiver: cycle[(i + 1) % n],
      }));
    }
  }

  // Intento 2: Backtracking general para cualquier derangement válido (en caso de restricciones fuertes)
  const givers = shuffleArray(ids);
  const usedReceivers = new Set();
  const result = [];

  function backtrack(index) {
    if (index === n) {
      return true;
    }

    const giver = givers[index];
    const candidateReceivers = shuffleArray(ids);

    for (const receiver of candidateReceivers) {
      if (giver === receiver) continue;
      if (usedReceivers.has(receiver)) continue;
      if (forbidden.has(`${giver}->${receiver}`)) continue;

      usedReceivers.add(receiver);
      result.push({ giver, receiver });

      if (backtrack(index + 1)) {
        return true;
      }

      result.pop();
      usedReceivers.delete(receiver);
    }

    return false;
  }

  if (backtrack(0)) {
    return result;
  }

  throw new Error(
    'No es posible realizar el sorteo con las restricciones actuales (exclusiones). Intenta quitar alguna restricción o agregar más familiares.'
  );
}

module.exports = { generateSecretSantaAssignments };
