import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '../components/editor/Editor';
import { useSchemaStore } from '../store/schemaStore';
import { schemaApi } from '../api/schema';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSchemaJson, reset } = useSchemaStore();
  const [isSaving, setIsSaving] = useState(false);
  const [schemaName, setSchemaName] = useState('Schema v1');

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const schemaJson = getSchemaJson();
      await schemaApi.createSchema(id, {
        name: schemaName,
        schemaJson,
      });
      alert('Схема сохранена успешно!');
    } catch (error) {
      console.error('Ошибка сохранения схемы:', error);
      alert('Ошибка при сохранении схемы');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (!id) return;

    try {
      // Сначала сохраняем схему
      const schemaJson = getSchemaJson();
      const response = await schemaApi.createSchema(id, {
        name: schemaName,
        schemaJson,
      });

      // Затем деплоим
      await schemaApi.deploySchema(response.id);
      alert('Мок-сервер успешно задеплоен!');
    } catch (error) {
      console.error('Ошибка деплоя:', error);
      alert('Ошибка при деплое мок-сервера');
    }
  };

  const handleReset = () => {
    if (confirm('Вы уверены, что хотите очистить холст?')) {
      reset();
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Назад
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            Визуальный редактор
          </h1>
          <input
            type="text"
            value={schemaName}
            onChange={(e) => setSchemaName(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Очистить
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить схему'}
          </button>
          <button
            onClick={handleDeploy}
            className="px-4 py-2 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
          >
            🚀 Деплой
          </button>
        </div>
      </header>

      {/* Editor Canvas */}
      <div className="flex-1 overflow-hidden">
        <Editor />
      </div>
    </div>
  );
}
