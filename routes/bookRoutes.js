// Book Routes
const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");

router.get("/books", bookController.getAllBooks);
router.get("/books/:id", bookController.getBookById);
router.post("/books", bookController.createBook);
router.post("/books/reviews/:id", bookController.addReview);
router.patch("/books/update/:id", bookController.updateBook);
router.delete("/books/:id", bookController.deleteBook);

// Add more routes as needed

module.exports = router;
