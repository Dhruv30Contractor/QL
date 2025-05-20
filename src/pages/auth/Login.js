import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("https://api-stage.queryloom.com/user/login", {
        email,
        password,
      });

      if (response.data?.status) {
        const userData = {
          ...response.data.data,
          login_date: new Date().toISOString(), // You can store login time here
        };

        localStorage.setItem("user", JSON.stringify(userData));

        // Optional: Store token separately for auth headers later
        localStorage.setItem("token", response.data.data.token);

        // Navigate to home or dashboard
        navigate("/");
      } else {
        setError("Login failed. Please check credentials.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Login</h2>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full p-2 border border-gray-300 rounded mb-6"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
        >
          Log In
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
