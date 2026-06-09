import {
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'node:crypto';

const INITIALIZATION_VECTOR = Buffer.from([
  0x00, 0x01, 0x02, 0x03,
  0x04, 0x05, 0x06, 0x07,
  0x08, 0x09, 0x0a, 0x0b,
  0x0c, 0x0d, 0x0e, 0x0f,
]);

function getEncryptionKey(workingKey) {
  return createHash('md5').update(workingKey, 'utf8').digest();
}

export function encrypt(plainText, workingKey) {
  const cipher = createCipheriv(
    'aes-128-cbc',
    getEncryptionKey(workingKey),
    INITIALIZATION_VECTOR,
  );

  return cipher.update(plainText, 'utf8', 'hex') + cipher.final('hex');
}

export function decrypt(encryptedText, workingKey) {
  const decipher = createDecipheriv(
    'aes-128-cbc',
    getEncryptionKey(workingKey),
    INITIALIZATION_VECTOR,
  );

  return decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
}
