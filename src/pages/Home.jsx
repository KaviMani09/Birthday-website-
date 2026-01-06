import React, { useEffect, useState, useRef } from "react";
import png from '../assets/1.png'
import ballon1 from '../assets/balloon1.png'
import ballon2 from '../assets/balloon2.png'
import decorate from '../assets/decorate.png'
import decoFlowers from '../assets/decorate_flower.png'
import hat from '../assets/hat.png'
import smileIcon from '../assets/smiley_icon.png'
import BookCanvas from "../components/BookCanvas";
import SmallLetter from "../components/SmallLetter";
import mk1 from "../assets/mk 1.jpeg";
import audioFile from "../assets/audio.mp3";

const Home = () => {
    // ------------------- Hooks 
    const [Active, SetActive] = useState(true)
    const audioRef = useRef(null);

    // Audio synchronization with typing animation
    // Animation starts at 4s (when first "H" appears), so audio starts at the same time
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Configure audio properties
        audio.loop = false; // Play only once
        audio.volume = 0.5; // 50% volume
        audio.preload = "auto";

        // Start audio when typing animation begins (at 4s when "H" appears)
        const startAudio = async () => {
            try {
                await audio.play();
            } catch (error) {
                // Autoplay was prevented (common on mobile browsers)
                // Audio will not play - no fallback to user interaction
            }
        };

        // Delay to match animation start time (4 seconds)
        const audioTimer = setTimeout(() => {
            startAudio();
        }, 4000);

        return () => {
            clearTimeout(audioTimer);
        };
    }, []);

    useEffect(() => {
        let timeoutId;
        let intervalId;
        
        const datetxt = "January 09";
        const charArrDate = datetxt.split('');
        let currentIndex = 0;
        const date__of__birth = document.querySelector(".date__of__birth span");
        let typedText = "";

        if (!date__of__birth) return;

        timeoutId = setTimeout(function () {
            intervalId = setInterval(function () {
                if (currentIndex < charArrDate.length) {
                    typedText += charArrDate[currentIndex];
                    date__of__birth.textContent = typedText; // set fresh each time
                    currentIndex++;
                } else {
                    clearInterval(intervalId);
                    if (!date__of__birth.classList.contains("svg-added")) {
                        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                        svg.setAttribute("width", "24");
                        svg.setAttribute("height", "24");
                        svg.setAttribute("viewBox", "0 0 24 24");
                        svg.innerHTML = `<path fill="#a31414" d="M18.483 16.767A8.5 8.5 0 0 1 8.118 7.081a1 1 0 0 1-.113.097c-.28.213-.63.292-1.33.45l-.635.144c-2.46.557-3.69.835-3.983 1.776c-.292.94.546 1.921 2.223 3.882l.434.507c.476.557.715.836.822 1.18c.107.345.071.717-.001 1.46l-.066.677c-.253 2.617-.38 3.925.386 4.506s1.918.052 4.22-1.009l.597-.274c.654-.302.981-.452 1.328-.452s.674.15 1.329.452l.595.274c2.303 1.06 3.455 1.59 4.22 1.01c.767-.582.64-1.89.387-4.507z"/> <path fill="#a31414" d="m9.153 5.408l-.328.588c-.36.646-.54.969-.82 1.182q.06-.045.113-.097a8.5 8.5 0 0 0 10.366 9.686l-.02-.19c-.071-.743-.107-1.115 0-1.46c.107-.344.345-.623.822-1.18l.434-.507c1.677-1.96 2.515-2.941 2.222-3.882c-.292-.941-1.522-1.22-3.982-1.776l-.636-.144c-.699-.158-1.049-.237-1.33-.45c-.28-.213-.46-.536-.82-1.182l-.327-.588C13.58 3.136 12.947 2 12 2s-1.58 1.136-2.847 3.408" opacity="0.5"/>`;
                        const container = document.querySelector(".date__of__birth");
                        if (container) {
                            container.prepend(svg);
                            container.appendChild(svg.cloneNode(true));
                            date__of__birth.classList.add("svg-added");
                        }
                    }
                }
            }, 100);
        }, 12000);

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
        };
    }, []);


    return (
        <>
            {/* Audio element synchronized with typing animation */}
            <audio
                ref={audioRef}
                src={audioFile}
                preload="auto"
                style={{ display: 'none' }}
                aria-label="Birthday background music"
            />
            
            <div id="wrapper">
                <div className="flag__birthday">
                    <img src={png} alt="" width="350" className="flag__left" />
                    <img src={png} alt="" width="350" className="flag__right" />
                </div>

                <div className="content">
                    <div className="left">
                        <div className="title">
                            <h1 className="happy">
                                <span style={{ "--t": "4s" }}>H</span>
                                <span style={{ "--t": "4.2s" }}>a</span>
                                <span style={{ "--t": "4.4s" }}>p</span>
                                <span style={{ "--t": "4.6s" }}>p</span>
                                <span style={{ "--t": "4.8s" }}>y</span>
                            </h1>
                            <h1 className="birthday">
                                <span style={{ "--t": "5s" }}>B</span>
                                <span style={{ "--t": "5.2s" }}>i</span>
                                <span style={{ "--t": "5.4s" }}>r</span>
                                <span style={{ "--t": "5.6s" }}>t</span>
                                <span style={{ "--t": "5.8s" }}>h</span>
                                <span style={{ "--t": "6s" }}>d</span>
                                <span style={{ "--t": "6.2s" }}>a</span>
                                <span style={{ "--t": "6.4s" }}>y</span>
                            </h1>
                            <h1 className="kaviya">
                                <span style={{ "--t": "5s" }}>K</span>
                                <span style={{ "--t": "5.2s" }}>a</span>
                                <span style={{ "--t": "5.4s" }}>v</span>
                                <span style={{ "--t": "5.6s" }}>i</span>
                                <span style={{ "--t": "5.8s" }}>y</span>
                                <span style={{ "--t": "6s" }}>a</span>
                            </h1>
                            <div className="hat">
                                <img src={hat} alt="" width="130" />
                            </div>
                        </div>

                        <div className="date__of__birth">
                            <span></span>
                        </div>
                    </div>

                    <div className="right">
                        <div className="box__account">
                            <div className="birthday-frame">
                                {/* Decorative elements */}
                                <div className="frame-decoration frame-top">
                                    <div className="confetti confetti-1"></div>
                                    <div className="confetti confetti-2"></div>
                                    <div className="confetti confetti-3"></div>
                                    <div className="frame-heart heart-top-1">❤</div>
                                    <div className="frame-heart heart-top-2">❤</div>
                                    <div className="frame-star star-top-1">✦</div>
                                    <div className="frame-star star-top-2">✦</div>
                                    <div className="frame-flower flower-top-1">🌸</div>
                                    <div className="frame-flower flower-top-2">🌺</div>
                                </div>
                                <div className="frame-decoration frame-right">
                                    <div className="confetti confetti-4"></div>
                                    <div className="confetti confetti-5"></div>
                                    <div className="frame-heart heart-right-1">❤</div>
                                    <div className="frame-star star-right-1">✦</div>
                                    <div className="frame-flower flower-right-1">🌹</div>
                                </div>
                                <div className="frame-decoration frame-bottom">
                                    <div className="confetti confetti-6"></div>
                                    <div className="confetti confetti-7"></div>
                                    <div className="frame-heart heart-bottom-1">❤</div>
                                    <div className="frame-heart heart-bottom-2">❤</div>
                                    <div className="frame-star star-bottom-1">✦</div>
                                    <div className="frame-flower flower-bottom-1">🌸</div>
                                </div>
                                <div className="frame-decoration frame-left">
                                    <div className="confetti confetti-8"></div>
                                    <div className="frame-heart heart-left-1">❤</div>
                                    <div className="frame-star star-left-1">✦</div>
                                    <div className="frame-flower flower-left-1">🌺</div>
                                </div>
                                
                                {/* Glowing corner accents */}
                                <div className="frame-corner corner-top-left"></div>
                                <div className="frame-corner corner-top-right"></div>
                                <div className="frame-corner corner-bottom-left"></div>
                                <div className="frame-corner corner-bottom-right"></div>
                                
                                {/* Main image container */}
                                <div className="image">
                                    <img src={mk1} alt="Kaviya" />
                                </div>
                                
                                {/* Floating decorative balloons */}
                                <div className="frame-balloon balloon-frame-1">
                                    <img width="60px" src={ballon1} alt="" />
                                </div>
                                <div className="frame-balloon balloon-frame-2">
                                    <img width="60px" src={ballon2} alt="" />
                                </div>
                                <div className="frame-balloon balloon-frame-3">
                                    <img width="50px" src={ballon1} alt="" />
                                </div>
                            </div>
                            <div className="name">
                                <i className="fa-solid fa-heart"></i>
                                <span> Kaviya</span>
                                <i className="fa-solid fa-heart"></i>
                            </div>
                            <div className="balloon_one">
                                <img width="100px" src={ballon1} alt="" />
                            </div>
                            <div className="balloon_two">
                                <img width="100px" src={ballon2} alt="" />
                            </div>
                        </div>

                        <div className="cricle">
                            <div className="text__cricle">
                                {["H", "a", "p", "p", "y", "-", "b", "i", "r", "t", "h", "d", "a", "y", "-"].map(
                                    (char, i) => (
                                        <span key={i} style={{ "--i": i + 1 }}>
                                            {char}
                                        </span>
                                    )
                                )}
                            </div>
                            <i className="fa-solid fa-heart"></i>
                        </div>
                    </div>
                </div>

                {[1, 2, 3, 4, 5].map((n, i) => (
                    <div key={i} className={`decorate_star star${n}`} style={{ "--t": `${15 + i * 0.2}s` }}></div>
                ))}

                <div className="decorate_flower--one" style={{ "--t": "15s" }}>
                    <img width="20" src={decoFlowers} alt="" />
                </div>
                <div className="decorate_flower--two" style={{ "--t": "15.3s" }}>
                    <img width="20" src={decoFlowers} alt="" />
                </div>
                <div className="decorate_flower--three" style={{ "--t": "15.6s" }}>
                    <img width="20" src={decoFlowers} alt="" />
                </div>

                <div className="decorate_bottom">
                    <img src={decorate} alt="" width="100" />
                </div>

                <div className="smiley__icon">
                    <img src={smileIcon} alt="" width="100" />
                </div>






                {/* =========================== BoxMail Canvas =============================== */}
                <BookCanvas active={Active} setActive={SetActive} />

                {/* ========================== Small letter from rajib ========================= */}
                <section className="smallLetter absolute md:-bottom-26 -bottom-40 md:left-[45%] left-[50%] -translate-x-1/2" style={{ "--t": "15.6s" }}>
                    <SmallLetter />
                </section>
            </div>
        </>
    );
};

export default Home;
