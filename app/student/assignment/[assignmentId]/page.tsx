'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

// --- Mock Data & Types (Replace with DB calls) ---
interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: string;
    difficulty: 0 | 1 | 2; // 0: Easy, 1: Medium, 2: Hard
}

const allQuestions: Question[] = [
    { id: 'q1', text: 'What is 2 + 2?', options: ['3', '4', '5', '6'], correctAnswer: '4', difficulty: 0 },
    { id: 'q2', text: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctAnswer: 'Paris', difficulty: 0 },
    { id: 'q3', text: 'What is 8 * 7?', options: ['56', '54', '49', '64'], correctAnswer: '56', difficulty: 1 },
    { id: 'q4', text: 'Solve for x: 3x - 5 = 10', options: ['3', '4', '5', '6'], correctAnswer: '5', difficulty: 1 },
    { id: 'q5', text: 'What is the integral of 2x dx?', options: ['2x^2', 'x^2', 'x^2 + C', '2'], correctAnswer: 'x^2 + C', difficulty: 2 },
    { id: 'q6', text: 'Who wrote "Hamlet"?', options: ['Charles Dickens', 'William Shakespeare', 'Leo Tolstoy', 'Mark Twain'], correctAnswer: 'William Shakespeare', difficulty: 2 },
];
// --- End Mock Data ---

// --- Simulated DKT Engine ---
const getNextQuestion = (currentDifficulty: 0 | 1 | 2, isCorrect: boolean): Question => {
    let nextDifficulty: 0 | 1 | 2 = currentDifficulty;

    if (isCorrect) {
        nextDifficulty = (currentDifficulty < 2 ? currentDifficulty + 1 : 2) as 0 | 1 | 2;
    } else {
        nextDifficulty = (currentDifficulty > 0 ? currentDifficulty - 1 : 0) as 0 | 1 | 2;
    }
    
    const potentialQuestions = allQuestions.filter(q => q.difficulty === nextDifficulty);
    return potentialQuestions[Math.floor(Math.random() * potentialQuestions.length)];
};
// --- End DKT Engine ---

export default function AssignmentPage() {
    const router = useRouter()
    const params = useParams()
    const assignmentId = params.assignmentId as string

    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
    const [confidence, setConfidence] = useState<0 | 1 | 2>(1)
    const [feedback, setFeedback] = useState<{ message: string; correct: boolean } | null>(null)
    const [score, setScore] = useState(0)
    const [questionCount, setQuestionCount] = useState(0)

    useEffect(() => {
        // Start with an easy question
        setCurrentQuestion(allQuestions.find(q => q.difficulty === 0)!);
    }, [assignmentId])

    const handleAnswerSubmit = async () => {
        if (!selectedAnswer || !currentQuestion) return;

        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        setFeedback({ message: isCorrect ? 'Correct!' : `Not quite. The right answer is ${currentQuestion.correctAnswer}`, correct: isCorrect });
        
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        // --- Log the attempt ---
        // This is where you'd call your Supabase Edge Function for the DKT engine
        console.log('Logging to DKT Engine:', {
            question_id: currentQuestion.id,
            question_difficulty: currentQuestion.difficulty,
            student_confidence: confidence,
            correctness: isCorrect ? 1 : 0
        });
        // --- End Logging ---
        
        // Wait a moment for feedback, then load the next question
        setTimeout(() => {
            if (questionCount >= 4) { // End assignment after 5 questions
                router.push(`/student/assignment/${assignmentId}/results?score=${score + (isCorrect ? 1 : 0)}&total=5`)
            } else {
                setQuestionCount(prev => prev + 1)
                const nextQ = getNextQuestion(currentQuestion.difficulty, isCorrect);
                setCurrentQuestion(nextQ);
                setSelectedAnswer(null);
                setFeedback(null);
                setConfidence(1);
            }
        }, 1500);
    }

    if (!currentQuestion) return <p>Loading assignment...</p>

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl">
                <p className="text-sm text-gray-500 mb-2">Question {questionCount + 1} of 5</p>
                <p className="text-2xl font-semibold mb-6 text-gray-800">{currentQuestion.text}</p>
                
                <div className="space-y-3 mb-6">
                    {currentQuestion.options.map(option => (
                        <button
                            key={option}
                            onClick={() => setSelectedAnswer(option)}
                            disabled={!!feedback}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                                selectedAnswer === option ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                            } ${
                                feedback && currentQuestion.correctAnswer === option ? 'bg-green-200 border-green-500' : ''
                            } ${
                                feedback && selectedAnswer === option && !feedback.correct ? 'bg-red-200 border-red-500' : ''
                            } disabled:cursor-not-allowed`}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {feedback && (
                    <div className={`p-3 rounded-md text-center text-white ${feedback.correct ? 'bg-green-600' : 'bg-red-600'}`}>
                        {feedback.message}
                    </div>
                )}
                
                {!feedback && (
                    <>
                        <div className="my-6">
                            <label className="block text-center font-semibold text-gray-700 mb-2">How confident are you?</label>
                            <div className="flex justify-center space-x-3">
                                {['Not Confident', 'Somewhat Confident', 'Very Confident'].map((label, index) => (
                                    <button 
                                        key={index}
                                        onClick={() => setConfidence(index as 0|1|2)}
                                        className={`px-4 py-2 rounded-full border-2 ${confidence === index ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleAnswerSubmit}
                            disabled={!selectedAnswer}
                            className="w-full bg-blue-600 text-white p-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                        >
                            Submit Answer
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}