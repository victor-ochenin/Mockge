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
    <div className="bg-white border border-gray-300 rounded-lg shadow-md min-w-[200px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-t-lg font-semibold">
        {data.label || 'Entity'}
      </div>

      {/* Fields */}
      <div className="p-2">
        {data.fields && data.fields.length > 0 ? (
          <div className="space-y-1">
            {data.fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between text-sm p-1 hover:bg-gray-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{field.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                    {getFieldTypeName(field.type)}
                  </span>
                  {field.required && (
                    <span className="text-red-500 text-xs">*</span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onDeleteField?.(field.id);
                  }}
                  className="text-gray-400 hover:text-red-500 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400 text-sm text-center py-2">
            Нет полей
          </div>
        )}

        {/* Add Field Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddField?.();
          }}
          className="w-full mt-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 py-1 rounded transition-colors"
        >
          + Добавить поле
        </button>
      </div>

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-3 !h-3"
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-3 !h-3"
      />
    </div>
  );
}

export const EntityNode = memo(EntityNodeComponent);
