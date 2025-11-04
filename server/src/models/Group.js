import mongoose from 'mongoose';

const WishlistItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    imageUrl: { type: String },
    note: { type: String }
  },
  { _id: true, timestamps: true }
);

const ParticipantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    wishlist: { type: [WishlistItemSchema], default: [] },
    assignedParticipantId: { type: mongoose.Schema.Types.ObjectId }
  },
  { timestamps: true }
);

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    joinCode: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String },
    allowReveal: { type: Boolean, default: false },
    assignmentsGenerated: { type: Boolean, default: false },
    participants: { type: [ParticipantSchema], default: [] }
  },
  { timestamps: true }
);

export const Group = mongoose.model('Group', GroupSchema);
