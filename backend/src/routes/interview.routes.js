const express = require("express")
const upload = require("../middlewares/file.middleware")
const authUserMiddleware = require("../middlewares/auth.middleware")
const { generateInterViewReportController, getAllInterviewReportsController, generateResumePdfController, getInterviewReportByIdController, generateResumeHtmlController } = require("../controllers/interview.controller")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description generate new interview report on the basis of user self description,resume pdf and job description.
 * @access private
 */

interviewRouter.post("/", authUserMiddleware, upload.single("resume"), generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId
 * @description get interview report by interviewId.
 * @access private
 */
interviewRouter.get("/report/:interviewId", authUserMiddleware, getInterviewReportByIdController)


/**
 * @route GET /api/interview/
 * @description get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get("/", authUserMiddleware, getAllInterviewReportsController)


/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authUserMiddleware, generateResumePdfController)
interviewRouter.get("/resume/html/:interviewReportId", authUserMiddleware, generateResumeHtmlController)



module.exports = interviewRouter