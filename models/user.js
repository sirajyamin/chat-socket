const mongoose = require("mongoose");
const { Schema } = mongoose;

const skilsRatingSchema = new Schema({
  school_id: { type: Number },
  student_id: { type: Number },
  section_id: { type: String, maxLength: 100 },
  rating: { type: Number },
  skill_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceModel",
  },
});

const ratingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: "BookingModel",
  },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating must be at most 5"],
    required: [true, "Rating is required"],
  },
  comment: {
    type: String,
    maxLength: [500, "Comment must not exceed 500 characters"],
    trim: true,
  },
  created_at: { type: Date, default: Date.now },
});

const addressSchema = new Schema({
  city: { type: String, maxLength: 50 },
  flat: { type: String, maxLength: 100 },
  full_address: { type: String, maxLength: 200 },
  is_default: { type: Boolean, default: false },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number],
    },
  },
});

const userSchema = new Schema(
  {
    first_name: { type: String, maxLength: 50 },
    last_name: { type: String, maxLength: 50 },
    email: {
      type: String,
      maxLength: 50,
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
    cnic: { type: String, maxLength: 15 },
    profile_picture: { type: String },
    cnic_back_image: { type: String },
    cnic_front_image: { type: String },
    phone: {
      type: String,
      maxLength: 20,
      unique: true,
      sparse: true,
      set: function (v) {
        return v === "" ? null : v;
      },
    },

    student_id: { type: String },
    school_id: { type: String },
    addresses: [addressSchema],
    verified: [String],
    status: { type: String, default: "not-approved" },
    account_status: { type: String, default: "active" },
    password: { type: String, maxLength: 100 },
    salt: { type: String },
    token: { type: String },
    otp: { type: String },
    otp_expiry: { type: Date },
    skills_rating: [skilsRatingSchema],
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceModel",
      },
    ],
    job_counts: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    ratings: [ratingSchema],
    avg_rating: { type: Number, default: 0 },
    online: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

userSchema.index({ "addresses.location": "2dsphere" });

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      email: { $exists: true, $ne: null, $ne: "" },
    },
  }
);

module.exports =
  mongoose.models.UserModel || mongoose.model("UserModel", userSchema);
