import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../shared/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const Greeting = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, isDark } = useTheme();
    const [name, setName] = useState('');
    const [showQuestions, setShowQuestions] = useState(false);
    const [animationComplete, setAnimationComplete] = useState(false);
    const [typedText, setTypedText] = useState('');
    const fullText = "Your journey to better mental wellness begins here";
    const typingSpeed = 40; // milliseconds per character
    const typingRef = useRef(null);

    const nextSteps = (location.state && location.state.flow) || ['dashboard'];
    const isAnonymous = (location.state && location.state.isAnonymous) || false;

    // Handle typing animation effect
    useEffect(() => {
        if (!showQuestions && typedText.length < fullText.length) {
            typingRef.current = setTimeout(() => {
                setTypedText(fullText.substring(0, typedText.length + 1));
            }, typingSpeed);
        }
        return () => clearTimeout(typingRef.current);
    }, [typedText, showQuestions]);

    // Handle user info and animation sequence
    useEffect(() => {
        const firstNameOnly = currentUser?.displayName?.split(' ')[0];
        if (firstNameOnly) {
            setName(firstNameOnly);
        }
        
        const mainTimer = setTimeout(() => {
            setShowQuestions(true);
            setTimeout(() => setAnimationComplete(true), 800);
        }, 3000); // Extended for typing animation to complete
        
        return () => {
            clearTimeout(mainTimer);
            clearTimeout(typingRef.current);
        };
    }, [currentUser]);

    const handleContinue = () => {
        const nextStep = nextSteps[0] || 'dashboard';
        navigate(`/${nextStep}`, {
            state: {
                flow: nextSteps.slice(1),
                isAnonymous
            }
        });
    };

    // Enhanced Particle animation for background - reduced count for mobile
    const Particles = () => {
        const particles = [];
        // Adaptive particle count based on screen size for better mobile performance
        const useReducedParticles = window.innerWidth < 768;
        const count = useReducedParticles ? 15 : 30;
        
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 6 + 2; // Slightly smaller for mobile
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * 8;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            
            particles.push(
                <div 
                    key={i}
                    className={`absolute rounded-full ${isDark ? 'bg-white' : 'bg-purple-500'} opacity-10`}
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        left: `${posX}%`,
                        top: `${posY}%`,
                        animation: `float ${duration}s linear infinite`,
                        animationDelay: `${delay}s`
                    }}
                />
            );
        }
        
        return <>{particles}</>;
    };
    
    // Custom animated blob component - optimized for mobile
    const AnimatedBlob = ({ className, animationClass }) => (
        <div className={`absolute rounded-full filter blur-3xl opacity-60 ${className} ${animationClass}`}></div>
    );

    return (
        <div className={`min-h-screen ${theme.background} relative overflow-hidden flex items-center justify-center font-sans`}>
            {/* Enhanced Background Elements */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
                {/* Modernized Gradient Orbs - positioned for mobile & desktop */}
                <AnimatedBlob 
                    className={`top-0 -left-20 md:w-96 md:h-96 w-64 h-64 ${isDark ? 'bg-blue-500/20' : 'bg-blue-400/30'}`}
                    animationClass="animate-blob" 
                />
                <AnimatedBlob 
                    className={`bottom-0 -right-20 md:w-96 md:h-96 w-64 h-64 ${isDark ? 'bg-purple-500/20' : 'bg-purple-400/30'}`}
                    animationClass="animate-blob animation-delay-2000" 
                />
                <AnimatedBlob 
                    className={`top-1/3 left-1/3 md:w-80 md:h-80 w-56 h-56 ${isDark ? 'bg-pink-500/20' : 'bg-pink-400/30'}`}
                    animationClass="animate-blob animation-delay-4000" 
                />
                <AnimatedBlob 
                    className={`bottom-1/4 left-1/4 md:w-72 md:h-72 w-48 h-48 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-400/30'}`}
                    animationClass="animate-blob animation-delay-6000" 
                />
                
                {/* Enhanced Particle Effect */}
                <Particles />
                
                {/* Subtle Grid Pattern */}
                <div className="absolute inset-0 bg-grid-pattern opacity-3"></div>
                
                {/* Additional subtle design elements */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-500/5 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-purple-500/5 to-transparent"></div>
            </div>

            {/* Theme Toggle with improved styling */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
                <ThemeToggle />
            </div>

            {/* Main Content with enhanced animations - responsive for mobile */}
            <div className="relative z-10 max-w-4xl w-full mx-4 perspective-1000">
                <AnimatePresence mode="wait">
                    {!showQuestions ? (
                        <motion.div
                            key="greeting"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20, rotateY: 90 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`${theme.card} rounded-3xl shadow-2xl backdrop-blur-sm ${isDark ? 'bg-opacity-80 border border-gray-700/30' : 'bg-opacity-90 border border-white/30'} px-6 py-8 md:p-12`}
                        >
                            <div className="text-center space-y-6 md:space-y-8">
                                {/* Animated emoji with more sophisticated container */}
                                <motion.div 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1, rotate: [0, 15, 0, -15, 0] }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    className="inline-block p-4 md:p-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-4xl md:text-5xl mb-6 md:mb-8 shadow-lg"
                                >
                                    👋
                                </motion.div>
                                
                                <motion.h1 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.5 }}
                                    className={`text-3xl md:text-5xl font-bold ${theme.textBold} mb-4 md:mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}
                                >
                                    {name ? (
                                        <>Welcome to <span className="font-extrabold">AuraCheck</span>, {name}!</>
                                    ) : (
                                        <>Welcome to <span className="font-extrabold">AuraCheck</span>!</>
                                    )}
                                </motion.h1>
                                
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 1, delay: 1 }}
                                    className={`text-lg md:text-2xl ${theme.text} max-w-2xl mx-auto leading-relaxed`}
                                >
                                    {typedText}
                                    <span className="animate-blink ml-1">|</span>
                                </motion.p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="questions"
                            initial={{ opacity: 0, rotateY: -90 }}
                            animate={{ opacity: 1, rotateY: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`${theme.card} rounded-3xl shadow-2xl backdrop-blur-sm ${isDark ? 'bg-opacity-80 border border-gray-700/30' : 'bg-opacity-90 border border-white/30'} px-6 py-8 md:p-12`}
                        >
                            <div className="text-center mb-6 md:mb-10">
                                <motion.h2 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className={`text-2xl md:text-4xl font-bold ${theme.textBold} mb-3 md:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}
                                >
                                    Let's Personalize Your Experience
                                </motion.h2>
                                
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className={`text-base md:text-xl ${theme.text} max-w-2xl mx-auto leading-relaxed mb-6 md:mb-10`}
                                >
                                    We'll create a unique wellness journey tailored just for you
                                </motion.p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                                {/* Feature Cards with improved visual effects - mobile responsive */}
                                {[
                                    {
                                        icon: "✨",
                                        title: "Wellness Patterns",
                                        description: "Discover insights about your mental well-being journey",
                                        delay: 0
                                    },
                                    {
                                        icon: "🌱",
                                        title: "Growth Garden",
                                        description: "Nurture your personal wellness garden with daily practice",
                                        delay: 0.15
                                    },
                                    {
                                        icon: "🎯",
                                        title: "Smart Insights",
                                        description: "Get personalized recommendations based on your progress",
                                        delay: 0.3
                                    }
                                ].map((feature, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.6, delay: feature.delay + 0.5 }}
                                        whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                                        className="h-full"
                                    >
                                        <div className={`${isDark ? 'bg-gray-800/80' : 'bg-white'} p-4 md:p-6 rounded-xl shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'} h-full group transition-all duration-300`}>
                                            <div className="text-4xl md:text-5xl mb-3 md:mb-4 transform transition-transform group-hover:scale-110 group-hover:rotate-3">{feature.icon}</div>
                                            <h3 className={`text-lg md:text-xl font-semibold ${theme.textBold} mb-2 group-hover:text-blue-500 transition-colors`}>{feature.title}</h3>
                                            <p className={`${theme.text} text-sm md:text-base leading-relaxed`}>{feature.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 1.2 }}
                                className="mt-6 md:mt-8"
                            >
                                <button
                                    onClick={handleContinue}
                                    className={`w-full max-w-xs md:max-w-md mx-auto block py-3 md:py-4 px-6 md:px-8 rounded-xl text-white font-semibold text-base md:text-lg 
                                    bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                                    transform transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 
                                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50
                                    relative overflow-hidden group`}
                                    disabled={!animationComplete}
                                >
                                    <span className="relative z-10">Begin Your Journey</span>
                                    <span className="absolute inset-0 h-full w-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Enhanced Brand Watermark - mobile responsive */}
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-50">
                <span className={`text-xs md:text-sm ${theme.text} opacity-70 font-medium tracking-wider`}>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Aura</span>Check
                </span>
            </div>
            
            {/* Add CSS for animations in a style tag */}
            <style jsx>{`
                @keyframes float {
                    0% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-10px) translateX(10px); }
                    50% { transform: translateY(0) translateX(15px); }
                    75% { transform: translateY(10px) translateX(5px); }
                    100% { transform: translateY(0) translateX(0); }
                }
                
                @keyframes float-delayed {
                    0% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(10px) translateX(-10px); }
                    50% { transform: translateY(15px) translateX(-5px); }
                    75% { transform: translateY(5px) translateX(-15px); }
                    100% { transform: translateY(0) translateX(0); }
                }
                
                @keyframes float-slow {
                    0% { transform: translateY(0) translateX(0); }
                    50% { transform: translateY(-15px) translateX(-15px); }
                    100% { transform: translateY(0) translateX(0); }
                }
                
                .animate-float {
                    animation: float 15s ease-in-out infinite;
                }
                
                .animate-float-delayed {
                    animation: float-delayed 18s ease-in-out infinite;
                }
                
                .animate-float-slow {
                    animation: float-slow 20s ease-in-out infinite;
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                @keyframes blob {
                    0% {
                        transform: translate(0px, 0px) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                    100% {
                        transform: translate(0px, 0px) scale(1);
                    }
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                
                .animation-delay-6000 {
                    animation-delay: 6s;
                }
                
                .animate-blink {
                    animation: blink 1s step-end infinite;
                }
                
                @keyframes blink {
                    from, to { opacity: 1; }
                    50% { opacity: 0; }
                }
                
                .perspective-1000 {
                    perspective: 1000px;
                }
                
                @media (max-width: 640px) {
                    .animate-blob {
                        animation-duration: 10s; /* Slower animation on mobile */
                    }
                }
            `}</style>
        </div>
    );
};

export default Greeting;