import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo'

export async function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' })
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dealflow_token')?.value
  
  if (!token) return null
  return verifyToken(token)
}
