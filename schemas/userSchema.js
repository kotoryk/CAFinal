const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
    default:
      'https://www.pngall.com/wp-content/uploads/5/User-Profile-PNG-Image.png',
  },
  role: {
    type: String,
    required: true,
  },
  topics: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Topic',
    },
  ],
  discussions: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Discussion',
    },
  ],
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
  ],
});

const User = mongoose.model('User', userSchema);
module.exports = User;
