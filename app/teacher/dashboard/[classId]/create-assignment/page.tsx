'use client'

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

// --- Mock Data & Types (Replace with DB calls) ---
interface Question {
    id: string;
    text: string;
    difficulty: 0 | 1 | 2; // 0: Easy, 1: Medium, 2: Hard
}

const mockQuestionBank: Question[] = [
    { id: 'q1', text: 'What is 2 + 2?', difficulty: 0 },
    { id: 'q2', text: 'What is the capital of France?', difficulty: 0 },
    { id: 'q3', text: 'What is 8 * 7?', difficulty: 1 },
    { id: 'q4', text: 'Solve for x: 3x - 5 = 10', difficulty: 1 },
    { id: 'q5', text: 'What is the integral of 2x dx?', difficulty: 2 },
    { id: 'q6', text: 'Who wrote "Hamlet"?', difficulty: 2 },
    { id: 'q7', text: 'What year did WWII end?', difficulty: 1 },
];
// ---

export default function CreateAssignmentPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    const toggleQuestion = (questionId: string) => {
        const newSelection = new Set(selectedQuestions);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedQuestions(newSelection);
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // In a real app, you would save this data to your 'assignments' and 'assignment_questions' tables in Supabase.
        console.log("Creating Assignment:", {
            classId,
            title,
            dueDate,
            questionIds: Array.from(selectedQuestions)
        });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        alert(`Assignment "${title}" created with ${selectedQuestions.size} questions.`);
        setLoading(false);
        router.push(`/teacher/class/${classId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <button onClick={() => router.back()} className="text-green-600 hover:underline mb-4">&larr; Back to Class</button>
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Assignment</h1>
                    <form onSubmit={handleCreateAssignment} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Side: Details */}
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Assignment Title</label>
                                <input
                                    id="title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input
                                    id="dueDate" type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                />
                            </div>
                            <div className="pt-4">
                               <button
                                    type="submit" disabled={loading || selectedQuestions.size === 0}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
                                >
                                    {loading ? 'Saving...' : `Create Assignment (${selectedQuestions.size} questions)`}
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Question Bank */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Select Questions</h3>
                            <div className="h-96 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2 bg-gray-50">
                                {mockQuestionBank.map(q => (
                                    <div 
                                        key={q.id}
                                        onClick={() => toggleQuestion(q.id)}
                                        className={`p-3 rounded-md cursor-pointer transition-colors ${selectedQuestions.has(q.id) ? 'bg-green-200 border-green-400 border' : 'bg-white hover:bg-gray-100'}`}
                                    >
                                        <p className="font-medium text-gray-800">{q.text}</p>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                            q.difficulty === 0 ? 'bg-blue-100 text-blue-800' : 
                                            q.difficulty === 1 ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            Difficulty: {q.difficulty}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}