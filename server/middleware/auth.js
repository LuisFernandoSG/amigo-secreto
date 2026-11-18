const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'navidad_amigo_secreto_super_clave_2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado. Por favor inicia sesión.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Sesión expirada o inválida. Vuelve a iniciar sesión.' });
  }
}

function signToken(user) {
  return jwt.sign(
    {
      id: String(user._id),
      username: user.username,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = { authMiddleware, signToken, JWT_SECRET };
