'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { supabase } from '@/lib/supabaseClient';

interface Topic {
  id: string; // UUID
  name: string;
  description: string;
  subject_id: string;
  week: number;
}

interface TopicFlowBoardProps {
  topics: Topic[];
  classId: string;
  saveTrigger: number;
}

export default function TopicFlowBoard({
  topics,
  classId,
  saveTrigger,
}: TopicFlowBoardProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Create nodes from dropped topics
  useEffect(() => {
    const newNodes: Node[] = topics.map((topic, idx) => ({
      id: `node-${topic.id}`,
      data: { label: `${topic.name} (Week ${topic.week})` },
      position: {
        x: idx * 150,
        y: topic.week * 150,
      },
      type: 'default',
    }));

    setNodes(newNodes);
  }, [topics]);

  // Save to Supabase when saveTrigger changes
  useEffect(() => {
    async function persistFlow() {
      if (!nodes.length) return;

      // Step 1: Delete existing nodes and edges for the class
      await supabase.from('topic_edges').delete().eq('class_id', classId);
      await supabase.from('topic_nodes').delete().eq('class_id', classId);

      // Step 2: Insert new nodes and get their DB IDs
      const { data: insertedNodes, error: nodeError } = await supabase
        .from('topic_nodes')
        .insert(
          nodes.map((node) => ({
            class_id: classId,
            topic_id: node.id.replace('node-', ''),
            x: node.position.x,
            y: node.position.y,
            week:
              typeof node.data.week === 'number'
                ? node.data.week
                : (typeof node.data.label === 'string'
                    ? parseInt(node.data.label.match(/Week (\d+)/)?.[1] || '0')
                    : 0),
          }))
        )
        .select(); // <-- This is important to get the generated IDs

      if (nodeError) {
        console.error('Error inserting nodes:', nodeError);
        return;
      }

      console.log('Inserting nodes:', nodes.map((node) => ({
        class_id: classId,
        topic_id: node.id.replace('node-', ''),
        x: node.position.x,
        y: node.position.y,
        week: typeof node.data.week === 'number'
          ? node.data.week
          : (typeof node.data.label === 'string'
              ? parseInt(node.data.label.match(/Week (\d+)/)?.[1] || '0')
              : 0),
      })));

      // Build a mapping from topic_id to DB node id
      const nodeIdMap: { [topicId: string]: string } = {};
      if (insertedNodes) {
        insertedNodes.forEach((dbNode: any) => {
          nodeIdMap[dbNode.topic_id] = dbNode.id;
        });
      }

      // Step 3: Insert new edges using the DB node IDs
      const { error: edgeError } = await supabase.from('topic_edges').insert(
        edges.map((edge) => ({
          class_id: classId,
          source_node_id: nodeIdMap[edge.source.replace('node-', '')],
          target_node_id: nodeIdMap[edge.target.replace('node-', '')],
        }))
      );

      if (edgeError) {
        console.error('Error inserting edges:', edgeError);
      }
    }

    if (saveTrigger > 0) {
      persistFlow();
    }
  }, [saveTrigger]);

  // Fetch initial flow data from Supabase
  useEffect(() => {
    async function fetchFlow() {
      // Fetch nodes from Supabase
      const { data: nodeData, error: nodeError } = await supabase
        .from('topic_nodes')
        .select('*, topic:topics(name)')
        .eq('class_id', classId);

      // Fetch edges from Supabase
      const { data: edgeData, error: edgeError } = await supabase
        .from('topic_edges')
        .select('*')
        .eq('class_id', classId);

      if (nodeData) {
        setNodes(
          nodeData.map((node: any) => ({
            id: `node-${node.topic_id}`,
            data: { label: `${node.topic?.name ?? node.topic_id} (Week ${node.week})` },
            position: { x: Number(node.x), y: Number(node.y) },
            type: 'default',
          }))
        );
      }

      if (edgeData && nodeData) {
        // Build a map from DB node id to topic_id
        const dbIdToTopicId: { [dbId: string]: string } = {};
        nodeData.forEach((node: any) => {
          dbIdToTopicId[node.id] = node.topic_id;
        });

        setEdges(
          edgeData.map((edge: any) => ({
            id: edge.id,
            source: `node-${dbIdToTopicId[edge.source_node_id]}`,
            target: `node-${dbIdToTopicId[edge.target_node_id]}`,
          }))
        );
      }
    }

    fetchFlow();
  }, [classId]);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, type: 'default' }, eds)),
    []
  );

  return (
    <div className="w-full h-[500px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
