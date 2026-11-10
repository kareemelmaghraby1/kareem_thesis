import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { HOME_PAGE } from '../../constants/Config';
import './account.scss';

const genres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Science Fiction', 'Thriller'];

export default function Account() {
  const { user, loading, savePreferences, logout } = useAuth();
  const [favoriteGenre, setFavoriteGenre] = useState('');
  const [favoriteMovie, setFavoriteMovie] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setFavoriteGenre(user.preferences?.favoriteGenre || '');
      setFavoriteMovie(user.preferences?.favoriteMovie || '');
    }
  }, [user]);

  if (loading) return <main className="account-page"><p role="status">Loading…</p></main>;
  if (!user) return <Redirect to={`/${HOME_PAGE}/login`} />;

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError(''); setSaved(false);
    try { await savePreferences({ favoriteGenre, favoriteMovie }); setSaved(true); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true); setError(''); setSaved(false);
    try { await logout(); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  return (
    <main className="account-page">
      <section className="account-card" aria-labelledby="account-title">
        <p className="account-eyebrow">YOUR MOVIE SPACE</p>
        <h1 id="account-title">My preferences</h1>
        <p className="account-description">Signed in as {user.email}</p>
        <form onSubmit={submit} onChange={() => setSaved(false)}>
          <label htmlFor="genre">Preferred genre</label>
          <select id="genre" value={favoriteGenre} onChange={(e) => setFavoriteGenre(e.target.value)}>
            <option value="">No preference</option>
            {genres.map((genre) => <option key={genre}>{genre}</option>)}
          </select>
          <label htmlFor="favorite-movie">Favorite movie</label>
          <input id="favorite-movie" value={favoriteMovie} maxLength={200} placeholder="e.g. Interstellar" onChange={(e) => setFavoriteMovie(e.target.value)} />
          {error && <p className="account-error" role="alert">{error}</p>}
          {saved && <p className="account-success" role="status">Preferences saved.</p>}
          <button className="account-primary" disabled={busy} type="submit">{busy ? 'Please wait…' : 'Save preferences'}</button>
        </form>
        <button className="account-link" type="button" disabled={busy} onClick={signOut}>Log out</button>
      </section>
    </main>
  );
}
