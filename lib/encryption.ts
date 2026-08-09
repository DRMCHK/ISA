import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

// ── Types ─────────────────────────────────────────────────────────────────────

export type EncryptedMessage = { ciphertext: string; nonce: string };

// ── Key generation ──────────────────────────────────────────────────────────

export function generateKeyPair(): { publicKey: string; secretKey: string } {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    secretKey: encodeBase64(kp.secretKey),
  };
}

// ── Encryption (client-side, runs in browser) ───────────────────────────────

export function encryptMessage(
  message: string,
  recipientPublicKeyB64: string,
  senderSecretKeyB64: string
): { ciphertext: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const recipientPubKey = decodeBase64(recipientPublicKeyB64);
  const senderSecretKey = decodeBase64(senderSecretKeyB64);

  const box = nacl.box(
  decodeUTF8(message),
  nonce,
  recipientPubKey,
  senderSecretKey
  );

  if (!box) throw new Error('Encryption failed');

  return {
    ciphertext: encodeBase64(box),
    nonce: encodeBase64(nonce),
  };
}

export function decryptMessage(
  payload: EncryptedMessage,
  senderPublicKeyB64: string,
  recipientSecretKeyB64: string
): string | null;
export function decryptMessage(
  ciphertextB64: string,
  nonceB64: string,
  senderPublicKeyB64: string,
  recipientSecretKeyB64: string
): string | null;
export function decryptMessage(
  payloadOrCiphertext: EncryptedMessage | string,
  nonceOrSenderKey: string,
  senderKeyOrSecret: string,
  recipientSecretKeyB64?: string
): string | null {
  const ciphertextB64 =
    typeof payloadOrCiphertext === 'string' ? payloadOrCiphertext : payloadOrCiphertext.ciphertext;
  const nonceB64 =
    typeof payloadOrCiphertext === 'string' ? nonceOrSenderKey : payloadOrCiphertext.nonce;
  const senderPublicKeyB64 =
    typeof payloadOrCiphertext === 'string' ? senderKeyOrSecret : nonceOrSenderKey;
  const secretKeyB64 =
    typeof payloadOrCiphertext === 'string' ? recipientSecretKeyB64! : senderKeyOrSecret;

  try {
    const ciphertext = decodeBase64(ciphertextB64);
    const nonce = decodeBase64(nonceB64);
    const senderPubKey = decodeBase64(senderPublicKeyB64);
    const recipientSecretKey = decodeBase64(secretKeyB64);

  const message = nacl.box.open(ciphertext, nonce, senderPubKey, recipientSecretKey);
if (!message) return null;
return encodeUTF8(message);
  } catch {
    return null;
  }
}
