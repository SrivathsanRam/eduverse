'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TopicFlowBoard from '@/components/TopicFlow';


interface Topic {
    id: number;
    name: string;
    description: string;
    subject_id: number;
    week: number;
}

export default function ClassDashboard({ params }: { params: { classId: string } }) {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [weekTopics, setWeekTopics] = useState<{ [week: string]: Topic[] }>({});

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

    const handleRemoveTopic = (week: string, index: number) => {
        setWeekTopics((prev) => {
            const updatedWeek = [...(prev[week] || [])];
            updatedWeek.splice(index, 1);
            return {
                ...prev,
                [week]: updatedWeek,
            };
        });
    };

    return (
        <>
            <div className="flex h-screen p-4 space-x-4 bg-gray-100">
                {/* Topics Sidebar */}
                <div className="w-1/4 p-4 bg-white rounded shadow overflow-y-auto">
                    <h2 className="text-lg font-bold mb-2">Available Topics</h2>
                    <div id="topic-list" className="space-y-2">
                        {topics.map((topic) => (
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


                    {/* Topic Flow View */}
                    <TopicFlowBoard topics={allDroppedTopics} />
                </div>

            </div>

        </>
    );
}
