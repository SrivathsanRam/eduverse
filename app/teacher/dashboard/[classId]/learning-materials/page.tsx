'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import PDFUploadArea from '@/components/PDFUploadArea';

interface Topic {
    id: string;
    name: string;
    description: string;
    week_number: number;
}

interface Material {
    pdf_url?: string;
    youtube_url?: string;
    animation_embed?: string;
}

export default function LearningMaterialsPage() {
    const { classId: classCode } = useParams();
    console.log(classCode);
    const [topicsByWeek, setTopicsByWeek] = useState<{ [week: number]: Topic[] }>({});
    const [materials, setMaterials] = useState<{ [topicId: string]: Material }>({});
    const [classUUID, setClassUUID] = useState<string | null>(null);
    // Load topics for this class
    useEffect(() => {
  async function fetchTopicNodes() {
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('code', classCode)
      .single();

    if (classError || !classData) {
      console.error('Class not found:', classError);
      return;
    }

    const classUUID = classData.id;

    const { data, error } = await supabase
      .from('topic_nodes')
      .select(`
        id,
        week,
        topic_id,
        topics (
          id,
          name,
          description
        )
      `)
      .eq('class_id', classUUID);

    if (error) {
      console.error('Error fetching topic_nodes:', error);
      return;
    }

    // Group by week
    const grouped: { [week: number]: Topic[] } = {};
    data.forEach((node: any) => {
      const week = node.week;
      const topic = {
        id: node.id, // <-- Use the topic_nodes/class_topics id
        topic_id: node.topic_id, // <-- Keep the topic_id if you need it
        name: node.topics?.name ?? 'Unnamed Topic',
        description: node.topics?.description ?? '',
        week_number: week,
      };

      if (!grouped[week]) grouped[week] = [];
      grouped[week].push(topic);
    });

    setTopicsByWeek(grouped);

    // --- Fetch learning_materials for these topic_node ids ---
    const allTopicNodeIds = data.map((node: any) => node.id);
    if (allTopicNodeIds.length > 0) {
      const { data: materialsData, error: materialsError } = await supabase
        .from('learning_materials')
        .select('*')
        .in('topic_node_id', allTopicNodeIds);

      if (materialsError) {
        console.error('Error fetching learning materials:', materialsError);
      } else if (materialsData) {
        // Map to { [topicNodeId]: Material }
        const materialsMap: { [topicNodeId: string]: Material } = {};
        materialsData.forEach((mat: any) => {
          materialsMap[mat.topic_node_id] = {
            pdf_url: mat.pdf_url || '',
            youtube_url: mat.youtube_url || '',
            animation_embed: mat.animation_embed || '',
          };
        });
        setMaterials(materialsMap);
      }
    }
  }

  fetchTopicNodes();
}, [classUUID]);

    const handleInputChange = (topicId: string, field: keyof Material, value: string) => {
        setMaterials((prev) => ({
            ...prev,
            [topicId]: {
                ...prev[topicId],
                [field]: value,
            },
        }));
    };

    const handleSave = async (topicId: string) => {
        const material = materials[topicId];
        if (!material) return;

        const { error } = await supabase.from('learning_materials').upsert({
            id: uuidv4(),
            topic_node_id: topicId, // <-- renamed
            pdf_url: material.pdf_url || null,
            youtube_url: material.youtube_url || null,
            animation_embed: material.animation_embed || null,
        });

        if (error) {
            console.error('Save failed', error);
            alert('Failed to save material.');
        } else {
            alert('Material saved!');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Learning Materials</h1>

            {Object.entries(topicsByWeek)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([week, topics]) => (
                    <div key={week} className="mb-8">
                        <h2 className="text-xl font-semibold mb-3">Week {week}</h2>

                        {topics.map((topic) => (
                            <div
                                key={topic.id}
                                className="border p-4 rounded mb-4 bg-white shadow"
                            >
                                <h3 className="text-lg font-bold mb-2">{topic.name}</h3>
                                <p className="text-gray-600 mb-4">{topic.description}</p>

                                <div className="space-y-2">
                                    <PDFUploadArea
  topic={topic}
  classUUID={classUUID ?? ''}
  onUpload={pdfUrl => handleInputChange(topic.id, 'pdf_url', pdfUrl)}
/>

{materials[topic.id]?.pdf_url && (
  <div className="mt-2">
    <a
      href={materials[topic.id].pdf_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      View Uploaded PDF
    </a>
  </div>
)}

                                    <input
                                        type="text"
                                        placeholder="YouTube Video URL"
                                        className="w-full border px-3 py-2 rounded"
                                        value={materials[topic.id]?.youtube_url || ''}
                                        onChange={(e) =>
                                            handleInputChange(topic.id, 'youtube_url', e.target.value)
                                        }
                                    />

                                    <input
                                        type="text"
                                        placeholder="Animation Embed Link"
                                        className="w-full border px-3 py-2 rounded"
                                        value={materials[topic.id]?.animation_embed || ''}
                                        onChange={(e) =>
                                            handleInputChange(topic.id, 'animation_embed', e.target.value)
                                        }
                                    />

                                    <button
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                        onClick={() => handleSave(topic.id)}
                                    >
                                        Save Materials
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
        </div>
    );
}
