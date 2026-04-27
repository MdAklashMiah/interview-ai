const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: [true, 'usename already taken'],
  },
    email: {
    type: String,
    required: true,
    unique: [true, 'Email already exists'],
    },
    password: {
    type: String,
    required: true,
    },
})

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;