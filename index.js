const express = require('express');
const cors = require('cors');
const router = require('./routers/router');
const mongoose = require('mongoose');
require('dotenv').config();
const crypto = require('crypto');

const generateJwtSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const jwtSecret = process.env.JWT_SECRET || generateJwtSecret();
console.log('JWT Secret:', jwtSecret);

const app = express();
const port = process.env.PORT || 2500;

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

app.use(express.json());
app.use(cors());
app.use('', router);

console.log('Environment variables:', process.env);
console.log('Router:', router);
