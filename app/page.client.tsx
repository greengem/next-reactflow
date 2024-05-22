'use client';
import { useEffect, useCallback } from 'react';
import ReactFlow, { useNodesState, useEdgesState, addEdge, Controls, Connection, Node, Edge, NodeTypes, OnConnect, Background, BackgroundVariant, Panel } from 'reactflow';
import 'reactflow/dist/base.css';
import { v4 as uuidv4 } from 'uuid';
import MessageNode from '@/components/nodes/MessageNode';
import StartNode from '@/components/nodes/StartNode';
import CharactersNode from '@/components/nodes/CharactersNode';
import ConditionNode from '@/components/nodes/ConditionNode';
import RandomNode from '@/components/nodes/RandomNode';
import Sidebar from '@/components/Sidebar';
import { Button } from '@radix-ui/themes';
import { handleSaveFlow, handleDeleteFlow } from '@/server-actions/flow-actions';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';

const nodeTypes: NodeTypes = {
  start: StartNode,
  message: MessageNode,
  characters: CharactersNode,
  condition: ConditionNode,
  random: RandomNode,
};

const getDefaultNodeData = (type: string) => {
  switch (type) {
    case 'characters':
      return { characters: ['Player', 'Narrator'] };
    case 'message':
      return { character: 'Player', message: '', choices: [] };
    case 'condition':
      return { condition: '', outputs: ['true', 'false'] };
    case 'random':
      return { outputs: Array.from({ length: 2 }, (_, i) => `Output ${i + 1}`) };
    default:
      return {};
  }
};

interface PageClientProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  isMockData: boolean;
}

export default function PageClient({ initialNodes, initialEdges, isMockData }: PageClientProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(initialNodes);
  const [edges, setEdges, onEdgesState] = useEdgesState<Edge[]>(initialEdges);

  // Update nodes and edges when initialNodes or initialEdges change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  // Callback to add an edge between nodes
  const onConnect: OnConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Callback to add a new node to the flow
  const addNode = useCallback((type: string) => {
    const newNode: Node = {
      id: uuidv4(),
      type: type,
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      data: getDefaultNodeData(type),
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  // Callback to delete the flow
  const deleteFlow = async () => {
    const confirmation = window.confirm('Are you sure you want to delete this flow? This action cannot be undone.');
    if (!confirmation) return;

    const response = await handleDeleteFlow('default-flow');
    if (response.success) {
      toast.success(response.message);
    } else {
      toast.error(response.message);
    }
  };

  return (
    <div className='flex grow'>
      <Sidebar addNode={addNode} deleteFlow={deleteFlow} />
      <main className='grow'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesState}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-zinc-900"
        >
          <Background color="#333" variant={BackgroundVariant.Dots} />
          <Controls />
          <Panel position='top-right'>
            <UserSaveActions nodes={nodes} edges={edges} isMockData={isMockData} />
          </Panel>
        </ReactFlow>
      </main>
    </div>
  );
}

interface UserSaveActionsProps {
  nodes: Node[];
  edges: Edge[];
  isMockData: boolean;
}

function UserSaveActions({ nodes, edges, isMockData }: UserSaveActionsProps) {
  const saveFlow = async () => {
    const response = await handleSaveFlow('default-flow', nodes, edges);
    if (response.success) {
      toast.success('Flow saved successfully');
    } else {
      toast.error('Failed to save flow');
    }
  };

  return (
    <div className='flex gap-3'>
      {isMockData ? (
        <Button color="gray" variant="surface" onClick={() => signIn()}>Sign In to Save</Button>
      ) : (
        <Button color="gray" variant="surface" onClick={saveFlow}>Save Flow</Button>
      )}
    </div>
  );
}
