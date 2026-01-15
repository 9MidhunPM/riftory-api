const mongoose = require('mongoose');

const deviceProfileSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    default: 'Riftory User',
    maxlength: 50,
  },
  email: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  avatar: {
    url: String,
    publicId: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  settings: {
    notifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
  },
});

// Update lastActive before saving
deviceProfileSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('DeviceProfile', deviceProfileSchema);
