import { getSession } from '@/lib/auth'

export async function requireAdmin() {
  const session = await getSession()
  if (!session || session.type !== 'internal' || session.role !== 'ADMIN') {
    return null
  }
  return session
}
