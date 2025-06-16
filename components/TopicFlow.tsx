'use client'

import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'

const initialNodes = [
  { id: '1', data: { label: 'Topic A' }, position: { x: 50, y: 50 } },
  { id: '2', data: { label: 'Topic B' }, position: { x: 250, y: 150 } },
]

export default function TopicFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const onConnect = (connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds))
  }

  return (
    <div className="h-[500px] border mt-4 rounded">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
