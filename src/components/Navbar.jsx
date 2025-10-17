import React, { useEffect, useRef, useState } from "react";
import QuickAssist from "./QuickAssist";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [linksOpen, setLinksOpen] = useState(false);
  const linksContainerRef = useRef(null);

  const getStoredUsername = () =>
    localStorage.getItem("username") || sessionStorage.getItem("username");
  const getStoredViewUnit = () =>
    localStorage.getItem("viewUnitCode") ||
    sessionStorage.getItem("viewUnitCode") ||
    null;

  const [isLoggedIn, setIsLoggedIn] = useState(!!getStoredUsername());
  const [viewUnitCode, setViewUnitCode] = useState(getStoredViewUnit());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/whoami", { credentials: "include" });
        if (res.ok) {
          const j = await res.json();
          if (j && j.username) {
            if (!localStorage.getItem("username"))
              localStorage.setItem("username", j.username);
            if (j.view_unitcode && !localStorage.getItem("viewUnitCode"))
              localStorage.setItem("viewUnitCode", j.view_unitcode);
            setIsLoggedIn(true);
            setViewUnitCode(j.view_unitcode || getStoredViewUnit());
            return;
          }
        }
      } catch (e) {}
      setIsLoggedIn(!!getStoredUsername());
      setViewUnitCode(getStoredViewUnit());
    })();

    const handler = () => {
      setIsLoggedIn(!!getStoredUsername());
      setViewUnitCode(getStoredViewUnit());
    };
    window.addEventListener("authChanged", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("authChanged", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setLinksOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (e) {}
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("viewUnitCode");
    localStorage.removeItem("username");
    localStorage.removeItem("viewUnitCode");
    window.dispatchEvent(new Event("authChanged"));
    setIsLoggedIn(false);
    navigate("/staff-login");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 w-full h-20 z-50 bg-primary text-white">
        <div className="max-w-[1400px] mx-auto h-full px-4 flex items-center">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to="/" aria-label="Home">
              <img
                className="h-16 object-contain"
                src="/UWAlogo_placeholder.webp"
                alt="UWA Logo"
              />
            </Link>
            <Link to="/" className="text-sm leading-tight hidden md:block">
              UWA
              <br />
              Recognition of Prior Learning
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {/* Useful Links Dropdown */}
            <div
              ref={linksContainerRef}
              className="relative"
              onMouseEnter={() => setLinksOpen(true)}
              onMouseLeave={() => setLinksOpen(false)}
              onFocusCapture={() => setLinksOpen(true)}
              onBlurCapture={(e) => {
                if (!linksContainerRef.current?.contains(e.relatedTarget)) {
                  setLinksOpen(false);
                }
              }}
            >
              <button
                type="button"
                className="cursor-pointer py-2 px-0 text-white hover:text-yellow-400 transition
                          !bg-transparent !shadow-none !border-0 !rounded-none"
                aria-haspopup="menu"
                aria-expanded={linksOpen}
                onClick={() => setLinksOpen((s) => !s)}
              >
                Useful links
              </button>

              <div
                role="menu"
                className={`absolute left-0 top-full min-w-[220px] rounded shadow-lg bg-primary text-white transition-opacity duration-150 z-60 ${
                  linksOpen
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }`}
              >
                <ul className="list-none m-0 p-0">
                  <li>
                    <a
                      href="https://www.uwa.edu.au/policy/-/media/project/uwa/uwa/policy-library/policy/student-administration/recognition-of-prior-learning/recognition-of-prior-learning-policy.doc"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 hover:bg-slate-800"
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => setLinksOpen(false)}
                    >
                      RPL Policy
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.uwa.edu.au/policy/-/media/project/uwa/uwa/policy-library/policy/student-administration/recognition-of-prior-learning/recognition-of-prior-learning-procedures.docx"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 hover:bg-slate-800"
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => setLinksOpen(false)}
                    >
                      RPL Procedures
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.uwa.edu.au/students/contact"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 hover:bg-slate-800"
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => setLinksOpen(false)}
                    >
                      Student Advising Office Contacts
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Login / Logout Button */}
            <div>
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white rounded px-4 py-2 font-bold shadow hover:bg-red-700 transition duration-300"
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/staff-login"
                  className="py-2 text-white bg-transparent hover:text-yellow-400 transition"
                >
                  Staff Login
                </Link>
              )}
            </div>

            {/* Dashboard / Request Buttons */}
            <div>
              {isLoggedIn ? (
                (() => {
                  const isUC = Boolean(viewUnitCode);
                  const isOnDashboard = location.pathname?.startsWith(
                    "/dashboard"
                  );
                  if (isOnDashboard) {
                    return null;
                  }
                  return (
                    <Link
                      to="/dashboard"
                      className="bg-titles text-primary rounded px-4 py-2 font-bold shadow hover:bg-[#f5e7b2] transition duration-300"
                    >
                      View Dashboard
                    </Link>
                  );
                })()
              ) : (
                <a
                  href="/application"
                  className="bg-titles text-primary rounded px-4 py-2 font-bold shadow hover:bg-[#f5e7b2] transition duration-300"
                >
                  Request Unit Equivalence
                </a>
              )}
            </div>

            {/* Quick Assist Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("openQuickAssist", { detail: { role: null } })
                  )
                }
                className="cursor-pointer py-2 px-0 text-white hover:text-yellow-400 transition
                          !bg-transparent !shadow-none !border-0 !rounded-none"
                aria-label="Quick Assist"
              >
                Quick Assist
              </button>
            </div>
          </div>
        </div>
      </nav>
      <QuickAssist />
    </>
  );
}
