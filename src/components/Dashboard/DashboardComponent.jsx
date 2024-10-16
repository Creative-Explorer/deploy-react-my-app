import React, { useState, useEffect, useRef, useCallback } from "react";
import { fetchProducts, addToCartApi } from "../../ApiService";
import "./DashboardComponent.css";
import { useNavigate } from "react-router-dom";
import Pagination from "@mui/material/Pagination";
import { Stack } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { fetchItemCount} from "../../ApiService"
import { fetchCartItems, removeFromCart } from "../../ApiService";
import * as XLSX from "xlsx";
import { Line, Scatter, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler,
} from "chart.js";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useAuth } from "../../AuthContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  Filler
);

function DashboardComponent() {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeSection, setActiveSection] = useState("home");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cart, setCart] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const [showMessage, setShowMessage] = useState(false);
  const [entriesPerPage, setEntriesPerPage] = useState(5); // Default to 5 entries per page
  const [data, setData] = useState([]);
  // const [showMessage, setShowMessage] = useState(false);
  const [images, setImages] = useState([]);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const { logout } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [showProductList, setShowProductList] = useState(false); // State to control product list visibility
  const [inactivityTimeout, setInactivityTimeout] = useState(null);
  const [inactivityTimeoutId, setInactivityTimeoutId] = useState(null);
  const inactivityDuration = 1 * 60 * 1000; // 1 minute
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true); // Track user activity
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [timeoutId, setTimeoutId] = useState(null);
  const [videos, setVideos] = useState([]);
  // const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";
  const geoUrl =
    "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
  const { isAuthenticated } = useAuth();
  const handleLogout = useCallback(() => {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("access_phoneNumber");
    // logout();
    navigate("/session-expired");
  }, [navigate]);

  useEffect(() => {
    fetch(geoUrl)
      .then((response) => response.json())
      .then((data) => {
        console.log("GeoJSON Data:", data); // Log GeoJSON data
      });
  }, []);

  const getColor = (quantity) => {
    if (quantity > 20) return "#005700"; // Dark green
    if (quantity > 10) return "#66CDAA"; // Medium green
    if (quantity > 0) return "#98FB98"; // Light green
    return "#EAEAEA"; // Default color for no data
  };

  const handleMouseEnter = (geo, evt) => {
    const country = geo.properties.NAME; // Get country name from properties
    const quantity = aggregatedData[country] || 0;
    setTooltipContent(`${country}: ${quantity} items`);
    setTooltipPosition({ top: evt.clientY + 10, left: evt.clientX + 10 });
  };

  const handleMouseLeave = () => {
    setTooltipContent("");
  };
  useEffect(() => {
    const fetchData = async () => {
      const token = window.localStorage.getItem("access_token");
      const phoneNumber = window.localStorage.getItem("access_phoneNumber");

      if (!token || !phoneNumber) {
        setError(new Error("Access token or phone number not found."));
        setLoading(false);
        return;
      }

      try {
        const { data } = await fetchProducts(token, phoneNumber);
        const formattedProducts = data.map((item) => ({
          product: item.product,
          isDisabled: item.disabled,
          paymentStatus: item.paymentStatus,
        }));

        setProducts(formattedProducts);
      } catch (err) {
        if (err.response && err.response.status === 403) {
          handleLogout(); // Automatically logout on token expiration
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    toast.success(
      <span>
        <strong>Login Successful!</strong> 👌
      </span>,
      {
        position: "bottom-right",
        autoClose: 5000,
      }
    );
  }, [navigate, handleLogout]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value) {
      const filtered = products.filter((product) =>
        product.product.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product) => {
    setSearchTerm(product.product.name);
    setShowSuggestions(false);
  };

  const sortedProducts = products
    .filter(
      (product) =>
        !searchTerm ||
        product.product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.isDisabled - b.isDisabled); // Enabled products first

  // Check if any products are disabled
  const hasDisabledProducts = sortedProducts.some(
    (product) => product.isDisabled
  );

  // Pagination Logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = sortedProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const productNames = currentProducts.map(
    (item) => item.product.name || "No name"
  );
  const productPrices = currentProducts.map((item) => item.product.price);
  const productQuantities = currentProducts.map(
    (item) => item.product.quantity || 0
  );
  const productCategories = currentProducts.map(
    (item) => item.product.category || "No category"
  );
  const productSubcategories = currentProducts.map(
    (item) => item.product.subCategory || "No subcategory"
  );

  const salesData = currentProducts.map(
    (item) => item.product.price * item.product.quantity
  );

  // Create productSalesVsQuantity array
  const productSalesVsQuantity = currentProducts.map((item) => ({
    x: item.product.price,
    y: item.product.quantity,
  }));

  const productData = currentProducts.map((item) => ({
    name: item.product.name || "No name",
    quantity: item.product.quantity || 0,
    country: item.product.country || "Unknown", // Assuming you have a country field
  }));

  // Aggregate product quantities by country
  const countryMapping = {
    USA: "United States",
    UK: "United Kingdom",
    UAE: "United Arab Emirates",
    // Add more mappings as needed
  };

  // Use the mapping when aggregating data
  const aggregatedData = currentProducts.reduce((acc, { product }) => {
    const country = countryMapping[product.country] || product.country;
    acc[country] = (acc[country] || 0) + product.quantity;
    return acc;
  }, {});

  // Check if all products on the current page are enabled
  const allProductsEnabled = currentProducts.every(
    (product) => !product.isDisabled
  );
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? 2 : prevSlide - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 2 ? 0 : prevSlide + 1));
  };
  const handleContactSupport = () => {
    window.location.href = "mailto:support@myshop.com"; // Opens the user's email client
    setShowMessage(true);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide === 2 ? 0 : prevSlide + 1));
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // const handleAddToCart = (product) => {
  //   setCart((prevCart) => [...prevCart, product]);
  // };

  const handleRemoveFromCart = async (id) => {
    try {
      // Call the API to remove the item from the cart
      const response = await axios.delete(
        `http://localhost:5300/carts/cart-delete`,
        {
          params: { id },
        }
      );

      console.log("Delete response:", response); // Log the response

      // Check if the deletion was successful
      if (response.status === 200) {
        // Fetch updated cart data after deletion
        await fetchCartData();
        toast.success("Item removed from cart successfully", {
          position: "bottom-right",
        });
      } else {
        toast.error("Failed to remove item from cart", {
          position: "bottom-right",
        });
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast.error("Error removing item from cart", {
        position: "bottom-right",
      });
    }
  };

  const handleAddToCart = async (product) => {
    console.log("Product being added to cart:", product); // Log the product object
  
    // Ensure the product object has the expected structure
    if (!product || !product.productId) {
      toast.error("Invalid product information", {
        position: "bottom-right",
      });
      return;
    }
  
    const phoneNumber = window.localStorage.getItem('access_phoneNumber');
  
    if (!phoneNumber) {
      toast.error("Phone number not found", {
        position: "bottom-right",
      });
      return;
    }
  
    try {
      // Make sure this line is within an async function
      await addToCartApi(product.productId, phoneNumber);
      setCart((prevCart) => [...prevCart, product]);
      toast.success("Product added to cart successfully!", {
        position: "bottom-right",
      });
    } catch (error) {
      toast.error("Failed to add product to cart", {
        position: "bottom-right",
      });
      console.error("Error adding to cart:", error);
    }
  };

  const fetchCartData = async () => {
    try {
      const phoneNumber = window.localStorage.getItem("access_phoneNumber");
  
      // Ensure the phone number is retrieved
      if (!phoneNumber) {
        toast.error("Phone number not found", {
          position: "bottom-right",
        });
        return;
      }
  
      const response = await axios.get(`http://localhost:5300/carts/cart-items`, {
        params: { phoneNumber }, // Pass the phone number as a query parameter
      });
  
      setCart(response.data); // Set the cart items in the state
    } catch (error) {
      console.error("Error fetching cart items:", error);
      toast.error("Error fetching cart items", {
        position: "bottom-right",
      });
    }
  };
  

  useEffect(() => {
    if (activeSection === "cart") {
      fetchCartData(); // Fetch cart data when entering the cart section
    }
  }, [activeSection]);

  const handleProceedToBuy = () => {
    if (isAuthenticated) {
      navigate("/payment");
    } else {
      // Optionally show a message or redirect to login
      navigate("/login");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      setData(jsonData);
    };

    reader.readAsBinaryString(file);
  };
  const ExcelUploader = () => {
    const [data, setData] = useState([]);

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setData(jsonData);
      };

      reader.readAsBinaryString(file);
    };
  };
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages((prevImages) => prevImages.concat(newImages));
  };
  const handleSave = () => {
    console.log("Data saved:", data);
    // Add your saving logic here
  };

  const handleCancel = () => {
    setData([]); // Clear the data on cancel
    console.log("Upload canceled");
  };

  const barChartData = {
    labels: productNames,
    datasets: [
      {
        label: "Product Prices",
        data: productPrices,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Product Quantities",
        data: productQuantities,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };

  const pieChartData = {
    labels: productNames,
    datasets: [
      {
        data: productPrices,
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)", // Bright Red
          "rgba(54, 162, 235, 0.8)", // Bright Blue
          "rgba(255, 206, 86, 0.8)", // Bright Yellow
          "rgba(75, 192, 192, 0.8)", // Teal
          "rgba(153, 102, 255, 0.8)", // Purple
          "rgba(255, 159, 64, 0.8)", // Orange
          "rgba(255, 0, 0, 0.8)", // Pure Red
          "rgba(0, 255, 0, 0.8)", // Pure Green
          "rgba(0, 0, 255, 0.8)", // Pure Blue
          "rgba(255, 0, 255, 0.8)", // Magenta
          "rgba(255, 255, 0, 0.8)", // Bright Yellow
          "rgba(255, 99, 132, 0.8)", // Bright Red
          "rgba(54, 162, 235, 0.8)", // Bright Blue
          "rgba(255, 206, 86, 0.8)", // Bright Yellow
          "rgba(75, 192, 192, 0.8)", // Teal
          "rgba(153, 102, 255, 0.8)", // Purple
          "rgba(255, 159, 64, 0.8)", // Orange
          "rgba(255, 0, 0, 0.8)", // Pure Red
          "rgba(0, 255, 0, 0.8)", // Pure Green
          "rgba(0, 0, 255, 0.8)", // Pure Blue
          "rgba(255, 0, 255, 0.8)", // Magenta
          "rgba(255, 255, 0, 0.8)", // Bright Yellow
          "rgba(0, 255, 255, 0.8)", // Cyan
          "rgba(128, 0, 128, 0.8)", // Purple
          "rgba(255, 140, 0, 0.8)", // Dark Orange
          "rgba(255, 20, 147, 0.8)", // Deep Pink
          "rgba(128, 128, 0, 0.8)", // Olive
          "rgba(0, 128, 128, 0.8)", // Teal
          "rgba(75, 0, 130, 0.8)", // Indigo
          "rgba(240, 128, 128, 0.8)", // Light Coral
          "rgba(255, 99, 132, 0.8)", // Bright Red
          "rgba(54, 162, 235, 0.8)", // Bright Blue
          "rgba(255, 206, 86, 0.8)", // Bright Yellow
          "rgba(75, 192, 192, 0.8)", // Teal
          "rgba(153, 102, 255, 0.8)", // Purple
          "rgba(255, 159, 64, 0.8)", // Orange
          "rgba(255, 0, 0, 0.8)", // Pure Red
          "rgba(0, 255, 0, 0.8)", // Pure Green
          "rgba(0, 0, 255, 0.8)", // Pure Blue
          "rgba(255, 0, 255, 0.8)", // Magenta
          "rgba(255, 255, 0, 0.8)", // Bright Yellow
          "rgba(0, 255, 255, 0.8)", // Cyan
          "rgba(128, 0, 128, 0.8)", // Purple
          "rgba(255, 140, 0, 0.8)", // Dark Orange
          "rgba(255, 20, 147, 0.8)", // Deep Pink
          "rgba(128, 128, 0, 0.8)", // Olive
          "rgba(0, 128, 128, 0.8)", // Teal
          "rgba(75, 0, 130, 0.8)", // Indigo
          "rgba(240, 128, 128, 0.8)", // Light Coral
          "rgba(100, 149, 237, 0.8)", // Cornflower Blue
          "rgba(135, 206, 235, 0.8)",
        ],
      },
    ],
  };
  const lineChartData = {
    labels: productNames,
    datasets: [
      {
        label: "Sales Over Time",
        data: salesData, // This should be an array of sales numbers corresponding to each time point
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  // Sample sales data
  const scatterPlotData = {
    datasets: [
      {
        label: "Product Sales vs Quantity",
        data: productSalesVsQuantity, // This should be an array of { x: salesValue, y: quantityValue }
        backgroundColor: "rgba(255, 99, 132, 1)",
      },
    ],
  };

  const columnChartData = {
    labels: productNames,
    datasets: [
      {
        label: "Product Prices",
        data: productPrices,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const GeoChart = ({ aggregatedData }) => {
    useEffect(() => {
      fetch(geoUrl)
        .then((response) => response.json())
        .then((data) => {
          console.log("GeoJSON Data:", data); // Log GeoJSON data
        });
    }, []);
  };

  const CylinderChart = ({ currentProducts }) => {
    const productPrices = currentProducts.map(item => item.product.price);
    const productNames = currentProducts.map(item => item.product.name);
  
    const data = {
      labels: productNames,
      datasets: [
        {
          label: 'Product Prices',
          data: productPrices,
          backgroundColor: 'rgba(54, 162, 235, 0.6)', // Color of the bars
          borderColor: 'rgba(54, 162, 235, 1)', // Border color
          borderWidth: 1,
        },
      ],
    };
  
    const options = {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Price ($)',
          },
        },
      },
    };
  }
  // For Treemap, you may need a specific library since Chart.js does not support it natively.
  // Consider using another library like `react-vis` or `d3`.

  const role = window.localStorage.getItem("access_role_based") || "Unknown User";
  const userName =
    window.localStorage.getItem("access_userName") || "Unknown User";

    useEffect(() => {
      const phoneNumber = window.localStorage.getItem("access_phoneNumber"); // Get phone number from local storage

      const getItemCount = async () => {
        try {
          const response = await axios.get('http://localhost:5300/products/product-count', {
            headers: {
              'Content-Type': 'application/json',
            },
            params: { phoneNumber } // Pass phoneNumber as a query parameter
          });
          setItemCount(response.data); // Set the count directly from the response
        } catch (err) {
          setError(err);
        } finally {
          setLoading(true);
        }
      };
  
      if (phoneNumber) { // Check if phoneNumber is available
        getItemCount();
      } else {
        setLoading(true); // Handle case where phoneNumber is not available
      }
    }, []);
    
    const handleItemClick = () => {
      setLoading(true);
      setShowProductList(prev => !prev); // Toggle visibility
       setTimeout(() => {
    setLoading(false); // Hide loading spinner after 3 seconds
  }, 3000);
    };
// implement inActivity then page will go session expired page

const startInactivityTimer = useCallback(() => {
  // Start a new inactivity timer
  const newTimeoutId = setTimeout(() => {
    handleLogout(); // Call logout function after inactivity
  }, inactivityDuration);
  setTimeoutId(newTimeoutId);
}, [handleLogout]);

const resetInactivityTimer = useCallback(() => {
  // Clear existing timeout
  if (timeoutId) {
    clearTimeout(timeoutId);
    setTimeoutId(null); // Reset the timeoutId
  }
  // Start a new inactivity timer
  startInactivityTimer();
}, [timeoutId, startInactivityTimer]);

useEffect(() => {
  // Register event listeners for user activity
  window.addEventListener('click', resetInactivityTimer);
  window.addEventListener('keydown', resetInactivityTimer);
  window.addEventListener('mousemove', resetInactivityTimer);

  // Start the inactivity timer
  startInactivityTimer();

  return () => {
    // Cleanup event listeners and timeout on unmount
    window.removeEventListener('click', resetInactivityTimer);
    window.removeEventListener('keydown', resetInactivityTimer);
    window.removeEventListener('mousemove', resetInactivityTimer);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}, [resetInactivityTimer, startInactivityTimer, timeoutId]);


useEffect(() => {
  const fetchVideos = async () => {
      console.log('Fetching videos...');

      try {
          const response = await fetch('http://localhost:5300/products/video/list');

          // Log the response status and headers for debugging
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);

          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Fetched data:', data);
          setVideos(data);
      } catch (err) {
          console.error('Fetch error:', err);
      }
  };

  fetchVideos();
}, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <nav className="navbar">
          <div className="logo">
            <div className="logo-item">{role} : </div>
            <div className="logo-item">{userName}</div>
          </div>

          <form className="search-box" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={handleSearchChange}
              ref={searchInputRef}
              aria-label="Search products"
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <i className="fa fa-times"></i>
              </button>
            )}
            {showSuggestions && (
              <div className="suggestions-dropdown">
                {filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((product) => (
                    <div
                      key={product.product.productId}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(product)}
                    >
                      {product.product.name || "No name"}
                    </div>
                  ))
                ) : (
                  <div className="suggestion-item">No suggestions</div>
                )}
              </div>
            )}
          </form>
          <ul className="nav-links">
            <li>
              <a href="#home" onClick={() => setActiveSection("home")}>
                Home
              </a>
            </li>
            <li>
              <a href="#products" onClick={() => setActiveSection("products")}>
                Products
              </a>
            </li>
            <li>
              <a href="#about" onClick={() => setActiveSection("about")}>
                Charts
              </a>
            </li>
            <li>
              <a href="#contact" onClick={() => setActiveSection("contact")}>
                Contact
              </a>
            </li>
            <li>
              <a href="#cart" onClick={() => setActiveSection("cart")}>
                Cart ({cart.length})
              </a>
            </li>
            <li>
              <a href="#card" onClick={() => setActiveSection("card")}>
                Card
              </a>
            </li>
            <li>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <div className="dashboard-content">
        {activeSection === "home" && (
          <div className="home-section">
            <div className="slider-container">
              <button onClick={prevSlide} className="button prev">&#10094;</button>
              <div className="slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                <div className="slide">
                  <img 
                    src="https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/b35a105fe8bc8cbb.png?q=20" 
                    alt="Slide 1" 
                  />
                </div>
                <div className="slide">
                  <img 
                    src="https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/39e74c24b819a298.jpeg?q=20" 
                    alt="Slide 2" 
                  />
                </div>
                <div className="slide">
                  <img 
                    src="https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/dff6511cbf3c625e.jpg?q=20" 
                    alt="Slide 3" 
                  />
                </div>
              </div>
              <div className="gradient-overlay"></div>
              <button onClick={nextSlide} className="button next">&#10095;</button>
              <div className="pagination-dots">
                {[0, 1, 2].map(index => (
                  <div
                    key={index}
                    className={`dot ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>
            <div>
    <h1>Video List</h1>
    <ul>
        {videos.map(video => (
            <li key={video.id}>
                <h2>{video.name}</h2>
                <video controls width="400">
                    <source
                        src={`data:video/mp4;base64,${video.videoData}`}
                        type="video/mp4"
                    />
                    Your browser does not support the video tag.
                </video>
            </li>
        ))}
    </ul>
</div>

            <div className="products-grid">
              <h2>Our Products</h2>
              <p>Explore our range of products:</p>
              {loading && (
                <div className="spinner-circle">
                  <div className="spinner"></div>
                  <div className="spinner-text">Loading, please wait...</div>
                </div>
              )}
              {error && <p>Error loading products: {error.message}</p>}

              <div
                className={`product-list ${showMessage ? "low-opacity" : ""}`}
              >
                {!loading && !error && (
                  <>
                    {/* Check for disabled products and render the appropriate table */}
                    {currentProducts.some((product) => product.isDisabled) ? (
                      <table className="product-table">
                        <thead>
                          <tr>
                            <th>S.No</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Product Image</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentProducts
                            .filter((product) => product.isDisabled)
                            .map((item, index) => (
                              <tr
                                key={item.product.productId}
                                className="disabled-row"
                              >
                                <td>{index + 1}</td>
                                <td>{item.product.name || "No name"}</td>
                                <td>${item.product.price}</td>
                                <td>Out of Stock</td>
                                <td style={{ color: "red" }}>Inactive</td>{" "}
                                {/* Display Inactive in red */}
                                <td>
                                  <img
                                    src={
                                      item.product.imageData
                                        ? `data:image/jpeg;base64,${item.product.imageData}`
                                        : "default-image-url.jpg"
                                    }
                                    alt={item.product.name || "No name"}
                                    className="product-image"
                                  />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    ) : (
                      currentProducts.some(
                        (product) => !product.isDisabled
                      ) && (
                        <table className="product-table">
                          <thead>
                            <tr>
                              <th>S.No</th>
                              <th>Name</th>
                              <th>Price</th>
                              <th>Quantity</th>
                              <th>Product Image</th>
                              <th>Actions</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentProducts
                              .filter((product) => !product.isDisabled)
                              .map((item, index) => (
                                <tr key={item.product.productId}>
                                  <td>{index + 1}</td>
                                  <td>{item.product.name || "No name"}</td>
                                  <td>${item.product.price}</td>
                                  <td>
                                    <input
                                      type="number"
                                      min="1"
                                      defaultValue="1"
                                      className="quantity-input"
                                    />
                                  </td>
                                  <td>
                                    <img
                                      src={
                                        item.product.imageData
                                          ? `data:image/jpeg;base64,${item.product.imageData}`
                                          : "default-image-url.jpg"
                                      }
                                      alt={item.product.name || "No name"}
                                      className="product-image"
                                    />
                                  </td>
                                  <td>
                                    <button
                                      className="add-to-cart-button"
                                      onClick={() =>
                                        handleAddToCart(item.product)
                                      }
                                    >
                                      Add to Cart
                                    </button>
                                  </td>
                                  <td>
                                    <button
                                      className={`status-button ${item.paymentStatus}`}
                                      style={{ borderRadius: "8px" }} // Rounded corners
                                    >
                                      {item.paymentStatus}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      )
                    )}

                    {/* Show message if there are disabled products */}
                    {currentProducts.some((product) => product.isDisabled) && (
                      <div className="unauthorized-message">
                      <div className="message-content">
                        <h1 style={{ fontWeight: "bold" }}>403 Forbidden</h1>
                        <h2>You don't have authorization to access this page.</h2>
                        <p>Please contact support for more information.</p>
                        <button
                          className="contact-support-button"
                          onClick={() => {
                            handleContactSupport();
                            setShowMessage(true);
                          }}
                        >
                          Contact Support
                        </button>
                      </div>
                    </div>
                    
                    )}
                  </>
                )}
              </div>

              {/* Pagination Logic - Only show when there are enabled products */}
              {allProductsEnabled && currentProducts.length > 0 && (
                <div className="custom-pagination-container">
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>

                  <select
                    className="entries-per-page"
                    value={entriesPerPage}
                    onChange={(e) => {
                      setEntriesPerPage(Number(e.target.value));
                      setCurrentPage(1); // Reset to the first page when changing entries per page
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                  </select>

                  <Stack spacing={2} className="pagination-stack">
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(event, page) => setCurrentPage(page)}
                      variant="outlined"
                      shape="rounded"
                      classes={{ ul: "custom-pagination-list" }}
                    />
                  </Stack>
                </div>
              )}
            </div>
          </div>
          
        )}

        {activeSection === "products" && (
          <div className="home-section">
            {/* <div className="slider-container">
              <button onClick={prevSlide} className="button prev">&#10094;</button>
              <div className="slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                <div className="slide">
                  <img 
                    src="https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/b35a105fe8bc8cbb.png?q=20" 
                    alt="Slide 1" 
                  />
                </div>
                <div className="slide">
                  <img 
                    src="https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/39e74c24b819a298.jpeg?q=20" 
                    alt="Slide 2" 
                  />
                </div>
                <div className="slide">
                  <img 
                    src="https://rukminim1.flixcart.com/fk-p-flap/1600/270/image/dff6511cbf3c625e.jpg?q=20" 
                    alt="Slide 3" 
                  />
                </div>
              </div>
              <div className="gradient-overlay"></div>
              <button onClick={nextSlide} className="button next">&#10095;</button>
              <div className="pagination-dots">
                {[0, 1, 2].map(index => (
                  <div
                    key={index}
                    className={`dot ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div> */}

            <div className="products-grid">
              <h2>Our Products</h2>
              <p>Explore our range of products:</p>
              {loading && <p>Loading products...</p>}
              {error && <p>Error loading products: {error.message}</p>}

              <div className="product-list">
                {!loading && !error && (
                  <>
                    {/* Render all products */}
                    <div className="products-container">
                      {currentProducts.map(
                        ({ product, isDisabled, paymentStatus }) => (
                          <div
                            key={product.productId}
                            className={`product-card ${
                              isDisabled ? "disabled" : ""
                            }`}
                          >
                            {/* Show Out of Stock if paymentStatus is SUCCESS */}
                            {paymentStatus === "SUCCESS" && (
                              <span className="out-of-stock-label">
                                Out of Stock
                              </span>
                            )}
                            <img
                              src={
                                product.imageData
                                  ? `data:image/jpeg;base64,${product.imageData}`
                                  : "default-image-url.jpg"
                              }
                              alt={product.name || "No name"}
                              className="product-image"
                            />
                            <div className="product-info">
                              <h3>{product.name || "No name"}</h3>
                              <p className="product-price">${product.price}</p>
                              <button
                                className="add-to-cart-button"
                                onClick={() =>
                                  handleAddToCart({ ...product, isDisabled })
                                }
                                disabled={
                                  isDisabled || paymentStatus === "SUCCESS"
                                } // Disable button if out of stock
                              >
                                {paymentStatus === "SUCCESS"
                                  ? "Out of Stock"
                                  : "Add to Cart"}
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Show message if any products are disabled */}
                    {currentProducts.some((product) => product.isDisabled) && (
                      <div className="unauthorized-message">
                        <div className="message-content">
                          <h1 style={{ fontWeight: "bold" }}>403 Forbidden</h1>
                          <h2>
                            You don't have authorization to access this page.
                          </h2>
                          <p>Please contact support for more information.</p>
                          <button
                            className="contact-support-button"
                            onClick={handleContactSupport}
                          >
                            Contact Support
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pagination Logic - Only show when there are enabled products */}
              {allProductsEnabled && currentProducts.length > 0 && (
                <div className="custom-pagination-container">
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Stack spacing={2} className="pagination-stack">
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(event, page) => setCurrentPage(page)}
                      variant="outlined"
                      shape="rounded"
                      classes={{ ul: "custom-pagination-list" }} // Custom class for styling
                    />
                  </Stack>
                </div>
              )}
            </div>
          </div>
        )}
        {activeSection === "cart" && (
          <div className="cart-section">
            <h2>Your Cart</h2>
            {cart.length === 0 ? (
              <p className="empty-cart">Your cart is currently empty.</p>
            ) : (
              <div className="cart-container">
                <div className="cart-items">
                  {cart.map((product, index) => (
                    <div key={index} className="cart-item">
                      <img
                        src={
                          product.imageData
                            ? `data:image/jpeg;base64,${product.imageData}`
                            : "default-image-url.jpg"
                        }
                        alt={product.name || "No name"}
                        className="cart-item-image"
                      />
                      <div className="cart-item-details">
                        <h3>{product.name || "No name"}</h3>
                        <p className="cart-item-price">${product.price}</p>
                        <div className="cart-item-actions">
                          <button
                            className="remove-button"
                            onClick={() =>
                              handleRemoveFromCart(product.id)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-summary">
                  <h4>
                    Total: $
                    {cart
                      .reduce((total, item) => total + item.price, 0)
                      .toFixed(2)}
                  </h4>
                  <button
                    className="proceed-button"
                    onClick={handleProceedToBuy}
                  >
                    Proceed to Buy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "about" && (
          <div className="about-section">
            <h2>Our Products</h2>
            <p>Explore our range of products:</p>
            <div className="charts-container">
              <div className="chart-item">
                <h3>Product Prices by Category</h3>
                <Bar data={barChartData} />
              </div>
              <div className="chart-item">
                <h3>Product Quantities by Category</h3>
                <Bar data={barChartData} />
              </div>
              <div className="chart-item">
                <h3>Product Quantities Distribution</h3>
                <Pie data={pieChartData} />
              </div>
              <div className="chart-item">
                <h3>Product Prices Distribution</h3>
                <Pie data={pieChartData} />
              </div>
              <div className="chart-item">
                <h3>Sales Over Time</h3>
                <Line data={lineChartData} />
              </div>
              <div className="chart-item">
                <h3>Product Sales vs Quantity</h3>
                <Scatter data={scatterPlotData} />
              </div>
              <div className="chart-item">
                <h3>Product Prices Column Chart</h3>
                <Bar data={columnChartData} />
              </div>
              <div className="world-map-container">
                <h3 className="world-map-title">
                  World Map - Product Quantities
                </h3>
                <ComposableMap>
                  <Geographies geography={geoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo) => (
                        <Geography
                          key={geo.id}
                          geography={geo}
                          fill={getColor(
                            aggregatedData[geo.properties.NAME] || 0
                          )}
                          stroke="#FFFFFF"
                          style={{
                            hover: {
                              fill: "#76c7c0",
                              outline: "none",
                            },
                          }}
                          onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                          onMouseLeave={handleMouseLeave}
                        />
                      ))
                    }
                  </Geographies>
                </ComposableMap>
                {tooltipContent && (
                  <div
                    className="tooltip"
                    style={{
                      top: tooltipPosition.top,
                      left: tooltipPosition.left,
                      opacity: tooltipContent ? 1 : 0,
                    }}
                  >
                    {tooltipContent}
                  </div>
                )}
              </div>
              <div className="charts-container">
    {/* Other charts */}
    <CylinderChart currentProducts={currentProducts} />
    {/* Continue with other charts */}
  </div>
              {/* Treemap chart would go here, using another library */}
            </div>
          </div>
        )}

        {activeSection === "contact" && (
          <div className="contact-section">
            <div className="excel-uploader">
              <h2>Upload Excel File</h2>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              {data.length > 0 && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {Object.keys(data[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, i) => (
                            <td key={i}>{value}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Buttons for Save and Cancel */}
              <div
                className="button-container"
                style={{ marginTop: "20px", textAlign: "center" }}
              >
                <button className="btn btn-success" onClick={handleSave}>
                  Save
                </button>
                <button className="btn btn-danger" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {activeSection === "card" && (
         <div className="cart-content">
         <div className="cart-card-container">
           {/* Only show the first card if showProductList is false */}
           {!showProductList && (
             <div className="cart-card left-card" onClick={handleItemClick}>
               <p><h1>{itemCount}</h1></p>
             </div>
           )}
       
           {/* Conditionally render the product list and hide other cards */}
           {showProductList ? (
             <div className="products-grid">
             {loading && !error && (
    <div className="spinner-circle">
      <div className="spinner"></div>
      <div className="spinner-text">Loading, please wait...</div>
    </div>
  )}
             <div className="product-list">
               {!loading && !error && (
                 <>
                   {/* Render all products */}
                   <div className="products-container">
                     {currentProducts.map(
                       ({ product, isDisabled, paymentStatus }) => (
                         <div
                           key={product.productId}
                           className={`product-card ${
                             isDisabled ? "disabled" : ""
                           }`}
                         >
                           {/* Show Out of Stock if paymentStatus is SUCCESS */}
                           {paymentStatus === "SUCCESS" && (
                             <span className="out-of-stock-label">
                               Out of Stock
                             </span>
                           )}
                           <img
                             src={
                               product.imageData
                                 ? `data:image/jpeg;base64,${product.imageData}`
                                 : "default-image-url.jpg"
                             }
                             alt={product.name || "No name"}
                             className="product-image"
                           />
                           <div className="product-info">
                             <h3>{product.name || "No name"}</h3>
                             <p className="product-price">${product.price}</p>
                             <button
                               className="add-to-cart-button"
                               onClick={() =>
                                 handleAddToCart({ ...product, isDisabled })
                               }
                               disabled={
                                 isDisabled || paymentStatus === "SUCCESS"
                               } // Disable button if out of stock
                             >
                               {paymentStatus === "SUCCESS"
                                 ? "Out of Stock"
                                 : "Add to Cart"}
                             </button>
                           </div>
                         </div>
                       )
                     )}
                   </div>

                   {/* Show message if any products are disabled */}
                   {currentProducts.some((product) => product.isDisabled) && (
                     <div className="unauthorized-message">
                       <div className="message-content">
                         <h1 style={{ fontWeight: "bold" }}>403 Forbidden</h1>
                         <h2>
                           You don't have authorization to access this page.
                         </h2>
                         <p>Please contact support for more information.</p>
                         <button
                           className="contact-support-button"
                           onClick={handleContactSupport}
                         >
                           Contact Support
                         </button>
                       </div>
                     </div>
                   )}
                 </>
               )}
             </div>

             {/* Pagination Logic - Only show when there are enabled products */}
             {allProductsEnabled && currentProducts.length > 0 && (
               <div className="custom-pagination-container">
                 <div className="pagination-info">
                   Page {currentPage} of {totalPages}
                 </div>
                 <Stack spacing={2} className="pagination-stack">
                   <Pagination
                     count={totalPages}
                     page={currentPage}
                     onChange={(event, page) => setCurrentPage(page)}
                     variant="outlined"
                     shape="rounded"
                     classes={{ ul: "custom-pagination-list" }} // Custom class for styling
                   />
                 </Stack>
               </div>
             )}
           </div>
           ) : (
             <>
               <div className="cart-card center-card">
                 <h1><center>User</center></h1>
                 {/* <p>Details about the center product.</p> */}
               </div>
               <div className="cart-card right-card">
               <h1><center>User</center></h1>
               </div>
             </>
           )}
         </div>
       </div>
       
       
        
        )}
      </div>

      <footer className="dashboard-footer">
  <div className="footer-container">
    <div className="footer-section">
      <h3>About Us</h3>
      <ul>
        <li><a href="#about">About MyShop</a></li>
        <li><a href="#careers">Careers</a></li>
        <li><a href="#press">Press Releases</a></li>
        <li><a href="#contact">Contact Us</a></li>
        <li><a href="#mission">Our Mission</a></li>
        <li><a href="#values">Our Values</a></li>
        <li><a href="#team">Meet the Team</a></li>
      </ul>
    </div>
    <div className="footer-section">
      <h3>Customer Service</h3>
      <ul>
        <li><a href="#shipping">Shipping Information</a></li>
        <li><a href="#returns">Returns & Exchanges</a></li>
        <li><a href="#faq">FAQs</a></li>
        <li><a href="#support">Customer Support</a></li>
        <li><a href="#tracking">Order Tracking</a></li>
        <li><a href="#feedback">Leave Feedback</a></li>
        <li><a href="#livechat">Live Chat</a></li>
      </ul>
    </div>
    <div className="footer-section">
      <h3>Legal</h3>
      <ul>
        <li><a href="#privacy">Privacy Policy</a></li>
        <li><a href="#terms">Terms of Service</a></li>
        <li><a href="#cookie">Cookie Policy</a></li>
        <li><a href="#disclaimer">Disclaimer</a></li>
        <li><a href="#compliance">Compliance Information</a></li>
        <li><a href="#terms-of-sale">Terms of Sale</a></li>
      </ul>
    </div>
    <div className="footer-section">
      <h3>Follow Us</h3>
      <div className="social-media">
        <a href="https://facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
          <i className="fa fa-facebook"></i>
        </a>
        <a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
          <i className="fa fa-twitter"></i>
        </a>
        <a href="https://instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <i className="fa fa-instagram"></i>
        </a>
        <a href="https://linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
          <i className="fa fa-linkedin"></i>
        </a>
        <a href="https://pinterest.com" aria-label="Pinterest" target="_blank" rel="noopener noreferrer">
          <i className="fa fa-pinterest"></i>
        </a>
        <a href="https://youtube.com" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
          <i className="fa fa-youtube"></i>
        </a>
      </div>
      <p className="footer-email">Email: support@myshop.com</p>
    </div>
  </div>
  <div className="footer-bottom">
    <p>&copy; 2024 MyShop. All rights reserved.</p>
    <p>Designed by MyShop Team | <a href="#sitemap">Sitemap</a></p>
  </div>
</footer>

      <ToastContainer />
    </div>
  );
}

export default DashboardComponent;
