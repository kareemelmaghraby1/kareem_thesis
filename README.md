# kareem_thesis
React movie web application developed for my thesis

## Run locally

Requires Node.js 20+ and MongoDB (local or MongoDB Atlas).

1. Run `npm install`.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` to your MongoDB connection string.
3. Generate a session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put it in `SESSION_SECRET` in `.env`. Keep `.env` private.
4. Start MongoDB if using a local database.
5. Run `npm run server` in one terminal and `npm start` in another.
6. Open `http://localhost:3000/react-movie-app/login`.

Choose **Create an account**, enter your email and password, then save your preferred genre and favorite movie on **My account**. Preferences are stored per user and reload after logging in again. An empty movie title clears the favorite; **No preference** clears the genre. Browsing movies does not require an account.

## Favourites

Click **♡ Favourite** below any movie or TV card, or on its detail page. Log in first if prompted, then click the button again. Open **My favourites** in the navigation to see your list; click **♥ Saved** to remove a title. Each account has its own list, saved across logins. In MongoDB Compass, open `kareem_movies` → `users` and expand `favorites` to see the saved titles. Existing accounts work without a migration.

API routes: `PUT /api/favorites/:category/:id` (body: `title`, `posterPath`) and `DELETE /api/favorites/:category/:id`. Category is `movie` or `tv`; ID is the TMDB title ID. The list is included in `/api/auth/me`.

## How it works

The React app calls a small Express API using a session cookie. MongoDB stores users (email, bcrypt password hash, preferences) and sessions. Password hashes never leave the server. The API validates input, limits login attempts, and requires a custom header on writes to prevent cross-origin form submissions. Sessions expire after seven days and are destroyed on logout.

API routes: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`, `PUT /api/preferences`.

## Checks

Run `npm run test:server` for integration tests against a temporary real MongoDB instance, including account isolation and persistence across sessions. The first test run downloads a MongoDB test binary. Run `npm run build` to build React.

## Production

Run `npm run build`, then `NODE_ENV=production npm run server`. The server serves the app at `/react-movie-app` and the API at `/api` on the same origin. Put it behind an HTTPS reverse proxy with one trusted proxy hop; production session cookies require HTTPS. Set `MONGODB_URI`, a random `SESSION_SECRET`, and optionally `PORT` through your host's private environment settings.

GitHub Pages can only serve static files and cannot run the MongoDB API. Host the Node server on a service that supports Node.js and can reach your MongoDB database.
