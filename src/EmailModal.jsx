import React, { useState } from 'react';
import './EmailModal.css';

/**
 * Custom email input modal for Teams compatibility
 * Replaces browser prompt() which doesn't work in Teams apps
 */
export default function EmailModal({ isOpen, onSubmit, onCancel }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email.trim());
      setEmail('');
    }
  };

  const handleCancel = () => {
    setEmail('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="email-modal-overlay">
      <div className="email-modal">
        <h3>Sign up with Email</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              autoFocus
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
