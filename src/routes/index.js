// src/routes/index

const express = require("express");
const router = express.Router();
const userController = require("../controllers/usercontrollers");

router.get("/", (req, res) => {
  req.session.userId ? res.redirect("/users") : res.redirect("/login");
});

router.get("/register", userController.showRegisterForm);
router.post("/register", userController.register);

router.get("/login", userController.showLoginForm);
router.post("/login", userController.login);

router.get("/forgot-password", userController.showForgotPasswordForm);
router.post("/forgot-password", userController.forgotPassword);

router.get("/reset-password/:token", userController.showResetPasswordForm);
router.post("/reset-password/:token", userController.resetPassword);

router.get("/logout", userController.logout);


router.get("/users", userController.requireLogin, userController.userList);

router.get('/chat', userController.requireLogin, userController.chat);
router.get("/chat/:id", userController.requireLogin, userController.chat);

module.exports = router;
