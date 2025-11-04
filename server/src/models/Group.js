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
    assignedParticipantId: { type: mongoose.Schema.Types.ObjectId },
    accessCode: { type: String, required: true },
    isOwner: { type: Boolean, default: false }
  },
  { timestamps: true }
);

ParticipantSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.accessCode;
    return ret;
  }
});

const GroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    joinCode: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true },
    ownerEmail: { type: String },
    ownerParticipantId: { type: mongoose.Schema.Types.ObjectId },
    allowReveal: { type: Boolean, default: false },
    assignmentsGenerated: { type: Boolean, default: false },
    adminCode: { type: String, required: true },
    participants: { type: [ParticipantSchema], default: [] }
  },
  { timestamps: true }
);

GroupSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.adminCode;
    return ret;
  }
});

export const Group = mongoose.model('Group', GroupSchema);
