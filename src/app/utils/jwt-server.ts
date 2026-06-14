import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'jobtracker-super-secret-jwt-key-9281';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
}

export function signToken(payload: TokenPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  
  // Set expiration to 7 days from now
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const fullPayload = { ...payload, exp };
  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerBase64}.${payloadBase64}`)
    .digest('base64url');
    
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerBase64, payloadBase64, signature] = parts;
    
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerBase64}.${payloadBase64}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) {
      return null; // Invalid signature
    }
    
    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name
    };
  } catch (error) {
    return null;
  }
}
