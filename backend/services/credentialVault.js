const crypto = require('crypto');

function getEncryptionKey() {
  const encodedKey = process.env.ORCA_CREDENTIAL_ENCRYPTION_KEY;
  if (!encodedKey) {
    throw new Error('ORCA_CREDENTIAL_ENCRYPTION_KEY must be configured.');
  }

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) {
    throw new Error('ORCA_CREDENTIAL_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }

  return key;
}

function encryptSecret(plaintext) {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new TypeError('A non-empty secret is required.');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    encrypted_value: encrypted.toString('base64'),
    encryption_iv: iv.toString('base64'),
    encryption_tag: tag.toString('base64'),
    key_version: Number(process.env.ORCA_CREDENTIAL_KEY_VERSION || 1),
  };
}

function decryptSecret(record) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(record.encryption_iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(record.encryption_tag, 'base64'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.encrypted_value, 'base64')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

function redactSecret(value) {
  if (!value || value.length <= 8) return '[REDACTED]';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

module.exports = { encryptSecret, decryptSecret, redactSecret };
