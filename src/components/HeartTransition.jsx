import React, { useEffect, useState, useRef } from 'react'; // 👈 Import useRef
import '../HeartTransition.css';
import { useLocation } from 'react-router';

const HeartTransition = ({ children }) => {
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const isInitialMount = useRef(true);
    const previousPathname = useRef(location.pathname);

    useEffect(() => {
        let isMounted = true;
        
        if (isInitialMount.current) {
            // Skip transition on initial mount (after opening animation)
            isInitialMount.current = false;
            previousPathname.current = location.pathname;
            setLoading(false);
            return;
        }

        // Only show transition when navigating TO /love-Letter from another route
        if (location.pathname === '/love-Letter' && previousPathname.current !== '/love-Letter') {
            setLoading(true);
            const minTime = new Promise(res => setTimeout(res, 7000));
            const loadDone = new Promise(res => window.requestIdleCallback(res, { timeout: 2000 }));

            Promise.all([minTime, loadDone]).then(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });
        } else {
            // No transition needed for other route changes
            setLoading(false);
        }

        previousPathname.current = location.pathname;

        return () => {
            isMounted = false;
        };
    }, [location.pathname]);


    return (
        <>
            {loading && (
                <div className="route-loader">
                    <main className='bg-[#8b0000] HeartTransisitonOpen'>
                        <svg className="heart-loader" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 90 90" version="1.1">
                            <g className="heart-loader__group">
                                <path className="heart-loader__square" strokeWidth="1" fill="none" d="M0,30 0,90 60,90 60,30z" />
                                <path className="heart-loader__circle m--left" strokeWidth="1" fill="none" d="M60,60 a30,30 0 0,1 -60,0 a30,30 0 0,1 60,0" />
                                <path className="heart-loader__circle m--right" strokeWidth="1" fill="none" d="M60,60 a30,30 0 0,1 -60,0 a30,30 0 0,1 60,0" />
                                <path className="heart-loader__heartPath" strokeWidth="2" d="M60,30 a30,30 0 0,1 0,60 L0,90 0,30 a30,30 0 0,1 60,0" />
                            </g>
                        </svg>
                    </main>

                </div>
            )}

            <div style={{ opacity: loading ? 0.3 : 1, transition: "opacity 0.3s ease" }}>
                {children}
            </div>
        </>
    )
}

export default HeartTransition