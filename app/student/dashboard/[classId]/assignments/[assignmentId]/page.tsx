'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Make sure this import exists

interface Option {
  text: string;
  is_correct: boolean;
}
interface Question {
  id: string;
  title: string;
  text: string;
  options: Option[];
}

const RECURSION_QUESTIONS: Question[] = [
  {
    id: '192c1090-36b9-4156-bd11-58a5d72413d6',
    title: 'Recursion vs Iteration',
    text: 'Recursion differs from iteration because:',
    options: [
      { text: 'It uses function calls instead of loops', is_correct: true },
      { text: 'It is always faster', is_correct: false },
      { text: 'It uses less memory', is_correct: false },
      { text: 'It can’t be used in Python', is_correct: false },
    ],
  },
  {
    id: '5d0bdb95-5e2c-4f35-9d07-77d885b9fcb2',
    title: 'Base Case in Recursion',
    text: 'Why is a base case needed in recursion?',
    options: [
      { text: 'To create infinite loops', is_correct: false },
      { text: 'To ensure the recursion stops', is_correct: true },
      { text: 'To return a random value', is_correct: false },
      { text: 'To increase depth', is_correct: false },
    ],
  },
  {
    id: '28c25fa1-8f33-46e8-ad53-b82c38a0daeb',
    title: 'What is recursion?',
    text: 'Recursion is when a function:',
    options: [
      { text: 'Calls itself', is_correct: true },
      { text: 'Uses loops', is_correct: false },
      { text: 'Returns a string', is_correct: false },
      { text: 'Prints itself', is_correct: false },
    ],
  },
  {
    id: 'f434ee3c-0810-4b19-80b4-f3ecea9df147',
    title: 'Recursive Depth',
    text: 'What could happen with too deep recursion?',
    options: [
      { text: 'Stack overflow', is_correct: true },
      { text: 'Faster execution', is_correct: false },
      { text: 'Better memory usage', is_correct: false },
      { text: 'Automatic loop conversion', is_correct: false },
    ],
  },
  {
    id: '646c1c1a-ef77-4a08-afa8-b04a267be5a8',
    title: 'Factorial Recursion',
    text: 'What is factorial(0) in recursive functions?',
    options: [
      { text: '1', is_correct: true },
      { text: '0', is_correct: false },
      { text: 'undefined', is_correct: false },
      { text: 'factorial(1)', is_correct: false },
    ],
  },
  {
    id: 'e4d7ab68-300f-41e6-8d8f-8112c3f1f03f',
    title: 'Recursion Time Complexity',
    text: 'What is the time complexity of a recursive fibonacci function without memoization?',
    options: [
      { text: 'O(N)', is_correct: false },
      { text: 'O(2^N)', is_correct: true },
      { text: 'O(N^2)', is_correct: false },
    ],
  },
];

const FUNCTION_QUESTIONS: Question[] = [
  {
    id: 'b2ae7505-5322-4726-8519-49726e147c27',
    title: 'Function Parameters',
    text: 'What are parameters in functions?',
    options: [
      { text: 'Inputs to the function', is_correct: true },
      { text: 'The return values', is_correct: false },
      { text: 'Loops inside functions', is_correct: false },
      { text: 'Global variables', is_correct: false },
    ],
  },
  {
    id: '99892f36-4947-40f6-b0bd-baebf4b11097',
    title: 'Return Statement',
    text: 'Which keyword is used to return a value?',
    options: [
      { text: 'return', is_correct: true },
      { text: 'break', is_correct: false },
      { text: 'yield', is_correct: false },
      { text: 'output', is_correct: false },
    ],
  },
  {
    id: '2df2a75a-7ae3-40cc-bc70-632bf17de908',
    title: 'What is a function?',
    text: 'A function is used to:',
    options: [
      { text: 'Encapsulate reusable code', is_correct: true },
      { text: 'Store data', is_correct: false },
      { text: 'Call a variable', is_correct: false },
      { text: 'Repeat a loop', is_correct: false },
    ],
  },
];

