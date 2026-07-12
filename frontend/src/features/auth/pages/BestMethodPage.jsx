// Public informational page about Quran memorization methods - accessible without authentication
import React from 'react';
import { Link } from 'react-router-dom';

export default function BestMethodPage() {
  return (
    <div className="best-method-page-wrapper">
      <div className="best-method-header">
        <Link to="/" className="back-link">← Back to Home</Link>
        <h1>The Qur’an Memorisation & Mutashābihāt Master Project</h1>
        <p className="subtitle">Purpose of This Project</p>
      </div>

      <div className="best-method-content">
        <p>This project is a complete structured system for Qur’an memorisation (Ḥifẓ), long-term retention, Murāja‘ah (revision), mastering Mutashābihāt, and strengthening Tajwīd. It combines memorisation principles, revision systems, flashcard study material, mnemonics, and practical correction methods.</p>

        <div className="method-section">
          <h2>PART I — FOUNDATIONS OF MEMORISATION</h2>
          <h3>The Core Rule of Ḥifẓ: The Universal Principle</h3>
          <p><em>How do I memorise, retain, perfect, and avoid forgetting? By repetition. Repetition, then repetition, then repetition.</em></p>
          
          <h3>The Three Pillars of Memorisation</h3>
          <ol>
            <li><strong>Foundation:</strong> Correct Tajwīd, accurate pronunciation, slow recitation, strong listening habits, and learning with a teacher. Without this, mistakes become embedded.</li>
            <li><strong>Repetition:</strong> Creates stability. Every Ayah must be repeated aloud, recited from memory, linked to surrounding verses, and reviewed over time.</li>
            <li><strong>Review (Murāja‘ah):</strong> The hardest pillar requiring discipline, patience, and consistency. Memorisation is easy; preservation is the true challenge.</li>
          </ol>
        </div>

        <div className="method-section">
          <h2>PART II — THE MINDSET OF A STUDENT</h2>
          <ul>
            <li>The Qur’an comes before the voice.</li>
            <li>People are praying with you, not judging you.</li>
            <li>Forgetfulness is part of the journey of the Huffāẓ.</li>
            <li>Your struggle is not failure.</li>
          </ul>
        </div>

        <div className="method-section">
          <h2>PART III — PREPARING TO LEAD</h2>
          <p><strong>Strengthen Preparation:</strong> Nervousness comes from uncertainty. Review thoroughly, focus on fluency, strengthen weak areas, and practice transitions.</p>
          <p><strong>Rest Properly:</strong> Refreshes the mind, improves focus, strengthens recall, and reduces mental fatigue.</p>
          <p><strong>Breath Control & Calmness:</strong> Inhale deeply, exhale slowly, relax shoulders, slow heart rate, and clear mental tension.</p>
          <p><strong>Handling Mistakes:</strong> Correct it calmly, continue confidently, do not panic, and maintain composure. Confidence after correction is part of leadership.</p>
        </div>

        <div className="method-section highlight-box">
          <h2>PART IV — THE 1×4 REVISION SYSTEM</h2>
          <p><strong>Goal:</strong> Revise the entire Qur’an four times per month by revising one Juz’ daily through four methods:</p>
          <ol>
            <li><strong>Listening:</strong> Listen to the Juz’ attentively using a precise Qārī to reinforce pronunciation.</li>
            <li><strong>Reading with Mushaf:</strong> Read while looking to strengthen visual memory.</li>
            <li><strong>Reading from Memory:</strong> Recite entirely from memory to test retention.</li>
            <li><strong>Reciting:</strong> Cement retention, increase fluency, and build spiritual connection.</li>
          </ol>
          <p><em>Flexible Adaptation: Consistency matters more than intensity.</em></p>
        </div>

        {/* Assessment Box */}
        <div className="assessment-cta">
          <p>This assessment helps identify your preferred learning patterns, motivation style, memory habits, and study environment needs. Based on your responses, you’ll receive a personalized learning profile with practical recommendations to improve focus and learning efficiency.</p>
          <a href="https://forms.gle/4MZnpYDQ8x9cWzTHA" target="_blank" rel="noopener noreferrer" className="cta-button">
            Take The Personalized Assessment
          </a>
        </div>
      </div>
    </div>
  );
}