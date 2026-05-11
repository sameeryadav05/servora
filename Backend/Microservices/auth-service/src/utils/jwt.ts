import jwt from "jsonwebtoken";


export interface UserPayload {
  id: string;          // ✅ use string
  fullName: string;
  email: string;
  role: string;
}



// ✅ Generate Token
export function generateAccessToken(payload: UserPayload): string {
  return jwt.sign(payload,process.env.ACCESS_JWT_SECRET!, {
    expiresIn: "15m",
    issuer:'Auth-Service',
    audience:'user',
  });
}
export function generateRefreshToken(payload: UserPayload): string {
  return jwt.sign(payload,process.env.REFRESH_JWT_SECRET!, {
    expiresIn: "7d",
    issuer:'Auth-Service',
    audience:'user',
  });
}

// ✅ Verify Token
export function verifyAccessToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token,process.env.ACCESS_JWT_SECRET!,{
          issuer:'Auth-Service',
          audience:'user',
    }) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
export function verifyRefreshToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token,process.env.REFRESH_JWT_SECRET!,{
          issuer:'Auth-Service',
          audience:'user',
    }) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}