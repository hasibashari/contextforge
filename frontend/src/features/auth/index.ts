import { useState } from 'react'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'patient' | string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (role?: 'admin' | 'patient') => void
  logout: () => void
}

const defaultUser: User = {
  id: '1',
  name: 'Dr. John Doe',
  email: 'john.doe@medicore.health',
  avatar: 'https://images.pexels.com/photos/5327585/pexels-photo-5327585.jpeg?auto=compress&cs=tinysrgb&w=150',
  role: 'admin',
}

export function useAuth(): AuthContextType {
  // Demo interactive state
  const [user, setUser] = useState<User | null>(null)

  const login = (role: 'admin' | 'patient' = 'patient') => {
    setUser({
      ...defaultUser,
      role,
      name: role === 'admin' ? 'Dr. John Doe' : 'Budi Santoso',
    })
  }

  const logout = () => {
    setUser(null)
  }

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  }
}
