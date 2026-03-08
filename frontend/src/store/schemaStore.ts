import type { Node, Edge } from 'reactflow';
import { create } from 'zustand';

export interface SchemaField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  generated: boolean;
  faker?: string;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface SchemaEntity {
  id: string;
  name: string;
  fields: SchemaField[];
}

export interface SchemaState {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, data: Record<string, unknown>) => void;
  deleteNode: (nodeId: string) => void;
  addEdge: (edge: Edge) => void;
  deleteEdge: (edgeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  addFieldToNode: (nodeId: string, field: SchemaField) => void;
  updateFieldInNode: (nodeId: string, fieldId: string, updates: Partial<SchemaField>) => void;
  deleteFieldFromNode: (nodeId: string, fieldId: string) => void;
  getSchemaJson: () => Record<string, unknown>;
  reset: () => void;
  // Методы для загрузки схемы из базы
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

const initialNodeData = {
  label: '',
  fields: [] as SchemaField[],
};

export const useSchemaStore = create<SchemaState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  addNode: (node: Node) => {
    set((state) => ({
      nodes: [...state.nodes, { ...node, data: { ...initialNodeData, ...node.data } }],
    }));
  },

  updateNode: (nodeId: string, data: Record<string, unknown>) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          // Проверяем, есть ли position в данных для обновления
          const updates = { ...data };
          const position = updates.position as { x: number; y: number } | undefined;
          
          // Если есть position, обновляем его на верхнем уровне
          if (position) {
            delete updates.position;
            return {
              ...node,
              position,
              data: { ...node.data, ...updates },
            };
          }
          
          // Иначе обновляем только data
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      }),
    }));
  },

  deleteNode: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
    }));
  },

  addEdge: (edge: Edge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }));
  },

  deleteEdge: (edgeId: string) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },

  addFieldToNode: (nodeId: string, field: SchemaField) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: [...(node.data.fields || []), field],
              },
            }
          : node
      ),
    }));
  },

  updateFieldInNode: (nodeId: string, fieldId: string, updates: Partial<SchemaField>) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: (node.data.fields || []).map((field: SchemaField) =>
                  field.id === fieldId ? { ...field, ...updates } : field
                ),
              },
            }
          : node
      ),
    }));
  },

  deleteFieldFromNode: (nodeId: string, fieldId: string) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: (node.data.fields || []).filter(
                  (field: SchemaField) => field.id !== fieldId
                ),
              },
            }
          : node
      ),
    }));
  },

  getSchemaJson: () => {
    const { nodes, edges } = get();
    
    const entities = nodes.map((node) => ({
      id: node.id,
      name: node.data.label || 'Unknown',
      fields: node.data.fields || [],
      position: node.position,
    }));

    const relations = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      type: edge.sourceHandle === 'many' ? 'manyToOne' : 'oneToMany',
    }));

    return {
      entities,
      relations,
      settings: {
        defaultLatency: 100,
        errorRate: 0.05,
        stateful: true,
      },
    };
  },

  reset: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
  },

  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },

  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
}));
