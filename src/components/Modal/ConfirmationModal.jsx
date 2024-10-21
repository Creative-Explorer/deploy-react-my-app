// src/components/ConfirmationModal.js
import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
    return (
        <div className="modal-overlay">
            <div className="modal">
                <h4 className="modal-title">Alert..!</h4>
                <p className="modal-message">{message}</p>
                <div className="modal-footer">
                    <button className="confirm-button" onClick={onConfirm}>
                        ✅ Yes, Confirm
                    </button>
                    <button className="cancel-button" onClick={onCancel}>
                        ❌ No, Cancel
                    </button>
                </div>
                <div className="modal-icons">
                    <span role="img" aria-label="warning" className="modal-icon">⚠️</span>
                    <span role="img" aria-label="info" className="modal-icon">ℹ️</span>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
