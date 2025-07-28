const mongoose = require("mongoose");
const CounterModel = require("./counter");
const { Schema } = mongoose;

const paymentSchema = new Schema({
  service_charges: { type: Number },
  tax_charges: { type: Number },
  other_charges: { type: Number },
  other_charges_description: { type: String },
  total_charges: { type: Number },
  currency: { type: String, default: "PKR" },
  payment_method: { type: String, default: "cashOnDelivery" },
  payment_status: { type: String, default: "pending" },
});

const schema = new Schema(
  {
    booking_id: {
      type: String,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "UserModel",
    },
    number_of_tradesman: { type: Number, default: 1 },
    number_of_customers: {
      type: Number,
      default: 1,
    },
    tradesman: [{ type: Schema.Types.ObjectId, ref: "UserModel" }],
    service: {
      type: Schema.Types.ObjectId,
      ref: "ServiceModel",
    },
    addons: [
      {
        addon: { type: Schema.Types.ObjectId, ref: "AddonModel" },
        quantity: { type: Number },
      },
    ],
    dispute: {
      type: Boolean,
      default: false,
    },
    day: {
      type: String,
      enum: [
        "monday",
        "Monday",
        "tuesday",
        "Tuesday",
        "wednesday",
        "Wednesday",
        "thursday",
        "Thursday",
        "friday",
        "Friday",
        "saturday",
        "Saturday",
        "sunday",
        "Sunday",
      ],
    },
    date: {
      type: Date,
      default: Date.now,
    },
    startTime: {
      type: String,
    },
    endTime: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "assigned",
        "accepted",
        "in-progress",
        "completedByTradesman",
        "completedByUser",
        "completed",
        "completed-by-tradesman",
        "completed-by-user",
        "cancelled",
        "incomplete",
        "resolved",
        "rejected",
      ],
      default: "pending",
    },
    payment: paymentSchema,
    user_instructions: {
      type: String,
    },
    user_instructions_images: [String],
    tradesman_completed_at: {
      type: Date,
      default: null,
    },
    user_completed_at: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    city: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

schema.pre("save", async function (next) {
  try {
    if (!this.booking_id) {
      const counter = await CounterModel.findByIdAndUpdate(
        { _id: "bookingId" },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );

      const paddedNumber = counter.sequence_value.toString().padStart(5, "0");
      this.booking_id = `#B${paddedNumber}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports =
  mongoose.models.BookingModel || mongoose.model("BookingModel", schema);
