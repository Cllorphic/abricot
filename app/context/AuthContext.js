'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:8000';

// ──── Helpers cookies ────

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));
  return cookie ? cookie.split('=')[1] : null;
}

function setCookie(name, value, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; path=/; expires=${expires}; SameSite=Strict`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// ──── Provider ────

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  // Récupérer le profil
  const fetchProfile = useCallback(async (token) => {
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data?.user || data.data);      } else {
        deleteCookie('token');
        setUser(null);
      }
    } catch (err) {
      console.error('Erreur profil:', err);
      deleteCookie('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Au chargement
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const token = getCookie('token');
    if (token) {
      fetchProfile(token);
    } else {
      setLoading(false);
    }
  }, [fetchProfile]);

  // Déconnexion (stabilisée avec useCallback)
  const logout = useCallback(() => {
    deleteCookie('token');
    setUser(null);
    router.push('/login');
  }, [router]);

  // Connexion
  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Erreur de connexion');
    const token = data.data?.token || data.token;
    setCookie('token', token);
    await fetchProfile(token);
    return data;
  }

  // Inscription
  async function register(email, password, name) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erreur lors de l'inscription");
    const token = data.data?.token || data.token;
    setCookie('token', token);
    await fetchProfile(token);
    return data;
  }

  // Requêtes authentifiées (stabilisée avec useCallback)
  const authFetch = useCallback(async (url, options = {}) => {
    const token = getCookie('token');
    if (!token) {
      logout();
      throw new Error('Non authentifié');
    }
    const res = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (res.status === 401) {
      logout();
      throw new Error('Session expirée');
    }
    return res;
  }, [logout]);

  const value = { user, loading, login, register, logout, authFetch };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
}