import type { SchemaField } from '../../store/schemaStore';
import { useSchemaStore } from '../../store/schemaStore';
import { useState } from 'react';

export function Toolbar() {
  const { addNode } = useSchemaStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');

  const entityTypes = [
    { name: 'User', icon: '👤' },
    { name: 'Product', icon: '📦' },
    { name: 'Order', icon: '🛒' },
    { name: 'Category', icon: '📁' },
    { name: 'Custom', icon: '⚙️' },
  ];

  const handleAddEntity = (type: string) => {
    const id = `entity_${Date.now()}`;
    const newNode = {
      id,
      type: 'entityNode',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 50 },
      data: {
        label: type,
        fields: [] as SchemaField[],
      },
    };
    addNode(newNode);
  };

  const handleCustomEntity = () => {
    if (newEntityName.trim()) {
      const id = `entity_${Date.now()}`;
      const newNode = {
        id,
        type: 'entityNode',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 50 },
        data: {
          label: newEntityName.trim(),
          fields: [] as SchemaField[],
        },
      };
      addNode(newNode);
      setNewEntityName('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-white border-r border-gray-200 p-4 w-48 flex flex-col gap-3">
      <h3 className="font-semibold text-gray-700 mb-2">Палитра</h3>
      
      {entityTypes.map((type) => (
        <button
          key={type.name}
          onClick={() => handleAddEntity(type.name)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-left"
        >
          <span className="text-xl">{type.icon}</span>
          <span className="text-sm text-gray-700">{type.name}</span>
        </button>
      ))}

      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-left mt-2"
      >
        <span className="text-xl">⚡</span>
        <span className="text-sm text-gray-700">Своя...</span>
      </button>

      {/* Modal for custom entity */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h4 className="font-semibold text-lg mb-4">Новая сущность</h4>
            <input
              type="text"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              placeholder="Название сущности"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCustomEntity()}
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewEntityName('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCustomEntity}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
