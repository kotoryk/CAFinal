const resSend = require('../plugins/resSend');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../schemas/userSchema');
const Topic = require('../schemas/topicSchema');
const Discussion = require('../schemas/discussionSchema');
const Post = require('../schemas/PostSchema');
const Message = require('../schemas/messagingShema');
module.exports = {
  registerUser: async (req, res) => {
    try {
      const { username, passwordOne, role } = req.body;

      console.log('Received registration request:', { username, role });

      const userExists = await User.findOne({ username });

      if (userExists) {
        console.log('Username already exists:', username);
        return resSend(res, false, null, 'Username is already taken');
      }

      const password = await bcrypt.hash(passwordOne, 10);

      console.log('Hashed password:', password);

      const newUser = new User({
        username,
        password,
        role,
      });

      await newUser.save();

      console.log('User registered successfully:', newUser);

      resSend(res, true, null, 'User registered successfully');
    } catch (error) {
      console.error('Error registering user:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      console.log('Received login request:', { username });

      const user = await User.findOne({ username });

      if (!user) {
        console.log('User not found:', username);
        return resSend(res, false, null, 'Invalid username or password');
      }

      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        console.log('Incorrect password:', username);
        return resSend(res, false, null, 'Invalid username or password');
      }

      console.log('User logged in successfully:', username);

      const token = jwt.sign({ username }, process.env.JWT_SECRET);

      return resSend(
        res,
        true,
        { token, username, role: user.role, image: user.image },
        'User logged in successfully'
      );
    } catch (error) {
      console.error('Error logging in:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  autoLogin: async (req, res) => {
    const { token } = req.body;
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      const { username } = decodedToken;

      const user = await User.findOne({ username }).select('image');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.status(200).json({
        message: 'success',
        username: username,
        image: user.image,
      });
    } catch (error) {
      console.error('Error decoding token:', error);
      res.status(500).json({ message: 'Error' });
    }
  },

  updateProfileImage: async (req, res) => {
    try {
      const { username, imageUrl } = req.body;

      const updatedUser = await User.findOneAndUpdate(
        { username },
        { image: imageUrl },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        user: updatedUser,
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      res
        .status(500)
        .json({ success: false, message: 'Internal server error' });
    }
  },
  // !---------------Topic---------------------------
  createTopic: async (req, res) => {
    console.log('Checking if user is admin...');
    console.log('User role:', req.user.role);

    if (req.user.role !== 'admin') {
      console.log('User is not an admin');
      return resSend(res, false, null, 'Only admins can create topics');
    }

    try {
      const { title, description } = req.body;

      if (!title || !description) {
        return resSend(res, false, null, 'Title and description are required');
      }

      const newTopic = new Topic({
        title,
        description,
        createdBy: req.user._id,
      });

      await newTopic.save();

      const user = await User.findById(req.user._id).select('username');

      const topicResponse = {
        id: newTopic._id,
        title: newTopic.title,
        createdBy: user.username,
      };

      resSend(res, true, topicResponse, 'Topic created successfully');
    } catch (error) {
      console.error('Error creating topic:', error);
      resSend(res, false, null, 'Server error');
    }
  },

  getAllTopics: async (req, res) => {
    try {
      const topics = await Topic.find().populate('createdBy', 'username');
      const topicsWithDiscussionCount = await Promise.all(
        topics.map(async (topic) => {
          const discussionCount = await Discussion.countDocuments({
            topic: topic._id,
          });
          console.log(`Topic: ${topic.title}, Discussions: ${discussionCount}`);
          return { ...topic.toObject(), discussionCount };
        })
      );

      resSend(
        res,
        true,
        topicsWithDiscussionCount,
        'Topics fetched successfully'
      );
    } catch (error) {
      console.error('Error fetching topics:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  getUserProfile: async (req, res) => {
    try {
      const user = await User.findOne({ username: req.user.username }).select(
        '-password'
      );
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  },
  getUserTopics: async (req, res) => {
    try {
      const userId = req.params.userId;
      const topics = await Topic.find({ createdBy: userId }).populate(
        'createdBy',
        'username'
      );
      console.log('Fetched user topics:', topics);
      resSend(res, true, topics, 'User topics fetched successfully');
    } catch (error) {
      console.error('Error fetching user topics:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  // !-------------Discussions-----------------------------------
  createDiscussion: async (req, res) => {
    try {
      const { title, description, topic } = req.body;

      const newDiscussion = new Discussion({
        title,
        description,
        createdBy: req.user._id,
        topic,
      });

      await newDiscussion.save();

      resSend(res, true, newDiscussion, 'Discussion created successfully');
    } catch (error) {
      console.error('Error creating discussion:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  getDiscussions: async (req, res) => {
    try {
      const { topicId } = req.params;
      const discussions = await Discussion.find({ topic: topicId }).populate(
        'createdBy',
        'username image'
      );

      const discussionsWithPostCount = await Promise.all(
        discussions.map(async (discussion) => {
          const postCount = await Post.countDocuments({
            discussion: discussion._id,
          });
          return { ...discussion.toObject(), postCount };
        })
      );

      resSend(
        res,
        true,
        discussionsWithPostCount,
        'Discussions fetched successfully'
      );
    } catch (error) {
      console.error('Error fetching discussions:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  getUserDiscussions: async (req, res) => {
    try {
      const userId = req.params.userId;
      const discussions = await Discussion.find({ createdBy: userId }).populate(
        'createdBy',
        'username'
      );
      console.log('Fetched user discussions:', discussions);
      resSend(res, true, discussions, 'User discussions fetched successfully');
    } catch (error) {
      console.error('Error fetching user discussions:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  // !---------------------Posts--------------------
  createPost: async (req, res) => {
    try {
      const { description, discussion } = req.body;

      const newPost = new Post({
        description,
        createdBy: req.user._id,
        discussion,
      });

      await newPost.save();

      resSend(res, true, newPost, 'Post created successfully');
    } catch (error) {
      console.error('Error creating post:', error);
      resSend(res, false, null, 'Server error');
    }
  },

  getPosts: async (req, res) => {
    try {
      const { discussionId } = req.params;
      const posts = await Post.find({ discussion: discussionId }).populate(
        'createdBy',
        'username image'
      );
      console.log('Fetched user posts:', posts);
      resSend(res, true, posts, 'Posts fetched successfully');
    } catch (error) {
      console.error('Error fetching posts:', error);
      resSend(res, false, null, 'Server error');
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const userId = req.params.userId;
      const posts = await Post.find({ createdBy: userId }).populate(
        'createdBy',
        'username'
      );
      resSend(res, true, posts, 'User posts fetched successfully');
    } catch (error) {
      console.error('Error fetching user posts:', error);
      resSend(res, false, null, 'Server error');
    }
  },
  // !---------Messsaging ------------------
  sendMessage: async (req, res) => {
    try {
      const { receiverId, message } = req.body;
      if (!receiverId || !message) {
        return resSend(
          res,
          false,
          null,
          'Receiver and message content are required.'
        );
      }

      console.log(`Received message for receiverId ${receiverId}: ${message}`);

      const newMessage = new Message({
        sender: req.user._id,
        receiver: receiverId,
        message: message,
      });

      await newMessage.save();
      console.log('New message saved:', newMessage);
      resSend(res, true, newMessage, 'Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      resSend(res, false, null, 'Failed to send message');
    }
  },

  getMessages: async (req, res) => {
    try {
      const userId = req.user._id;
      console.log(`Retrieving messages for userId ${userId}`);

      const messages = await Message.find({
        $or: [{ receiver: userId }, { sender: userId }],
      })
        .populate('sender', 'username image')
        .populate('receiver', 'username image')
        .exec();

      console.log('Messages retrieved:', messages);
      resSend(res, true, messages, 'Messages retrieved successfully');
    } catch (error) {
      console.error('Error retrieving messages:', error);
      resSend(res, false, null, 'Failed to retrieve messages');
    }
  },
};
