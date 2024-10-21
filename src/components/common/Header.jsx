import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css'; // Optional: add CSS for styling

function Header() {
  return (
    <header className="app-header">
      <h1>My Application</h1>
      <nav>
        <Link to="/login">Login</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/payment">Payment</Link>
      </nav>
    </header>
  );
}

export default Header;
