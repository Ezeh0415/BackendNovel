// Book Controller
const { ObjectId } = require("mongodb");
const { getDB } = require("../models/db");
const Novels = require("../models/Novel");
// const crypto = require("crypto");

// const secretKey = crypto.randomBytes(64).toString("hex");

exports.getAllBooks = async (req, res) => {
  try {
    const db = getDB();
    const bookCount = await db.collection("books").find().count();
    const books = await db
      .collection("books")
      .find()
      .sort({ title: 1 })
      .toArray();
    console.log("Book:");
    res.status(200).json({ count: bookCount, data: books });
  } catch (error) {
    console.error("Failed to get books:", error);
    res.status(500).json({ error: "Failed to get books" });
  }
};

exports.getBookById = async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
    return res.status(500).json({ error: "Invalid book ID" });
  }
  try {
    const book = await db
      .collection("books")
      .findOne({ _id: new ObjectId(id) });
    res.status(200).json({ data: book });
  } catch (error) {
    console.error("Failed to get book:", error);
    res.status(500).json({ error: "Failed to get book" });
  }
};

exports.createBook = async (req, res) => {
  const db = getDB();
  const book = new Novels(req.body);

  try {
    const result = await db.collection("books").insertOne(book);
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to create file:", error);
    res.status(500).json({ error: "Failed to create file" });
  }
};

exports.addReview = async (req, res) => {
  const db = getDB();
  const bookId = req.params.id;
  const review = req.body;
  if (!ObjectId.isValid(bookId)) {
    return res.status(400).json({ error: "Invalid book ID format" });
  }
  try {
    const result = await db
      .collection("books")
      .updateOne({ _id: new ObjectId(bookId) }, { $push: { reviews: review } });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Book not found" });
    }
    res.status(200).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Failed to add review:", error);
    res.status(500).json({ error: "Failed to add review" });
  }
};

exports.addLikes = async (req, res) => {
  const db = getDB();
  const userId = req.params.id;
  const like = req.body;
  // Validate userId
  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  // Validate like object (example: must have itemId and optionally timestamp)
  if (!like || typeof like !== "object" || (!like.id && !like.Id)) {
    return res
      .status(400)
      .json({ error: "Invalid like data. 'id' is required." });
  }

  try {
    // Use $addToSet to prevent duplicate likes
    const result = await db.collection("users").findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $addToSet: { likes: like } },
      { returnDocument: "after" } // return updated document after update
    );

    res.status(200).json({ message: "Like added successfully" });
  } catch (error) {
    console.error("Failed to add like:", error);
    res.status(500).json({ error: "Failed to add like" });
  }
};

exports.updateBook = async (req, res) => {
  const db = getDB();
  const id = req.params.id;
  const update = req.body;
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid book ID format" });
  }
  try {
    const result = await db
      .collection("books")
      .updateOne({ _id: new ObjectId(id) }, { $set: update });
    if (!result) {
      return res.status(404).json({ error: "file not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to update file:", error);
    res.status(500).json({ error: "Failed to update file" });
  }
};

exports.deleteBook = async (req, res) => {
  const db = getDB();
  const bookId = req.params.id;
  if (!ObjectId.isValid(bookId)) {
    return res.status(400).json({ error: "Invalid book ID format" });
  }
  try {
    const result = await db
      .collection("books")
      .deleteOne({ _id: new ObjectId(bookId) });
    if (!result) {
      return res.status(404).json({ error: "file not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to delete file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};
