// TourBanner.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTour } from '../context/TourContext';

export default function TourBanner() {
  const navigate = useNavigate();
  const { isActive, currentStep, advanceStep, goToPreviousStep, exitTour, completeTour, tourSteps, registerNavigate } = useTour();
  const [tooltipPosition, setTooltipPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [pointerStyle, setPointerStyle] = useState({});
  const [overlayPanels, setOverlayPanels] = useState(null);
  const [highlightStyle, setHighlightStyle] = useState({});
  const resizeObserverRef = useRef(null);
  const tooltipRef = useRef(null);
  const pollingRef = useRef(null);

  // Register navigate function with TourContext
  useEffect(() => {
    if (registerNavigate) {
      registerNavigate(navigate);
    }
  }, [navigate, registerNavigate]);

  const currentStepData = tourSteps[currentStep - 1];
  const stepContent = currentStepData?.content || 'Follow the steps to explore the app';
  const isActionStep = currentStepData?.trigger === 'action';
  const targetSelector = currentStepData?.targetSelector;
  const expandedTargetSelector = currentStepData?.expandedTargetSelector;

  // Calculate tooltip position and overlay panels based on target element
  const calculatePosition = useCallback(() => {
    if (!targetSelector) {
      // Center on screen if no target - use simple overlay
      setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      setPointerStyle({});
      setOverlayPanels(null);
      setHighlightStyle({});
      return;
    }

    // Check if an expanded target exists (e.g., modal, revealed input, expanded panel)
    // This handles cases where clicking a target reveals a new element that needs to become the spotlight
    // If expandedTargetSelector is an array, check in priority order (last to first)
    const expandedSelectors = Array.isArray(expandedTargetSelector) ? expandedTargetSelector : (expandedTargetSelector ? [expandedTargetSelector] : []);
    let activeSelector = targetSelector;
    for (let i = expandedSelectors.length - 1; i >= 0; i--) {
      const selector = expandedSelectors[i];
      if (document.querySelector(selector)) {
        activeSelector = selector;
        break;
      }
    }

    const targetElements = document.querySelectorAll(activeSelector);
    if (targetElements.length === 0) {
      console.log('[TourBanner] Target element not found for selector:', activeSelector);
      // Fall back to center with simple overlay
      setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
      setPointerStyle({});
      setOverlayPanels(null);
      setHighlightStyle({});
      return;
    }

    // Calculate combined bounding box for all matching elements
    let targetRect = targetElements[0].getBoundingClientRect();
    for (let i = 1; i < targetElements.length; i++) {
      const rect = targetElements[i].getBoundingClientRect();
      targetRect = {
        top: Math.min(targetRect.top, rect.top),
        left: Math.min(targetRect.left, rect.left),
        right: Math.max(targetRect.right, rect.right),
        bottom: Math.max(targetRect.bottom, rect.bottom),
        width: Math.max(targetRect.right, rect.right) - Math.min(targetRect.left, rect.left),
        height: Math.max(targetRect.bottom, rect.bottom) - Math.min(targetRect.top, rect.top),
      };
    }

    const tooltipWidth = 320;
    const tooltipHeight = 200; // Approximate height
    const gap = 8;
    const pointerSize = 12;

    // Try to position above first
    let top = targetRect.top - tooltipHeight - gap;
    let pointerPosition = 'bottom';

    // If not enough room above, position below
    if (top < 10) {
      top = targetRect.bottom + gap;
      pointerPosition = 'top';
    }

    // Center horizontally on target
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);

    // Keep within viewport bounds
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;

    setTooltipPosition({ top: `${top}px`, left: `${left}px`, transform: 'none' });

    // Set pointer style
    const pointerLeft = targetRect.left + (targetRect.width / 2) - left - (pointerSize / 2);
    if (pointerPosition === 'bottom') {
      setPointerStyle({
        position: 'absolute',
        bottom: `-${pointerSize}px`,
        left: `${pointerLeft}px`,
        width: '0',
        height: '0',
        borderLeft: `${pointerSize}px solid transparent`,
        borderRight: `${pointerSize}px solid transparent`,
        borderTop: `${pointerSize}px solid white`,
      });
    } else {
      setPointerStyle({
        position: 'absolute',
        top: `-${pointerSize}px`,
        left: `${pointerLeft}px`,
        width: '0',
        height: '0',
        borderLeft: `${pointerSize}px solid transparent`,
        borderRight: `${pointerSize}px solid transparent`,
        borderBottom: `${pointerSize}px solid white`,
      });
    }

    // Calculate 4-panel overlay for spotlight effect
    // Add padding to the cutout for the highlight border
    const padding = 4;
    const cutoutTop = Math.max(0, targetRect.top - padding);
    const cutoutLeft = Math.max(0, targetRect.left - padding);
    const cutoutRight = Math.min(window.innerWidth, targetRect.right + padding);
    const cutoutBottom = Math.min(window.innerHeight, targetRect.bottom + padding);

    setOverlayPanels({
      top: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: `${cutoutTop}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 2147483646,
        pointerEvents: 'auto',
      },
      bottom: {
        position: 'fixed',
        top: `${cutoutBottom}px`,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 2147483646,
        pointerEvents: 'auto',
      },
      left: {
        position: 'fixed',
        top: `${cutoutTop}px`,
        left: 0,
        width: `${cutoutLeft}px`,
        height: `${cutoutBottom - cutoutTop}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 2147483646,
        pointerEvents: 'auto',
      },
      right: {
        position: 'fixed',
        top: `${cutoutTop}px`,
        left: `${cutoutRight}px`,
        right: 0,
        height: `${cutoutBottom - cutoutTop}px`,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 2147483646,
        pointerEvents: 'auto',
      },
    });

    // Set highlight style for the cutout area
    setHighlightStyle({
      position: 'fixed',
      top: `${cutoutTop}px`,
      left: `${cutoutLeft}px`,
      width: `${cutoutRight - cutoutLeft}px`,
      height: `${cutoutBottom - cutoutTop}px`,
      border: '3px solid #C9A84C',
      borderRadius: '4px',
      boxShadow: '0 0 8px rgba(201, 168, 76, 0.6), 0 0 16px rgba(201, 168, 76, 0.4)',
      zIndex: 2147483645,
      pointerEvents: 'none',
      boxSizing: 'border-box',
    });
  }, [targetSelector, expandedTargetSelector]);

  // Recalculate position on resize and scroll
  useEffect(() => {
    if (!isActive) return;

    calculatePosition();

    const handleResize = () => {
      calculatePosition();
    };

    const handleScroll = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    // Also observe the tooltip for size changes
    if (tooltipRef.current) {
      resizeObserverRef.current = new ResizeObserver(() => {
        calculatePosition();
      });
      resizeObserverRef.current.observe(tooltipRef.current);
    }

    // Poll every 300ms to handle dynamic element changes
    if (targetSelector) {
      pollingRef.current = setInterval(() => {
        calculatePosition();
      }, 300);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [calculatePosition, currentStep, isActive, targetSelector]);

  // Recalculate when step changes
  useEffect(() => {
    if (!isActive) return;
    calculatePosition();
  }, [currentStep, calculatePosition, isActive]);

  const handleNext = () => {
    console.log('[TourBanner] Next clicked, currentStep:', currentStep);
    if (currentStep >= tourSteps.length) {
      completeTour();
    } else {
      advanceStep();
    }
  };

  const handlePrevious = () => {
    console.log('[TourBanner] Previous clicked, currentStep:', currentStep);
    goToPreviousStep();
  };

  const handleExit = () => {
    console.log('[TourBanner] Exit clicked');
    exitTour();
  };

  console.log('[TourBanner] Rendering - isActive:', isActive, 'currentStep:', currentStep);

  if (!isActive) return null;

  return ReactDOM.createPortal(
    <>
      <style>
        {`
          @keyframes tourPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.45; }
          }
          .tour-pulse { animation: tourPulse 1.8s ease-in-out infinite; }
        `}
      </style>

      {/* Spotlight overlay panels (4-panel cutout) OR simple full-page overlay */}
      {overlayPanels ? (
        <>
          <div style={overlayPanels.top} />
          <div style={overlayPanels.bottom} />
          <div style={overlayPanels.left} />
          <div style={overlayPanels.right} />
          {/* Highlight border around the cutout */}
          <div style={highlightStyle} />
        </>
      ) : (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 2147483646,
          pointerEvents: 'auto',
        }} />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          ...tooltipPosition,
          width: '320px',
          maxWidth: '90vw',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          zIndex: 2147483647,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Pointer */}
        <div style={pointerStyle} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, letterSpacing: '0.05em' }}>
            STEP {currentStep} / {tourSteps.length}
          </div>
          <button
            onClick={handleExit}
            style={{
              background: 'none',
              border: 'none',
              color: '#9CA3AF',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: 0,
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ fontSize: '14px', lineHeight: 1.5, color: '#111827', marginBottom: '16px' }}>
          {stepContent}
        </div>

        {/* Action hint for action steps */}
        {isActionStep && (
          <div style={{ fontSize: '12px', color: '#C9A84C', fontStyle: 'italic', marginBottom: '12px', animation: 'tourPulse 1.8s ease-in-out infinite' }}>
            👆 Go ahead — we'll continue automatically...
          </div>
        )}

        {/* Footer with navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            style={{
              background: 'none',
              border: 'none',
              color: currentStep === 1 ? '#D1D5DB' : '#6B7280',
              cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              padding: '4px 8px',
            }}
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            style={{
              background: 'none',
              border: 'none',
              color: '#004D40',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              padding: '4px 8px',
            }}
          >
            {currentStep === tourSteps.length ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

