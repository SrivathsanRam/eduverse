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

interface Topic {
  id: number;
  name: string;
  description: string;
  subject_id: number;
  week: number;
}

interface TopicFlowBoardProps {
  topics: Topic[];
}

let nodeIdCounter = 1;
let weekNumberCounter = 0;

export default function TopicFlowBoard({ topics }: TopicFlowBoardProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

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

  useEffect(() => {
    console.log(nodes);
    console.log(edges);
  }, [nodes, edges]);


  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );


  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}

        fitView
      //draggable={true}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
