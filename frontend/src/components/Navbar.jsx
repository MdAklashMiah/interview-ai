import React from 'react'
import { useAuth } from '../features/auth/hooks/useAuth'
import { Link, useNavigate } from 'react-router'
import "./Navbar.scss"

const Navbar = () => {
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate("/login")
    }

    if (!user) return null

    return (
        <nav className="main-nav">
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    <span>InterviewAI</span>
                </Link>
                <div className="nav-links">
                    <span className="user-greeting">Hi, {user.username}</span>
                    <button onClick={onLogout} className="logout-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
