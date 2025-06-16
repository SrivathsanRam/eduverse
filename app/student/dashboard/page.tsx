'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Class {
  id: string
  name: string
  level: string
  description: string
  code: string
}

export default function StudentDashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [passkey, setPasskey] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchClasses = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return router.push('/student/auth')

      const { data, error } = await supabase
        .from('student_classes')
        .select('classes(*)')
        .eq('student_id', user.id)

      if (error) console.error(error)
      else setClasses(data.map((d: any) => d.classes))

      setLoading(false)
    }

    fetchClasses()
  }, [])

  const joinClass = async () => {
    const { data: classMatch, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('code', joinCode)
      .eq('passkey', passkey)
      .single()

    if (classError || !classMatch) {
      alert('Invalid class code or passkey.')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase.from('student_classes').insert([
      {
        student_id: user?.id,
        class_id: classMatch.id,
      },
    ])

    setJoinCode('')
    setPasskey('')
    location.reload()
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Your Classes</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="mb-6">
          {classes.map((c) => (
            <li key={c.id} className="mb-2 border p-4 rounded bg-white shadow">
              <strong>{c.name}</strong> (Level {c.level})<br />
              {c.description}
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-md space-y-3">
        <h2 className="text-xl font-semibold">Join a Class</h2>
        <input
          placeholder="6-digit Class Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          placeholder="Passkey"
          value={passkey}
          onChange={(e) => setPasskey(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <button onClick={joinClass} className="bg-blue-600 text-white px-4 py-2 rounded">
          Join Class
        </button>
      </div>
    </div>
  )
}
