import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotatingLines } from "react-loader-spinner"; // Import the spinner component
import "./PaymentComponent.css";

function PaymentComponent() {
  const [formData, setFormData] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true); // Start loading spinner

    // Simulate a network request
    setTimeout(() => {
      setLoading(false); // Stop loading spinner
      setSubmitted(true); // Show success message

      // Redirect after displaying the success message
      setTimeout(() => {
        navigate("/dashboard"); // Replace '/dashboard' with your actual dashboard path
      }, 1500); // Adjust delay as needed
    }, 10000); // Simulate loading delay
  };

  return (
    <div className="payment-container">
      {loading && (
        <div className="global-loading-overlay">
          <RotatingLines
            strokeColor="#007bff" // Customize spinner color
            strokeWidth="5"
            animationDuration="1.5" // Faster animation for a smoother look
            width="80" // Adjust spinner size if needed
            visible={true}
          />
          <p className="loading-text">
            Please wait while we process your payment...
          </p>
        </div>
      )}
      {!submitted ? (
        <div className="payment-form-container">
          <h1 className="payment-heading">Payment Details</h1>
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <div className="input-container">
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleChange}
                  placeholder="1234 5678 9012 3456"
                  required
                  disabled={loading}
                />
                <div className="card-icons">
                  <img
                    src="https://www.freepnglogos.com/uploads/visa-logo-download-png-21.png"
                    alt="Visa"
                  />
                  <img
                    src="https://www.freepnglogos.com/uploads/mastercard-png/file-mastercard-logo-svg-wikimedia-commons-4.png"
                    alt="MasterCard"
                  />
                  <img
                    src="https://www.freepnglogos.com/uploads/discover-png-logo/credit-cards-discover-png-logo-4.png"
                    alt="Discover"
                  />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="cardHolder">Card Holder</label>
              <input
                type="text"
                id="cardHolder"
                name="cardHolder"
                value={formData.cardHolder}
                onChange={handleChange}
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="expiryDate">Expiry Date</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                placeholder="MM/YY"
                required
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="submit-button" disabled={loading}>
              Submit Payment
            </button>
          </form>
        </div>
      ) : (
        <div className="success-message">
          Payment successful! Redirecting to dashboard...
        </div>
      )}
    </div>
  );
}

export default PaymentComponent;
