import { useCallback } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  type Connection,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  type NodeTypes,
  applyNodeChanges,
  applyEdgeChanges,
  type OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { SchemaField } from '../../store/schemaStore';
import { useSchemaStore } from '../../store/schemaStore';
import { EntityNode } from './EntityNode';
import { Toolbar } from './Toolbar';
import { PropertiesPanel } from './PropertiesPanel';

const nodeTypes: NodeTypes = {
  entityNode: EntityNode,
};

export function Editor() {
  const {
    nodes,
    edges,
    addEdge,
    deleteEdge,
    setSelectedNode,
    addFieldToNode,
    updateFieldInNode,
    deleteFieldFromNode,
  } = useSchemaStore();

  const onNodesChange = useCallback(
    (changes: any[]) => {
      // Применяем изменения позиций через applyNodeChanges
      const newNodes = applyNodeChanges(changes, nodes);
      
      // Обновляем store с новыми позициями
      useSchemaStore.getState().setNodes(newNodes);

      // Также обновляем позиции через updateNode для консистивности
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          useSchemaStore.getState().updateNode(change.id, {
            position: change.position,
          });
        }
      });
    },
    [nodes]
  );

  const onEdgesChange = useCallback(
    (changes: any[]) => {
      applyEdgeChanges(changes, edges);
      changes.forEach((change) => {
        if (change.type === 'remove') {
          const edgeId = edges.find((e) => e.id === change.id)?.id;
          if (edgeId) {
            deleteEdge(edgeId);
          }
        }
      });
    },
    [edges, deleteEdge]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      const edge = {
        ...connection,
        id: `edge_${connection.source}_${connection.target}`,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      } as Edge;
      addEdge(edge);
    },
    [addEdge]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // Сбрасываем выделение других узлов при начале перетаскивания
      // Это гарантирует, что перетаскивается только один узел
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      // Разрешаем выделение только одного узла
      if (selectedNodes && selectedNodes.length > 0) {
        setSelectedNode(selectedNodes[0].id);
      } else {
        setSelectedNode(null);
      }
    },
    [setSelectedNode]
  );

  // Обработчики для EntityNode
  const handleAddField = useCallback(
    (nodeId: string) => {
      const newField: SchemaField = {
        id: `field_${Date.now()}`,
        name: 'newField',
        type: 'string',
        required: false,
        generated: false,
      };
      addFieldToNode(nodeId, newField);
    },
    [addFieldToNode]
  );

  const handleDeleteField = useCallback(
    (nodeId: string, fieldId: string) => {
      deleteFieldFromNode(nodeId, fieldId);
    },
    [deleteFieldFromNode]
  );

  const handleFieldChange = useCallback(
    (nodeId: string, fieldId: string, updates: Partial<SchemaField>) => {
      updateFieldInNode(nodeId, fieldId, updates);
    },
    [updateFieldInNode]
  );

  // Добавляем обработчики в данные узлов
  const nodesWithHandlers = nodes.map((node) => ({
    ...node,
    draggable: true,
    data: {
      ...node.data,
      onAddField: () => handleAddField(node.id),
      onDeleteField: (fieldId: string) => handleDeleteField(node.id, fieldId),
      onFieldChange: (fieldId: string, updates: Partial<SchemaField>) =>
        handleFieldChange(node.id, fieldId, updates),
    },
  }));

  return (
    <div className="flex h-screen">
      {/* Toolbar */}
      <Toolbar />

      {/* React Flow Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodesWithHandlers}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStart={onNodeDragStart}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          minZoom={0.5}
          maxZoom={2}
          deleteKeyCode={['Backspace', 'Delete']}
          selectNodesOnDrag={true}
          multiSelectionKeyCode={null}
          nodesDraggable={true}
        >
          <Controls />
          <MiniMap
            nodeStrokeColor={(n) => {
              if (n.type === 'entityNode') return '#3b82f6';
              return '#6366f1';
            }}
            nodeColor={(n) => {
              if (n.type === 'entityNode') return '#eff6ff';
              return '#f3f4f6';
            }}
            className="bg-white border border-gray-200"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e7eb" />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
