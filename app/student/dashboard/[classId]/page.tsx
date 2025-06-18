'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';


interface Material {
    topic_node_id: string;
    pdf_url?: string;
    youtube_url?: string;
    animation_embed?: string;
    topic_name?: string;
    week_number?: number;
}

interface Assignment {
    id: string;
    title: string;
    due_date: string;
    status: 'pending' | 'completed';
}

export default function StudentClassDashboard() {
    const { classId } = useParams();
    const router = useRouter();
    const [topicNodes, setTopicNodes] = useState<any[]>([]);
    const [studentId, setStudentId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'notes' | 'videos' | 'animations'>('notes');
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [rawMaterials, setRawMaterials] = useState<any[]>([]);
    function getYoutubeEmbedUrl(url: string) {
        // Handles both youtu.be and youtube.com/watch?v=...
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^\s&?/]+)/);
        return match ? `https://www.youtube.com/embed/${match[1]}` : url;
    }

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (session?.user?.id) {
                setStudentId(session.user.id); // this is the student's UUID
            }
        };

        getUser();
    }, []);

    // Fetch class UUID
    const [classUUID, setClassUUID] = useState<string | null>(null);
    useEffect(() => {
        supabase
            .from('classes')
            .select('id')
            .eq('code', classId)
            .single()
            .then(({ data }) => setClassUUID(data?.id ?? null));
    }, [classId]);

    // Load materials once we have classUUID
    useEffect(() => {
        if (!classUUID) return;

        supabase
            .from('learning_materials')
            .select(`
        pdf_url, youtube_url, animation_embed,
        topic_node_id (
          week,
          topic_id,
          class_id,
          topic:topics ( name )
        )
      `)
            .eq('topic_node_id.class_id', classUUID)
            .then(({ data }) => {
                console.log('Learning materials data:', data);
                const items = (data ?? [])
                    .filter(row => row.topic_node_id) // Only include rows with a valid topic_node_id join
                    .map((row: any) => ({
                        topic_node_id: row.topic_node_id.id,
                        topic_name: row.topic_node_id.topic?.name ?? '',
                        week_number: row.topic_node_id.week,
                        pdf_url: row.pdf_url,
                        youtube_url: row.youtube_url,
                        animation_embed: row.animation_embed,
                    })) as Material[];
                setRawMaterials(items);
            });
    }, [classUUID]);

    // Load assignments for student
    useEffect(() => {
        if (!classUUID || !studentId) return;

        // Fetch completed assignments for this student
        supabase
            .from('student_assignments')
            .select(`
            assignment:assignments (
                id,
                title,
                due_date,
                class_id
            ),
            status,
            completed_at
        `)
            .eq('student_id', studentId)
            .eq('assignment.class_id', classUUID)
            .then(({ data }) => {
                const completedAssignments = (data ?? []).map((row: any) => ({
                    id: row.assignment.id,
                    title: row.assignment.title,
                    due_date: row.assignment.due_date,
                    status: row.status,
                    completed_at: row.completed_at,
                })) as Assignment[];
                setAssignments(completedAssignments);
            });
    }, [classUUID, studentId]);

    // Fetch all assignments for the class
    const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
    useEffect(() => {
        if (!classUUID) return;
        supabase
            .from('assignments')
            .select('*')
            .eq('class_id', classUUID)
            .then(({ data }) => setAllAssignments(data ?? []));
    }, [classUUID]);

    // Now, compute pending/completed
    const completedIds = new Set(assignments.map(a => a.id));
    const completed = allAssignments.filter(a => completedIds.has(a.id));
    const pending = allAssignments.filter(a => !completedIds.has(a.id));

    const materials = rawMaterials.map(mat => {
        const node = topicNodes.find(n => n.id === mat.topic_node_id);
        return {
            topic_node_id: mat.topic_node_id,
            pdf_url: mat.pdf_url,
            youtube_url: mat.youtube_url,
            animation_embed: mat.animation_embed,
            topic_name: node?.topics?.name ?? '',
            week_number: node?.week,
        };
    });

    if (!classUUID) return <p className="p-6">Loading...</p>;

    const filtered = materials.filter((m) => {
        if (activeTab === 'notes') return !!m.pdf_url;
        if (activeTab === 'videos') return !!m.youtube_url;
        return !!m.animation_embed;
    });

    return (
        <div className="p-6 flex space-x-6">
            {/* Left side: Module content */}
            <div className="flex-1">
                <div className="mb-4 flex space-x-4">
                    {['notes', 'videos', 'animations'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t as any)}
                            className={`px-4 py-2 rounded-md ${activeTab === t ? 'bg-blue-600 text-white' : 'bg-gray-200'
                                }`}
                        >
                            {t[0].toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {filtered.map((m, i) => (
                        <div key={i} className="p-4 border rounded shadow bg-white">
                            <h4 className="font-semibold">{m.topic_name}</h4>
                            {activeTab === 'notes' && m.pdf_url && (
                                <iframe src={m.pdf_url} className="w-full h-60"></iframe>
                            )}
                            {activeTab === 'videos' && m.youtube_url && (
                                <iframe
                                    src={getYoutubeEmbedUrl(m.youtube_url)}
                                    allowFullScreen
                                    className="w-full h-60"
                                ></iframe>
                            )}
                            {activeTab === 'animations' && m.animation_embed && (
                                <iframe
                                    src={m.animation_embed}
                                    className="w-full h-60"
                                    frameBorder="0"
                                    allowFullScreen
                                />
                            )}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <p className="text-gray-500">No content available in this tab.</p>
                    )}
                </div>
            </div>

            {/* Right side: Assignments */}
            <div className="w-1/3 space-y-6">
                <div>
                    <h3 className="font-bold text-lg">Pending Assignments</h3>
                    {pending.map((a) => (
                        <button
                            key={a.id}
                            onClick={() => router.push(`/student/dashboard/${classId}/assignments/${a.id}`)}
                            className="block w-full text-left p-3 border rounded mb-2 bg-yellow-100 hover:bg-yellow-200"
                        >
                            <div className="font-semibold">{a.title}</div>
                            <small>Due: {new Date(a.due_date).toLocaleDateString()}</small>
                        </button>
                    ))}
                    {pending.length === 0 && <p>No pending assignments.</p>}
                </div>

                <div>
                    <h3 className="font-bold text-lg">Completed Assignments</h3>
                    {completed.map((a) => (
                        <div key={a.id} className="p-3 border rounded mb-2 bg-green-50">
                            <div className="font-semibold">{a.title}</div>
                            <small>Completed</small>
                        </div>
                    ))}
                    {completed.length === 0 && <p>No completed assignments yet.</p>}
                </div>
            </div>
        </div>
    );
}

