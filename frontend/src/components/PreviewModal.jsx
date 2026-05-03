import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, Edit3, Shield } from 'lucide-react'
import './PreviewModal.scss'

const PreviewModal = ({ isOpen, onClose, htmlContent, onDownload }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="preview-modal-overlay">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="modal-backdrop"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 40 }}
                        className="preview-modal"
                    >
                        <div className="preview-modal__header">
                            <div className="header-left">
                                <div className="icon-box"><FileText size={20} /></div>
                                <div>
                                    <h2>Resume Preview</h2>
                                    <div className="status">
                                        <Shield size={12} /> AI Verified • ATS Friendly
                                    </div>
                                </div>
                            </div>
                            <button onClick={onClose} className="close-btn"><X size={20} /></button>
                        </div>
                        
                        <div className="preview-modal__body">
                            <div className="resume-frame-wrapper">
                                <iframe 
                                    title="Resume Preview"
                                    srcDoc={htmlContent}
                                    className="resume-iframe"
                                    frameBorder="0"
                                />
                            </div>
                        </div>

                        <div className="preview-modal__footer">
                            <div className="footer-left">
                                <p>Ready to apply? Your resume is optimized for <strong>High Success Rate</strong>.</p>
                            </div>
                            <div className="footer-right">
                                <button onClick={onClose} className="secondary-btn">
                                    <Edit3 size={18} /> Back to Dashboard
                                </button>
                                <button onClick={onDownload} className="primary-btn">
                                    <Download size={18} /> Download PDF
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default PreviewModal
