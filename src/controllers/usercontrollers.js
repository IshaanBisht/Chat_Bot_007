//  src/controllers/userController.js
const User = require('../models/user');
const crypto = require('crypto');
const sendEmail = require('../utils/email'); // You'll need to implement this
const Message = require('../controllers/message'); // ✅ your current message.js location


// Helper function for sending error responses
const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};

exports.showRegisterForm = (req, res) => {
  res.render('register', { 
    title: 'Create Account',
    error: null, // Initialize error as null
    formData: {   // Initialize formData with empty values
      firstName: '',
      lastName: '',
      email: ''
    }
  });
};

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', {
        title: 'Create Account',
        error: 'Email already in use',
        formData: { firstName, lastName, email }
      });
    }

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    req.session.userId = newUser._id.toString(); // Ensure ID is string
    console.log('Session after registration:', req.session); // Debug logging
    
    return res.redirect('/users');
    
  } catch (err) {
    console.error('Registration error:', err);
    return res.render('register', {
      title: 'Create Account',
      error: 'Registration failed. Please try again.',
      formData: req.body
    });
  }
};

exports.showLoginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.render('login', {
        error: 'Please provide email and password',
        email
      });
    }

    // 2) Check if user exists and password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', {
        error: 'Incorrect email or password',
        email
      });
    }

    // 3) Create session
    req.session.userId = user._id;
    res.redirect('/chat');

  } catch (err) {
    console.error('Login error:', err);
    res.render('login', {
      error: 'An error occurred during login',
      email: req.body.email
    });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/chat');
    }
    res.clearCookie('connect.sid'); // The default session cookie name
    res.redirect('/login');
  });
};

exports.showForgotPasswordForm = (req, res) => {
  res.render('forgot-password', { title: 'Forgot Password' });
};

exports.forgotPassword = async (req, res) => {
  try {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.render('forgot-password', {
        message: 'If that email exists, a reset link has been sent',
        email: req.body.email
      });
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message: `Forgot your password? Submit a new password at: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`
    });

    res.render('forgot-password', {
      message: 'If that email exists, a reset link has been sent',
      email: req.body.email
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.render('forgot-password', {
      error: 'There was an error sending the email. Try again later!',
      email: req.body.email
    });
  }
};

exports.showResetPasswordForm = (req, res) => {
  const token = req.params.token;
  res.render('reset-password', { title: 'Reset Password', token });
};

exports.resetPassword = async (req, res) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.render('reset-password', {
        token: req.params.token,
        error: 'Token is invalid or has expired'
      });
    }

    user.password = req.body.password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    // 3) Log the user in, send JWT
    req.session.userId = user._id;
    res.redirect('/chat');

  } catch (err) {
    console.error('Reset password error:', err);
    res.render('reset-password', {
      token: req.params.token,
      error: 'An error occurred while resetting your password'
    });
  }
};

exports.requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

exports.userList = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.userId);
    const users = await User.find({ _id: { $ne: req.session.userId } })

    .select('firstName lastName online lastSeen');
      
    res.render('users', { 
      title: 'Users', 
      users, 
      currentUser,
      sessionData: JSON.stringify({
        currentUserId: currentUser._id.toString()
      })
    });


  } catch (err) {
    console.error('User list error:', err);
    res.render('users', { error: 'Error loading user list' });
  }
};


exports.chat = async (req, res) => {
  try {
    const currentUser = await User.findById(req.session.userId);
    const chatUser = await User.findById(req.query.id); // user you're chatting with

    if (!chatUser) {
      return res.redirect('/users');
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUser._id, receiver: chatUser._id },
        { sender: chatUser._id, receiver: currentUser._id }
      ]
    }).sort({ timestamp: 1 });

    res.render('chat', {
      title: `Chat with ${chatUser.firstName}`,
      currentUser,
      chatUser,
      messages,
      sessionData: JSON.stringify({
        currentUserId: currentUser._id.toString(),
        chatUserId: chatUser._id.toString(),
        chatUserName: chatUser.firstName
      })
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.redirect('/login');
  }
};