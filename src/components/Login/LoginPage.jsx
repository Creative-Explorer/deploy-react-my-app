import React, { useState, useEffect } from "react";
import { requestOtp, verifyOtp, authenticateUser } from "../../ApiService"; // Ensure paths are correct
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { FaPhone, FaLock, FaEye, FaEyeSlash } from "react-icons/fa"; // Import icons
import "react-toastify/dist/ReactToastify.css";
import "./LoginPage.css";
import { useAuth } from "../../AuthContext";

function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, login } = useAuth(); // Access login function from context
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const navigate = useNavigate();

  useEffect(() => {
    toast.info("Welcome! Please log in! 🎉", {
      position: "bottom-right",
      autoClose: 5000,
    });
  }, []);

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await requestOtp(phoneNumber);
      setIsOtpSent(true);
      toast.success("OTP sent to your mobile number!", {
        position: "bottom-right",
        autoClose: 5000,
      });
    } catch (err) {
      console.error("OTP request failed:", err.message);
      toast.error("Failed to send OTP. Please check your phone number.", {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const verifyResponse = await verifyOtp(phoneNumber, otp);
      if (verifyResponse === "OTP verified successfully") {
        setIsOtpVerified(true);
        toast.success("OTP verified successfully!", {
          position: "bottom-right",
          autoClose: 5000,
        });
      } else {
        throw new Error("Invalid OTP verification response");
      }
    } catch (err) {
      console.error("Verification failed:", err.message);
      toast.error("Failed to verify OTP. Please try again.", {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard"); // Redirect to dashboard if authenticated
    } else {
      toast.info("Welcome! Please log in! 🎉", {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  }, [isAuthenticated, navigate]);
  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const authResponse = await authenticateUser(phoneNumber, password);
      if (authResponse.data && authResponse.data.token) {
        // Store tokens and user info in local storage
        window.localStorage.setItem("access_token", authResponse.data.token);
        window.localStorage.setItem("access_phoneNumber", phoneNumber);
        window.localStorage.setItem("access_role_based", authResponse.data.role);
        window.localStorage.setItem(
          "access_userName",
          authResponse.data.userName
        );

        // Call the login function from context
        login(); // Ensure this is defined in AuthContext
        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        throw new Error("No token received from authentication");
      }
    } catch (err) {
      console.error("Authentication failed:", err.message);
      toast.error("Failed to authenticate. Please check your credentials.", {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <app-header-section isInternalHeader={true}></app-header-section>
      <app-category-items isInternalCategoryItems={true}></app-category-items>
      <section className="sign-in-section">
      <div className="sign-in-left-container">
        <h1 className="title">Login</h1>
        <p className="sub-message">
          Get access to your Orders, Wishlist, and Recommendations
        </p>
        {/* <div className="login-image">
          <img src="images/Sesat-Logo.png" alt="login" />
        </div> */}
      </div>
      <div className="sign-in-right-container">
        <ToastContainer position="bottom-center" autoClose={5000} />
        <div className="login-container">
          <form onSubmit={handleLogin} className="login-form">
            <div className="mobile-input-box">
              <label htmlFor="phoneNumber">Mobile Number</label>
              <div className="input-group">
                <FaPhone className="icon" />
                <input
                  type="text"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
            </div>
            <div className="mobile-input-box">
              <label htmlFor="password">Password</label>
              <div className="input-group">
                <FaLock className="icon" />
                <input
                  type={showPassword ? 'text' : 'password'} // Toggle password visibility
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="eye-icon"
                  onClick={() => setShowPassword(!showPassword)} // Toggle showPassword state
                >
                  {showPassword ? <FaEye /> : <FaEyeSlash />} {/* Toggle icon */}
                </button>
              </div>
            </div>
            <button type="submit" className="submit-otp-button">
              Login
            </button>
            {isLoading && <div className="loader"></div>}
          </form>
          <div className="footer-links">
            <a href="#">Forgot Password?</a>
            <span> | </span>
            <a href="#">Create an Account</a>
          </div>
        </div>
      </div>
    </section>
      <app-footer-section></app-footer-section>
    </>
  );
}

export default LoginPage;
