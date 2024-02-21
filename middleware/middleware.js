const resSend = require('../plugins/resSend');
const jwt = require('jsonwebtoken');
const User = require('../schemas/userSchema');
const Topic = require('../schemas/topicSchema');
const Discussion = require('../schemas/discussionSchema');

require('dotenv').config();

module.exports = {
  registerValidate: (req, res, next) => {
    console.log('Validating registration request...');
    const { username, passwordOne, passwordTwo, role } = req.body;

    console.log('Received role:', role);

    if (role !== 'admin' && role !== 'user') {
      console.log('Invalid role name:', role);
      return resSend(res, false, null, 'bad role name');
    }

    if (username.length < 4 || username.length > 20) {
      console.log('Invalid username length:', username.length);
      return resSend(res, false, null, 'username length bad');
    }

    if (passwordOne !== passwordTwo) {
      console.log('Passwords do not match');
      return resSend(res, false, null, 'passwords should match');
    }

    if (username.length < 4 || username.length > 20) {
      console.log('Invalid username length:', username.length);
      return resSend(res, false, null, 'username length bad');
    }

    function containsUppercase(str) {
      return /[A-Z]/.test(str);
    }

    if (!containsUppercase(passwordTwo)) {
      console.log('Password should contain at least one uppercase letter');
      return resSend(
        res,
        false,
        null,
        'Password has to be with one upper case letter'
      );
    }

    function hasNumber(str) {
      return /\d/.test(str);
    }

    if (!hasNumber(passwordOne)) {
      console.log('Password should contain at least one numeric symbol');
      return resSend(
        res,
        false,
        null,
        'Password should contain at least one numeric symbol'
      );
    }

    console.log('Registration request validated successfully');
    next();
  },
  loginValidate: (req, res, next) => {
    console.log('Validating login request...');
    const { username, password } = req.body;

    if (username.length < 4 || username.length > 20) {
      console.log('Invalid username length:', username.length);
      return res.status(400).json({
        success: false,
        message: 'Username length must be between 4 and 20 characters',
      });
    }

    if (password.length < 4 || password.length > 20) {
      console.log('Invalid password length:', password.length);
      return res.status(400).json({
        success: false,
        message: 'Password length must be between 4 and 20 characters',
      });
    }

    console.log('Login request validated successfully');
    next();
  },

  tokenAuth: (req, res, next) => {
    console.log('Authenticating token...');
    const token = req.headers.authorization;

    if (!token) {
      return resSend(res, false, null, 'Token not provided');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.log('Invalid token:', err.message);
        return resSend(res, false, null, 'bad token');
      } else {
        User.findOne({ username: decodedToken.username })
          .then((user) => {
            if (user) {
              req.user = user;
              next();
            } else {
              console.log('User not found:', decodedToken.username);
              return resSend(res, false, null, 'User not found');
            }
          })
          .catch((error) => {
            console.error('Error finding user:', error);
            return resSend(res, false, null, 'Server error');
          });
      }
    });
  },

  adminValidate: async (req, res, next) => {
    console.log('Validating admin access...');
    const { username } = req.user;

    try {
      const user = await User.findOne({ username });

      if (!user) {
        console.log('User not found');
        return resSend(res, false, null, 'User not found');
      }

      console.log('User role:', user.role);
      if (user.role !== 'admin') {
        console.log('User is not an admin');
        return resSend(res, false, null, 'bad role');
      }

      console.log('Admin access validated successfully');
      next();
    } catch (error) {
      console.error('Error in adminValidate middleware:', error);
      resSend(res, false, null, 'Server error');
    }
  },

  validToken: (req, res, next) => {
    console.log('Authenticating token...');
    const token = req.headers.authorization;

    if (!token) {
      return resSend(res, false, null, 'Token not provided');
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
      if (error) {
        console.error('Error verifying token:', error);
        return resSend(res, false, null, 'Invalid token');
      }

      req.user = { username: decoded.username };
      console.log('Decoded token:', decoded);

      console.log('Token authenticated successfully');
      next();
    });
  },

  validateTopic: (req, res, next) => {
    console.log('Validating topic creation request...');

    const { title, description } = req.body;
    const owner = req.user?.username;

    if (!title) {
      console.log('Title is missing or invalid:', title);
      return resSend(res, false, null, 'Title is required.');
    }

    if (!description) {
      console.log('Description is missing or invalid:', description);
      return resSend(res, false, null, 'Description is required.');
    }

    if (!owner) {
      console.log('Owner information is missing');
      return resSend(res, false, null, 'Owner information is missing.');
    }

    console.log('Topic creation request validated successfully');
    next();
  },

  validateDiscussion: (req, res, next) => {
    console.log('Validating discussion creation request...');

    const { title, description } = req.body;
    const owner = req.user?.username;

    if (!title) {
      console.log('Title is missing or invalid:', title);
      return resSend(res, false, null, 'Title is required.');
    }

    if (!description) {
      console.log('Description is missing or invalid:', description);
      return resSend(res, false, null, 'Description is required.');
    }

    if (!owner) {
      console.log('Owner information is missing');
      return resSend(res, false, null, 'Owner information is missing.');
    }
    if (!req.body.topic) {
      console.log('Topic ID is missing');
      return resSend(res, false, null, 'Topic ID is required.');
    }

    next();
  },
  validatePost: (req, res, next) => {
    console.log('Validating post creation request...');

    const { description } = req.body;
    const owner = req.user?.username;

    if (!description) {
      console.log('Description is missing or invalid:', description);
      return resSend(res, false, null, 'Description is required.');
    }

    if (!owner) {
      console.log('Owner information is missing');
      return resSend(res, false, null, 'Owner information is missing.');
    }
    if (!req.body.discussion) {
      console.log('Discussion ID is missing');
      return resSend(res, false, null, 'Discussion ID is required.');
    }

    next();
  },
};
