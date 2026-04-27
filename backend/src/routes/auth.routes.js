const express = require('express');
const { registerUserController, loginUserController, logoutUserController, getMeController } = require('../controllers/auth.controller');
const authUserMiddleware = require('../middlewares/auth.middleware');
const authRouter = express.Router();


/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */

authRouter.post('/register', registerUserController); 

/**
 * @route POST /api/auth/login
 * @description Login user with email and password
 * @access Public
 */

authRouter.post('/login', loginUserController);

/**
 * @route GET /api/auth/logout
 * @description Clear token from cookies and add the token in blacklist
 * @access Public
 */

authRouter.get('/logout', logoutUserController)

/**
 * @route GET /api/auth/get-me
 * @description Get the current logged in user details, expects token in cookies
 * @access Private
 */

authRouter.get('/get-me', authUserMiddleware, getMeController)


module.exports = authRouter;