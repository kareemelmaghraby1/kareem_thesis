const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { rateLimit } = require('express-rate-limit');
const path = require('node:path');

const genres = ['', 'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Science Fiction', 'Thriller'];
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  favorites: { type: [new mongoose.Schema({
    tmdbId: { type: Number, required: true },
    category: { type: String, enum: ['movie', 'tv'], required: true },
    title: { type: String, required: true, maxlength: 200 },
    posterPath: { type: String, default: '' },
  }, { _id: false })], default: [] },
  preferences: {
    favoriteGenre: { type: String, enum: genres, default: '' },
    favoriteMovie: { type: String, maxlength: 200, default: '' },
  },
});
const User = mongoose.model('User', userSchema);
const publicUser = (user) => ({ email: user.email, preferences: user.preferences, favorites: user.favorites || [] });

function createApp({ mongoUrl, sessionSecret, production = false }) {
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }
  const app = express();
  if (production) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    // Cross-origin forms cannot send this header; no CORS is enabled.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.get('X-Requested-With') !== 'movie-app') {
      return res.status(403).json({ message: 'Invalid request.' });
    }
    next();
  });
  app.use(express.json({ limit: '10kb' }));
  const store = MongoStore.create({ mongoUrl });
  store.on('error', () => console.error('MongoDB session storage error.'));
  app.use('/api', session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: { httpOnly: true, sameSite: 'lax', secure: production, maxAge: 7 * 24 * 60 * 60 * 1000 },
  }));
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false,
    message: { message: 'Too many attempts. Please try again in 15 minutes.' } });
  const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
  const signIn = (req, id) => new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) return reject(error);
      req.session.userId = String(id);
      req.session.save((saveError) => saveError ? reject(saveError) : resolve());
    });
  });
  const requireUser = route(async (req, res, next) => {
    const user = req.session.userId && await User.findById(req.session.userId);
    if (!user) return res.status(401).json({ message: 'Please log in.' });
    req.user = user;
    next();
  });
  function credentials(body) {
    const { email, password } = body || {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 ||
        typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) return null;
    return { email: email.trim().toLowerCase(), password };
  }
  app.post('/api/auth/register', authLimiter, route(async (req, res) => {
    const input = credentials(req.body);
    if (!input) return res.status(400).json({ message: 'Enter a valid email and a password of at least 8 characters (maximum 72 bytes).' });
    const user = await User.create({ email: input.email, passwordHash: await bcrypt.hash(input.password, 12) });
    await signIn(req, user._id);
    res.status(201).json(publicUser(user));
  }));
  app.post('/api/auth/login', authLimiter, route(async (req, res) => {
    const input = credentials(req.body);
    const user = input && await User.findOne({ email: input.email }).select('+passwordHash');
    if (!user || !await bcrypt.compare(input.password, user.passwordHash)) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    await signIn(req, user._id);
    res.json(publicUser(user));
  }));
  app.get('/api/auth/me', requireUser, (req, res) => res.json(publicUser(req.user)));
  app.put('/api/preferences', requireUser, route(async (req, res) => {
    const { favoriteGenre, favoriteMovie } = req.body || {};
    if (!genres.includes(favoriteGenre) || typeof favoriteMovie !== 'string' || favoriteMovie.trim().length > 200) {
      return res.status(400).json({ message: 'Choose a valid genre and a movie title up to 200 characters.' });
    }
    req.user.preferences = { favoriteGenre, favoriteMovie: favoriteMovie.trim() };
    await req.user.save();
    res.json(publicUser(req.user));
  }));
  const favoriteKey = (req, res, next) => {
    const { category, id } = req.params;
    if (!['movie', 'tv'].includes(category) || !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      return res.status(400).json({ message: 'Choose a valid movie or TV show.' });
    }
    req.favoriteKey = { category, tmdbId: Number(id) };
    next();
  };
  app.put('/api/favorites/:category/:id', requireUser, favoriteKey, route(async (req, res) => {
    const { title, posterPath = '' } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 ||
        typeof posterPath !== 'string' || (posterPath !== '' && !/^\/[a-zA-Z0-9_-]+\.(jpg|png|webp)$/.test(posterPath))) {
      return res.status(400).json({ message: 'Provide a valid title and poster path.' });
    }
    // Match and append atomically so repeated clicks cannot create duplicates.
    await User.updateOne({ _id: req.user._id, favorites: { $not: { $elemMatch: req.favoriteKey } } },
      { $push: { favorites: { ...req.favoriteKey, title: title.trim(), posterPath } } });
    res.json(publicUser(await User.findById(req.user._id)));
  }));
  app.delete('/api/favorites/:category/:id', requireUser, favoriteKey, route(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id,
      { $pull: { favorites: req.favoriteKey } }, { new: true });
    res.json(publicUser(user));
  }));
  app.post('/api/auth/logout', (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('connect.sid', { httpOnly: true, sameSite: 'lax', secure: production });
      res.json({ message: 'Logged out.' });
    });
  });
  app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint not found.' }));
  if (production) {
    app.use('/react-movie-app', express.static(path.join(__dirname, '../build')));
    app.get('/react-movie-app/*', (req, res) => res.sendFile(path.join(__dirname, '../build/index.html')));
    app.get('/', (req, res) => res.redirect('/react-movie-app'));
  }
  app.use((error, req, res, next) => {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request too large.' });
    console.error('Request failed:', error.name);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  });
  return { app, store };
}

module.exports = { createApp, User };
