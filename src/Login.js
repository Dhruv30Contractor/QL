// src/Login.js
import React, { useState } from "react";

function Login() {
  const [email, setEmail] = useState("dhruvcontractor30@gmail.com");
  const [password, setPassword] = useState("Dhruv@3010");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await fetch("https://api-stage.queryloom.com/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Error ${res.status}: ${res.statusText}`
        );
      }

      setResponse(data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
          Login to QueryLoom
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
        )}

        {response && (
          <pre className="mt-4 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
            {JSON.stringify(response, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export default Login;
