import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, getResumeHtml } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"
import toast from "react-hot-toast"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        const loadingToast = toast.loading("AI is analyzing your profile...")
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
            toast.success("Strategy generated successfully!", { id: loadingToast })
            return response.interviewReport
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to generate strategy. Please try again."
            toast.error(msg, { id: loadingToast })
            console.error("generateReport error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (id) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(id)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            toast.error("Failed to load interview report.")
            console.error("getReportById error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            toast.error("Failed to load dashboard.")
            console.error("getReports error:", error)
        } finally {
            setLoading(false)
        }
    }

    const getResumePdf = async (id) => {
        const downloadToast = toast.loading("Generating your PDF... This may take a moment.")
        try {
            const response = await generateResumePdf({ interviewReportId: id })
            
            // Verify that we received valid blob data
            if (!response || response.size === 0) {
                throw new Error("Received empty PDF response")
            }

            const url = window.URL.createObjectURL(new Blob([ response ], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `resume_${id}.pdf`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success("Resume downloaded!", { id: downloadToast })
        }
        catch (error) {
            const msg = error.response?.data?.message || "Failed to download PDF. Please try again."
            toast.error(msg, { id: downloadToast })
            console.error("getResumePdf error:", error)
        }
    }

    const getResumeHtmlData = async (id) => {
        const previewToast = toast.loading("Preparing preview...")
        try {
            const data = await getResumeHtml({ interviewReportId: id })
            
            if (!data || !data.html) {
                throw new Error("No HTML content received from server")
            }

            toast.success("Preview ready!", { id: previewToast })
            return data.html
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to prepare preview. Please try again."
            toast.error(msg, { id: previewToast })
            console.error("getResumeHtmlData error:", error)
            return null
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, getResumeHtmlData }

}