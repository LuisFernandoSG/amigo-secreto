const mongoose = require('mongoose');

const FamilyWishSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  url: { type: String, default: '', trim: true },
  storeName: { type: String, default: '', trim: true },
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
  reservedBySecretSanta: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const MemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  nickname: { type: String, default: '', trim: true },
  joinedAt: { type: Date, default: Date.now },
  hasRevealed: { type: Boolean, default: false },
  revealedAt: { type: Date, default: null },
  giftStatus: {
    type: String,
    enum: ['pending', 'shopping', 'wrapped', 'ready'],
    default: 'pending',
  },
});

const ExclusionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bidirectional: { type: Boolean, default: true },
  reason: { type: String, default: 'Pareja / Restricción familiar' },
});

const AssignmentSchema = new mongoose.Schema({
  giver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const MessageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['to_giftee', 'to_santa', 'family_wall'],
    required: true,
  },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const ActivitySchema = new mongoose.Schema({
  text: { type: String, required: true },
  icon: { type: String, default: '🎄' },
  createdAt: { type: Date, default: Date.now },
});

const FamilySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '¡Bienvenidos al intercambio navideño de nuestra familia!',
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    settings: {
      budgetMin: { type: Number, default: 20 },
      budgetMax: { type: Number, default: 50 },
      recommendedAmount: { type: Number, default: 35 },
      currency: { type: String, default: 'USD ($)' },
      exchangeDate: {
        type: Date,
        default: () => new Date(new Date().getFullYear(), 11, 24, 21, 0, 0),
      },
      exchangeLocation: { type: String, default: 'Cena de Nochebuena en Familia' },
      revealMode: {
        type: String,
        enum: ['immediate', 'scheduled', 'manual_locked'],
        default: 'immediate',
      },
      revealDate: {
        type: Date,
        default: null,
      },
      customRules: {
        type: String,
        default: '1. Mantén el secreto hasta Nochebuena.\n2. Revisa la lista de deseos de tu asignado.\n3. ¡Envuelve el regalo con mucho espíritu navideño!',
      },
      themeBanner: {
        type: String,
        enum: ['classic_red', 'emerald_forest', 'golden_starlight', 'arctic_aurora'],
        default: 'classic_red',
      },
    },
    members: [MemberSchema],
    exclusions: [ExclusionSchema],
    drawStatus: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    drawnAt: { type: Date, default: null },
    drawHistoryCount: { type: Number, default: 0 },
    assignments: [AssignmentSchema],
    wishlist: [FamilyWishSchema],
    messages: [MessageSchema],
    activityFeed: [ActivitySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Family', FamilySchema);
