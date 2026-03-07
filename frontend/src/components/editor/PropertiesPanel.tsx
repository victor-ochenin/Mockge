import type { SchemaField } from '../../store/schemaStore';
import { useSchemaStore } from '../../store/schemaStore';

const fieldTypes = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'uuid', label: 'UUID' },
  { value: 'url', label: 'URL' },
  { value: 'phone', label: 'Phone' },
];

const fakerPresets: Record<string, string[]> = {
  string: ['person.fullName', 'person.firstName', 'person.lastName', 'company.name', 'lorem.word'],
  number: ['number.int', 'finance.amount', 'commerce.price'],
  email: ['internet.email'],
  date: ['date.past', 'date.future', 'date.recent'],
  url: ['internet.url'],
  phone: ['phone.number'],
  uuid: [],
  boolean: [],
};

export function PropertiesPanel() {
  const { selectedNodeId, nodes, addFieldToNode, updateFieldInNode, deleteFieldFromNode } = useSchemaStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNodeId || !selectedNode) {
    return (
      <div className="bg-white border-l border-gray-200 p-4 w-72">
        <h3 className="font-semibold text-gray-700 mb-4">Свойства</h3>
        <p className="text-gray-400 text-sm text-center py-8">
          Выберите узел для редактирования
        </p>
      </div>
    );
  }

  const handleAddField = () => {
    const newField: SchemaField = {
      id: `field_${Date.now()}`,
      name: 'newField',
      type: 'string',
      required: false,
      generated: false,
    };
    addFieldToNode(selectedNodeId, newField);
  };

  const handleFieldChange = (fieldId: string, updates: Partial<SchemaField>) => {
    updateFieldInNode(selectedNodeId, fieldId, updates);
  };

  return (
    <div className="bg-white border-l border-gray-200 p-4 w-72 overflow-y-auto">
      <h3 className="font-semibold text-gray-700 mb-4">Свойства</h3>

      {/* Entity Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-1">
          Название сущности
        </label>
        <input
          type="text"
          value={selectedNode.data.label || ''}
          onChange={(e) => {
            useSchemaStore.getState().updateNode(selectedNodeId, {
              label: e.target.value,
            });
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Fields Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-600">
            Поля
          </label>
          <button
            onClick={handleAddField}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Добавить
          </button>
        </div>

        <div className="space-y-3">
          {selectedNode.data.fields?.map((field: SchemaField) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              {/* Field Name */}
              <div className="mb-2">
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) =>
                    handleFieldChange(field.id, { name: e.target.value })
                  }
                  placeholder="Название поля"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Field Type */}
              <div className="mb-2">
                <select
                  value={field.type}
                  onChange={(e) =>
                    handleFieldChange(field.id, { type: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fieldTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Options */}
              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      handleFieldChange(field.id, { required: e.target.checked })
                    }
                    className="rounded"
                  />
                  Обязательное
                </label>
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={field.generated}
                    onChange={(e) =>
                      handleFieldChange(field.id, { generated: e.target.checked })
                    }
                    className="rounded"
                  />
                  Автогенерация
                </label>
              </div>

              {/* Faker Preset */}
              {field.generated && fakerPresets[field.type]?.length > 0 && (
                <div className="mb-2">
                  <select
                    value={field.faker || ''}
                    onChange={(e) =>
                      handleFieldChange(field.id, { faker: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите Faker...</option>
                    {fakerPresets[field.type].map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Min/Max for numbers */}
              {field.type === 'number' && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    value={field.min || ''}
                    onChange={(e) =>
                      handleFieldChange(field.id, {
                        min: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Min"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={field.max || ''}
                    onChange={(e) =>
                      handleFieldChange(field.id, {
                        max: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Max"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Delete Field */}
              <button
                onClick={() => deleteFieldFromNode(selectedNodeId, field.id)}
                className="w-full text-xs text-red-600 hover:text-red-800 hover:bg-red-50 py-1 rounded transition-colors"
              >
                Удалить поле
              </button>
            </div>
          ))}

          {(!selectedNode.data.fields || selectedNode.data.fields.length === 0) && (
            <p className="text-gray-400 text-xs text-center py-4">
              Нет полей. Нажмите "+ Добавить"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
