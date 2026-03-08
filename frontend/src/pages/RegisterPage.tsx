import { SignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    console.log('[RegisterPage] isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
    
    if (isSignedIn) {
      navigate('/dashboard');
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Загрузка Clerk...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Регистрация в Mockge
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Создайте аккаунт чтобы продолжить
          </p>
        </div>
        
        <SignUp
          routing="virtual"
          signInUrl="/login"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white',
              card: 'shadow-lg',
              rootBox: 'w-full',
              headerTitle: 'text-xl font-bold',
              headerSubtitle: 'text-sm text-gray-600',
              socialButtonsBlockButtonText: 'text-sm',
              formFieldLabel: 'text-sm font-medium text-gray-700',
              formFieldInput: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
              footerActionLink: 'text-blue-600 hover:underline',
            },
          }}
        />
      </div>
    </div>
  );
}
