'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { FaEdit, FaClipboardList, FaChartLine, FaBook } from 'react-icons/fa';
import Link from 'next/link';

interface Class {
  id: string
  name: string
  level: string
  description: string
  code: string
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [newClass, setNewClass] = useState({ name: '', level: '', description: '', passkey: '' })
  const router = useRouter()

  useEffect(() => {
    const fetchClasses = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return router.push('/teacher/auth')

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id)

      if (error) console.error(error)
      else setClasses(data as Class[])

      setLoading(false)
    }

    fetchClasses()
  }, [])

  const createClass = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('classes').insert([
      {
        name: newClass.name,
        level: newClass.level,
        description: newClass.description,
        code,
        passkey: newClass.passkey,
        teacher_id: user?.id,
      },
    ])

    if (error) {
      console.error(error)
      return
    }

    setNewClass({ name: '', level: '', description: '', passkey: '' })
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
            <li key={c.id} className="mb-4 border p-4 rounded bg-white shadow">
              <div className="mb-2">
                <strong>{c.name}</strong> (Level {c.level})<br />
                {c.description}<br />
                Class Code: <span className="font-mono">{c.code}</span>
              </div>

              <div className="flex space-x-3 mt-2">
                {/* Edit Flow */}
                <Link href={`/teacher/dashboard/${c.code}/edit-flow`} passHref>
                  <button
                    className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                    title="Edit Flow"
                  >
                    <FaEdit size={20} />
                  </button>
                </Link>

                {/* Upload Learning Materials */}
                <Link href={`/teacher/dashboard/${c.code}/learning-materials`} passHref>
                  <button
                    className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                    title="Upload Learning Materials"
                  >
                    <FaBook size={20} />
                  </button>
                </Link>

                {/* Create Assignment */}
                <Link href={`/teacher/dashboard/${c.code}/create-assignment`} passHref>
                  <button
                    className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition"
                    title="Create Assignment"
                  >
                    <FaClipboardList size={20} />
                  </button>
                </Link>

                {/* Analytics Dashboard */}
                <Link href={`/teacher/dashboard/${c.code}/analytics`} passHref>
                  <button
                    className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition"
                    title="Analytics Dashboard"
                  >
                    <FaChartLine size={20} />
                  </button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-md space-y-3">
        <h2 className="text-xl font-semibold">Create a New Class</h2>
        <input
          placeholder="Class Name"
          value={newClass.name}
          onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          placeholder="Level (1–12)"
          value={newClass.level}
          onChange={(e) => setNewClass({ ...newClass, level: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          placeholder="Description"
          value={newClass.description}
          onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          placeholder="Passkey"
          value={newClass.passkey}
          onChange={(e) => setNewClass({ ...newClass, passkey: e.target.value })}
          className="w-full border px-3 py-2 rounded"
        />
        <button onClick={createClass} className="bg-green-600 text-white px-4 py-2 rounded">
          Create Class
        </button>
      </div>
    </div>
  )
}