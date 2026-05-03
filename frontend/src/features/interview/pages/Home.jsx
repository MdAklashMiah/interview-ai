import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Upload, 
    FileText, 
    ChevronRight, 
    Briefcase, 
    User, 
    CheckCircle2,
    Loader2,
    Sparkles,
    ShieldCheck,
    Zap
} from 'lucide-react'
import { useInterview } from '../hooks/useInterview'
import { useNavigate } from 'react-router'
import "../style/home.scss"

const STEPS = [
    { id: 'analyzing', label: 'Analyzing Resume', icon: <FileText size={20} /> },
    { id: 'extracting', label: 'Extracting Skills', icon: <Briefcase size={20} /> },
    { id: 'generating', label: 'Generating Strategy', icon: <Sparkles size={20} /> },
    { id: 'finalizing', label: 'Polishing Output', icon: <CheckCircle2 size={20} /> }
]

const Home = () => {
    const [file, setFile] = useState(null)
    const [jobDescription, setJobDescription] = useState('')
    const [selfDescription, setSelfDescription] = useState('')
    const [currentLoadingStep, setCurrentLoadingStep] = useState(0)
    
    const { generateReport, loading } = useInterview()
    const navigate = useNavigate()

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) setFile(selectedFile)
    }

    const startLoadingSequence = () => {
        setCurrentLoadingStep(0)
        const interval = setInterval(() => {
            setCurrentLoadingStep(prev => {
                if (prev >= STEPS.length - 1) {
                    clearInterval(interval)
                    return prev
                }
                return prev + 1
            })
        }, 1500)
    }

    const handleGenerate = async () => {
        startLoadingSequence()
        const report = await generateReport({ 
            jobDescription, 
            selfDescription, 
            resumeFile: file 
        })
        if (report) {
            navigate(`/interview/${report._id}`)
        }
    }

    return (
        <div className='home-container'>
            <section className='hero-section'>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='hero-content'
                >
                    <div className='badge'>
                        <Zap size={14} /> Powered by Gemini 1.5 Flash
                    </div>
                    <h1>Your AI-Powered <span className='gradient-text'>Interview Edge</span></h1>
                    <p>Transform your professional profile into a high-converting interview strategy. Tailored questions, expert roadmaps, and instant resume optimization.</p>
                </motion.div>
            </section>

            <main className='main-form-area'>
                <AnimatePresence mode='wait'>
                    {loading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className='loading-card'
                        >
                            <div className='loading-header'>
                                <div className='pulse-circle'>
                                    <Loader2 className='spinner-icon' />
                                </div>
                                <h2>Brewing your strategy...</h2>
                                <p>Our AI agents are working hard to curate your personalized plan.</p>
                            </div>
                            <div className='steps-progress'>
                                {STEPS.map((step, idx) => (
                                    <div key={step.id} className={`step-item ${idx <= currentLoadingStep ? 'active' : ''} ${idx < currentLoadingStep ? 'completed' : ''}`}>
                                        <div className='step-icon'>
                                            {idx < currentLoadingStep ? <CheckCircle2 size={18} /> : step.icon}
                                        </div>
                                        <span>{step.label}</span>
                                        {idx === currentLoadingStep && <div className='step-indicator' />}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className='dashboard-card'
                        >
                            <div className='form-grid'>
                                <div className='form-left'>
                                    <div className='input-group'>
                                        <label><Briefcase size={16} /> Target Role & Description</label>
                                        <textarea 
                                            placeholder='Paste the job description here... (Min 50 chars)'
                                            value={jobDescription}
                                            onChange={(e) => setJobDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className='input-group'>
                                        <label><User size={16} /> About You (Optional)</label>
                                        <textarea 
                                            placeholder='Highlight specific achievements or focus areas...'
                                            value={selfDescription}
                                            onChange={(e) => setSelfDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className='form-right'>
                                    <div className='upload-area'>
                                        <label>Resume Upload</label>
                                        <div className={`dropzone ${file ? 'has-file' : ''}`}>
                                            <input type="file" onChange={handleFileChange} accept=".pdf" id="resume-upload" />
                                            <label htmlFor="resume-upload" className='dropzone-content'>
                                                {file ? (
                                                    <>
                                                        <CheckCircle2 size={40} className='success-icon' />
                                                        <p className='file-name'>{file.name}</p>
                                                        <span className='change-file'>Click to replace</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={40} className='upload-icon' />
                                                        <p>Drop your resume here or click to browse</p>
                                                        <span>Supports PDF only</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    <button 
                                        className='generate-btn'
                                        disabled={!jobDescription || jobDescription.length < 50}
                                        onClick={handleGenerate}
                                    >
                                        Generate Strategy <ChevronRight size={18} />
                                    </button>

                                    <div className='trust-badges'>
                                        <div className='trust-item'><ShieldCheck size={14} /> Data Encrypted</div>
                                        <div className='trust-item'><Sparkles size={14} /> AI Tailored</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

export default Home