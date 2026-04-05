import { createContext, useContext, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMe, logout, type User } from '@/lib/api';

interface AuthContext {
  user: User | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: Infinity,
  });

  const logoutMut = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(['me'], null);
      qc.removeQueries({ queryKey: ['jobs'] });
    },
  });

  return (
    <Ctx.Provider
      value={{
        user: data?.user ?? null,
        isLoading,
        logout: () => logoutMut.mutateAsync(),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
