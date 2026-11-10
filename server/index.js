require('dotenv').config();
const mongoose = require('mongoose');
const { createApp, User } = require('./app');

async function start() {
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kareem_movies';
  const { app } = createApp({ mongoUrl, sessionSecret: process.env.SESSION_SECRET, production: process.env.NODE_ENV === 'production' });
  await mongoose.connect(mongoUrl);
  await User.init();
  app.listen(process.env.PORT || 5000, () => console.log(`API listening on port ${process.env.PORT || 5000}`));
}

start().catch((error) => {
  console.error('Server could not start. Check MONGODB_URI and SESSION_SECRET.', error.name);
  process.exit(1);
});
