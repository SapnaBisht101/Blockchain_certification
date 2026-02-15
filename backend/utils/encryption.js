const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.CERT_SECRET_KEY;

// Encrypt
const encryptData = (data) => {
  const ciphertext = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY
  ).toString();
  return ciphertext;
};

// Decrypt
const decryptData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  const originalData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  return originalData;
};

module.exports = { encryptData, decryptData };
