// models/CounterModel.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const counterSchema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 },
});

module.exports =
  mongoose.models.CounterModel || mongoose.model("CounterModel", counterSchema);
