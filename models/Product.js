const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Regular categories
      'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 'Art & Crafts', 'Vintage', 'Other',
      // Upside Down categories
      'Forbidden Tech', 'Dark Fashion', 'Cursed Objects', 'Occult', 'Experiments', 'Contraband', 'Unknown Origin'
    ],
  },
  images: [{
    url: String,
    publicId: String, // Cloudinary public ID for deletion
  }],
  imageUrl: {
    type: String, // Primary image URL (first image)
  },
  seller: {
    id: String,
    name: String,
    rating: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    contactNumber: String,
    address: String,
    email: String,
    type: { type: String, default: 'artisan' },
    upiId: String,
    qrImageUrl: String,
  },
  deviceId: {
    type: String,
    required: true,
    index: true, // Index for faster queries by device
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isUpsideDown: {
    type: Boolean,
    default: false,
  },
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price.toLocaleString('en-IN')}`;
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
