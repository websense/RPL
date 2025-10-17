import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { pdf } from '@react-pdf/renderer';
import { ApplicationPDF } from '../components/ApplicationPDF';

const USE_DB = true;

// use this to conditionally set status colors
const statusColor = {
  Approve: "bg-approvebg text-approvetext",
  Reject: "bg-rejectbg text-rejecttext",
  Comment: "bg-commentbg text-commenttext",
  "Request Further Information": "bg-commentbg text-commenttext",
  Pending: "bg-commentbg text-commenttext",
  Obsolete: "bg-gray-300 text-gray-600"
};

const mockstatus = "Approve"; // can be Approve, Reject, Comment

// mock data for demonstration 
const mockUWAUnits = [
  {
    code: "CITS3200",
    name: "Professional computing",
    level: 1,
    outcomes: "(1) bla bla bla (2) bla bla bla",
    indicativeAssessments: "(1) project (2) labs (3)assignments",
    creditPoints: 6,
    contactHours: 150,
    year: 2023,
    desc: "Intro to SE",
    university: "UWA",
    outline: "", // it will auto-generate with unit code if empty 
    incoming: {
      code: "COMP101",
      name: "Professionals",
      level: 1,
      outcomes: "Bruhcomes",
      indicativeAssessments: "Bruh assignments",
      creditPoints: 6,
      contactHours: 150,
      year: 2023,
      desc: "bruhh",
      university: "Curtin",
      outline: "https://other.edu/unitA"
    },
  },
];

const mockComments = [
  { type: "Comment", author: "Unit Coordinator bruh1", text: "bruhhhh", date: "28 August, 2025" },
  { type: "Approved", author: "Unit Coordinator bruh2", text: "bruhhhhh", date: "30 August, 2025" },
];

const mockStaffName = "Staff bruh"; // current staff mock

// generate outline link (UWA use handbooks, incoming use its own outline if available)
const handbookBase = "https://handbooks.uwa.edu.au/unitdetails?code=";

function ObsoleteMessage(new_id) {
  console.log(new_id)
  return <div className="w-full p-2 bg-gray-300 text-gray-600 border border-gray-600">
    This application has been updated with more information! Please use the updated version at <Link to={`/review/${new_id["newid"]}`} className="text-blue-600 underline" reloadDocument>this link.</Link>
  </div>
}

function buildOutlineUrlForUWA(uwa) {
  if (!uwa) return "";
  if (uwa.outline && uwa.outline.trim()) return uwa.outline;
  if (uwa.code) return handbookBase + encodeURIComponent(uwa.code);
  return "";
}

// Unit Field Row Component 
function UnitFieldRow({ label, uwaContent, incContent }) {
  return (
    <tr>
      <td className="border-2 px-4 py-2 w-56">{label}</td>
      <td className="border-2 px-4 py-2">{uwaContent}</td>
      <td className="border-2 px-4 py-2">{typeof incContent === "object" && incContent?.type === "div"
          ? <div className="flex items-center justify-center gap-2">{incContent.props.children}</div>
          : incContent}</td>
    </tr>
  );
}



