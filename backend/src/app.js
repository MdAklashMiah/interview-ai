const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());

app.use(express.json());

const authRouter = require('./routes/auth.routes');
const interviewRouter = require('./routes/interview.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 10, // Limit each IP to 10 requests per window
	standardHeaders: 'draft-7',
	legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try again after 15 minutes." }
});

/* Using all the routes here */
app.use('/api/auth', authRouter);
app.use('/api/interview', aiRateLimiter, interviewRouter);

app.use(errorMiddleware);

module.exports = app;