import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { storeAuthData, clearAuthData, getStoredToken } from '@/services/authService';
import { apiClient } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = getStoredToken();
        const nifoToken = localStorage.getItem('jwtAccessToken');
        const candidateTokens = [
          ...(token ? [token] : []),
          ...(nifoToken && nifoToken !== token ? [nifoToken] : []),
        ];

        for (const candidate of candidateTokens) {
          const response = await apiClient.get('/auth/me', {
            headers: {
              Authorization: `Bearer ${candidate}`,
            },
          });

          const normalizedUser = {
            ...response.data.user,
            createdAt: response.data.user.createdAt ?? response.data.user.created_at ?? '',
          };
          storeAuthData({
            user: normalizedUser,
            token: response.data.token || candidate,
          });
          setUser(normalizedUser);
          return;
        }

        clearAuthData();
      } catch {
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
