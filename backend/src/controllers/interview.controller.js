const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf, generateResumeHtml } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")



/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { title, selfDescription, jobDescription } = req.body

        if (!jobDescription || jobDescription.trim().length < 50) {
            return res.status(400).json({ message: "Job description is required and should be at least 50 characters." })
        }

        if (!req.file && (!selfDescription || selfDescription.trim().length < 20)) {
            return res.status(400).json({ message: "Please provide either a resume or a detailed self-description." })
        }

        let resumeText = ""
        if (req.file) {
            try {
                if (!req.file.buffer || req.file.buffer.length === 0) {
                    throw new Error("Empty file buffer");
                }
                const resumeContent = await pdfParse(req.file.buffer)
                resumeText = resumeContent.text || ""
            } catch (err) {
                console.error("PDF Parsing Error:", err);
                if (!selfDescription || selfDescription.trim().length < 20) {
                    return res.status(422).json({ 
                        message: "Failed to parse the uploaded resume. Please ensure it's a valid PDF or provide a detailed self-description instead." 
                    })
                }
            }
        }

        console.log("=== GENERATING REPORT ===");
        console.log("Title:", title || "Untitled");
        console.log("Resume text length:", resumeText.length, "chars");
        console.log("Self description length:", (selfDescription || "").length, "chars");
        console.log("Job description length:", jobDescription.length, "chars");

        if (resumeText.length === 0 && (!selfDescription || selfDescription.trim().length < 20)) {
            return res.status(400).json({ message: "We couldn't extract any text from your resume. Please check your file or add a detailed self-description." })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        console.log("AI Report generated. Candidate:", interViewReportByAi.candidateName);

        // --- Data Sanitization Layer ---
        if (typeof interViewReportByAi.matchScore === 'string') {
            interViewReportByAi.matchScore = parseInt(interViewReportByAi.matchScore.replace(/[^0-9]/g, '')) || 0;
        }

        const arrayFields = ['technicalQuestions', 'behavioralQuestions', 'skillGaps', 'preparationPlan'];
        arrayFields.forEach(field => {
            if (!Array.isArray(interViewReportByAi[field])) {
                interViewReportByAi[field] = [];
            }
        });

        const interviewReport = await interviewReportModel.create({
            title: title || interViewReportByAi.title || "Untitled Position",
            user: req.user.id,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            candidateName: interViewReportByAi.candidateName || "Candidate",
            matchScore: interViewReportByAi.matchScore,
            technicalQuestions: interViewReportByAi.technicalQuestions,
            behavioralQuestions: interViewReportByAi.behavioralQuestions,
            skillGaps: interViewReportByAi.skillGaps,
            preparationPlan: interViewReportByAi.preparationPlan,
        })

        console.log("Report saved to DB:", interviewReport._id);

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })

    } catch (error) {
        console.error("generateInterViewReportController Error:", error);
        res.status(500).json({ 
            message: error.message || "Failed to generate interview report. Please try again." 
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("getInterviewReportByIdController Error:", error);
        res.status(500).json({ message: "Failed to fetch report." })
    }
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        console.error("getAllInterviewReportsController Error:", error);
        res.status(500).json({ message: "Failed to fetch reports." })
    }
}


/**
 * @description Controller to generate resume PDF based on stored interview report data.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        console.log("=== GENERATING PDF ===");
        console.log("Report ID:", interviewReportId);
        console.log("Resume text available:", resume ? resume.length + " chars" : "NONE");

        if (!resume && !selfDescription) {
            return res.status(400).json({ message: "No resume data found for this report. Cannot generate PDF." })
        }

        const pdfBuffer = await generateResumePdf({ resume: resume || "", jobDescription: jobDescription || "", selfDescription: selfDescription || "" })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
            "Content-Length": pdfBuffer.length
        })

        res.send(pdfBuffer)

    } catch (error) {
        console.error("generateResumePdfController Error:", error);
        res.status(500).json({ 
            message: error.message || "Failed to generate PDF. Please try again." 
        })
    }
}

/**
 * @description Controller to generate resume HTML for preview.
 */
async function generateResumeHtmlController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport

        console.log("=== GENERATING PREVIEW HTML ===");
        console.log("Report ID:", interviewReportId);
        console.log("Resume text available:", resume ? resume.length + " chars" : "NONE");

        if (!resume && !selfDescription) {
            return res.status(400).json({ message: "No resume data found for this report. Cannot generate preview." })
        }

        const html = await generateResumeHtml({ resume: resume || "", jobDescription: jobDescription || "", selfDescription: selfDescription || "" })

        res.status(200).json({
            message: "Resume HTML generated successfully.",
            html
        })

    } catch (error) {
        console.error("generateResumeHtmlController Error:", error);
        res.status(500).json({ 
            message: error.message || "Failed to generate resume preview. Please try again." 
        })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController, generateResumeHtmlController }