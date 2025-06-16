'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TeacherAuth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async () => {
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) return alert(error.message)

      const user = data.user
      if (!user) return alert('No user returned')

      await supabase.from('profiles').insert([
        {
          id: user.id,
          name,
          dob,
          role: 'Teacher',
        },
      ])
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return alert(error.message)
    }

    router.push('/teacher/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
    <div className="bg-white p-8 rounded shadow-md w-96">
      <h1 className="text-2xl font-bold mb-6">{isSignUp ? 'Sign Up' : 'Log In'} as Teacher</h1>

      <input
        type="email"
        placeholder="Email"
        className="w-full border px-3 py-2 rounded mb-6"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border px-3 py-2 rounded mb-6"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {isSignUp && (
        <>
          <input
            type="text"
            placeholder="Name"
            className="w-full border px-3 py-2 rounded mb-6"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="date"
            placeholder="Date of Birth"
            className="w-full border px-3 py-2 rounded mb-6"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </>
      )}

      <button
        onClick={handleAuth}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isSignUp ? 'Create Account' : 'Log In'}
      </button>

      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-blue-500 text-sm underline mt-4"
      >
        {isSignUp ? 'Already have an account? Log in' : 'New here? Sign up'}
      </button>
    </div>
    </div>
  )
}