// Unit Comparison Table Component 
function UnitComparisonTable({ uwa, currentIncomingIndex, totalIncoming, onPrev, onNext, supportingDocs }) {
  const incUnit = Array.isArray(uwa?.incoming) ? (uwa.incoming || [])[0] : (uwa?.incoming || {});
  const uwaOutline = buildOutlineUrlForUWA(uwa);
  const incRaw = (incUnit.outline || "").trim();
  const incOutline = incRaw
    ? (/^https?:\/\//i.test(incRaw) || incRaw.startsWith("/")) ? incRaw : `https://${incRaw}`
    : "";

  // add navigation buttons if multiple incoming units
  function renderIncContent(content) {
    return (
      <div className="flex items-center gap-2">
        {totalIncoming > 1 && (
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={onPrev}
            disabled={totalIncoming <= 1}
            aria-label="Previous external unit"
            style={{ minWidth: 32 }}
          >←</button>
        )}
        <span>{content}</span>
        {totalIncoming > 1 && (
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={onNext}
            disabled={totalIncoming <= 1}
            aria-label="Next external unit"
            style={{ minWidth: 32 }}
          >→</button>
        )}
      </div>
    );
  }

  return (
    <table className="min-w-full border-2 text-base md:text-lg mb-8">
      <thead className="bg-containers">
        <tr>
          <th className="px-4 py-3 border-2 w-56 text-center">Field</th>
          <th className="px-4 py-3 border-2 text-center">{uwa?.university || "UWA"}</th>
          <th className="px-4 py-3 border-2 text-center">
            <div className="flex items-center gap-2">
              {totalIncoming > 1 && (
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={onPrev}
                  disabled={totalIncoming <= 1}
                  aria-label="Previous external unit"
                  style={{ minWidth: 32 }}
                >←</button>
              )}
              <span>{incUnit?.university || "-"}</span>
              {totalIncoming > 1 && (
                <button
                  className="px-2 py-1 border rounded disabled:opacity-50"
                  onClick={onNext}
                  disabled={totalIncoming <= 1}
                  aria-label="Next external unit"
                  style={{ minWidth: 32 }}
                >→</button>
              )}
            </div>
            {totalIncoming > 1 && (
              <span className="ml-2 text-xs text-gray-500">
                ({currentIncomingIndex + 1} / {totalIncoming})
              </span>
            )}
          </th>
        </tr>
      </thead>
      <tbody>
        <UnitFieldRow
          label="Unit Code"
          uwaContent={uwa?.code || "-"}
          incContent={incUnit?.code || "-"}
        />
        <UnitFieldRow label="Unit Name" uwaContent={uwa?.name || "-"} incContent={incUnit?.name || "-"} />
        <UnitFieldRow label="Unit Level" uwaContent={uwa?.level || "-"} incContent={incUnit?.level || "-"} />
        <UnitFieldRow label="Learning Outcomes" uwaContent={uwa?.outcomes || "-"} incContent={incUnit?.outcomes || "-"} />
        <UnitFieldRow label="Indicative Assessments" uwaContent={uwa?.indicativeAssessments || "-"} incContent={incUnit?.indicativeAssessments || "-"} />
        <UnitFieldRow label="Credit Points" uwaContent={uwa?.creditPoints || "-"} incContent={incUnit?.creditPoints || "-"} />
        <UnitFieldRow label="Contact Hours" uwaContent={uwa?.contactHours || "-"} incContent={incUnit?.contactHours || "-"} />
        <UnitFieldRow
          label="Link to Unit Outline"
          uwaContent={
            uwaOutline
              ? <a href={uwaOutline} target="_blank" rel="noopener" className="text-primary underline whitespace-nowrap">Handbook</a>
              : "-"
          }
          incContent={
            incOutline
              ? <a href={incOutline} target="_blank" rel="noopener" className="text-primary underline whitespace-nowrap">Outline</a>
              : "-"
          }
        />
        <UnitFieldRow label="Year Completed" uwaContent={uwa?.year || "-"} incContent={incUnit?.year || "-"} />
        <UnitFieldRow
          label="Supporting Documents e.g. example assessments"
          uwaContent={"NOT AN INPUT FIELD"}
          incContent={renderDocs(supportingDocs)}
        />
      </tbody>
    </table>
  );
}

function renderDocs(docs) {
  if (!docs) return "-";
  const API_BASE = `${window.location.protocol}//${window.location.hostname}:5001`;
  const list = Array.isArray(docs) ? docs : [docs];
  const items = list
    .filter(Boolean)
    .map((d, i) => {
      const obj = typeof d === "string" ? { name: d, url: d } : d || {};
      const name = obj.name || obj.url || "";
      const href = obj.url || "";
      if (!name) return null;
      const isHttp = /^https?:\/\//i.test(href);
      const isAppPath = typeof href === "string" && href.startsWith("/"); // /api/files..., /uploads...
      const finalHref = isHttp ? href : (isAppPath ? `${API_BASE}${href}` : "");
      return (
        <li key={`${name}-${i}`} className="break-all">
          {finalHref ? <a href={finalHref} target="_blank" rel="noopener" className="text-primary underline">{name}</a> : name}
        </li>
      );
    })
    .filter(Boolean);
  return items.length ? <ul className="list-disc pl-5">{items}</ul> : "-";
}

 // Comment Item Component 
function CommentItem({ c }) {
  const displayType = c.type === "Comment" ? "Request Further Information" : c.type;

  const container =
    displayType === "Request Further Information" ? "bg-commentbg"
    : displayType === "Rejected" ? "bg-rejectbg"
    : displayType === "Pending" ? "bg-commentbg"
    : "bg-approvebg";

  const badge =
    displayType === "Request Further Information" ? "bg-commenttext text-white"
    : displayType === "Rejected" ? "bg-rejecttext text-white"
    : displayType === "Pending" ? "bg-commenttext text-white"
    : "bg-approvetext text-white";

  return (
    <div className={`flex items-center gap-4 p-3 mb-2 rounded ${container}`}>
      <span className={`px-2 py-1 rounded font-bold ${badge}`}>{displayType}</span>
      <div>
        <div className="font-semibold">{c.author}</div>
        <div>{c.text}</div>
      </div>
      <div className="ml-auto text-sm text-gray-500">{c.date}</div>
    </div>
  );
}

export default function ReviewSingleRecord() {
  const { id } = useParams();
  const recordId = id || "";

  const [status, setStatus] = useState(""); 

  function safeSetStatus(newStatus) {
    setStatus(prev => prev === "Obsolete" ? prev : newStatus);
  }
  // take the staff name from local/session storage if available, otherwise use mock
  const [staffName, setStaffName] = useState(
    localStorage.getItem("username") || sessionStorage.getItem("username") || ""
  );
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/whoami', { credentials: 'include' });
        if (res.ok) {
          const j = await res.json();
          if (j && j.username) {
            setStaffName(j.username);
            if (!localStorage.getItem("username")) localStorage.setItem("username", j.username);
          }
        }
      } catch (e) {
        console.error("Error fetching user info:", e);
      }
    })();
  }, []);

  const [previousId, setPreviousId] = useState("");

  // state
  const [uwaUnits, setUwaUnits] = useState(mockUWAUnits);
  const [comments, setComments] = useState(mockComments);
  const [generalComments, setGeneralComments] = useState([]);
  const [newGeneralComment, setNewGeneralComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const [currentIncomingIndex, setCurrentIncomingIndex] = useState(0);
  const [newestVersion, setNewestVersion] = useState("");

  // Student Services check
  const isStudentServices = (staffName || "").toLowerCase() === "studentservices";

  // Request UC review
  const handleRequestUcReview = async () => {
    // optimistic: set status and add local comment
    const prevStatus = status;
    setStatus("Pending");
    const local = {
      author: staffName || mockStaffName,
      text: "Requested Unit Coordinator review",
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      type: "Pending"
    };
    setGeneralComments(prev => [...prev, local]);

    try {
      const res = await fetch(`/api/application/${encodeURIComponent(recordId)}/assign-uc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        // optionally pass recipients if you have UC emails: { recipients: ["uc@example.com"] }
        body: JSON.stringify({})
      });
      if (!res.ok) {
        // revert if server failed
        setStatus(prevStatus);
        setGeneralComments(prev => prev.slice(0, -1));
        const j = await res.json().catch(() => null);
        console.error("assign-uc error:", res.status, j);
        return;
      }
      const j = await res.json();
      if (j.status) setStatus(String(j.status).trim());
    } catch (e) {
      console.error("assign-uc network error", e);
      setStatus(prevStatus);
      setGeneralComments(prev => prev.slice(0, -1));
    }
  };

  // Ref for the printable content
  const printedComponentRef = useRef();
  
  // PDF download handler using react-pdf - shows ALL incoming units
  const handleDownloadPDF = async () => {
    setPdfError(null); // Clear any previous errors
    try {
      const blob = await pdf(
        <ApplicationPDF
          recordId={recordId}
          status={status}
          uwaUnits={uwaUnits}
          comments={comments}
          generalComments={generalComments}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RPL_Application_${recordId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfError('Failed to generate PDF. Please try again.');
    }
  };

  // Fetch the application data from the /api/application/:id endpoint
  useEffect(() => {
    if (!USE_DB || !recordId) return;
    setLoading(true);
    setError(null);

    fetch(`/api/application/${encodeURIComponent(recordId)}`)
      .then(r => {
        if (!r.ok) return r.json().then(j => { throw new Error(j.error || `HTTP ${r.status}`); });
        return r.json();
      })
      .then(app => {
        // set status from returned object
        setNewestVersion(app.newestVersion);
        setStatus(app.status || ""); // not safesetstatus - this should override obsolete

        // app shape: { _id, status, personal, units: [uwa_unit], incomingUnits, comments, previousId, ... }
        const units = Array.isArray(app.units) ? app.units : (app.units ? [app.units] : []);

        const transformedUnits = units.map(uwa => {
          // incoming may be nested on the UWA unit or returned separately as incomingUnits
          let incoming = [];
          if (Array.isArray(uwa.incoming) && uwa.incoming.length) incoming = uwa.incoming;
          else if (Array.isArray(app.incomingUnits) && app.incomingUnits.length) incoming = app.incomingUnits;
          else if (uwa.incoming && typeof uwa.incoming === "object") incoming = [uwa.incoming];
          
          console.log("Transforming UWA unit:", uwa, "with incoming:", incoming, "app" , app.supportingDocs);
          return {
            code: uwa.code || "",
            name: uwa.name || "",
            level: uwa.level || "",
            outcomes: uwa.outcomes || "",
            indicativeAssessments: uwa.indicativeAssessments || uwa.indicative_assessments || "",
            creditPoints: uwa.creditPoints || uwa.credit_points || "",
            contactHours: uwa.contactHours || uwa.contact_hours || "",
            year: uwa.year || uwa.completed_year || "",
            desc: uwa.desc || "",
            university: uwa.university || "UWA",
            outline: uwa.outline || "",
            supportingDocs: app.supportingDocs || [],
            incoming: Array.isArray(incoming) ? incoming : (incoming ? [incoming] : [])
          };
        });

        if (transformedUnits.length) setUwaUnits(transformedUnits);
        if (Array.isArray(app.comments)) setComments(app.comments);
        if (app.previousId) setPreviousId(app.previousId);

        setCurrentIncomingIndex(0);

        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching application:", err);
        setError(err.message || "Failed to load application");
        setLoading(false);
      });
  }, [recordId]);

  const handlePrev = (max) => setCurrentIncomingIndex(i => (i - 1 + max) % max);
  const handleNext = (max) => setCurrentIncomingIndex(i => (i + 1) % max);

  // type: "Comment" | "Approved" | "Rejected"
  const handleAddGeneralComment = async (type = "Comment") => {
    let text = (newGeneralComment || "").trim();
    // Require text only for "Comment" action; for Approve/Reject supply a short default message
    if (type === "Comment" && !text) return;
    if (type !== "Comment" && !text) {
      // default short message so backend (if it requires non-empty text) receives something meaningful
      text = type === "Approved" ? "Approved" : (type === "Rejected" ? "Rejected" : type);
    }

    // compute optimistic status immediately
    const kind = String(type || "Comment").trim().toLowerCase();
    let optimistic;
    if (kind.startsWith("app")) optimistic = "Approve";
    else if (kind.startsWith("rej")) optimistic = "Reject";
    else if (kind === "comment") optimistic = "Request Further Information";
    else optimistic = kind;
    const prevStatus = status;
    if (status != "Obsolete") {
      safeSetStatus(optimistic);
    }
    // optimistic local UI comment
    const local = {
      author: staffName || mockStaffName,
      text,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
      type
    };
    setGeneralComments(prev => ([...prev, local]));
    setNewGeneralComment("");

    if (!USE_DB || !recordId) return;
    try {
      const res = await fetch(`/api/application/${encodeURIComponent(recordId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: staffName || mockStaffName, text, type }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        console.error("post comment failed:", { status: res.status, body: j });
        // revert optimistic changes
        safeSetStatus(prevStatus);
        return;
      }
      const j = await res.json();

      // replace last optimistic comment with server-side comment (if provided)
      setGeneralComments(prev => {
        const copy = prev.slice(0, -1);
        const server = {
          author: j.comment?.author || local.author,
          text: j.comment?.text || local.text,
          date: j.comment?.timestamp ? new Date(j.comment.timestamp * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : local.date,
          type: j.comment?.type || local.type
        };
        return [...copy, server];
      });

      // If server returned status, use it; otherwise re-fetch app to get authoritative status
      if (j.status) {
        safeSetStatus(String(j.status).trim());
      } else {
        // fallback fetch to ensure UI matches DB
        try {
          const rr = await fetch(`/api/application/${encodeURIComponent(recordId)}`);
          if (rr.ok) {
            const app = await rr.json();
            const raw = (app.status || "").toString().trim();
            const normalized = raw ? (raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()) : raw;
            safeSetStatus(normalized);
          } else {
            // leave optimistic if unable to get authoritative status
            console.warn("Could not refresh application status after comment");
          }
        } catch (e) {
          console.warn("Status refresh failed", e);
        }
      }
    } catch (err) {
      console.error("post comment error", err);
      safeSetStatus(prevStatus);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl w-full mx-auto bg-white p-10 rounded-lg shadow-lg mt-10 text-base md:text-lg">
        <p>Loading application...</p>
      </div>
    );
  }

  if (error && !uwaUnits.length) {
    return (
      <div className="max-w-7xl w-full mx-auto bg-white p-10 rounded-lg shadow-lg mt-10 text-base md:text-lg">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto bg-white p-10 rounded-lg shadow-lg pt-28 mt-6 text-base md:text-lg">
      {/* PDF Error Message */}
      {pdfError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded">
          <p className="text-red-600 font-semibold">{pdfError}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl md:text-4xl font-extrabold">Application #{recordId}</h2>
        <span className={`px-4 py-2 rounded-full font-semibold text-base ${statusColor[status] || statusColor[mockstatus]}`}>{status || mockstatus}</span>
      </div>

      {/* Download PDF and Request UC Review buttons */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <button
          onClick={handleDownloadPDF}
          className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-opacity-90 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download PDF
        </button>
      </div>

      {status == "Obsolete" && <ObsoleteMessage newid={newestVersion}></ObsoleteMessage>} 

      <div className="overflow-x-auto mb-10 mt-5">
        {/* only illustrate current external unit */}
        {uwaUnits.map((uwa, i) => {
          const incomingList = Array.isArray(uwa.incoming)
            ? uwa.incoming
            : [];
          const currentInc = incomingList[currentIncomingIndex] || {};
          const supportingDocs = Array.isArray(uwa.supportingDocs)
            ? uwa.supportingDocs
            : uwa.supportingDocs
            ? [uwa.supportingDocs]
            : [];

          return (
            <UnitComparisonTable
              key={i}
              uwa={{ ...uwa, incoming: currentInc }}
              currentIncomingIndex={currentIncomingIndex}
              totalIncoming={incomingList.length}
              onPrev={() => handlePrev(incomingList.length)}
              onNext={() => handleNext(incomingList.length)}
              supportingDocs={supportingDocs}
            />
          );
        })}
      </div>

      {/* Comments Section */}
      <div className="mb-6">
        {[...comments, ...generalComments].map((c, i) => (
          <CommentItem key={i} c={c} />
        ))}
      </div>

      {/* Add Comment Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">Comments</span>
          <span className="text-primary font-semibold">
            {staffName || mockStaffName}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2 items-end">
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            placeholder="Add a comment..."
            value={newGeneralComment}
            onChange={(e) => setNewGeneralComment(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              className="bg-accents text-accents px-4 py-1 rounded font-bold border border-accents disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleAddGeneralComment("Comment")}
              type="button"
              disabled={!newGeneralComment.trim()}
            >
              Request Further Information
            </button>

            {isStudentServices && (
              <button
                type="button"
                onClick={handleRequestUcReview}
                className="px-4 py-1 rounded font-bold border bg-blue-50 text-blue-700 hover:bg-blue-100"
                title="Notify the Unit Coordinator to review this application"
              >
                Request UC Review
              </button>
            )}

            <button
              className="bg-approvebg text-approvetext px-4 py-1 rounded font-bold border border-approvebg"
              onClick={() => handleAddGeneralComment("Approved")}
              type="button"
            >
              Approve
            </button>

            <button
              className="bg-rejectbg text-rejecttext px-4 py-1 rounded font-bold border border-rejectbg"
              onClick={() => handleAddGeneralComment("Rejected")}
              type="button"
            >
              Reject
            </button>
          </div>

          <div className="flex items-center justify-between w-full">
            {previousId ? (
              <Link to={`/review/${previousId}`} className="text-primary underline text-sm">
                View previous version
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
);

}
