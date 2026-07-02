async function deriveConversationKey(userId1, userId2) {
  const sorted = [userId1, userId2].sort((a, b) => a - b).join(':');
  const encoded = new TextEncoder().encode(`isa-dm-encrypted:${sorted}`);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptMessage(userId1, userId2, plaintext) {
  const key = await deriveConversationKey(userId1, userId2);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    ciphertext: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv),
  };
}

export async function decryptMessage(userId1, userId2, ciphertext, iv) {
  try {
    const key = await deriveConversationKey(userId1, userId2);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBuffer(iv) },
      key,
      base64ToBuffer(ciphertext)
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return '[Unable to decrypt message]';
  }
}

export async function decryptMessages(userId, friendId, messages) {
  return Promise.all(
    messages.map(async (m) => ({
      ...m,
      text: await decryptMessage(userId, friendId, m.ciphertext, m.iv),
    }))
  );
}
