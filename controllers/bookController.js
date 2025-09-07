// Book Controller
const { ObjectId } = require("mongodb");
const { getDB } = require("../models/db");
const Novels = require("../models/Novel");
const { handleError } = require("../utils/ErrorHandler");

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
    handleError(res, err, "Failed to get books");
  }
};

exports.getBookByTitle = async (req, res) => {
  const db = getDB();
  const title = req.body.search;
  try {
    const book = await db.collection("books").find({ title: title }).toArray();
    res.status(200).json({ data: book });
  } catch (error) {
    handleError(res, err, "Failed to get books");
  }
};

exports.getBookByAuthor = async (req, res) => {
  const db = getDB();
  const author = req.body.search;
  try {
    const book = await db
      .collection("books")
      .find({ author: author })
      .toArray();
    res.status(200).json({ data: book });
  } catch (error) {
    handleError(res, err, "Failed to get books");
  }
};

exports.totalReview = async (req, res) => {
  try {
    const db = getDB(); // your database connection
    const reviewerName = req.body.UserName;

    if (!reviewerName) {
      return res.status(400).json({ error: "Reviewer name is required" });
    }

    const result = await db
      .collection("books")
      .aggregate([
        { $unwind: "$reviews" },
        { $match: { "reviews.reviewer": reviewerName } },
        { $count: "totalReviews" },
      ])
      .toArray();

    const total = result[0]?.totalReviews || 0;

    res.status(200).json({ name: reviewerName, totalReviews: total });
  } catch (err) {
    handleError(res, err, "Error fetching total reviews:");
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
    handleError(res, err, "Failed to get books");
  }
};

exports.createBook = async (req, res) => {
  const db = getDB();
  const book = new Novels(req.body);

  try {
    const result = await db.collection("books").insertOne(book);
    res.status(200).json(result);
  } catch (error) {
    handleError(res, err, "Failed to create file");
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
    handleError(res, err, "Failed to add review");
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
    handleError(res, err, "Failed to add likes");
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
    handleError(res, err, "Failed to update book");
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
    handleError(res, err, "unable to delete book");
  }
};

exports.deleteLiked = async (req, res) => {
  const userId = req.params.id; // user ID
  const likeIdToRemove = req.body.id; // ID of the like you want to remove
  const db = getDB();

  if (!ObjectId.isValid(userId)) {
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  if (!likeIdToRemove) {
    return res.status(400).json({ error: "Missing likeId in request body" });
  }

  console.log(likeIdToRemove, userId);

  try {
    const result = await db
      .collection("users")
      .findOneAndUpdate(
        { _id: new ObjectId(userId) },
        { $pull: { likes: { id: likeIdToRemove } } },
        { returnDocument: "after" }
      );

    res.status(200).json({ message: "Like removed", user: result.value });
  } catch (err) {
    handleError(res, err, "unable to unlike the book");
  }
};
