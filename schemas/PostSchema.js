const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Discussion',
      required: true,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
