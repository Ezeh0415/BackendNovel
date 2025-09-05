// Book Routes
const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const authController = require("../controllers/authController");

// authController
// post routers on auth sections
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/user/profileImage", authController.uploadImage);
router.post("/user/getprofile", authController.getUserImg);
router.post("/user/subscribe", authController.subscribe);
router.post("/user/deleteUser", authController.deleteUser);
// get routers on auth sections
router.get("/logout", authController.logout);
router.get("/novelLiked/:id", authController.novelLiked);
// end of authController
// get for books router
router.get("/books", bookController.getAllBooks);
router.get("/books/:id", bookController.getBookById);
// post for books router
router.post("/books", bookController.createBook);
router.post("/books/reviews/:id", bookController.addReview);
router.post("/books/review/count", bookController.totalReview);
router.post("/books/liked/:id", bookController.addLikes);
router.post("/books/like/:id", bookController.deleteLiked);
// router.post("/books/BookByGenre", bookController.getBookByGenre);
router.post("/books/BookByAuthor", bookController.getBookByAuthor);
router.post("/books/BookByTitle", bookController.getBookByTitle);
// patch for books router
router.patch("/books/update/:id", bookController.updateBook);
// delete for books router
router.delete("/books/:id", bookController.deleteBook);

module.exports = router;
