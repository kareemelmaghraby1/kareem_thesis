import React, { useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { HOME_PAGE } from '../../constants/Config';
import './account.scss';

export default function Login() {
  const { user, loading, error: serviceError, authenticate } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <main className="account-page"><p role="status">Loading…</p></main>;
  if (user) return <Redirect to={`/${HOME_PAGE}/account`} />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try { await authenticate(mode, { email, password }); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="account-title">
        <p className="account-eyebrow">YOUR MOVIE SPACE</p>
        <h1 id="account-title">{mode === 'login' ? 'Welcome back' : 'Create an account'}</h1>
        <p className="account-description">Save your preferences and keep your favorite movie close.</p>
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8} maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-help" />
          <small id="password-help">At least 8 characters. Maximum 72 bytes.</small>
          {(error || serviceError) && <p className="account-error" role="alert">{error || serviceError}</p>}
          <button className="account-primary" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
        </form>
        <button className="account-link" type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setPassword(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  );
}
