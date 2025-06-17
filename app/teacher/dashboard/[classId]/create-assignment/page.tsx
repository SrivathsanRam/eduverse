'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

interface Option {
    text: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    title: string;
    text: string;
    image: string | null;
    options: { text: string; is_correct: boolean }[];
    difficulty: 0 | 1 | 2;
    institution: string;
    module: string;
    grade?: number;
}



export default function CreateAssignmentPage() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [questionBank, setQuestionBank] = useState<Question[]>([]);
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [institutionFilter, setInstitutionFilter] = useState('');
    const [moduleFilter, setModuleFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [showCustomForm, setShowCustomForm] = useState(false);
    interface Option {
        text: string;
        is_correct: boolean;
    }

    const [newQuestion, setNewQuestion] = useState<{
        title: string;
        text: string;
        image: string | null;
        difficulty: number;
        institution: string;
        module: string;
        grade: number;
        options: { text: string; is_correct: boolean }[];
    }>({
        title: '',
        text: '',
        image: null,
        difficulty: 0,
        institution: '',
        module: '',
        grade: 1,
        options: [{ text: '', is_correct: true }],
    });


    useEffect(() => {
        const fetchQuestions = async () => {
            const { data, error } = await supabase
                .from('questions')
                .select('*');

            if (error) {
                console.error('Failed to load questions:', error.message);
            } else {
                setQuestionBank(data);
            }
        };

        fetchQuestions();
    }, []);


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

        try {
            // 1. Get the class UUID from class code
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id')
                .eq('code', classId) // classId is the 6-digit code in the URL
                .single();

            if (classError || !classData) {
                alert('Class not found.');
                setLoading(false);
                return;
            }

            const classUuid = classData.id;

            // 2. Insert into assignments
            const { data: assignmentData, error: assignmentError } = await supabase
                .from('assignments')
                .insert({
                    class_id: classUuid,
                    title,
                    due_date: dueDate,
                })
                .select('id') // Get the ID of the newly created assignment
                .single();

            if (assignmentError || !assignmentData) {
                alert('Failed to create assignment.');
                setLoading(false);
                return;
            }

            const assignmentId = assignmentData.id;

            // 3. Insert into assignment_questions
            const questionInserts = Array.from(selectedQuestions).map((qid) => ({
                assignment_id: assignmentId,
                question_id: qid,
            }));

            const { error: aqError } = await supabase
                .from('assignment_questions')
                .insert(questionInserts);

            if (aqError) {
                alert('Failed to link questions to assignment.');
                setLoading(false);
                return;
            }

            alert(`Assignment "${title}" created with ${selectedQuestions.size} questions.`);
            router.push(`/teacher/dashboard`);
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const filteredQuestions = questionBank.filter((q) => {
        return (
            (difficultyFilter === '' || q.difficulty === parseInt(difficultyFilter)) &&
            (institutionFilter === '' || q.institution.toLowerCase().includes(institutionFilter.toLowerCase())) &&
            (moduleFilter === '' || q.module.toLowerCase().includes(moduleFilter.toLowerCase())) &&
            (searchQuery === '' || q.text.toLowerCase().includes(searchQuery.toLowerCase()) || q.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (gradeFilter === '' || q.grade === Number(gradeFilter))
        );
    });




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
                            <button
                                type="button"
                                onClick={() => setShowCustomForm(!showCustomForm)}
                                className="mb-4 text-sm text-green-600 hover:underline"
                            >
                                {showCustomForm ? 'Close Custom Question Form' : '+ Create Custom Question'}
                            </button>
                            {showCustomForm && (
                                <div className="border rounded p-4 mb-6 bg-white shadow">
                                    <h2 className="text-lg font-semibold mb-4">New Custom Question</h2>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Title"
                                            className="w-full px-3 py-2 border rounded"
                                            value={newQuestion.title}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                                        />
                                        <textarea
                                            placeholder="Question text"
                                            className="w-full px-3 py-2 border rounded"
                                            rows={3}
                                            value={newQuestion.text}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const { data, error } = await supabase.storage
                                                        .from('question-images')
                                                        .upload(`custom/${Date.now()}-${file.name}`, file);
                                                    if (error) {
                                                        alert('Image upload failed');
                                                        setNewQuestion({ ...newQuestion, image: null });
                                                    } else {
                                                        const publicUrl = supabase.storage.from('question-images').getPublicUrl(data.path).data.publicUrl;
                                                        setNewQuestion({ ...newQuestion, image: publicUrl });
                                                    }
                                                } else {
                                                    setNewQuestion({ ...newQuestion, image: null });
                                                }
                                            }}
                                        />
                                        <select
                                            className="w-full px-3 py-2 border rounded"
                                            value={newQuestion.difficulty}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: Number(e.target.value) })}
                                        >
                                            <option value={0}>Easy</option>
                                            <option value={1}>Medium</option>
                                            <option value={2}>Hard</option>
                                        </select>

                                        <input
                                            type="text"
                                            placeholder="Institution"
                                            className="w-full px-3 py-2 border rounded"
                                            value={newQuestion.institution}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, institution: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            placeholder="Module Code"
                                            className="w-full px-3 py-2 border rounded"
                                            value={newQuestion.module}
                                            onChange={(e) => setNewQuestion({ ...newQuestion, module: e.target.value })}
                                        />
                                        <select
                                            className="w-full px-3 py-2 border rounded"
                                            value={newQuestion.grade}
                                            onChange={e => setNewQuestion({ ...newQuestion, grade: Number(e.target.value) })}
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    Grade {i + 1}
                                                </option>
                                            ))}
                                        </select>

                                        {/* Options Input */}
                                        {newQuestion.options.map((opt, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={`Option ${idx + 1}`}
                                                    className="flex-1 px-3 py-2 border rounded"
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const newOptions = [...newQuestion.options];
                                                        newOptions[idx].text = e.target.value;
                                                        setNewQuestion({ ...newQuestion, options: newOptions });
                                                    }}
                                                />
                                                <input
                                                    type="radio"
                                                    name="correctOption"
                                                    checked={opt.is_correct}
                                                    onChange={() => {
                                                        const newOptions = newQuestion.options.map((o, i) => ({
                                                            ...o,
                                                            is_correct: i === idx,
                                                        }));
                                                        setNewQuestion({ ...newQuestion, options: newOptions });
                                                    }}
                                                    title="Mark as correct answer"
                                                />
                                                {newQuestion.options.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            let newOptions = [...newQuestion.options];
                                                            newOptions.splice(idx, 1);
                                                            // Ensure one option remains marked correct
                                                            if (!newOptions.some(o => o.is_correct)) {
                                                                newOptions[0].is_correct = true;
                                                            }
                                                            setNewQuestion({ ...newQuestion, options: newOptions });
                                                        }}
                                                        className="text-sm text-red-500 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setNewQuestion({ ...newQuestion, options: [...newQuestion.options, { text: '', is_correct: false }] })
                                            }
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            + Add Option
                                        </button>

                                        <button
                                            type="button"
                                            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                                            onClick={async () => {
                                                const { title, text, image, difficulty, institution, module, grade, options } = newQuestion;
                                                if (!title || !text || options.length < 2 || !options.some(o => o.is_correct)) {
                                                    alert('Please fill all fields and ensure at least two options with one marked correct.');
                                                    return;
                                                }
                                                const { error } = await supabase.from('questions').insert({
                                                    title,
                                                    text,
                                                    image,
                                                    options,
                                                    difficulty,
                                                    institution,
                                                    module,
                                                    grade,
                                                });
                                                if (error) {
                                                    alert('Failed to create question: ' + error.message);
                                                } else {
                                                    alert('Question created successfully!');
                                                    setShowCustomForm(false);
                                                    setNewQuestion({
                                                        title: '',
                                                        text: '',
                                                        image: null,
                                                        difficulty: 0,
                                                        institution: '',
                                                        module: '',
                                                        grade: 1,
                                                        options: [{ text: '', is_correct: true }],
                                                    });
                                                }
                                            }}
                                        >
                                            Save Question
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>



                        {/* Right Side: Question Bank */}

                        <div>
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                                <input
                                    type="text"
                                    placeholder="Search questions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-3 py-2 border rounded shadow-sm focus:outline-none"
                                />
                                <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="px-3 py-2 border rounded shadow-sm">
                                    <option value="">All Difficulties</option>
                                    <option value="0">Easy</option>
                                    <option value="1">Medium</option>
                                    <option value="2">Hard</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Institution"
                                    value={institutionFilter}
                                    onChange={(e) => setInstitutionFilter(e.target.value)}
                                    className="px-3 py-2 border rounded shadow-sm"
                                />
                                <input
                                    type="text"
                                    placeholder="Module"
                                    value={moduleFilter}
                                    onChange={(e) => setModuleFilter(e.target.value)}
                                    className="px-3 py-2 border rounded shadow-sm"
                                />
                                <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)} className="px-3 py-2 border rounded shadow-sm">
                                    <option value="">All Grades</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            Grade {i + 1}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <h3 className="text-lg font-medium text-gray-800 mb-2">Select Questions</h3>
                            <div className="h-96 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2 bg-gray-50">
                                {filteredQuestions.map(q => (
                                    <div
                                        key={q.id}
                                        onClick={() => toggleQuestion(q.id)}
                                        className={`p-3 rounded-md cursor-pointer transition-colors ${selectedQuestions.has(q.id) ? 'bg-green-200 border-green-400 border' : 'bg-white hover:bg-gray-100'}`}
                                    >
                                        <p className="font-medium text-gray-800">{q.title}</p>
                                        <p className="text-gray-600 text-sm mb-2">{q.text}</p>
                                        {q.image && <img src={q.image} alt="question image" className="mb-2 max-h-40 object-contain" />}
                                        <ul className="list-disc ml-4 text-sm text-gray-700">
                                            {q.options.map((opt, i) => (
                                                <li key={i}>
                                                    {opt.text} {opt.is_correct ? '✅' : ''}
                                                </li>
                                            ))}
                                        </ul>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Difficulty: {['Easy', 'Medium', 'Hard'][q.difficulty]} · {q.institution} · {q.module}
                                        </div>
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