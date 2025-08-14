const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  reviewer: { type: String, required: true },
  comment: { type: String },
  rating: { type: Number, min: 0, max: 10 },
  date: { type: Date, default: Date.now },
});

const novelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genres: [{ type: String }],
  image_url: { type: String },
  novel_pages_url: { type: String },
  pages: { type: Number },
  rating: { type: Number, min: 0, max: 10 },
  reviews: { type: [reviewSchema], default: [] },
});

const Novel = mongoose.model("Novels", novelSchema);

module.exports = Novel;
