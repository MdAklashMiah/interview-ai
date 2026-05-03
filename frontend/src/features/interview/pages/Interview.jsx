import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    MessageSquare, 
    Zap, 
    Map, 
    Download, 
    ChevronDown, 
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Target,
    Activity,
    Eye,
    ChevronRight,
    Trophy
} from 'lucide-react'
import { useInterview } from '../hooks/useInterview'
import PreviewModal from '../../../components/PreviewModal'
import "../style/interview.scss"

const Interview = () => {
    const { interviewId } = useParams()
    const navigate = useNavigate()
    const { getReportById, report, loading, getResumeHtmlData, getResumePdf } = useInterview()
    
    const [activeTab, setActiveTab] = useState("technical")
    const [expandedQuestion, setExpandedQuestion] = useState(null)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [resumeHtml, setResumeHtml] = useState('')
    const [preparingPreview, setPreparingPreview] = useState(false)

    useEffect(() => {
        if (interviewId) getReportById(interviewId)
    }, [interviewId])

    const handlePreview = async () => {
        setPreparingPreview(true)
        const html = await getResumeHtmlData(interviewId)
        if (html) {
            setResumeHtml(html)
            setIsPreviewOpen(true)
        }
        setPreparingPreview(false)
    }

    if (loading && !report) return (
        <div className='interview-loading'>
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className='loading-box'
            >
                <div className='spinner' />
                <h2>Fetching Strategy...</h2>
            </motion.div>
        </div>
    )

    if (!report) return null

    const tabs = [
        { id: "technical", label: "Technical Mastery", icon: <Zap size={18} />, count: report.technicalQuestions?.length },
        { id: "behavioral", label: "Behavioral Excellence", icon: <MessageSquare size={18} />, count: report.behavioralQuestions?.length },
        { id: "roadmap", label: "Success Roadmap", icon: <Map size={18} /> }
    ]

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='interview-page'
        >
            <header className='interview-header'>
                <div className='header-left'>
                    <button onClick={() => navigate('/')} className='back-btn'>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1>{report.title}</h1>
                        <p>Strategy generated for your profile</p>
                    </div>
                </div>
                <div className='header-right'>
                    <button onClick={handlePreview} className='secondary-btn' disabled={preparingPreview}>
                        {preparingPreview ? <Activity className='spin' size={18} /> : <Eye size={18} />}
                        Preview Resume
                    </button>
                    <button onClick={() => getResumePdf(interviewId)} className='primary-btn'>
                        <Download size={18} /> Download PDF
                    </button>
                </div>
            </header>

            <div className='interview-layout'>
                <main className='interview-main'>
                    <nav className='tab-nav'>
                        {tabs.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            >
                                {tab.icon}
                                {tab.label}
                                {tab.count !== undefined && <span className='tab-count'>{tab.count}</span>}
                            </button>
                        ))}
                    </nav>

                    <div className='tab-content'>
                        <AnimatePresence mode='wait'>
                            {activeTab === "technical" && (
                                <motion.section 
                                    key="technical"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className='q-list'
                                >
                                    {report.technicalQuestions?.map((q, idx) => (
                                        <QuestionCard 
                                            key={idx} 
                                            idx={idx} 
                                            q={q} 
                                            isExpanded={expandedQuestion === `tech-${idx}`}
                                            toggle={() => setExpandedQuestion(expandedQuestion === `tech-${idx}` ? null : `tech-${idx}`)}
                                        />
                                    ))}
                                </motion.section>
                            )}

                            {activeTab === "behavioral" && (
                                <motion.section 
                                    key="behavioral"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className='q-list'
                                >
                                    {report.behavioralQuestions?.map((q, idx) => (
                                        <QuestionCard 
                                            key={idx} 
                                            idx={idx} 
                                            q={q} 
                                            isExpanded={expandedQuestion === `beh-${idx}`}
                                            toggle={() => setExpandedQuestion(expandedQuestion === `beh-${idx}` ? null : `beh-${idx}`)}
                                        />
                                    ))}
                                </motion.section>
                            )}

                            {activeTab === "roadmap" && (
                                <motion.section 
                                    key="roadmap"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className='roadmap-view'
                                >
                                    {report.preparationPlan?.map((day, idx) => (
                                        <div key={idx} className='roadmap-step'>
                                            <div className='step-meta'>
                                                <div className='step-number'>Day {day.day}</div>
                                                <div className='step-connector' />
                                            </div>
                                            <div className='step-card'>
                                                <h3>{day.focus}</h3>
                                                <ul className='task-list'>
                                                    {day.tasks?.map((task, tidx) => (
                                                        <li key={tidx}><CheckCircle2 size={14} /> {task}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))}
                                </motion.section>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                <aside className='interview-sidebar'>
                    <div className='sidebar-card match-card'>
                        <div className='card-header'>
                            <Target size={18} />
                            <h3>Profile Match</h3>
                        </div>
                        <div className='score-container'>
                            <div className={`score-ring ${report.matchScore >= 80 ? 'high' : report.matchScore >= 60 ? 'mid' : 'low'}`}>
                                <span className='score-value'>{report.matchScore}</span>
                                <span className='score-symbol'>%</span>
                            </div>
                            <p className='score-label'>Match with Job Description</p>
                        </div>
                    </div>

                    <div className='sidebar-card skill-card'>
                        <div className='card-header'>
                            <Trophy size={18} />
                            <h3>Skill Gaps</h3>
                        </div>
                        <div className='skill-list'>
                            {report.skillGaps?.map((gap, idx) => (
                                <div key={idx} className={`skill-badge ${gap.severity}`}>
                                    {gap.skill}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='sidebar-card info-card'>
                        <Activity size={20} />
                        <p>This strategy was generated by analyzing your profile against the provided job description using Gemini AI.</p>
                    </div>
                </aside>
            </div>

            <PreviewModal 
                isOpen={isPreviewOpen} 
                onClose={() => setIsPreviewOpen(false)} 
                htmlContent={resumeHtml} 
                onDownload={() => getResumePdf(interviewId)}
            />
        </motion.div>
    )
}

const QuestionCard = ({ idx, q, isExpanded, toggle }) => (
    <motion.div 
        layout
        className={`q-card ${isExpanded ? 'expanded' : ''}`}
        onClick={toggle}
    >
        <div className='q-card-header'>
            <span className='q-index'>Q{idx + 1}</span>
            <p className='q-text'>{q.question}</p>
            <ChevronDown size={20} className='arrow' />
        </div>
        <AnimatePresence>
            {isExpanded && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className='q-card-body'
                >
                    <div className='answer-section'>
                        <h4>Interviewer's Goal</h4>
                        <p>{q.intention}</p>
                    </div>
                    <div className='answer-section'>
                        <h4>Recommended Response</h4>
                        <div className='response-box'>
                            {q.answer}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.div>
)

export default Interview