const jwt = require('jsonwebtoken');

// Fungsi untuk membuat JWT token
const generateToken = (payload, secretKey) => {
  return jwt.sign(payload, secretKey, { expiresIn: 900 });
};

// Fungsi untuk memverifikasi JWT token
const verifyToken = (token, secretKey) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};
