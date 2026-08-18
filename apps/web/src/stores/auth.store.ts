import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUser } from '@medlink/shared';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { setAccessToken } from '../lib/axios';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  authReady: boolean;
  setAuth: (user: IUser, accessToken: string) => void;
  setAuthReady: (ready: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      authReady: false,
      setAuth: (user, accessToken) => {
        setAccessToken(accessToken);
        connectSocket(accessToken);
        set({ user, accessToken, isAuthenticated: true, authReady: true });
      },
      setAuthReady: (ready) => set({ authReady: ready }),
      clearAuth: () => {
        setAccessToken(null);
        disconnectSocket();
        set({ user: null, accessToken: null, isAuthenticated: false, authReady: true });
      },
    }),
    {
      name: 'medlink-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
