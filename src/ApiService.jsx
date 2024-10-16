import axios from "axios";
import qs from "qs";

const API_URL = "http://localhost:5300/products"; // Update if needed

export const authenticateUser = (phoneNumber, password) => {
  return axios.post(`${API_URL}/authenticate`, null, {
    params: {
      phoneNumber,
      password,
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const addToCartApi = (productId, phoneNumber) => {
  return axios.post("http://localhost:5300/carts/add-cart-items", null, {
    params: { productId, phoneNumber },
    headers: {
      "Content-Type": "application/json",
    },
  });
};


export const fetchCartItems = async () => {
  return await axios.get("http://localhost:5300/carts/cart-items"); // Adjust URL if needed
};

export const removeFromCart = (productId) => {
  return axios.delete(`http://localhost:5300/carts/cart-delete`, {
    params: { productId },
  });
};

export const requestOtp = async (
  phoneNumber,
  baseUrl = "http://localhost:5300/Users"
) => {
  try {
    const response = await axios.post(
      `${baseUrl}/send-otp`,
      qs.stringify({ phoneNumber }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Set content type for URL-encoded data
        },
      }
    );

    // Check if the response data contains useful information
    if (response.data) {
      return response.data;
    } else {
      throw new Error("No data received from the server.");
    }
  } catch (error) {
    console.error(
      "Error requesting OTP:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not request OTP. Please try again later.");
  }
};

export const verifyOtp = async (
  phoneNumber,
  otp,
  baseUrl = "http://localhost:5300/Users"
) => {
  try {
    const response = await axios.post(
      `${baseUrl}/verify-otp`,
      qs.stringify({ phoneNumber, code: otp }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded", // Set content type for URL-encoded data
        },
      }
    );

    // Check if the response data contains useful information
    if (response.data) {
      return response.data;
    } else {
      throw new Error("No data received from the server.");
    }
  } catch (error) {
    console.error(
      "Error verifying OTP:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Could not verify OTP. Please try again later.");
  }
};

export const fetchItemCount = async () => {
  try {
    const response = await axios.get('http://localhost:5300/item-count', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data; // Assuming the count is in the response body
  } catch (error) {
    console.error('Error fetching item count:', error);
    throw error; // Handle error as needed
  }
};
export const fetchProducts = (token, phoneNumber) => {
  return axios.get(`${API_URL}/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    params: {
      phoneNumber,
    },
  });
};


