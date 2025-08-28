// Book Routes
const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const authController = require("../controllers/authController");

// authController

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/novelLiked/:id", authController.novelLiked);

router.get("/books", bookController.getAllBooks);
router.get("/books/:id", bookController.getBookById);
router.post("/books", bookController.createBook);
router.post("/books/reviews/:id", bookController.addReview);
router.post("/books/liked/:id", bookController.addLikes);
router.patch("/books/update/:id", bookController.updateBook);
router.delete("/books/:id", bookController.deleteBook);
router.post("/books/like/:id", bookController.deleteLiked);

// Add more routes as needed

module.exports = router;
