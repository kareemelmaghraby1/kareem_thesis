const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp, User } = require('./app');

let mongo, app, store;
const header = ['X-Requested-With', 'movie-app'];
before(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.init();
  ({ app, store } = createApp({ mongoUrl: mongo.getUri(), sessionSecret: 'test-secret-with-at-least-thirty-two-characters' }));
});
after(async () => {
  if (store) await store.close();
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

test('registration, hashed passwords, preferences, session persistence and logout', async () => {
  const agent = request.agent(app);
  const credentials = { email: ' Movie@Example.com ', password: 'a-safe-password' };
  const registration = await agent.post('/api/auth/register').set(...header).send(credentials).expect(201);
  assert.equal(registration.body.email, 'movie@example.com');
  assert.equal(registration.body.passwordHash, undefined);
  assert.match(registration.headers['set-cookie'][0], /HttpOnly/);
  assert.match(registration.headers['set-cookie'][0], /SameSite=Lax/);
  const user = await User.findOne({ email: 'movie@example.com' }).select('+passwordHash');
  assert.notEqual(user.passwordHash, credentials.password);
  assert.equal(await bcrypt.compare(credentials.password, user.passwordHash), true);

  const preferences = { favoriteGenre: 'Science Fiction', favoriteMovie: 'Interstellar' };
  await agent.put('/api/preferences').set(...header).send(preferences).expect(200);
  assert.deepEqual((await agent.get('/api/auth/me').expect(200)).body.preferences, preferences);
  assert.equal((await User.findById(user._id)).preferences.favoriteMovie, 'Interstellar');
  await agent.post('/api/auth/logout').set(...header).expect(200);
  await agent.get('/api/auth/me').expect(401);

  const nextSession = request.agent(app);
  const login = await nextSession.post('/api/auth/login').set(...header).send(credentials).expect(200);
  assert.deepEqual(login.body.preferences, preferences);
  await nextSession.put('/api/preferences').set(...header).send({ favoriteGenre: '', favoriteMovie: '' }).expect(200);
  assert.equal((await nextSession.get('/api/auth/me')).body.preferences.favoriteMovie, '');
});

test('unauthenticated access, validation, duplicate accounts and incorrect credentials', async () => {
  await request(app).get('/api/auth/me').expect(401);
  await request(app).put('/api/preferences').set(...header).send({}).expect(401);
  await request(app).post('/api/auth/register').send({}).expect(403);
  for (const body of [{}, { email: 'bad-email', password: '12345678' }, { email: 'a@b.com', password: 'short' }, { email: 'a@b.com', password: 'é'.repeat(40) }]) {
    await request(app).post('/api/auth/register').set(...header).send(body).expect(400);
  }
  const credentials = { email: 'validation@example.com', password: 'password-123' };
  const agent = request.agent(app);
  await agent.post('/api/auth/register').set(...header).send(credentials).expect(201);
  await request(app).post('/api/auth/register').set(...header).send(credentials).expect(409);
  await request(app).post('/api/auth/login').set(...header).send({ ...credentials, password: 'wrong-password' }).expect(401);
  await request(app).post('/api/auth/login').set(...header).send({ email: { $ne: null }, password: 'password-123' }).expect(401);
  await agent.put('/api/preferences').set(...header).send({ favoriteGenre: 'invalid', favoriteMovie: 'Test' }).expect(400);
  await agent.put('/api/preferences').set(...header).send({ favoriteGenre: 'Drama', favoriteMovie: 'x'.repeat(201) }).expect(400);
});

test('accounts can only read and update their own preferences', async () => {
  const first = request.agent(app);
  const second = request.agent(app);
  await first.post('/api/auth/register').set(...header).send({ email: 'first@example.com', password: 'password-first' }).expect(201);
  await second.post('/api/auth/register').set(...header).send({ email: 'second@example.com', password: 'password-second' }).expect(201);
  await first.put('/api/preferences').set(...header).send({ favoriteGenre: 'Drama', favoriteMovie: 'First movie', email: 'second@example.com' }).expect(200);
  const other = await second.get('/api/auth/me').expect(200);
  assert.equal(other.body.email, 'second@example.com');
  assert.equal(other.body.preferences.favoriteMovie, '');
  assert.equal((await first.get('/api/auth/me')).body.preferences.favoriteMovie, 'First movie');
});
