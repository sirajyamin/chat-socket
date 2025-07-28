const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "UserModel", required: true },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookingModel",
      required: true,
    },
    content: { type: String },
    offer: {
      amount: Number,
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "countered"],
        default: "pending",
      },
      counterOffer: Number,
      terms: String,
    },
    type: { type: String, enum: ["message", "offer"], default: "message" },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    conversationId: { type: String },
  },
  { timestamps: true }
);
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

module.exports =
  mongoose.models.Message || mongoose.model("MessageModel", messageSchema);
