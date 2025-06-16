'use client'
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-8">Welcome to EduVerse</h1>
      <div className="space-x-4">
        <Link href="/student/auth" className="px-4 py-2 bg-blue-500 text-white rounded">
          For Students
        </Link>
        <Link href="/teacher/auth" className="px-4 py-2 bg-green-500 text-white rounded">
          For Educators
        </Link>
      </div>
    </div>
  );
}