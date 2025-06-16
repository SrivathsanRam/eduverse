'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// Helper function to generate a random alphanumeric string
const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function CreateClass() {
  const [name, setName] = useState('')
  const [level, setLevel] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert("You must be logged in to create a class.")
      router.push('/teacher/auth')
      return
    }

    const newClass = {
      teacher_id: user.id,
      name,
      level,
      description,
      code: generateRandomString(6),
      passkey: generateRandomString(8)
    }

    const { error } = await supabase.from('classes').insert([newClass])

    if (error) {
      alert('Error creating class: ' + error.message)
    } else {
      alert('Class created successfully!')
      router.push('/teacher/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <button onClick={() => router.back()} className="text-green-600 hover:underline mb-4">&larr; Back to Dashboard</button>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Create a New Class</h1>
          <form onSubmit={handleCreateClass} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Class Name</label>
              <input
                id="name"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grade 10 Algebra"
              />
            </div>
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700">Level / Grade</label>
              <input
                id="level"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="e.g., 10th Grade, Beginner"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief overview of the class."
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}