'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function ResultsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const score = searchParams.get('score')
    const total = searchParams.get('total')

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Assignment Complete!</h1>
                <p className="text-lg text-gray-600 mb-6">Here's how you did:</p>
                
                <div className="bg-blue-100 border-2 border-blue-300 rounded-full w-48 h-48 mx-auto flex flex-col justify-center items-center mb-8">
                    <p className="text-5xl font-bold text-blue-700">{score}</p>
                    <p className="text-xl text-blue-600">out of {total}</p>
                </div>

                <p className="text-gray-500 mb-6">Your results have been saved. Keep up the great work!</p>

                <button
                    onClick={() => router.push('/student/dashboard')}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    )
}