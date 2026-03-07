import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { projectsApi } from '../api';
import type { Project } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, getToken, isLoaded } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectSubdomain, setNewProjectSubdomain] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  useEffect(() => {
    console.log('[DashboardPage] user:', user, 'isLoaded:', isLoaded);
    
    // Если пользователь не вошёл, перенаправляем на login
    if (isLoaded && !user) {
      console.log('[DashboardPage] User not signed in, redirecting to /login');
      navigate('/login');
    }
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    if (user && isLoaded) {
      loadProjects();
    }
  }, [user, isLoaded]);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setError('Не удалось получить токен авторизации');
        return;
      }
      const data = await projectsApi.getAll(token);
      setProjects(data);
    } catch {
      setError('Не удалось загрузить проекты');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();
    if (!token) {
      setError('Не удалось получить токен авторизации');
      return;
    }
    try {
      await projectsApi.create(token, newProjectName, newProjectSubdomain, newProjectDescription || undefined);
      setNewProjectName('');
      setNewProjectSubdomain('');
      setNewProjectDescription('');
      setShowCreateForm(false);
      loadProjects();
    } catch {
      setError('Не удалось создать проект');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить проект?')) return;
    const token = await getToken();
    if (!token) {
      setError('Не удалось получить токен авторизации');
      return;
    }
    try {
      await projectsApi.delete(token, id);
      loadProjects();
    } catch {
      setError('Не удалось удалить проект');
    }
  };

  // Показываем загрузку пока Clerk не загрузился
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Mockge Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</span>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Проекты</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
          >
            Создать проект
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Новый проект</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder="Название проекта"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">От 2 до 200 символов</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Поддомен
                  </label>
                  <input
                    type="text"
                    value={newProjectSubdomain}
                    onChange={(e) => setNewProjectSubdomain(e.target.value)}
                    required
                    minLength={3}
                    maxLength={63}
                    pattern="[a-z0-9][a-z0-9-]*[a-z0-9]|[a-z0-9]"
                    placeholder="myproject"
                    title="Только строчные латинские буквы, цифры и дефисы. Должен начинаться и заканчиваться буквой или цифрой"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">3-63 символов, латиница, цифры и дефисы</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание (необязательно)
                  </label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    maxLength={1000}
                    placeholder="Опишите ваш проект"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-gray-500">Максимум 1000 символов</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
                  >
                    Создать
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">У вас пока нет проектов. Создайте первый!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Удалить
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {project.subdomain}.mockge.local
                </p>
                {project.description && project.description.trim() !== '' && (
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                )}
                <div className="text-xs text-gray-400">
                  Создан: {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => navigate(`/projects/${project.id}/editor`)}
                    className="flex-1 bg-blue-500 text-white text-sm py-2 px-3 rounded hover:bg-blue-600 transition"
                  >
                    ✏️ Редактор
                  </button>
                  <a
                    href={`http://${project.subdomain}.mockge.local:3000`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-green-500 text-white text-sm py-2 px-3 rounded hover:bg-green-600 transition text-center"
                  >
                    🚀 Мок
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
