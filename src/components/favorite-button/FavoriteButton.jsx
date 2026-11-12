import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { HOME_PAGE } from '../../constants/Config';
import './favorite-button.scss';

export default function FavoriteButton({ category, item }) {
  const { user, loading, saveFavorite } = useAuth();
  const history = useHistory();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saved = (user?.favorites || []).some((favorite) => favorite.category === category && favorite.tmdbId === Number(item.id));

  const toggle = async () => {
    if (!user) {
      history.push(`/${HOME_PAGE}/login`);
      return;
    }
    setBusy(true);
    setError('');
    try { await saveFavorite(category, item, saved); }
    catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="favorite-action">
      <button className="favorite-button" type="button" aria-pressed={saved}
        aria-label={`${saved ? 'Remove from' : 'Add to'} favourites: ${item.title || item.name}`}
        disabled={loading || busy} onClick={toggle}>
        {busy ? 'Saving…' : saved ? '♥ Saved' : '♡ Favourite'}
      </button>
      {error && <p className="favorite-error" role="alert">{error}</p>}
    </div>
  );
}
