import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import BookCanvas from '../components/BookCanvas'
import memoryMediaData from '../data/memoryMedia'

// Memoized Memory Card Component for better performance
const MemoryCard = React.memo(({
    media,
    index,
    isActive,
    currentIndex,
    onLoad,
    onError,
    videoRef,
    audioRef,
    muted,
    reduceMotion
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [imageOrientation, setImageOrientation] = useState('landscape'); // 'landscape' or 'portrait'
    const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9);
    const [currentImageSrc, setCurrentImageSrc] = useState(media.src);
    const imgRef = useRef(null);
    const containerRef = useRef(null);
    const imageElementRef = useRef(null);

    // Reset state when media source changes - crucial for preventing ghost images
    useEffect(() => {
        if (media.src !== currentImageSrc) {
            // Reset all states when image changes
            setIsLoaded(false);
            setHasError(false);
            setImageOrientation('landscape');
            setImageAspectRatio(16 / 9);
            setCurrentImageSrc(media.src);

            // Clear any existing image element
            if (imageElementRef.current) {
                imageElementRef.current.src = '';
                imageElementRef.current = null;
            }
        }
    }, [media.src, currentImageSrc]);

    // Detect image orientation and dimensions
    const detectImageOrientation = useCallback((img) => {
        if (img && img.naturalWidth && img.naturalHeight) {
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            setImageAspectRatio(aspectRatio);
            setImageOrientation(aspectRatio >= 1 ? 'landscape' : 'portrait');
        }
    }, []);

    // Cleanup effect - clear image when component unmounts or media changes
    useEffect(() => {
        return () => {
            // Cleanup on unmount or media change
            if (imageElementRef.current) {
                imageElementRef.current.src = '';
                imageElementRef.current = null;
            }
            setIsLoaded(false);
        };
    }, [media.src]);

    // Lazy load images using Intersection Observer
    useEffect(() => {
        if (media.type === 'image' && imgRef.current && media.src === currentImageSrc) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !isLoaded && media.src === currentImageSrc) {
                            const img = new Image();
                            img.onload = () => {
                                // Only update if still the current image
                                if (media.src === currentImageSrc) {
                                    detectImageOrientation(img);
                                    setIsLoaded(true);
                                    if (onLoad) onLoad();
                                }
                            };
                            img.onerror = () => {
                                if (media.src === currentImageSrc) {
                                    setHasError(true);
                                    if (onError) onError();
                                }
                            };
                            img.src = media.src;
                        }
                    });
                },
                {
                    rootMargin: '50px', // Start loading 50px before visible
                    threshold: 0.01
                }
            );

            observer.observe(imgRef.current);
            return () => {
                observer.disconnect();
            };
        }
    }, [media, isLoaded, onLoad, onError, detectImageOrientation, currentImageSrc]);

    // Note: Orientation detection is handled in onLoad handler of the img element

    // Preload adjacent images
    const shouldLoad = useMemo(() => {
        return isActive || Math.abs(index - currentIndex) <= 1;
    }, [isActive, index, currentIndex]);

    if (hasError) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '1rem'
            }}>
                Failed to load
            </div>
        );
    }

    // Adaptive frame dimensions based on orientation
    // CSS handles responsive sizing, we set the aspect ratio to maintain image proportions
    const frameStyles = useMemo(() => {
        if (imageOrientation === 'portrait') {
            // Vertical frame: taller than wide - let CSS constrain size, aspect-ratio maintains proportions
            return {
                aspectRatio: imageAspectRatio > 0 ? `${imageAspectRatio}` : '3/4',
            };
        } else {
            // Horizontal frame: wider than tall
            return {
                aspectRatio: imageAspectRatio > 0 ? `${imageAspectRatio}` : '16/9',
            };
        }
    }, [imageOrientation, imageAspectRatio]);

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(8px, 2vw, 20px)',
            }}
        >
            <div
                ref={media.type === 'image' ? imgRef : null}
                className={`memory-frame memory-frame-${imageOrientation}`}
                style={{
                    ...frameStyles,
                    borderRadius: 'clamp(15px, 2vw, 20px)',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255, 107, 107, 0.2)',
                    border: '3px solid rgba(255, 255, 255, 0.2)',
                    background: media.type === 'image' && !isLoaded ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(5px)',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    isolation: 'isolate', // Create new stacking context to prevent ghosting
                }}
            >
                {media.type === 'video' ? (
                    <>
                        {media.thumbnail && (
                            <img
                                src={media.thumbnail}
                                alt={`Video thumbnail ${index + 1}`}
                                loading="lazy"
                                style={{
                                    position: 'absolute',
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center center',
                                    opacity: 0.3,
                                    zIndex: 1,
                                }}
                            />
                        )}
                        {shouldLoad ? (
                            <video
                                ref={videoRef}
                                src={media.src}
                                className="memory-video"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center center',
                                    display: 'block',
                                    position: 'relative',
                                    zIndex: 2,
                                }}
                                controls
                                playsInline
                                loop
                                muted={muted}
                                preload={isActive ? 'auto' : 'metadata'}
                                onError={() => {
                                    setHasError(true);
                                    if (onError) onError();
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                background: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff'
                            }}>
                                Loading...
                            </div>
                        )}
                    </>
                ) : media.type === 'audio' ? (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2) 0%, rgba(238, 90, 111, 0.2) 100%)',
                        padding: 'clamp(20px, 5vw, 40px)',
                        gap: '20px',
                    }}>
                        <div style={{
                            fontSize: 'clamp(48px, 8vw, 80px)',
                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
                        }}>
                            🎵
                        </div>
                        {shouldLoad ? (
                            <audio
                                ref={audioRef}
                                src={media.src}
                                controls
                                loop
                                muted={muted}
                                preload={isActive ? 'auto' : 'metadata'}
                                style={{
                                    width: '100%',
                                    maxWidth: '400px',
                                    height: '50px',
                                    borderRadius: '25px',
                                    outline: 'none',
                                }}
                                onError={() => {
                                    setHasError(true);
                                    if (onError) onError();
                                }}
                                onLoadedData={() => {
                                    setIsLoaded(true);
                                    if (onLoad) onLoad();
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                maxWidth: '400px',
                                height: '50px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '25px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff'
                            }}>
                                Loading...
                            </div>
                        )}
                        <div style={{
                            color: '#fff',
                            fontSize: 'clamp(14px, 2vw, 18px)',
                            fontFamily: '"Sriracha", cursive',
                            textAlign: 'center',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                        }}>
                            Music Player
                        </div>
                    </div>
                ) : (
                    <>
                        {isLoaded || shouldLoad ? (
                            <img
                                key={`memory-image-${media.src}-${index}`}
                                ref={(el) => {
                                    imageElementRef.current = el;
                                }}
                                src={media.src}
                                alt={`Memory ${index + 1}`}
                                className={`memory-image memory-image-${imageOrientation}`}
                                loading={shouldLoad ? 'eager' : 'lazy'}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center center',
                                    display: isLoaded ? 'block' : 'none',
                                    opacity: isLoaded ? 1 : 0,
                                    transition: reduceMotion ? 'none' : (isLoaded ? 'opacity 0.3s ease-in-out' : 'none'),
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    zIndex: 2,
                                    backgroundColor: 'transparent',
                                    willChange: isLoaded ? 'opacity' : 'auto',
                                }}
                                onLoad={(e) => {
                                    const img = e.target;
                                    // Only process if this is still the current image
                                    if (img.src === media.src && media.src === currentImageSrc) {
                                        if (img.naturalWidth && img.naturalHeight) {
                                            detectImageOrientation(img);
                                        }
                                        setIsLoaded(true);
                                        if (onLoad) onLoad();
                                        // Force display
                                        img.style.display = 'block';
                                        img.style.opacity = '1';
                                    }
                                }}
                                onError={(e) => {
                                    const img = e.target;
                                    if (img.src === media.src) {
                                        setHasError(true);
                                        img.style.display = 'none';
                                        if (onError) onError();
                                    }
                                }}
                                onLoadStart={() => {
                                    // Reset display when loading starts
                                    if (imageElementRef.current) {
                                        imageElementRef.current.style.display = 'none';
                                        imageElementRef.current.style.opacity = '0';
                                    }
                                }}
                            />
                        ) : null}
                        {/* Loading indicator - only show when not loaded */}
                        {!isLoaded && shouldLoad && (
                            <div
                                key={`loading-${media.src}`}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    background: 'rgba(0, 0, 0, 0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    zIndex: 1,
                                }}
                            >
                                Loading...
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
});

