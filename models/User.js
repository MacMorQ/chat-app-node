const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  password: String,
  isAdmin: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
