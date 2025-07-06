const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    first_name: { type: String, maxLength: 50 },
    last_name: { type: String, maxLength: 50 },
    email: {
      type: String,
      maxLength: 50,
      unique: true,
      sparse: true,
      set: function (v) {
        return v === "" ? null : v;
      },
    },
    age: { type: Number, index: true, default: 0, maxLength: 3 },
    role: {
      type: String,
      default: "user",
      enum: ["tradesman", "admin", "user", "supplier"],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      index: true,
      default: "male",
    },
    profile_picture: { type: String },
    phone: {
      type: String,
      maxLength: 20,
      unique: true,
      sparse: true,
      set: function (v) {
        return v === "" ? null : v;
      },
    },

    verified: [String],
    status: { type: String, default: "not-approved" },
    account_status: { type: String, default: "active" },
    password: { type: String, maxLength: 100 },
    salt: { type: String },
    token: { type: String },
    otp: { type: String },
    otp_expiry: { type: Date },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

userSchema.index({ "addresses.location": "2dsphere" });

module.exports =
  mongoose.models.UserModel || mongoose.model("UserModel", userSchema);
