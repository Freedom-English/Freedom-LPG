
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonPlan, QuizQuestion } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";

// Audio Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const ClassroomView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quizState, setQuizState] = useState<Record<number, { selected: number; confirmed: boolean }>>({});
  const [showBackground, setShowBackground] = useState(false);
  
  // Font Size Control
  const [fontSize, setFontSize] = useState(24);
  
  // Translation State
  const [translation, setTranslation] = useState<{ word: string; translated: string; x: number; y: number } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Audio Player States
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animationRef = useRef<number | null>(null);

  // Helper function to return conditional slide classes
  const getSlideTheme = (idx: number) => {
    const themes = [
      'bg-white border-freedom-orange',
      'bg-gray-50 border-freedom-gray',
      'bg-orange-50 border-freedom-orange',
      'bg-white border-freedom-gray',
    ];
    return themes[idx % themes.length];
  };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('freedom_plans') || '[]');
    const found = saved.find((p: LessonPlan) => p.id === id);
    if (found) {
      setPlan(found);
      if (found.isQuickLesson) setFontSize(32); // Default larger for readability
    }
  }, [id]);

  const updateProgress = () => {
    if (isPlaying && audioContextRef.current) {
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate + offsetRef.current;
      setCurrentTime(Math.min(elapsed, duration));
      if (elapsed >= duration) {
        setIsPlaying(false);
        setCurrentTime(duration);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      } else {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const handleTranslate = async (word: string, e: React.MouseEvent) => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"").trim();
    if (!cleanWord || isTranslating) return;

    setTranslation({ word: cleanWord, translated: "Translating...", x: e.clientX, y: e.clientY });
    setIsTranslating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Translate the English word "${cleanWord}" to Portuguese. Return ONLY the translated word.`,
      });
      setTranslation(prev => prev ? { ...prev, translated: response.text || "Error" } : null);
    } catch (err) {
      setTranslation(prev => prev ? { ...prev, translated: "Error" } : null);
    } finally {
      setIsTranslating(false);
    }
  };

  const playFromOffset = (offset: number) => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    
    // Stop previous
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(audioContextRef.current.destination);
    
    startTimeRef.current = audioContextRef.current.currentTime;
    offsetRef.current = offset;
    
    source.start(0, offset / playbackRate);
    audioSourceRef.current = source;
    setIsPlaying(true);
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) {
      audioSourceRef.current?.stop();
      setIsPlaying(false);
      offsetRef.current = currentTime; // Save where we paused
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      return;
    }

    // Resume if we have a buffer
    if (audioBufferRef.current) {
      const startAt = currentTime >= duration ? 0 : currentTime;
      playFromOffset(startAt);
      return;
    }

    if (!plan?.audioConfig) return;

    setIsAudioLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              voiceName: plan.audioConfig.voiceName,
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data received");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        audioContextRef.current,
        24000,
        1,
      );

      audioBufferRef.current = audioBuffer;
      setDuration(audioBuffer.duration);
      playFromOffset(0);
    } catch (e) {
      console.error("Audio playback error:", e);
      alert("Fred couldn't play the audio right now.");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (isPlaying) {
      playFromOffset(newTime);
    } else {
      offsetRef.current = newTime;
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      audioSourceRef.current?.stop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentSlide]);

  if (!plan) return null;

  let slides: any[] = [];
  if (plan.isQuickLesson) {
    const readingSection = plan.sections[0];
    const rawContent = readingSection?.studentContent || "";
    let textOnly = "";
    let vocabListRaw = "";
    if (rawContent.includes('||VOCAB||')) {
      const parts = rawContent.split('||VOCAB||');
      textOnly = parts[0]?.trim();
      vocabListRaw = parts[1]?.trim();
    } else {
      textOnly = rawContent;
    }
    
    slides.push({
      type: 'reading-compact',
      title: readingSection?.title || plan.title,
      content: { text: textOnly, vocab: vocabListRaw },
      illustration: plan.illustrationImage
    });

    if (plan.quiz && plan.quiz.length > 0) {
      slides.push({ type: 'quiz', title: "Activity Lab", content: plan.quiz.slice(0, 5) });
    }

    const conversationSections = plan.sections.slice(1, 11);
    conversationSections.forEach((sec, idx) => {
      slides.push({ type: 'question', title: `Point #${idx + 1}`, content: sec.studentContent, backgroundQuestions: sec.backgroundQuestions });
    });
  } else {
    slides = [
      { type: 'title', title: plan.title, subtitle: `${plan.level} Class` },
      ...plan.sections.map(s => ({ type: 'content', title: s.title, content: s.studentContent, backgroundQuestions: s.backgroundQuestions })),
      ...(plan.quiz && plan.quiz.length > 0 ? [{ type: 'quiz', title: "Review Quiz", content: plan.quiz }] : [])
    ];
  }

  const next = () => { setShowBackground(false); if (currentSlide < slides.length - 1) setCurrentSlide(c => c + 1); };
  const prev = () => { setShowBackground(false); if (currentSlide > 0) setCurrentSlide(c => c - 1); };

  const renderClickableText = (text: string) => {
    return text.split(/(\s+)/).map((part, i) => {
      if (part.trim() === '') return part;
      return (
        <span 
          key={i} 
          onClick={(e) => handleTranslate(part, e)}
          className="cursor-pointer hover:bg-freedom-orange/10 hover:text-freedom-orange transition-colors rounded px-0.5 border-b border-dotted border-gray-300 hover:border-freedom-orange"
        >
          {part}
        </span>
      );
    });
  };

  const renderContent = (slide: any) => {
    if (slide.type === 'reading-compact') {
      const { text, vocab } = slide.content;
      const vocabLines = vocab ? vocab.split('\n').filter((l:any) => l.trim()) : [];
      return (
        <div className="flex flex-col w-full h-full text-left overflow-hidden">
          {translation && (
            <div 
              className="fixed bg-freedom-gray text-white p-3 rounded-2xl shadow-2xl z-[100] animate-fadeIn border-2 border-freedom-orange"
              style={{ top: translation.y - 70, left: translation.x - 50 }}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-freedom-orange mb-1">{translation.word}</p>
              <p className="text-sm font-bold">{translation.translated}</p>
              <button onClick={() => setTranslation(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-lg">✕</button>
            </div>
          )}

          <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
            {slide.illustration && (
              <div className="flex-1 max-w-[40%] h-full rounded-3xl overflow-hidden shadow-lg border-2 border-white">
                <img src={slide.illustration} alt="Context" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-[1.5] flex flex-col overflow-hidden relative">
              <div className="flex items-center justify-between mb-3 shrink-0">
                 <div className="flex items-center space-x-3">
                   <div className="bg-freedom-orange text-white px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Reading</div>
                   <h2 className="text-xl lg:text-2xl font-black text-freedom-gray tracking-tighter uppercase line-clamp-1">{slide.title}</h2>
                 </div>
                 
                 {plan.audioConfig?.enabled && (
                   <div className="flex items-center space-x-2">
                     <div className="flex bg-gray-100 rounded-lg p-0.5">
                       {[0.75, 1, 1.5, 2].map(r => (
                         <button 
                           key={r}
                           onClick={() => setPlaybackRate(r)}
                           className={`px-2 py-1 text-[8px] font-black rounded-md transition-all ${playbackRate === r ? 'bg-white text-freedom-orange shadow-sm' : 'text-gray-400'}`}
                         >
                           {r}x
                         </button>
                       ))}
                     </div>
                     <button 
                       onClick={() => handlePlayAudio(text)}
                       disabled={isAudioLoading}
                       className={`flex items-center space-x-2 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-sm transition-all ${isPlaying ? 'bg-black text-white' : 'bg-freedom-orange text-white hover:bg-orange-600'} disabled:opacity-50`}
                     >
                       {isAudioLoading ? (
                         <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : (
                         <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                           {isPlaying ? (
                             <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                           ) : (
                             <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                           )}
                         </svg>
                       )}
                       <span>{isPlaying ? 'Pause' : 'Listen'}</span>
                     </button>
                   </div>
                 )}
              </div>

              {/* Audio Controls Bar */}
              {audioBufferRef.current && (
                <div className="mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100 flex items-center space-x-4 animate-fadeIn">
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums w-10">{formatTime(currentTime)}</span>
                  <input 
                    type="range" 
                    min="0" 
                    max={duration} 
                    step="0.1" 
                    value={currentTime} 
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-freedom-orange"
                  />
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums w-10">{formatTime(duration)}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div 
                  className={`text-freedom-gray leading-relaxed text-justify space-y-4 whitespace-pre-wrap font-medium border-l-4 border-freedom-orange/20 pl-4`}
                  style={{ fontSize: `${fontSize * 0.7}px` }}
                >
                  {renderClickableText(text)}
                </div>
              </div>
            </div>
          </div>
          {vocabLines.length > 0 && (
            <div className="mt-4 bg-freedom-gray p-4 rounded-2xl border-t-4 border-freedom-orange">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {vocabLines.map((line: string, i: number) => (
                  <div key={i} className="bg-white/10 text-white px-3 py-1 rounded-lg text-[10px] font-bold">{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    if (slide.type === 'quiz') {
      const questions = slide.content as QuizQuestion[];
      return (
        <div className="w-full h-full flex flex-col overflow-hidden">
           <div className="flex items-center space-x-3 mb-4 shrink-0">
             <div className="bg-freedom-gray text-white px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">Practice</div>
             <h2 className="text-xl lg:text-3xl font-black text-freedom-gray uppercase tracking-tighter">Knowledge Lab</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
            {questions.map((q, qIdx) => {
              const state = quizState[qIdx];
              return (
                <div key={qIdx} className="bg-white p-5 rounded-3xl shadow-sm border-l-8 border-freedom-orange">
                  <h4 className="text-sm font-bold text-freedom-gray mb-3">0{qIdx + 1}. {q.question}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = oIdx === q.correctIndex;
                      const isSelected = state?.selected === oIdx;
                      let btnClass = "p-3 rounded-xl border text-left transition-all text-xs font-bold ";
                      if (state?.confirmed) {
                        if (isCorrect) btnClass += "bg-green-50 border-green-500 text-green-700";
                        else if (isSelected) btnClass += "bg-red-50 border-red-500 text-red-700";
                        else btnClass += "bg-gray-50 opacity-40";
                      } else { btnClass += "bg-gray-50 hover:border-freedom-orange"; }
                      return (
                        <button key={oIdx} onClick={() => { if (!quizState[qIdx]?.confirmed) setQuizState({...quizState, [qIdx]: { selected: oIdx, confirmed: true }}); }} className={btnClass}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const contentText = slide.content || slide.subtitle || "";
    return (
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
        {slide.title && (
          <div className="mb-6 shrink-0">
             <h1 className="text-[10px] font-black text-white bg-freedom-gray px-6 py-2 rounded-full tracking-widest uppercase border-b-4 border-freedom-orange shadow-lg">
              {slide.title}
            </h1>
          </div>
        )}
        <div className="w-full flex-1 flex items-center justify-center min-h-0 px-6 overflow-y-auto custom-scrollbar">
          <div 
            className={`text-freedom-gray leading-tight font-black text-center drop-shadow-sm italic tracking-tight`}
            style={{ fontSize: `${fontSize}px` }}
          >
            {contentText}
          </div>
        </div>
        {slide.backgroundQuestions && slide.backgroundQuestions.length > 0 && (
          <div className="mt-6 shrink-0 w-full animate-fadeIn text-center">
            <button onClick={() => setShowBackground(!showBackground)} className="bg-freedom-orange text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md border-b-2 border-orange-800">
              {showBackground ? "Hide Hints" : "View Hints"}
            </button>
            {showBackground && (
              <div className="mt-4 flex flex-wrap justify-center gap-3 max-w-5xl mx-auto px-4 overflow-y-auto max-h-[15vh] pb-2 custom-scrollbar">
                {slide.backgroundQuestions.map((bq: string, bi: number) => (
                  <div key={bi} className="bg-white p-3 rounded-xl border-t-4 border-freedom-orange shadow-sm text-[10px] font-bold text-freedom-gray italic">
                    "{bq}"
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50 overflow-hidden select-none">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f7931e; border-radius: 10px; } 
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
      
      <div className="flex justify-between items-center p-3 lg:p-4 bg-black/95 border-b border-white/5 z-30">
        <div className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-freedom-orange rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-xl italic tracking-tighter">F</span>
          </div>
          <h2 className="text-white font-black text-lg lg:text-xl tracking-tighter">
            FREEDOM<span className="text-freedom-orange">ACADEMY</span>
          </h2>
        </div>
        <button onClick={() => navigate('/')} className="text-white font-black border border-white/10 px-4 py-2 rounded-xl hover:bg-white/10 transition-all uppercase text-[9px] tracking-widest">
          Exit
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden relative">
        <div className={`w-[94vw] h-[86vh] rounded-[3rem] lg:rounded-[4rem] shadow-2xl p-6 lg:p-10 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 border-b-[16px] ${getSlideTheme(currentSlide)}`}>
          <div className="w-full h-full overflow-hidden">
            {renderContent(slides[currentSlide])}
          </div>
          
          {/* Translucent and Floating Font Size Controls */}
          <div className="absolute bottom-8 right-8 z-[60] group">
            <div className="bg-freedom-gray/40 backdrop-blur-sm p-1.5 rounded-2xl border border-white/10 flex flex-col space-y-1.5 shadow-lg transition-all duration-300 opacity-25 group-hover:opacity-100 group-hover:bg-freedom-gray/90 group-hover:scale-105 group-hover:shadow-2xl">
              <button 
                onClick={() => setFontSize(prev => Math.min(prev + 4, 120))} 
                className="w-8 h-8 rounded-xl bg-white/5 text-white/50 flex items-center justify-center text-lg font-black hover:bg-freedom-orange hover:text-white transition-all group-hover:text-white"
                title="Increase Font Size"
              >
                +
              </button>
              <div className="h-[1px] bg-white/5 w-full"></div>
              <button 
                onClick={() => setFontSize(prev => Math.max(prev - 4, 12))} 
                className="w-8 h-8 rounded-xl bg-white/5 text-white/50 flex items-center justify-center text-lg font-black hover:bg-freedom-orange hover:text-white transition-all group-hover:text-white"
                title="Decrease Font Size"
              >
                −
              </button>
              <div className="flex items-center justify-center pt-0.5 pb-1">
                <span className="text-[6px] text-white/20 font-black uppercase tracking-tighter group-hover:text-white/60">Size</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6 flex items-center justify-between bg-black z-30">
        <div className="flex flex-col">
          <span className="text-freedom-orange font-black tracking-[0.4em] text-[8px] uppercase mb-1">Live Progress</span>
          <div className="flex items-center space-x-3">
            <span className="text-white font-black text-xl lg:text-3xl tabular-nums">{String(currentSlide + 1).padStart(2, '0')}</span>
            <div className="flex space-x-1 px-4">
              {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 lg:w-16 bg-freedom-orange' : 'w-1.5 bg-white/10'}`} />
              ))}
            </div>
            <span className="text-white/20 font-black text-xl lg:text-3xl tabular-nums">{String(slides.length).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="flex space-x-4">
          <button onClick={prev} disabled={currentSlide === 0} className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-white/5 text-white flex items-center justify-center disabled:opacity-0 hover:bg-white/10 transition-all border border-white/10">
            <span className="text-xl">←</span>
          </button>
          <button onClick={next} disabled={currentSlide === slides.length - 1} className="w-16 h-12 lg:w-32 lg:h-16 rounded-2xl bg-freedom-orange text-white flex items-center justify-center disabled:opacity-10 hover:bg-orange-600 transition-all text-2xl lg:text-3xl shadow-xl border-b-4 border-orange-900">
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassroomView;
