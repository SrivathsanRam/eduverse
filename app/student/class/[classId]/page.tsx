'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Mock types until DB schema is finalized
interface Assignment {
    id: string;
    title: string;
    dueDate: string;
    status: 'Not Started' | 'In Progress' | 'Completed';
}

interface ClassDetails {
    name: string;
}

export default function ClassDetailPage() {
    const router = useRouter()
    const params = useParams()
    const classId = params.classId as string

    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!classId) return;

        const fetchClassData = async () => {
            setLoading(true)
            
            // Fetch class details
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('name')
                .eq('id', classId)
                .single()

            if (classError) {
                console.error("Error fetching class details:", classError)
                // Optionally redirect or show an error message
                router.push('/student/dashboard')
                return;
            }
            setClassDetails(classData)

            // MOCK: Fetch assignments for this class
            // In the future, this would be a Supabase query to your 'assignments' table
            const mockAssignments: Assignment[] = [
                { id: 'assign1', title: 'Algebra Basics Homework', dueDate: '2025-06-20', status: 'Not Started' },
                { id: 'assign2', title: 'Geometry Chapter 1 Quiz', dueDate: '2025-06-22', status: 'Not Started' },
                { id: 'assign3', title: 'Past Assignment: Fractions', dueDate: '2025-06-10', status: 'Completed' },
            ]
            setAssignments(mockAssignments)

            setLoading(false)
        }

        fetchClassData()
    }, [classId, router])

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Loading class...</p></div>
    }

    return (
        <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => router.back()} className="text-blue-600 hover:underline mb-4">&larr; Back to Dashboard</button>
                <h1 className="text-3xl font-bold mb-2 text-gray-800">{classDetails?.name}</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-6">Assignments</h2>

                <div className="space-y-4">
                    {assignments.map(assignment => (
                        <div key={assignment.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg text-gray-800">{assignment.title}</p>
                                <p className="text-sm text-gray-500">Due: {assignment.dueDate}</p>
                            </div>
                            <button 
                                onClick={() => router.push(`/student/assignment/${assignment.id}`)}
                                disabled={assignment.status === 'Completed'}
                                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {assignment.status === 'Completed' ? 'View Results' : 'Start'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}