const mongoose = require('mongoose');

const GlobalWishSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  url: { type: String, default: '', trim: true },
  priceEstimate: { type: Number, default: null },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'dream'],
    default: 'high',
  },
  category: {
    type: String,
    enum: ['tech', 'fashion', 'books', 'home', 'hobbies', 'beauty', 'sweets', 'other'],
    default: 'other',
  },
  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: 'santa',
    },
    bio: {
      type: String,
      default: '',
      trim: true,
    },
    sizes: {
      shirt: { type: String, default: '', trim: true },
      pants: { type: String, default: '', trim: true },
      shoes: { type: String, default: '', trim: true },
      favoriteColor: { type: String, default: '', trim: true },
      snacksAndDrinks: { type: String, default: '', trim: true },
      avoidOrAllergies: { type: String, default: '', trim: true },
    },
    globalWishlist: [GlobalWishSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
