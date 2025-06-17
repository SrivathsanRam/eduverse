'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

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
    const [passkey, setPasskey] = useState('') // Note: Passkey might be better named 'class_code' if it's the same
    const router = useRouter()

    useEffect(() => {
        const fetchClasses = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.push('/student/auth')
                return
            }

            const { data, error } = await supabase
                .from('student_classes')
                .select('classes(*)')
                .eq('student_id', user.id)

            if (error) {
                console.error('Error fetching classes:', error)
            } else if (data) {
                // Ensure data is mapped correctly, handling potential null `classes` relationships
                const validClasses = data.map((d: any) => d.classes).filter(Boolean) as Class[]
                setClasses(validClasses)
            }

            setLoading(false)
        }

        fetchClasses()
    }, [router])

    const joinClass = async () => {
        const { data: classMatch, error: classError } = await supabase
            .from('classes')
            .select('id')
            .eq('code', joinCode)
            .eq('passkey', passkey)
            .single()

        if (classError || !classMatch) {
            alert('Invalid class code or passkey.')
            return
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return;

        const { error } = await supabase.from('student_classes').insert([
            {
                student_id: user.id,
                class_id: classMatch.id,
            },
        ])

        if (error) {
            alert('Error joining class: ' + error.message)
            return
        }

        setJoinCode('')
        setPasskey('')
        window.location.reload() // Simple reload to refetch classes
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Classes</h1>
                {loading ? (
                    <p>Loading classes...</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {classes.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => router.push(`/student/class/${c.id}`)}
                                className="text-left p-4 rounded-lg bg-white shadow hover:shadow-lg hover:scale-105 transition-transform duration-200"
                            >
                                <strong className="text-xl text-blue-700">{c.name}</strong>
                                <p className="text-sm text-gray-500 mb-2">Level {c.level}</p>
                                <p className="text-gray-600">{c.description}</p>
                            </button>
                        ))}
                    </div>
                )}

                <div className="max-w-md space-y-3 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-semibold text-gray-800">Join a New Class</h2>
                    <input
                        placeholder="6-digit Class Code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        placeholder="Passkey"
                        value={passkey}
                        onChange={(e) => setPasskey(e.target.value)}
                        className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={joinClass} className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                        Join Class
                    </button>
                </div>
            </div>
        </div>
    )
}

// 'use client'

// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabaseClient'
// import { useRouter } from 'next/navigation'

// interface Class {
//   id: string
//   name: string
//   level: string
//   description: string
//   code: string
// }

// export default function StudentDashboard() {
//   const [classes, setClasses] = useState<Class[]>([])
//   const [loading, setLoading] = useState(true)
//   const [joinCode, setJoinCode] = useState('')
//   const [passkey, setPasskey] = useState('')
//   const router = useRouter()

//   useEffect(() => {
//     const fetchClasses = async () => {
//       const {
//         data: { user },
//       } = await supabase.auth.getUser()

//       if (!user) return router.push('/student/auth')

//       const { data, error } = await supabase
//         .from('student_classes')
//         .select('classes(*)')
//         .eq('student_id', user.id)

//       if (error) console.error(error)
//       else setClasses(data.map((d: any) => d.classes))

//       setLoading(false)
//     }

//     fetchClasses()
//   }, [])

//   const joinClass = async () => {
//     const { data: classMatch, error: classError } = await supabase
//       .from('classes')
//       .select('*')
//       .eq('code', joinCode)
//       .eq('passkey', passkey)
//       .single()

//     if (classError || !classMatch) {
//       alert('Invalid class code or passkey.')
//       return
//     }

//     const {
//       data: { user },
//     } = await supabase.auth.getUser()

//     await supabase.from('student_classes').insert([
//       {
//         student_id: user?.id,
//         class_id: classMatch.id,
//       },
//     ])

//     setJoinCode('')
//     setPasskey('')
//     location.reload()
//   }

//   return (
//     <div className="p-8">
//       <h1 className="text-2xl font-bold mb-4">Your Classes</h1>
//       {loading ? (
//         <p>Loading...</p>
//       ) : (
//         <ul className="mb-6">
//           {classes.map((c) => (
//             <li key={c.id} className="mb-2 border p-4 rounded bg-white shadow">
//               <strong>{c.name}</strong> (Level {c.level})<br />
//               {c.description}
//             </li>
//           ))}
//         </ul>
//       )}

//       <div className="max-w-md space-y-3">
//         <h2 className="text-xl font-semibold">Join a Class</h2>
//         <input
//           placeholder="6-digit Class Code"
//           value={joinCode}
//           onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
//           className="w-full border px-3 py-2 rounded"
//         />
//         <input
//           placeholder="Passkey"
//           value={passkey}
//           onChange={(e) => setPasskey(e.target.value)}
//           className="w-full border px-3 py-2 rounded"
//         />
//         <button onClick={joinClass} className="bg-blue-600 text-white px-4 py-2 rounded">
//           Join Class
//         </button>
//       </div>
//     </div>
//   )
// }
