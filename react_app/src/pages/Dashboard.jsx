import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({
    new_unitcode: "",
    old_unitcode: "",
    university: "",
    dateBefore: "",
    dateAfter: "",
    status: ""
  });
  const [showFilter, setShowFilter] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const filterRef = useRef(null);

  // Track UC view unit code 
  const getStoredViewUnit = () =>
    localStorage.getItem("viewUnitCode") || sessionStorage.getItem("viewUnitCode") || null;
  const [viewUnitCode, setViewUnitCode] = useState(getStoredViewUnit());

  // Track username 
  const getStoredUsername = () =>
    localStorage.getItem("username") || sessionStorage.getItem("username") || "";
  const [username, setUsername] = useState(getStoredUsername());

  // Fetch applications (optionally filtered by UC view unit code)
  const fetchApplications = (vc = null) => {
    const qp = new URLSearchParams();
    if (vc) qp.set("view_unitcode", vc);
    const url = `/api/db${qp.toString() ? `?${qp.toString()}` : ""}`;
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setApplications(data))
      .catch(err => {
        console.error("Dashboard fetch failed:", err);
        setApplications([]);
      });
  };

  // Fetch when viewUnitCode is known/changes (so dashboard shows only the unit the user is responsible for)
  useEffect(() => {
    fetchApplications(viewUnitCode);
  }, [viewUnitCode]);

  useEffect(() => {
    fetchApplications();
  }, []);

  // Sync UC info and username from backend 
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/whoami', { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          if (j && j.view_unitcode) {
            localStorage.setItem("viewUnitCode", j.view_unitcode);
            setViewUnitCode(j.view_unitcode);
          }
          if (j && j.username) {
            setUsername(j.username);
            if (!localStorage.getItem("username")) localStorage.setItem("username", j.username);
          }
        }
      } catch {}
    })();
  }, []);

  // Handle filter input change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Handle Apply button
  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setShowFilter(false);
  };

  // Close filter popout when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    }
    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  // Helpers to determine UC urgency and closed status
  // If application is approved or rejected
  const isClosedStatus = (s) => {
    const t = String(s || "").trim().toLowerCase();
    return t === "approve" || t === "reject";
  };

  // If application is urgent
  const isUrgentForUC = (app) => {
    if (!viewUnitCode) return false;
    if (isClosedStatus(app.status)) return false;
    const assignedToUC = String(app.assigned_to || "").toLowerCase() === "uc";
    const unitMatch =
      String((app.assigned_unitcode || app.uwa_unit_code || "")).toUpperCase() ===
      String(viewUnitCode).toUpperCase();
    return assignedToUC && unitMatch;
  };

  // Filter applications locally
  const getFilteredApplications = () => {
    const DEFAULT_STATUSES = new Set(["Pending", "Request Further Information"]);

    return applications
      .filter(application => {
        // Incoming unit code matches filter
        if (appliedFilters.new_unitcode && !(application.uwa_unit_code?.toLowerCase().includes(appliedFilters.new_unitcode.toLowerCase()))) return false;
        // Equivalent unit code or name (UWA)
        if (appliedFilters.old_unitcode) {
          const matchCode = application.unit_code?.toLowerCase().includes(appliedFilters.old_unitcode.toLowerCase());
          if (!matchCode) return false;
        }
        // University
        if (appliedFilters.university && !(application.university_name?.toLowerCase().includes(appliedFilters.university.toLowerCase()))) return false;
        // Date Before
        if (appliedFilters.dateBefore) {
          const applicationDate = application.timestamp ? new Date(application.timestamp * 1000).toISOString().slice(0, 10) : "";
          if (applicationDate > appliedFilters.dateBefore) return false;
        }
        // Date After
        if (appliedFilters.dateAfter) {
          const applicationDate = application.timestamp ? new Date(application.timestamp * 1000).toISOString().slice(0, 10) : "";
          if (applicationDate < appliedFilters.dateAfter) return false;
        }

        // Status
        const appStatus = application.status || "";
        if (appliedFilters.status) {
          if (appStatus !== appliedFilters.status) return false;
        } else {
          if (!DEFAULT_STATUSES.has(appStatus)) return false;
        }

        return true;
      })
      // Sorts the applications by urgency and time
      .sort((a, b) => {
        // Urgent first
        const aUrgent = isUrgentForUC(a);
        const bUrgent = isUrgentForUC(b);
        if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;

        // Newest first
        const at = a.timestamp ? Number(a.timestamp) : 0;
        const bt = b.timestamp ? Number(b.timestamp) : 0;
        return bt - at;
      });
  };

  return (
    <div className="dashboard w-screen h-screen overflow-hidden">
      <div className="flex h-full">
        <aside className="w-48 bg-text text-white flex flex-col p-6 pt-25 h-full">
          <h2 className="text-2xl font-bold mb-2">Dashboard</h2>
          {username ? (
            <div className="mb-8 text-sm text-white/90 truncate text-center" title={username}>
              {username}
            </div>
          ) : <div className="mb-8" />}

          <nav className="flex flex-col gap-4">
            <a href="/dashboard" className="hover:bg-lightprimary px-4 py-2 rounded transition">Overview</a>
            <a href="/database" className="hover:bg-lightprimary px-4 py-2 rounded transition">Database</a>
          </nav>
        </aside>

        <main className="flex-1 p-8 flex flex-col min-h-0">
          <div className="bg-gray-200 rounded-2xl p-8 shadow-xl pt-8 mt-22 flex flex-col flex-1 overflow-hidden min-h-0">
            <h2 className="text-3xl font-bold mb-2">Applications</h2>
            <hr className="border-gray-400 mb-6" />
            <div className="relative mb-6">
              <button
                className="flex items-center gap-2 color-primary"
                onClick={() => setShowFilter(v => !v)}
              >
                Filter
              </button>
              {showFilter && (
                <div ref={filterRef} className="absolute z-50 left-0 mt-2 w-full bg-white border border-gray-300 rounded-xl shadow-lg p-6 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      name="new_unitcode"
                      placeholder="Equivalent Unit"
                      value={filters.new_unitcode}
                      onChange={handleFilterChange}
                      className="bg-gray-100 text-gray-700 placeholder-gray-600 rounded px-4 py-2 font-medium"
                    />
                    <input
                      type="text"
                      name="old_unitcode"
                      placeholder="Incoming Unit"
                      value={filters.old_unitcode}
                      onChange={handleFilterChange}
                      className="bg-gray-100 text-gray-700 placeholder-gray-600 rounded px-4 py-2 font-medium"
                    />
                    <input
                      type="date"
                      name="dateBefore"
                      placeholder="Before date (YYYY-MM-DD)"
                      value={filters.dateBefore}
                      onChange={handleFilterChange}
                      className="bg-gray-100 text-gray-700 placeholder-gray-600 rounded px-4 py-2 font-medium"
                    />
                    <input
                      type="date"
                      name="dateAfter"
                      placeholder="After date (YYYY-MM-DD)"
                      value={filters.dateAfter}
                      onChange={handleFilterChange}
                      className="bg-gray-100 text-gray-700 placeholder-gray-600 rounded px-4 py-2 font-medium"
                    />
                    <input
                      type="text"
                      name="university"
                      placeholder="Previous Institute"
                      value={filters.university}
                      onChange={handleFilterChange}
                      className="bg-gray-100 text-gray-700 placeholder-gray-600 rounded px-4 py-2 font-medium"
                    />
                    <select
                      name="status"
                      placeholder="Status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      className="bg-gray-100 text-gray-700 rounded px-4 py-2 font-medium"
                    >
                      <option value="">Show Relevant Applications</option>
                      <option value="Approve">Show Approved Applications Only</option>
                      <option value="Reject">Show Rejected Applications Only</option>
                      <option value="Request Further Information">Show Applications Requesting more Information Only</option>
                      <option value="Pending">Show Pending Applications Only</option>
                      <option value="Obsolete">Show Obsolete Applications Only</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="color-primary"
                      onClick={handleApplyFilters}
                      style={{ opacity: 1, pointerEvents: 'auto' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
              {getFilteredApplications().map((app, idx) => {
                const needsYourReview = isUrgentForUC(app);
                const isClosed = isClosedStatus(app.status);

                return (
                  <div
                    key={app.application_id?.$oid || app.application_id || idx}
                    className="bg-[var(--color-titles)] text-white rounded-2xl p-6 relative cursor-pointer"
                    onClick={() => navigate(`/review/${app.application_id?.$oid || app.application_id || idx}`)}
                  >
                    {needsYourReview && (
                      <span
                        className="absolute top-3 right-3 w-3 h-3 rounded-full bg-red-500"
                        title="Requested UC review"
                        aria-label="Requested UC review"
                      />
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-2xl">
                        {app._id?.$oid || idx}
                        {app.university_name ? ` - ${app.university_name}` : ""}
                      </h3>
                      <span className="text-sm">{app.timestamp ? new Date(app.timestamp * 1000).toLocaleString() : ''}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div><span className="font-semibold">UWA Unit Code:</span> {app.uwa_unit_code || "-"}</div>
                          <div className="flex flex-col">
                            <span><span className="font-semibold">Status:</span> {app.status || "Pending"}</span>
                            {needsYourReview && (
                              <span className="mt-1 inline-block w-max self-start px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                                Review Urgent
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div><span className="font-semibold">Incoming Unit Code:</span> {app.unit_code || "-"}</div>
                          <div><span className="font-semibold">Incoming Unit Name:</span> {app.unit_name || "-"}</div>
                          <div><span className="font-semibold">Incoming Unit Level:</span> {app.level || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}