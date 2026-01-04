import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import '../SmallLetter.css';

const SmallLetter = () => {
    // 1. State to control the letter's open/close status
    const [isOpen, setIsOpen] = useState(false);

    // 2. Ref to hold the main letter container DOM element
    // This is needed to manually add/remove the '--close' class for the animation timing
    const letterRef = useRef(null);

    // 3. Navigation hook
    const navigate = useNavigate();

    // --- Logic for Envelope Click (Navigate to LoveLetter) ---

    const handleToggleLetter = () => {
        // Navigate to LoveLetter page when envelope is clicked
        navigate('/love-Letter');
    };

    // --- Logic for 'X' Click (Close Only) ---

    const handleCloseLetter = () => {
        const letterElement = letterRef.current;
        if (!letterElement) return; // Safety check

        // Start the close animation immediately
        letterElement.classList.remove('small-rajib-letter--open');
        letterElement.classList.add('small-rajib-letter--close');
        setIsOpen(false); // Update state to reflect closed status

        // Remove the closing class after the animation duration (600ms)
        setTimeout(() => {
            letterElement.classList.remove('small-rajib-letter--close');
        }, 600);
    };

    // Determine the dynamic class based on 'isOpen' state
    const letterStateClass = isOpen ? 'small-rajib-letter--open' : '';

    return (
        <>
            <div
                className={`small-rajib-letter ${letterStateClass}`}
                ref={letterRef} // Attach the ref here
            >
                <div
                    className="small-rajib-envelope"
                    onClick={handleToggleLetter} // Attach the toggle handler
                >
                    <div className="small-rajib-envelope-flap"></div>
                    <div className="small-rajib-envelope-paper"></div>
                    <div className="small-rajib-envelope-detail"></div>
                    {!isOpen && <div className="small-rajib-envelope-click-text">Click</div>}
                </div>

                <div className="small-rajib-paper">
    <div className="small-rajib-paper-content">
        <div
            className="small-rajib-paper-close"
            onClick={handleCloseLetter} // Attach the close handler
        >
            x
        </div>
        <p>Yo brocaccho,<br /><br />Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud <br /><br />Rajib</p>
    </div>

    {/* --- NEW SVG DIARY PAGE DECORATION --- */}
    <svg className="rajib-diary-deco" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Left 'binding' line */}
        <line x1="5" y1="0" x2="5" y2="100" stroke="#E0DDB7" strokeWidth="1" className="diary-line left-line" />
        {/* Right 'border' line */}
        <line x1="95" y1="0" x2="95" y2="100" stroke="#E0DDB7" strokeWidth="1" className="diary-line right-line" />
        
        {/* Optional: Top/bottom faint lines for page feel */}
        <line x1="0" y1="5" x2="100" y2="5" stroke="#E0DDB7" strokeWidth="0.5" className="diary-line top-line" />
        <line x1="0" y1="95" x2="100" y2="95" stroke="#E0DDB7" strokeWidth="0.5" className="diary-line bottom-line" />
        
        {/* Subtle, pulsing dots along the left (like stitching) */}
        <circle cx="5" cy="10" r="0.5" fill="#E0DDB7" className="diary-dot dot-1" />
        <circle cx="5" cy="20" r="0.5" fill="#E0DDB7" className="diary-dot dot-2" />
        <circle cx="5" cy="30" r="0.5" fill="#E0DDB7" className="diary-dot dot-3" />
        <circle cx="5" cy="40" r="0.5" fill="#E0DDB7" className="diary-dot dot-4" />
        <circle cx="5" cy="50" r="0.5" fill="#E0DDB7" className="diary-dot dot-5" />
        <circle cx="5" cy="60" r="0.5" fill="#E0DDB7" className="diary-dot dot-6" />
        <circle cx="5" cy="70" r="0.5" fill="#E0DDB7" className="diary-dot dot-7" />
        <circle cx="5" cy="80" r="0.5" fill="#E0DDB7" className="diary-dot dot-8" />
        <circle cx="5" cy="90" r="0.5" fill="#E0DDB7" className="diary-dot dot-9" />
    </svg>
    
</div>
            </div>
        </>
    )
}

export default SmallLetter;