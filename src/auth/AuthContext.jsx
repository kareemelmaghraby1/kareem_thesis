import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export async function accountRequest(path, method = 'GET', body) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'movie-app' },
      ...(body && { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Cannot reach the account service. Please try again.');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    accountRequest('/auth/me').then(setUser).catch((error) => {
      if (error.status !== 401) setError(error.message);
    }).finally(() => setLoading(false));
  }, []);

  const authenticate = async (mode, values) => {
    const user = await accountRequest(`/auth/${mode}`, 'POST', values);
    setUser(user);
    setError('');
  };
  const savePreferences = async (values) => {
    try {
      setUser(await accountRequest('/preferences', 'PUT', values));
    } catch (error) {
      if (error.status === 401) setUser(null);
      throw error;
    }
  };
  const logout = async () => {
    await accountRequest('/auth/logout', 'POST');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, error, authenticate, savePreferences, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
