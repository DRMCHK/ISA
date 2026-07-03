import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

export interface EncryptedMessage {
  ciphertext: string; // base64
  nonce: string;      // base64
}

/**
 * Generate a NaCl box keypair.
 * Call this client-side at registration.
 * Store publicKey on server, privateKey in localStorage ONLY.
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
}

/**
 * Encrypt a DM using the recipient's public key and sender's private key.
 * Returns ciphertext + nonce in base64.
 */
export function encryptMessage(
  plaintext: string,
  recipientPublicKeyB64: string,
  senderPrivateKeyB64: string
): EncryptedMessage {
  const recipientPublicKey = decodeBase64(recipientPublicKeyB64);
  const senderPrivateKey = decodeBase64(senderPrivateKeyB64);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = encodeUTF8(plaintext);

  const encrypted = nacl.box(messageUint8, nonce, recipientPublicKey, senderPrivateKey);

  return {
    ciphertext: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

/**
 * Decrypt a DM using the sender's public key and recipient's private key.
 * Returns null if decryption fails (tampered or wrong key).
 */
export function decryptMessage(
  encryptedMsg: EncryptedMessage,
  senderPublicKeyB64: string,
  recipientPrivateKeyB64: string
): string | null {
  try {
    const senderPublicKey = decodeBase64(senderPublicKeyB64);
    const recipientPrivateKey = decodeBase64(recipientPrivateKeyB64);
    const ciphertext = decodeBase64(encryptedMsg.ciphertext);
    const nonce = decodeBase64(encryptedMsg.nonce);

    const decrypted = nacl.box.open(ciphertext, nonce, senderPublicKey, recipientPrivateKey);
    if (!decrypted) return null;

    return decodeUTF8(decrypted);
  } catch {
    return null;
  }
}
