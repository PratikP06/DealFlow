'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.isAuthenticated && data.user.type === 'customer') {
          setUser(data.user)
        } else {
          router.push('/login')
        }
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold text-green-400">Customer Portal</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition">
            Logout
          </button>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl mb-4 font-semibold">Welcome, {user.name}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-700 p-4 rounded">
              <span className="text-gray-400 block mb-1">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <span className="text-gray-400 block mb-1">Tier</span>
              <span className="font-medium bg-green-900 text-green-200 py-1 px-2 rounded">{user.tier}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
