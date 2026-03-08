import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '../components/editor/Editor';
import { useSchemaStore } from '../store/schemaStore';
import { schemaApi } from '../api/schema';
import { useAuth } from '../hooks/useAuth';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSchemaJson, setNodes, setEdges, reset } = useSchemaStore();
  const { getToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [schemaName, setSchemaName] = useState('Schema v1');
  const [isLoading, setIsLoading] = useState(true);

  // Загрузка схемы при монтировании
  useEffect(() => {
    const loadSchema = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          console.error('[EditorPage] Failed to get auth token');
          setIsLoading(false);
          return;
        }

        // Пытаемся загрузить активную схему
        const activeSchema = await schemaApi.getActiveSchema(id, token);
        
        if (activeSchema?.schemaJson) {
          console.log('[EditorPage] Loaded active schema:', activeSchema);
          const { entities, relations } = activeSchema.schemaJson as { entities: unknown[], relations: unknown[] };
          
          // Восстанавливаем ноды из entities
          const nodes = (entities || []).map((entity: any) => ({
            id: entity.id || `node-${Date.now()}-${Math.random()}`,
            type: 'entityNode',
            position: entity.position || { x: 0, y: 0 },
            data: {
              label: entity.name || 'Entity',
              fields: Array.isArray(entity.fields) ? entity.fields : [],
            },
          }));

          // Восстанавливаем связи из relations
          const edges = (relations || []).map((relation: any, index: number) => ({
            id: `edge-${index}`,
            source: relation.source,
            target: relation.target,
            sourceHandle: relation.type === 'manyToMany' || relation.type === 'oneToMany' ? 'many' : 'one',
            targetHandle: relation.type === 'manyToOne' || relation.type === 'manyToMany' ? 'many' : 'one',
          }));

          setNodes(nodes);
          setEdges(edges);
          setSchemaName(activeSchema.name || 'Schema v1');
        } else {
          // Активная схема не найдена — начинаем с пустого редактора
          console.log('[EditorPage] No active schema found, starting with empty editor');
        }
      } catch (error: any) {
        // Игнорируем 404 — это нормально, когда нет активной схемы
        if (error?.response?.status !== 404) {
          console.error('[EditorPage] Error loading schema:', error);
        } else {
          console.log('[EditorPage] No active schema found (404)');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSchema();
  }, [id]); // Убрали getToken, setNodes, setEdges из зависимостей

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        alert('Ошибка авторизации: токен не получен');
        setIsSaving(false);
        return;
      }
      const schemaJson = getSchemaJson();
      console.log('[EditorPage] Saving schema:', {
        projectId: id,
        name: schemaName,
        schemaJson,
      });
      const savedSchema = await schemaApi.createSchema(id, {
        name: schemaName,
        schemaJson,
      }, token);
      // Активируем схему после сохранения
      await schemaApi.activateSchema(savedSchema.id, token);
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
      const token = await getToken();
      if (!token) {
        alert('Ошибка авторизации: токен не получен');
        return;
      }
      // Сначала сохраняем схему
      const schemaJson = getSchemaJson();
      const savedSchema = await schemaApi.createSchema(id, {
        name: schemaName,
        schemaJson,
      }, token);

      // Активируем схему
      await schemaApi.activateSchema(savedSchema.id, token);

      // Затем деплоим
      await schemaApi.deploySchema(savedSchema.id, token);
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

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