MemoryCard.displayName = 'MemoryCard';

const LoveLetter = () => {
    const [Active, SetActive] = useState(true);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [showMemories, setShowMemories] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);
    const [complimentIndex, setComplimentIndex] = useState(0);
    const sliderRef = useRef(null);
    const videoRefs = useRef([]);
    const audioRefs = useRef([]);
    const resizeTimeoutRef = useRef(null);
    const touchMoveTimeoutRef = useRef(null);

    // Persisted preferences
    useEffect(() => {
        const storedSound = localStorage.getItem('birthday_sound_enabled');
        const storedMotion = localStorage.getItem('birthday_reduce_motion');
        setSoundEnabled(storedSound === 'true');
        setReduceMotion(storedMotion === 'true');
    }, []);

    useEffect(() => {
        localStorage.setItem('birthday_sound_enabled', soundEnabled ? 'true' : 'false');
    }, [soundEnabled]);

    useEffect(() => {
        localStorage.setItem('birthday_reduce_motion', reduceMotion ? 'true' : 'false');
    }, [reduceMotion]);

    // Memory media array - memoized to prevent recreation
    const memoryMedia = useMemo(() => memoryMediaData, []);

    // Sweet rotating compliments to keep the vibe fresh
    const complimentPhrases = useMemo(() => ([
        'You make every room brighter. ✨',
        'Your smile is my favorite view.',
        'Thanks for being you—exactly you.',
        'Today is yours; enjoy every second!',
        'You are loved more than you know.',
    ]), []);

    // Debounced resize handler
    useEffect(() => {
        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 150);
        };

        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, []);

    // Memoized window width check
    const isMobile = useMemo(() => windowWidth < 768, [windowWidth]);

    // Optimized navigation handlers with transition lock
    const handleNext = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentImageIndex((prevIndex) => {
            const nextIndex = prevIndex === memoryMedia.length - 1 ? 0 : prevIndex + 1;

            // Pause current video/audio if playing
            if (videoRefs.current[prevIndex] && memoryMedia[prevIndex].type === 'video') {
                videoRefs.current[prevIndex].pause();
            }
            if (audioRefs.current[prevIndex] && memoryMedia[prevIndex].type === 'audio') {
                audioRefs.current[prevIndex].pause();
            }

            // Preload next video
            if (videoRefs.current[nextIndex] && memoryMedia[nextIndex].type === 'video') {
                const video = videoRefs.current[nextIndex];
                video.load(); // Force load
                setTimeout(() => {
                    if (video && !video.paused) {
                        video.play().catch(() => {
                            // Autoplay prevented
                        });
                    }
                }, 200);
            }

            // Preload next audio
            if (audioRefs.current[nextIndex] && memoryMedia[nextIndex].type === 'audio') {
                const audio = audioRefs.current[nextIndex];
                audio.load(); // Force load
            }

            setTimeout(() => setIsTransitioning(false), 300);
            return nextIndex;
        });
    }, [memoryMedia, isTransitioning]);

    const handlePrevious = useCallback(() => {
        if (isTransitioning) return;

        setIsTransitioning(true);
        setCurrentImageIndex((prevIndex) => {
            const prevIdx = prevIndex === 0 ? memoryMedia.length - 1 : prevIndex - 1;

            // Pause current video/audio if playing
            if (videoRefs.current[prevIndex] && memoryMedia[prevIndex].type === 'video') {
                videoRefs.current[prevIndex].pause();
            }
            if (audioRefs.current[prevIndex] && memoryMedia[prevIndex].type === 'audio') {
                audioRefs.current[prevIndex].pause();
            }

            // Preload previous video
            if (videoRefs.current[prevIdx] && memoryMedia[prevIdx].type === 'video') {
                const video = videoRefs.current[prevIdx];
                video.load(); // Force load
                setTimeout(() => {
                    if (video && !video.paused) {
                        video.play().catch(() => {
                            // Autoplay prevented
                        });
                    }
                }, 200);
            }

            // Preload previous audio
            if (audioRefs.current[prevIdx] && memoryMedia[prevIdx].type === 'audio') {
                const audio = audioRefs.current[prevIdx];
                audio.load(); // Force load
            }

            setTimeout(() => setIsTransitioning(false), 300);
            return prevIdx;
        });
    }, [memoryMedia, isTransitioning]);

    const handleToggleMemories = useCallback(() => {
        setShowMemories((prev) => {
            if (!prev) {
                setCurrentImageIndex(0);
            } else {
                // Pause all videos and audio when closing
                videoRefs.current.forEach((videoRef) => {
                    if (videoRef) {
                        videoRef.pause();
                        videoRef.currentTime = 0;
                    }
                });
                audioRefs.current.forEach((audioRef) => {
                    if (audioRef) {
                        audioRef.pause();
                        audioRef.currentTime = 0;
                    }
                });
            }
            return !prev;
        });
    }, []);

    // Auto-play video/audio when it becomes active - optimized
    useEffect(() => {
        if (!showMemories) return;

        const currentMedia = memoryMedia[currentImageIndex];
        if (currentMedia?.type === 'video') {
            const videoRef = videoRefs.current[currentImageIndex];
            if (videoRef) {
                // Use requestAnimationFrame for smoother playback
                requestAnimationFrame(() => {
                    if (videoRef) {
                        videoRef.load();
                        videoRef.play().catch(() => {
                            // Autoplay prevented
                        });
                    }
                });
            }
        }

        // Pause all other videos and audio efficiently
        videoRefs.current.forEach((videoRef, index) => {
            if (videoRef && index !== currentImageIndex) {
                videoRef.pause();
            }
        });
        audioRefs.current.forEach((audioRef, index) => {
            if (audioRef && index !== currentImageIndex) {
                audioRef.pause();
            }
        });
    }, [currentImageIndex, showMemories, memoryMedia]);

    // Optimized touch handlers with passive listeners and debouncing
    const minSwipeDistance = 30;

    const onTouchStart = useCallback((e) => {
        if (touchMoveTimeoutRef.current) {
            clearTimeout(touchMoveTimeoutRef.current);
        }
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    }, []);

    const onTouchMove = useCallback((e) => {
        // Debounce touch move to reduce re-renders
        if (touchMoveTimeoutRef.current) {
            clearTimeout(touchMoveTimeoutRef.current);
        }
        touchMoveTimeoutRef.current = setTimeout(() => {
            setTouchEnd(e.targetTouches[0].clientX);
        }, 10);
    }, []);

    const onTouchEnd = useCallback(() => {
        if (touchMoveTimeoutRef.current) {
            clearTimeout(touchMoveTimeoutRef.current);
        }

        if (!touchStart || !touchEnd || isTransitioning) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            handleNext();
        } else if (isRightSwipe) {
            handlePrevious();
        }

        // Reset touch states
        setTouchStart(null);
        setTouchEnd(null);
    }, [touchStart, touchEnd, isTransitioning, handleNext, handlePrevious]);

    // Prevent body scroll when slider is open
    useEffect(() => {
        if (showMemories) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
        };
    }, [showMemories]);

    // Handle keyboard navigation - optimized
    useEffect(() => {
        if (!showMemories) return;

        const handleKeyPress = (e) => {
            if (isTransitioning) return;

            if (e.key === 'ArrowLeft') {
                handlePrevious();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'Escape') {
                setShowMemories(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress, { passive: true });
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showMemories, handlePrevious, handleNext, isTransitioning]);

    // Preload adjacent images for smoother transitions
    useEffect(() => {
        if (!showMemories) return;

        const preloadIndices = [
            currentImageIndex - 1 >= 0 ? currentImageIndex - 1 : memoryMedia.length - 1,
            currentImageIndex + 1 < memoryMedia.length ? currentImageIndex + 1 : 0,
        ];

        preloadIndices.forEach((index) => {
            const media = memoryMedia[index];
            if (media && media.type === 'image') {
                const img = new Image();
                img.src = media.src;
            }
        });
    }, [currentImageIndex, showMemories, memoryMedia]);

    // Memoized button styles to prevent recalculation
    const buttonStyles = useMemo(() => ({
        openBtn: {
            position: 'fixed',
            bottom: isMobile ? '20px' : '30px',
            right: isMobile ? '20px' : '30px',
            zIndex: 100,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #d63031 100%)',
            border: 'none',
            borderRadius: '60px',
            padding: isMobile ? '12px 24px' : '18px 40px',
            color: '#fff',
            fontSize: isMobile ? '1rem' : '1.4rem',
            fontFamily: '"Sriracha", cursive',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(214, 48, 49, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.1), inset 0 2px 10px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            overflow: 'hidden',
        },
        memoriesBtn: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #d63031 100%)',
            border: 'none',
            borderRadius: '50px',
            padding: isMobile ? '14px 28px' : '16px 36px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            fontFamily: '"Sriracha", cursive',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(214, 48, 49, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.1), inset 0 2px 10px rgba(255, 255, 255, 0.2)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            overflow: 'hidden',
        }
    }), [isMobile]);

    // Cycle through compliments on a timer
    useEffect(() => {
        const timer = setInterval(() => {
            setComplimentIndex((prev) => (prev + 1) % complimentPhrases.length);
        }, 6500);
        return () => clearInterval(timer);
    }, [complimentPhrases]);

    return (
        <main className='munna bg-[#8b0000] h-screen w-full overflow-hidden'>
            {/* Custom Open Button */}
            <button
                className="munna heart open-envelope-btn"
                id="openEnvelope"
                aria-label="Open Envelope"
                onClick={() => SetActive(false)}
                style={buttonStyles.openBtn}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(214, 48, 49, 0.6), 0 0 0 6px rgba(255, 255, 255, 0.15), inset 0 2px 15px rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff7675 0%, #fd79a8 50%, #e84393 100%)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(214, 48, 49, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.1), inset 0 2px 10px rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #d63031 100%)';
                }}
            >
                <svg
                    width={isMobile ? "20" : "24"}
                    height={isMobile ? "20" : "24"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                        animation: 'heartBeat 1.5s ease-in-out infinite',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                        willChange: 'transform'
                    }}
                >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="munna heart-text" style={{
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    zIndex: 1
                }}>click here</span>
                <style>{`
                    @keyframes heartBeat {
                        0%, 100% { transform: scale(1); }
                        25% { transform: scale(1.15); }
                        50% { transform: scale(1); }
                        75% { transform: scale(1.1); }
                    }
                    .open-envelope-btn::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: -100%;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                        transition: left 0.5s;
                    }
                    .open-envelope-btn:hover::before {
                        left: 100%;
                    }
                    @media (max-width: 768px) {
                        .open-envelope-btn {
                            padding: 12px 24px !important;
                            font-size: 0.5rem !important;
                            letter-spacing: 1px !important;
                        }
                        .open-envelope-btn svg {
                            width: 18px !important;
                            height: 18px !important;
                        }
                    }
                    @media (max-width: 480px) {
                        .open-envelope-btn {
                            padding: 20px 20px !important;
                            font-size: 0.9rem !important;
                            gap: 8px !important;
                        }
                        .heart-text {
                            font-size: 0.9rem !important;
                        }
                        .open-envelope-btn svg {
                            width: 16px !important;
                            height: 16px !important;
                            display: block !important;
                        }
                    }
                `}</style>
            </button>

            {/* BookCanvas Component */}
            <BookCanvas active={Active} setActive={SetActive} />

            {/* Compliment ticker */}
            <div
                style={{
                    position: 'fixed',
                    top: isMobile ? '10px' : '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.85) 0%, rgba(238, 90, 111, 0.85) 100%)',
                    color: '#fff',
                    padding: isMobile ? '10px 16px' : '12px 20px',
                    borderRadius: '18px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    fontFamily: '"Sriracha", cursive',
                    letterSpacing: '0.5px',
                    zIndex: 99,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: reduceMotion ? 'none' : 'all 0.3s ease',
                    opacity: showMemories ? 0 : 1,
                    pointerEvents: showMemories ? 'none' : 'auto',
                }}
                onClick={() => setComplimentIndex((prev) => (prev + 1) % complimentPhrases.length)}
                onMouseEnter={(e) => {
                    if (!reduceMotion) e.currentTarget.style.transform = 'translateX(-50%) scale(1.03)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(-50%)';
                }}
                aria-live="polite"
            >
                <span style={{ fontSize: '1.3rem' }}>💝</span>
                <span style={{ whiteSpace: 'nowrap' }}>{complimentPhrases[complimentIndex]}</span>
            </div>

            {/* Memories Button */}
            <button
                className="memories-btn"
                onClick={handleToggleMemories}
                aria-label="View Memories"
                style={buttonStyles.memoriesBtn}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)';
                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(214, 48, 49, 0.6), 0 0 0 6px rgba(255, 255, 255, 0.15), inset 0 2px 15px rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff7675 0%, #fd79a8 50%, #e84393 100%)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(214, 48, 49, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.1), inset 0 2px 10px rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 50%, #d63031 100%)';
                }}
            >
                <svg
                    width={isMobile ? "18" : "22"}
                    height={isMobile ? "18" : "22"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                    }}
                >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                </svg>
                <span style={{
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}>Open</span>
            </button>

            {/* CSS Animations for Love Memories Flow - Optimized */}
            <style>{`
                @keyframes slideUpFromBottom {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                @keyframes slideDownToBottom {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }
                @keyframes memoryImageFadeIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }
                @keyframes softFloat {
                    0%, 100% {
                        transform: translateY(0px) scale(1);
                    }
                    50% {
                        transform: translateY(-8px) scale(1.02);
                    }
                }
                @keyframes fadeInOverlay {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                .memories-slider-overlay {
                    animation: fadeInOverlay 0.4s ease-out;
                    will-change: opacity;
                }
                .memories-slider-container {
                    animation: slideUpFromBottom 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    will-change: transform, opacity;
                }
                .memories-slider-container.closing {
                    animation: slideDownToBottom 0.4s cubic-bezier(0.55, 0.06, 0.68, 0.19);
                }
                .memory-card {
                    animation: memoryImageFadeIn 0.6s ease-out;
                    animation-fill-mode: both;
                    will-change: opacity, transform;
                }
                .memory-card.active {
                    animation: memoryImageFadeIn 0.6s ease-out, softFloat 4s ease-in-out infinite;
                    animation-delay: 0s, 0.6s;
                }
                .memory-image {
                    will-change: opacity, transform;
                    image-rendering: -webkit-optimize-contrast;
                    image-rendering: crisp-edges;
                }
                .memory-video {
                    will-change: opacity;
                }
                /* Adaptive Frame System - Responsive Image Handling */
                .memory-frame {
                    container-type: inline-size;
                    min-width: 0;
                    min-height: 0;
                    width: 100%;
                    height: auto;
                    contain: layout style paint; /* Isolate rendering to prevent ghosting */
                    backface-visibility: hidden; /* Prevent rendering artifacts */
                    transform: translateZ(0); /* Force GPU acceleration and new layer */
                }
                .memory-frame-landscape {
                    max-width: min(800px, 90vw);
                    max-height: min(70vh, 85vh);
                    width: min(100%, 800px);
                }
                .memory-frame-portrait {
                    max-width: min(600px, 75vw);
                    max-height: min(85vh, 90vh);
                    width: min(100%, 600px);
                }
                /* Ensure frame fills available space while respecting aspect-ratio */
                .memory-frame-landscape,
                .memory-frame-portrait {
                    height: auto;
                }
                .memory-image {
                    object-fit: cover;
                    object-position: center center;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    transform: translateZ(0);
                    pointer-events: none; /* Prevent interaction issues during transitions */
                }
                /* Hide images that are not loaded to prevent ghosting */
                .memory-image[style*="opacity: 0"],
                .memory-image[style*="display: none"] {
                    visibility: hidden !important;
                    opacity: 0 !important;
                }
                .memory-image-landscape {
                    object-position: center center;
                }
                .memory-image-portrait {
                    object-position: center center;
                }
                .memory-card-wrapper {
                    min-width: 0;
                    min-height: 0;
                    contain: layout style paint; /* Isolate each card */
                    backface-visibility: hidden;
                }
                /* Ensure inactive cards don't show ghost images */
                .memory-card-wrapper:not(.active) .memory-image {
                    opacity: 0 !important;
                    visibility: hidden !important;
                }
                .memory-card-wrapper.active .memory-image {
                    opacity: 1;
                    visibility: visible;
                }
                /* Responsive adjustments for mobile */
                @media (max-width: 768px) {
                    .memory-frame-landscape {
                        max-width: 95vw;
                        max-height: 75vh;
                        aspect-ratio: 16 / 9;
                    }
                    .memory-frame-portrait {
                        max-width: 85vw;
                        max-height: 80vh;
                        aspect-ratio: 3 / 4;
                    }
                }
                @media (max-width: 480px) {
                    .memory-frame-landscape {
                        max-width: 98vw;
                        max-height: 70vh;
                    }
                    .memory-frame-portrait {
                        max-width: 90vw;
                        max-height: 75vh;
                    }
                }
                /* Tablet adjustments */
                @media (min-width: 769px) and (max-width: 1024px) {
                    .memory-frame-landscape {
                        max-width: min(750px, 85vw);
                    }
                    .memory-frame-portrait {
                        max-width: min(550px, 70vw);
                    }
                }
                /* Large desktop adjustments */
                @media (min-width: 1440px) {
                    .memory-frame-landscape {
                        max-width: min(900px, 80vw);
                    }
                    .memory-frame-portrait {
                        max-width: min(650px, 65vw);
                    }
                }
                /* Orientation-specific optimizations */
                @media (orientation: portrait) {
                    .memory-frame-landscape {
                        max-height: min(60vh, 80vh);
                    }
                    .memory-frame-portrait {
                        max-height: min(75vh, 85vh);
                    }
                }
                @media (orientation: landscape) {
                    .memory-frame-landscape {
                        max-height: min(75vh, 85vh);
                    }
                    .memory-frame-portrait {
                        max-height: min(70vh, 80vh);
                    }
                }
                @media (max-width: 768px) {
                    .memories-nav-btn {
                        width: 45px !important;
                        height: 45px !important;
                        font-size: 20px !important;
                    }
                    .memories-close-btn {
                        width: 40px !important;
                        height: 40px !important;
                        font-size: 22px !important;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>

            {/* Love Memories Flow Slider */}
            {showMemories && (
                <div
                    className="memories-slider-overlay"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowMemories(false);
                        }
                    }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(180deg, rgba(139, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.92) 100%)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        paddingBottom: isMobile ? '0' : '20px',
                    }}
                >
                    <div
                        className="memories-slider-container"
                        ref={sliderRef}
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '100%',
                            height: isMobile ? '98%' : '90vh',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                            backdropFilter: 'blur(20px)',
                            borderRadius: isMobile ? '30px 30px 0 0' : '40px 40px 0 0',
                            borderTop: '2px solid rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 -10px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            padding: isMobile ? '20px 15px' : '40px 30px',
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowMemories(false)}
                            className="memories-close-btn"
                            aria-label="Close Memories"
                            style={{
                                position: 'absolute',
                                top: isMobile ? '15px' : '25px',
                                right: isMobile ? '15px' : '30px',
                                background: 'rgba(255, 107, 107, 0.3)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '50%',
                                width: isMobile ? '40px' : '50px',
                                height: isMobile ? '40px' : '50px',
                                color: '#fff',
                                fontSize: isMobile ? '22px' : '28px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1001,
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.5)';
                                e.currentTarget.style.transform = 'rotate(90deg) scale(1.15)';
                                e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)';
                                e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                            }}
                        >
                            ×
                        </button>

                        {/* Title + Controls */}
                        <div
                            style={{
                                position: 'absolute',
                                top: isMobile ? '20px' : '30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 1001,
                                textAlign: 'center',
                            }}
                        >
                            <h2
                                style={{
                                    fontFamily: '"Sriracha", cursive',
                                    fontSize: isMobile ? '1.5rem' : '2rem',
                                    color: '#fff',
                                    textShadow: '0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 107, 107, 0.3)',
                                    margin: '-20px 0 0 0',
                                    letterSpacing: '2px',
                                }}
                            >
                                💖 Memories 💖
                            </h2>
                            <div style={{
                                marginTop: '10px',
                                display: 'flex',
                                gap: '8px',
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    onClick={() => setSoundEnabled((prev) => !prev)}
                                    style={{
                                        background: soundEnabled
                                            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
                                            : 'rgba(0,0,0,0.25)',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.35)',
                                        padding: isMobile ? '8px 12px' : '8px 14px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                        fontFamily: '"Sriracha", cursive',
                                        fontSize: isMobile ? '0.8rem' : '0.95rem',
                                        transition: reduceMotion ? 'none' : 'all 0.25s ease',
                                    }}
                                >
                                    {soundEnabled ? '🔊 Sound On' : '🔇 Sound Off'}
                                </button>
                                <button
                                    onClick={() => setReduceMotion((prev) => !prev)}
                                    style={{
                                        background: reduceMotion
                                            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
                                            : 'rgba(0,0,0,0.25)',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.35)',
                                        padding: isMobile ? '8px 12px' : '8px 14px',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                                        fontFamily: '"Sriracha", cursive',
                                        fontSize: isMobile ? '0.8rem' : '0.95rem',
                                        transition: reduceMotion ? 'none' : 'all 0.25s ease',
                                    }}
                                >
                                    {reduceMotion ? '🌙 Calm Mode' : '✨ Motion Mode'}
                                </button>
                            </div>
                        </div>

                        {/* Full-Width Card Container - Optimized rendering with adaptive frames */}
                        <div
                            className="memories-image-container"
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                marginTop: isMobile ? '50px' : '70px',
                                padding: isMobile ? 'clamp(10px, 2vw, 15px)' : 'clamp(15px, 2vw, 25px)',
                            }}
                        >
                            {memoryMedia.map((media, index) => {
                                const isActive = index === currentImageIndex;
                                const shouldRender = isActive || Math.abs(index - currentImageIndex) <= 1;

                                if (!shouldRender) return null;

                                return (
                                    <div
                                        key={`memory-card-${media.src || index}-${index}`}
                                        className={`memory-card memory-card-wrapper ${isActive ? 'active' : ''}`}
                                        style={{
                                            position: 'absolute',
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: isActive ? 1 : 0,
                                            visibility: isActive ? 'visible' : 'hidden',
                                            transform: `translateX(${(index - currentImageIndex) * 100}%) translateY(${isActive ? '0' : '20px'}) scale(${isActive ? '1' : '0.9'})`,
                                            transition: reduceMotion
                                                ? 'none'
                                                : isTransitioning
                                                    ? 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s'
                                                    : 'none',
                                            pointerEvents: isActive ? 'auto' : 'none',
                                            zIndex: isActive ? 10 : 1,
                                            willChange: reduceMotion ? 'auto' : (isActive ? 'transform, opacity' : 'auto'),
                                        }}
                                    >
                                        <MemoryCard
                                            media={media}
                                            index={index}
                                            isActive={isActive}
                                            currentIndex={currentImageIndex}
                                            videoRef={media.type === 'video' ? (el) => {
                                                videoRefs.current[index] = el;
                                            } : null}
                                            audioRef={media.type === 'audio' ? (el) => {
                                                audioRefs.current[index] = el;
                                            } : null}
                                            muted={!soundEnabled}
                                            reduceMotion={reduceMotion}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Media caption */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: isMobile ? '125px' : '140px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                maxWidth: isMobile ? '88%' : '70%',
                                background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.45) 100%)',
                                color: '#fff',
                                padding: isMobile ? '12px 16px' : '14px 20px',
                                borderRadius: '16px',
                                textAlign: 'center',
                                fontFamily: '"Sriracha", cursive',
                                boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
                                backdropFilter: 'blur(10px)',
                                opacity: reduceMotion ? 0.95 : 1,
                                zIndex: 1001,
                            }}
                        >
                          
                        </div>

                        {/* Navigation Buttons - Optimized */}
                        <button
                            onClick={handlePrevious}
                            className="memories-nav-btn memories-nav-prev"
                            aria-label="Previous Image"
                            disabled={isTransitioning}
                            style={{
                                position: 'absolute',
                                left: isMobile ? '15px' : '30px',
                                bottom: '0',
                                transform: 'translateY(-50%)',
                                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.4) 0%, rgba(238, 90, 111, 0.4) 100%)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '50%',
                                width: isMobile ? '50px' : '65px',
                                height: isMobile ? '50px' : '65px',
                                color: '#fff',
                                fontSize: isMobile ? '28px' : '36px',
                                cursor: isTransitioning ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1001,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(15px)',
                                boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1)',
                                opacity: isTransitioning ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isTransitioning) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.6) 0%, rgba(238, 90, 111, 0.6) 100%)';
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.5), inset 0 2px 15px rgba(255, 255, 255, 0.2)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.4) 0%, rgba(238, 90, 111, 0.4) 100%)';
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            ‹
                        </button>

                        <button
                            onClick={handleNext}
                            className="memories-nav-btn memories-nav-next"
                            aria-label="Next Image"
                            disabled={isTransitioning}
                            style={{
                                position: 'absolute',
                                right: isMobile ? '15px' : '30px',
                                bottom: '0',
                                transform: 'translateY(-50%)',
                                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.4) 0%, rgba(238, 90, 111, 0.4) 100%)',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                borderRadius: '50%',
                                width: isMobile ? '50px' : '65px',
                                height: isMobile ? '50px' : '65px',
                                color: '#fff',
                                fontSize: isMobile ? '28px' : '36px',
                                cursor: isTransitioning ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1001,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                backdropFilter: 'blur(15px)',
                                boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1)',
                                opacity: isTransitioning ? 0.5 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isTransitioning) {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.6) 0%, rgba(238, 90, 111, 0.6) 100%)';
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                                    e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.5), inset 0 2px 15px rgba(255, 255, 255, 0.2)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 107, 107, 0.4) 0%, rgba(238, 90, 111, 0.4) 100%)';
                                e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            ›
                        </button>

                        {/* Media Counter */}
                        <div
                            className="memories-counter"
                            style={{
                                position: 'absolute',
                                bottom: isMobile ? '20px' : '30px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.3) 0%, rgba(238, 90, 111, 0.3) 100%)',
                                color: '#fff',
                                padding: isMobile ? '10px 20px' : '12px 24px',
                                borderRadius: '30px',
                                fontSize: isMobile ? '0.95rem' : '1.1rem',
                                fontFamily: '"Sriracha", cursive',
                                backdropFilter: 'blur(15px)',
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.1)',
                                zIndex: 1001,
                                textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}
                        >
                            <span>{memoryMedia[currentImageIndex]?.type === 'video' ? '🎬' : memoryMedia[currentImageIndex]?.type === 'audio' ? '🎵' : '💕'}</span>
                            <span>{currentImageIndex + 1} / {memoryMedia.length}</span>
                            <span>{memoryMedia[currentImageIndex]?.type === 'video' ? '🎬' : memoryMedia[currentImageIndex]?.type === 'audio' ? '🎵' : '💕'}</span>
                        </div>

                        {/* Media Indicators */}
                        <div
                            className="memories-indicators"
                            style={{
                                position: 'absolute',
                                bottom: isMobile ? '70px' : '85px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: isMobile ? '8px' : '12px',
                                alignItems: 'center',
                                zIndex: 1001,
                            }}
                        >
                            {memoryMedia.map((media, index) => (
                                <button
                                    key={index}
                                    onClick={() => !isTransitioning && setCurrentImageIndex(index)}
                                    disabled={isTransitioning}
                                    style={{
                                        width: index === currentImageIndex ? '35px' : '12px',
                                        height: index === currentImageIndex ? '12px' : '12px',
                                        borderRadius: index === currentImageIndex ? '6px' : '50%',
                                        border: 'none',
                                        background: index === currentImageIndex
                                            ? 'linear-gradient(135deg, rgba(255, 107, 107, 0.9) 0%, rgba(238, 90, 111, 0.9) 100%)'
                                            : 'rgba(255, 255, 255, 0.4)',
                                        cursor: isTransitioning ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: index === currentImageIndex
                                            ? '0 4px 15px rgba(255, 107, 107, 0.5), inset 0 2px 5px rgba(255, 255, 255, 0.2)'
                                            : '0 2px 8px rgba(0, 0, 0, 0.2)',
                                        opacity: isTransitioning ? 0.5 : 1,
                                    }}
                                    aria-label={`Go to ${media.type} ${index + 1}`}
                                    title={media.type === 'video' ? 'Video' : 'Image'}
                                    onMouseEnter={(e) => {
                                        if (index !== currentImageIndex && !isTransitioning) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                                            e.currentTarget.style.transform = 'scale(1.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (index !== currentImageIndex) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Heart Beating */}
            <div className="munna heart-container absolute top-[20%] md:left-20 left-6">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="munna heartBeating md:w-[150px] w-[110px] h-[200px]"
                    style={{ willChange: 'transform' }}
                >
                    <path
                        d="M471.7 73.6c-54.5-46.4-136-38.3-186.4 15.8L256 120.6l-29.3-31.2C176.3 35.3 94.8 27.2 40.3 73.6-18 125.4-13.3 221 43 273.7l187.3 177.6a24 24 0 0032.4 0L469 273.7c56.3-52.8 61-148.3 2.7-200.1z"
                        fill="#b10505"
                    />
                </svg>
            </div>
            <div className="munna heart-container absolute bottom-[10%] md:right-20 right-6 rotate-180">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="munna heartBeating md:w-[150px] w-[110px] h-[200px]"
                    style={{ willChange: 'transform' }}
                >
                    <path
                        d="M471.7 73.6c-54.5-46.4-136-38.3-186.4 15.8L256 120.6l-29.3-31.2C176.3 35.3 94.8 27.2 40.3 73.6-18 125.4-13.3 221 43 273.7l187.3 177.6a24 24 0 0032.4 0L469 273.7c56.3-52.8 61-148.3 2.7-200.1z"
                        fill="#b10505"
                    />
                </svg>
            </div>
            {/* Heart Falling - Optimized with lazy loading */}
            <div className="munna snowflakes z-0">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="munna snowflake">
                        <img
                            src="https://i.pinimg.com/originals/96/c7/8b/96c78bc8ab873498b763798793d64f62.png"
                            width="25"
                            loading="lazy"
                            alt="Decorative heart"
                            style={{ willChange: 'transform' }}
                        />
                    </div>
                ))}
            </div>
        </main>
    )
}

export default LoveLetter
