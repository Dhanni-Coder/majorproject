import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../../styles/Modal.css';

/**
 * Modal Component
 * A reusable modal dialog component with animation and backdrop
 */
const Modal = ({ isOpen, onClose, title, children, size = 'medium' }) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    // Lock body scroll when modal is open
    if (isOpen) {
      // Save the current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);

      // Restore scroll position when modal closes
      if (isOpen) {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.overflow = '';
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };
  }, [isOpen, onClose]);

  // Handle click outside modal to close
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Check if modal content is scrollable
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const checkOverflow = () => {
        const content = contentRef.current;
        if (content.scrollHeight > content.clientHeight) {
          content.classList.add('scrollable');
        } else {
          content.classList.remove('scrollable');
        }
      };

      checkOverflow();
      // Also check after a short delay to account for dynamic content
      setTimeout(checkOverflow, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div
        className={`modal-container modal-${size}`}
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>
        <div className="modal-content" ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