const MOCK_MATERIAL = {
  pdf_url: 'https://cmvltdxdbkknpukrukbx.supabase.co/storage/v1/object/public/pdf-uploads//233ea52b-180b-4814-ba87-98067e6d2d7f/1750210278967-recursion.pdf',
  youtube_url: 'https://www.youtube.com/embed/rf60MejMz3E',
  animation_embed: 'https://aa.ide.sk/DSV_en/RecReverse.html',
};

export default function StudentAssignment() {
  const router = useRouter();
  const { classId, assignmentId } = useParams();
  const [questions, setQuestions] = useState<Question[]>(RECURSION_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; correct: boolean } | null>(null);
  const [showIntervention, setShowIntervention] = useState(false);
  const [interventionType, setInterventionType] = useState<'pdf' | 'video' | 'animation' | null>(null);
  const [interventionStep, setInterventionStep] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [swapped, setSwapped] = useState(false);
  const [functionCorrect, setFunctionCorrect] = useState<boolean[]>([]);
  const [confidence, setConfidence] = useState<'low' | 'med' | 'high' | null>(null);

  const interventionSequence: ('pdf' | 'video' | 'animation')[] = ['pdf', 'video', 'animation'];

  const currentQuestion = questions[currentIdx];

  const handleAnswerSubmit = () => {
    if (!currentQuestion || !selectedAnswer || !confidence) return;
    const selectedOption = currentQuestion.options.find(opt => opt.text === selectedAnswer);
    const correct = selectedOption?.is_correct === true;

    setFeedback({
      message: correct
        ? '✅ Correct!'
        : `❌ Wrong—correct is "${currentQuestion.options.find(o => o.is_correct)?.text}"`,
      correct,
    });

    if (!correct) {
      setTimeout(() => {
        setShowIntervention(true);
        setInterventionType(interventionSequence[interventionStep]);
        setWrongStreak(wrongStreak + 1);
      }, 1000);
    } else {
      setTimeout(() => {
        setWrongStreak(0);
        if (swapped) {
          // If on function questions, update functionCorrect
          setFunctionCorrect(prev => {
            const updated = [...prev];
            updated[currentIdx] = true;

            // If this was the last function question and all are correct, swap back to recursion
            if (
              currentIdx === FUNCTION_QUESTIONS.length - 1 &&
              updated.length === FUNCTION_QUESTIONS.length &&
              updated.every(Boolean)
            ) {
              setQuestions(RECURSION_QUESTIONS);
              setCurrentIdx(0);
              setSwapped(false);
              setFunctionCorrect([]);
              setFeedback(null);
              setSelectedAnswer(null);
              return updated;
            }

            // Otherwise, go to next question as usual
            goToNextQuestion();
            return updated;
          });
        } else {
          goToNextQuestion();
        }
      }, 1000);
    }
  };

  const handleContinueAfterIntervention = () => {
    if (interventionStep < 2) {
      setInterventionStep(interventionStep + 1);
      setShowIntervention(false);
      setInterventionType(null);
      setFeedback(null);
      setSelectedAnswer(null);
    } else {
      // After 3 interventions, swap to function questions if not already swapped
      if (!swapped) {
        setQuestions(FUNCTION_QUESTIONS);
        setCurrentIdx(0);
        setSwapped(true);
        setWrongStreak(0);
        setFunctionCorrect(Array(FUNCTION_QUESTIONS.length).fill(false));
      } else {
        goToNextQuestion();
      }
      setInterventionStep(0);
      setShowIntervention(false);
      setInterventionType(null);
      setFeedback(null);
      setSelectedAnswer(null);
    }
  };

  const goToNextQuestion = async () => {
    // If on function questions and last question, check if all correct and revert
    if (
      swapped &&
      currentIdx + 1 === questions.length &&
      functionCorrect.length === FUNCTION_QUESTIONS.length &&
      functionCorrect.every(Boolean)
    ) {
      setQuestions(RECURSION_QUESTIONS);
      setCurrentIdx(0);
      setSwapped(false);
      setFunctionCorrect([]);
      setFeedback(null);
      setSelectedAnswer(null);
      return;
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
      setFeedback(null);
      setSelectedAnswer(null);
    } else {
      // Quiz finished
      // 1. Mark assignment as completed in Supabase
      await supabase
        .from('student_assignments')
        .update({ status: 'completed' })
        .eq('assignment_id', assignmentId)
        .eq('class_id', classId);

      // 2. Show alert and redirect
      alert('Quiz completed!');
      router.push(`/student/dashboard/${classId}`);
    }
  };

  if (!currentQuestion) return <div>Loading...</div>;

  if (showIntervention && interventionType) {
    let content = null;
    if (interventionType === 'pdf') {
      content = (
        <>
          <iframe
            src={MOCK_MATERIAL.pdf_url}
            className="w-full h-[70vh] min-h-[400px] rounded border"
          />
          <button
            onClick={handleContinueAfterIntervention}
            className="mt-6 w-full py-3 bg-blue-600 text-white rounded text-lg"
          >
            Continue
          </button>
        </>
      );
    } else if (interventionType === 'video') {
      content = (
        <>
          <iframe
            src={MOCK_MATERIAL.youtube_url}
            className="w-full h-[70vh] min-h-[400px] rounded border"
            allowFullScreen
          />
          <button
            onClick={handleContinueAfterIntervention}
            className="mt-6 w-full py-3 bg-blue-600 text-white rounded text-lg"
          >
            Continue
          </button>
        </>
      );
    } else if (interventionType === 'animation') {
      content = (
        <>
          <iframe
            src={MOCK_MATERIAL.animation_embed}
            className="w-full h-[70vh] min-h-[400px] rounded border"
            allowFullScreen
          />
          <button
            onClick={handleContinueAfterIntervention}
            className="mt-6 w-full py-3 bg-blue-600 text-white rounded text-lg"
          >
            Continue
          </button>
        </>
      );
    }
    return (
      <div className="min-h-screen p-6 bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl text-center">
          <h2 className="text-2xl font-semibold mb-6">Review this material before continuing</h2>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <p className="text-sm text-gray-600 mb-2">Question {currentIdx + 1} of {questions.length}</p>
        <h2 className="text-xl font-semibold mb-4">{currentQuestion.text}</h2>

        {currentQuestion.options.map((opt, idx) => (
          <button
            key={opt.text + idx}
            onClick={() => setSelectedAnswer(opt.text)}
            disabled={!!feedback}
            className={`block w-full text-left p-3 rounded mb-2 border ${
              selectedAnswer === opt.text ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
            } ${
              feedback && opt.text === selectedAnswer && feedback.correct ? 'bg-green-200 border-green-500' : ''
            } ${
              feedback && opt.text === selectedAnswer && !feedback.correct ? 'bg-red-200 border-red-500' : ''
            }`}
          >
            {opt.text}
          </button>
        ))}

        <div className="mb-4">
          <label className="block mb-2 font-medium">How confident are you?</label>
          <div className="flex gap-4">
            {(['low', 'med', 'high'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setConfidence(level)}
                disabled={!!feedback}
                className={`px-4 py-2 rounded border ${
                  confidence === level ? 'bg-blue-500 text-white border-blue-700' : 'bg-gray-100 border-gray-300'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {!feedback && (
          <button
            onClick={handleAnswerSubmit}
            disabled={!selectedAnswer || !confidence}
            className="w-full py-3 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Submit
          </button>
        )}

        {feedback && (
          <div className={`mt-4 p-3 rounded text-white text-center ${feedback.correct ? 'bg-green-600' : 'bg-red-600'}`}>
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}