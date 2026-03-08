import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    console.log('[LoginPage] isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);
    
    // Если пользователь уже вошёл, перенаправляем на dashboard
    if (isSignedIn) {
      console.log('[LoginPage] User already signed in, redirecting to /dashboard');
      navigate('/dashboard');
    }
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Загрузка...</div>
      </div>
    );
  }

  // Если уже вошёл, не показываем форму
  if (isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Вход в Mockge
        </h2>
        
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl="/dashboard"
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700',
              card: 'shadow-md',
              rootBox: 'w-full',
            },
          }}
        />
      </div>
    </div>
  );
}
