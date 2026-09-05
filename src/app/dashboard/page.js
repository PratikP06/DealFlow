'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.isAuthenticated && data.user.type === 'internal') {
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
          <h1 className="text-3xl font-bold text-blue-400">Internal Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition">
            Logout
          </button>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
          <h2 className="text-xl mb-4 font-semibold">Welcome, {user.name}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-700 p-4 rounded">
              <span className="text-gray-400 block mb-1">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <span className="text-gray-400 block mb-1">Role</span>
              <span className="font-medium bg-blue-900 text-blue-200 py-1 px-2 rounded">{user.role}</span>
            </div>
          </div>
        </div>

        {user.role === 'ADMIN' && (
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl mb-4 font-semibold text-purple-400">Admin Controls</h2>
            <p className="text-gray-400 mb-4">Access system configuration and management.</p>
            <button 
              onClick={() => router.push('/dashboard/admin')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
            >
              Go to Admin Configuration
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
