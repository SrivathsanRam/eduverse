'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TopicFlowBoard from '@/components/TopicFlow';
import { useRouter, useParams } from 'next/navigation';

interface Topic {
    id: string;
    name: string;
    description: string;
    subject_id: string;
    week: number;
}

export default function ClassDashboard() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [weekTopics, setWeekTopics] = useState<{ [week: string]: Topic[] }>({});
    const { classId } = useParams();
    const [saveTrigger, setSaveTrigger] = useState(0);
    const [classUUID, setClassUUID] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const router = useRouter();

    // Load timeline from Supabase on mount
    useEffect(() => {
        async function loadTimeline() {
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .select('id')
                .eq('code', classId)
                .single();

            if (classError || !classData) {
                console.error('Error retrieving class UUID:', classError);
                return;
            }

            const classUUID = classData.id;
            const { data, error } = await supabase
                .from('class_timelines')
                .select('timeline')
                .eq('class_id', classUUID)
                .single();
            if (data && data.timeline) {
                setWeekTopics(data.timeline);
            }
        }
        loadTimeline();
    }, [classId]);

    // Save timeline to Supabase
    const saveTimeline = useCallback(async () => {
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('id')
            .eq('code', classId)
            .single();

        if (classError || !classData) {
            console.error('Error retrieving class UUID:', classError);
            return;
        }

        const classUUID = classData.id;
        await supabase
            .from('class_timelines')
            .upsert([
                { class_id: classUUID, timeline: weekTopics }
            ]);
        setSaveTrigger(t => t + 1); // Triggers TopicFlowBoard to save nodes/edges
    }, [classId, weekTopics]);

    useEffect(() => {
        async function fetchTopics() {
            const { data, error } = await supabase.from('topics').select('*');
            if (error) console.error(error);
            else setTopics(data || []);
        }

        fetchTopics();
    }, []);

    const handleDrop = (week: string, topic: Topic) => {
        setWeekTopics((prev) => ({
            ...prev,
            [week]: [...(prev[week] || []), topic],
        }));
    };

    const allowDrop = (e: React.DragEvent) => e.preventDefault();

    const handleDragStart = (e: React.DragEvent, topic: Topic) => {
        e.dataTransfer.setData('topic', JSON.stringify(topic));
    };

    const onDrop = (e: React.DragEvent, week: string) => {
        const topic: Topic = JSON.parse(e.dataTransfer.getData('topic'));
        handleDrop(week, topic);
    };
    const allDroppedTopics: Topic[] = Object.entries(weekTopics).flatMap(
        ([week, topicList]) =>
            topicList.map((topic) => ({
                ...topic,
                week: parseInt(week.replace('week-', '')),
            }))
    );

    const handleRemoveTopic = async (week: string, index: number) => {
        const topicToRemove = weekTopics[week]?.[index];
        if (!topicToRemove) return;

        // Remove from UI state
        setWeekTopics((prev) => {
            const updatedWeek = [...(prev[week] || [])];
            updatedWeek.splice(index, 1);
            return {
                ...prev,
                [week]: updatedWeek,
            };
        });

        // Remove related edges from Supabase
        try {
            // 1. Find node(s) in topic_nodes for this topic and class
            const { data: nodes, error: nodeError } = await supabase
                .from('topic_nodes')
                .select('id')
                .eq('class_id', classUUID)
                .eq('topic_id', topicToRemove.id);

            if (nodeError) {
                console.error('Error fetching node for edge removal:', nodeError);
                return;
            }

            if (nodes && nodes.length > 0) {
                const nodeIds = nodes.map((n: any) => n.id);

                // 2. Delete edges where source_node_id or target_node_id matches any of these node IDs
                const { error: edgeError } = await supabase
                    .from('topic_edges')
                    .delete()
                    .or(
                        nodeIds
                            .map(
                                (id: string) =>
                                    `source_node_id.eq.${id},target_node_id.eq.${id}`
                            )
                            .join(',')
                    );

                if (edgeError) {
                    console.error('Error deleting related edges:', edgeError);
                }
            }
        } catch (err) {
            console.error('Unexpected error removing topic edges:', err);
        }
    };

    useEffect(() => {
        async function fetchClassUUID() {
            const { data, error } = await supabase
                .from('classes')
                .select('id')
                .eq('code', classId)
                .single();
            if (data && data.id) setClassUUID(data.id);
        }
        fetchClassUUID();
    }, [classId]);

    // Filter topics based on search input
    const filteredTopics = topics.filter(topic =>
        topic.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-full">
                <button onClick={() => router.back()} className="text-green-600 hover:underline mb-4">&larr; Back to Class</button>
                <div className="flex h-screen p-4 space-x-4 bg-gray-100">
                    {/* Topics Sidebar */}
                    <div className="w-1/4 p-4 bg-white rounded shadow overflow-y-auto">
                        <h2 className="text-lg font-bold mb-2">Available Topics</h2>
                        <input
                            type="text"
                            placeholder="Search topics..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full mb-3 p-2 border rounded"
                        />
                        <div id="topic-list" className="space-y-2">
                            {filteredTopics.map((topic) => (
                                <div
                                    key={topic.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, topic)}
                                    className="p-2 bg-blue-200 rounded cursor-move"
                                >
                                    {topic.name}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex-1 p-4 bg-white rounded shadow overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">Weekly Timeline</h2>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((week) => (
                                <div
                                    key={week}
                                    onDragOver={allowDrop}
                                    onDrop={(e) => onDrop(e, `week-${week}`)}
                                    className="p-4 bg-gray-200 rounded dropzone"
                                >
                                    <h3 className="font-semibold mb-2">Week {week}</h3>
                                    <div className="min-h-[50px] space-y-2">
                                        {(weekTopics[`week-${week}`] || []).map((topic, index) => (
                                            <div key={`${topic.id}-${index}`} className="p-2 bg-yellow-100 rounded flex justify-between items-center">
                                                <span>{topic.name}</span>
                                                <button
                                                    className="ml-2 text-red-500 hover:text-red-700 font-bold"
                                                    onClick={() => handleRemoveTopic(`week-${week}`, index)}
                                                    title="Remove topic"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="mb-4 px-4 py-2 bg-green-600 text-white rounded"
                            onClick={saveTimeline}
                        >
                            Save Timeline & Flow
                        </button>

                        {/* Topic Flow View */}
                        {classUUID && (
                            <TopicFlowBoard
                                topics={allDroppedTopics}
                                classId={classUUID}
                                saveTrigger={saveTrigger}
                            />
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
