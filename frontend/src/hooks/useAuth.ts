import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

export function useAuth() {
  const { user, isLoaded } = useUser();
  const { getToken, signOut, isSignedIn } = useClerkAuth();

  const logout = async () => {
    await signOut();
  };

  const getTokenAsync = async (): Promise<string | null> => {
    if (!user) return null;
    return getToken({ template: 'mockge-backend' });
  };

  return {
    user,
    isLoading: !isLoaded,
    isLoaded,
    isSignedIn,
    logout,
    getToken: getTokenAsync,
  };
}
