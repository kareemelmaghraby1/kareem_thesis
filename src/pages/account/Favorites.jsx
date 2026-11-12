import React from 'react';
import { Link, Redirect } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { HOME_PAGE } from '../../constants/Config';
import MovieCard from '../../components/movie-card/MovieCard';
import './favorites.scss';

export default function Favorites() {
  const { user, loading } = useAuth();
  if (loading) return <main className="favorites-page container"><p role="status">Loading…</p></main>;
  if (!user) return <Redirect to={`/${HOME_PAGE}/login`} />;
  const favorites = user.favorites || [];
  return (
    <main className="favorites-page container">
      <h1>My favourites</h1>
      <p>Movies and TV shows you saved. Click ♥ Saved to remove one.</p>
      {favorites.length === 0 ? (
        <p>No favourites yet. <Link to={`/${HOME_PAGE}/movie`}>Browse movies</Link> or <Link to={`/${HOME_PAGE}/tv`}>TV shows</Link> and click ♡ Favourite.</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((favorite) => <MovieCard key={`${favorite.category}/${favorite.tmdbId}`}
            category={favorite.category}
            item={{ id: favorite.tmdbId, title: favorite.title, poster_path: favorite.posterPath }} />)}
        </div>
      )}
    </main>
  );
}
