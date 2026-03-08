import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { SchemaField } from '../../store/schemaStore';

interface EntityNodeData {
  label: string;
  fields: SchemaField[];
  onAddField?: () => void;
  onDeleteField?: (fieldId: string) => void;
  onFieldChange?: (fieldId: string, updates: Partial<SchemaField>) => void;
}

function EntityNodeComponent({ data }: NodeProps<EntityNodeData>) {
  const getFieldTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      string: 'str',
      number: 'num',
      boolean: 'bool',
      email: 'email',
      date: 'date',
      uuid: 'uuid',
      url: 'url',
      phone: 'phone',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-md min-w-[200px] select-none" style={{ backgroundColor: '#fff', color: '#000' }}>
      {/* Header with drag handle */}
      <div
        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold cursor-grab active:cursor-grabbing select-none flex items-center gap-2"
        style={{ background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: '#fff' }}
      >
        {data.label || 'Entity'}
      </div>

      {/* Fields */}
      <div className="p-2" style={{ color: '#374151' }}>
        {data.fields && data.fields.length > 0 ? (
          <div className="space-y-1">
            {data.fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between text-sm p-1 hover:bg-gray-50 rounded cursor-default"
                style={{ color: '#1f2937' }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: '#374151' }}>{field.name}</span>
                  <span className="text-xs" style={{ color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }}>
                    {getFieldTypeName(field.type)}
                  </span>
                  {field.required && (
                    <span style={{ color: '#ef4444', fontSize: '10px' }}>*</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onDeleteField?.(field.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-red-500 text-xs px-1"
                  style={{ color: '#9ca3af' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm text-center py-2 cursor-default" style={{ color: '#9ca3af' }}>
            Нет полей
          </div>
        )}

        {/* Add Field Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddField?.();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full mt-2 text-xs py-1 rounded transition-colors cursor-pointer"
          style={{ color: '#1d4ed8', backgroundColor: '#eff6ff' }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dbeafe';
            e.currentTarget.style.color = '#1e40af';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#eff6ff';
            e.currentTarget.style.color = '#1d4ed8';
          }}
        >
          + Добавить поле
        </button>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-3 !h-3"
        style={{ backgroundColor: '#9ca3af', width: '12px', height: '12px' }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-3 !h-3"
        style={{ backgroundColor: '#9ca3af', width: '12px', height: '12px' }}
      />
    </div>
  );
}

export const EntityNode = memo(EntityNodeComponent);
