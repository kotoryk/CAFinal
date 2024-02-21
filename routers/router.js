const express = require('express');
const router = express.Router();
const {
  registerUser,
  login,
  autoLogin,
  updateProfileImage,
  getUserProfile,
  createTopic,
  getAllTopics,
  getUserTopics,
  getDiscussions,
  createDiscussion,
  getPosts,
  createPost,
  getUserPosts,
  sendMessage,
  getMessages,
} = require('../controller/controller');
const {
  registerValidate,
  loginValidate,
  tokenAuth,
  adminValidate,
  validateTopic,
  validateDiscussion,
  validatePost,
} = require('../middleware/middleware');

router.post('/register', registerValidate, registerUser);
router.post('/login', loginValidate, login);
router.post('/autologin', tokenAuth, autoLogin);
router.post('/topic', tokenAuth, adminValidate, validateTopic, createTopic);
router.get('/topics', getAllTopics);
router.post('/updateProfileImage', tokenAuth, updateProfileImage);
router.get('/profile', tokenAuth, getUserProfile);
router.get('/userTopics/:userId', tokenAuth, getUserTopics);
router.post('/discussion', tokenAuth, validateDiscussion, createDiscussion);
router.get('/discussions/:topicId', tokenAuth, getDiscussions);
router.get('/userDiscussions/:userId', tokenAuth, getUserTopics);
router.post('/post', tokenAuth, validatePost, createPost);
router.get('/posts/:discussionId', tokenAuth, getPosts);
router.get('/userPosts/:userId', tokenAuth, getUserPosts);
router.post('/message', tokenAuth, sendMessage);
router.get('/messages', tokenAuth, getMessages);

module.exports = router;
