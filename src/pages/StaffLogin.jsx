import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StaffLogin() {
  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [viewUnitCode, setViewUnitCode] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({ username: "", password: "" });
    
    // Basic validation - check each field
    const newErrors = {};
    if (!form.username.trim()) {
      newErrors.username = "Please enter your email or account ID";
    }
    if (!form.password.trim()) {
      newErrors.password = "Please enter your password";
    }
    
    // If there are errors, set them and return
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: 'include', // if the backend uses cookies for sessions then take this into account
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          remember: form.remember
        })
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setErrors({ username: data.error || "Login failed" });
        return;
      }
      // save the viewUnitCode to sessionStorage or localStorage depending on "remember"
      if (form.remember) {
        localStorage.setItem("viewUnitCode", data.view_unitcode || "");
        localStorage.setItem("username", form.username);
      } else {
        sessionStorage.setItem("viewUnitCode", data.view_unitcode || "");
        sessionStorage.setItem("username", form.username);
      }
      window.dispatchEvent(new Event("authChanged"));
      // navigate to dashboard with state
      navigate("/dashboard", { state: { viewUnitCode: data.view_unitcode || null } });
    } catch (err) {
      setLoading(false);
      setErrors({ username: "Network error" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] w-full bg-white flex items-start justify-center py-10 pt-60">
      {/* Outer panel matching the light blue border from the mock */}
      <div
        className="w-full max-w-3xl border rounded-md shadow-sm p-8 sm:p-10"
        style={{ borderColor: "#8fd3ff" }}
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black mb-8">
          Log in your staff account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username / Account ID */}
          <div>
            <label htmlFor="username" className="block text-xl font-semibold text-black mb-2">
              Email or Account ID:
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 px-4 py-4 text-lg outline-none"
            />
            {errors.username && (
              <p className="text-red-600 text-sm mt-1">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xl font-semibold text-black mb-2">
              Password :
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-md border border-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 px-4 py-4 text-lg outline-none pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-800 px-1 py-0.5"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-600 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          {/* Remember me + button */}
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-3 select-none">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-400"
              />
              <span className="text-xl font-semibold text-black">Remember me</span>
            </label>

            <button
              type="submit"
              className="rounded-full px-8 py-3 text-lg font-bold text-black shadow-sm"
              style={{ backgroundColor: "#DBB83D" }}
            >
              Log in
            </button>
          </div>
        </form>

        <div className="mt-6">
          <a href="#" className="text-[#0b74da] font-semibold underline text-lg">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
