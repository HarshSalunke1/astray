import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, Award, RotateCcw, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sampleQuizQuestions } from '../utils/initialState';

export default function QuizModeView({ setStudyProgress, setActiveTab }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = sampleQuizQuestions[currentQuestionIndex];

  const handleSelectOption = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQ.correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < sampleQuizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      // Update overall study progress to 65%
      setStudyProgress(65);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: '860px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--cyan-primary)', marginBottom: '8px' }}>
          <HelpCircle size={16} />
          <span>ASTRA ADAPTIVE QUIZ MODE</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
          DBMS Normalization Mastery Check
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Test your understanding of 1NF, 2NF, 3NF, BCNF, and Functional Dependencies.
        </p>
      </div>

      {!quizFinished ? (
        <div className="glass-panel" style={{ padding: '32px' }}>
          
          {/* Progress Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-primary)' }}>
              QUESTION {currentQuestionIndex + 1} OF {sampleQuizQuestions.length}
            </span>

            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Score: {score}
            </span>
          </div>

          {/* Question Title */}
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '24px', lineHeight: '1.4' }}>
            {currentQ.question}
          </h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {currentQ.options.map((opt, idx) => {
              let optStyle = {
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'rgba(255,255,255,0.02)',
                color: '#fff',
                fontSize: '14px',
                cursor: isAnswered ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              };

              if (isAnswered) {
                if (idx === currentQ.correctAnswerIndex) {
                  optStyle.background = 'rgba(16, 185, 129, 0.15)';
                  optStyle.borderColor = '#10b981';
                  optStyle.color = '#34d399';
                } else if (idx === selectedOption) {
                  optStyle.background = 'rgba(239, 68, 68, 0.15)';
                  optStyle.borderColor = '#ef4444';
                  optStyle.color = '#f87171';
                }
              }

              return (
                <div 
                  key={idx} 
                  style={optStyle}
                  onClick={() => handleSelectOption(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.08)',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{opt}</span>
                  </div>

                  {isAnswered && idx === currentQ.correctAnswerIndex && (
                    <CheckCircle2 size={18} color="#10b981" />
                  )}
                  {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswerIndex && (
                    <XCircle size={18} color="#ef4444" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation & Source Citation */}
          {isAnswered && (
            <div style={{
              background: 'rgba(0, 242, 254, 0.06)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--cyan-primary)', letterSpacing: '0.05em', marginBottom: '4px' }}>
                EXPLANATION & CITATION
              </div>
              <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.5', marginBottom: '8px' }}>
                {currentQ.explanation}
              </div>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)' }}>
                📄 Citation: {currentQ.citation}
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={handleNext}
              disabled={!isAnswered}
              className="btn-cyan"
              style={{ opacity: isAnswered ? 1 : 0.4 }}
            >
              <span>{currentQuestionIndex < sampleQuizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      ) : (
        /* Quiz Summary Card */
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <Award size={54} color="var(--cyan-primary)" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Quiz Completed!
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            You scored <strong style={{ color: 'var(--cyan-primary)' }}>{score} out of {sampleQuizQuestions.length}</strong> on DBMS Normalization.
          </p>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '32px',
            display: 'inline-block',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
              ✓ DBMS Focus Health Progress Updated to 65%!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Normalization mastery increased. Your study progress gauge on Mission Control has been updated.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button onClick={handleRestart} className="btn-secondary">
              <RotateCcw size={15} />
              <span>Retake Quiz</span>
            </button>

            <button onClick={() => setActiveTab('mission')} className="btn-cyan">
              <span>Return to Mission Control</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
