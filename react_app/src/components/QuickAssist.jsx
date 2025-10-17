import React, { useEffect, useRef, useState } from "react";

export default function QuickAssist() {
  const [active, setActive] = useState(true);   
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState(null);
  const triggerRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (window.__quickassist_mounted) {
      setActive(false);
      return;
    }
    window.__quickassist_mounted = true;
    return () => {
      delete window.__quickassist_mounted;
    };
  }, []);

  const close = () => {
    setOpen(false);
    setRole(null);
  };

  useEffect(() => {
    if (!active) return;                   
    if (!open && triggerRef.current) triggerRef.current.focus();
  }, [open, active]);

  useEffect(() => {
    if (!active || !open) return;       
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, active]);

  useEffect(() => {
    if (!active) return;       
    const onOpen = (e) => {
      const detail = (e && e.detail) || {};
      setRole(detail.role || null);
      setOpen(true);
    };
    const onClose = () => close();

    window.addEventListener("openQuickAssist", onOpen);
    window.addEventListener("closeQuickAssist", onClose);
    return () => {
      window.removeEventListener("openQuickAssist", onOpen);
      window.removeEventListener("closeQuickAssist", onClose);
    };
  }, [active]);

  if (!active) return null;    

  const RoleMenu = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <button
        type="button"
        onClick={() => setRole("applicant")}
        className="w-full p-5 rounded-2xl text-left border border-slate-300 shadow-sm !bg-slate-100 hover:!bg-slate-200 !text-slate-800 transition-colors"
      >
        <div className="font-semibold">Applicants</div>
        <div className="text-sm text-slate-600">
          Apply to have units from external institutions assessed for credit at UWA
        </div>
      </button>

      <button
        type="button"
        onClick={() => setRole("uc")}
        className="w-full p-5 rounded-2xl text-left border border-slate-300 shadow-sm !bg-slate-100 hover:!bg-slate-200 !text-slate-800 transition-colors"
      >
        <div className="font-semibold">Unit Coordinators</div>
        <div className="text-sm text-slate-600">
          Review and assess applications for units you coordinate.
        </div>
      </button>

      <button
        type="button"
        onClick={() => setRole("admin")}
        className="w-full p-5 rounded-2xl text-left border border-slate-300 shadow-sm !bg-slate-100 hover:!bg-slate-200 !text-slate-800 transition-colors"
      >
        <div className="font-semibold">Student Services / Admin</div>
        <div className="text-sm text-slate-600">
          Review all applications, intake, routing, and finalisation.
        </div>
      </button>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="space-y-2 mb-4 text-left bg-slate-100 p-4 rounded-xl">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );

  const ApplicantManual = () => (
    <div className="overflow-y-auto max-h-[60vh] pr-2 text-sm space-y-4">
      <Section title="Purpose">
        Apply to have external/previous units assessed for credit at UWA.
      </Section>
      <Section title="Before you start">
        <ul className="list-disc pl-5 space-y-1">
          <li>Have official unit outlines, assessment items and any additional supporting documents ready (PDF preferred).</li>
          <li>Use Chrome, Edge, or Firefox web browser.</li>
        </ul>
      </Section>
      <Section title="Step-by-step">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Click <strong>Request Unit Equivalence</strong> or click <strong>Apply</strong> on the homepage.</li>
          <li>Fill in your personal details.</li>
          <li>Note that if you click away from the application page when you're in the middle of it, you will lose all your progress if you haven't already saved.</li>
          <li>Click <strong>Useful Links</strong> to check which UWA unit is considered equivalent to the unit you have previously studied at another institution.</li>
          <li>Complete the form in Step 2 with incoming Unit Code, Previous University, Name, and Year Completed.</li>
          <li>Upload any supporting documents.</li>
          <li>Submit and note your Application ID. Retain a locally saved copy of your submitted application</li>
          <li>Monitor your emails for updates on your application status.</li>
        </ol>
      </Section>
      <Section title="After submission">
        If asked, follow up promptly. Refer to the following links for more info:&nbsp;
        <a href="https://www.uwa.edu.au/seek-wisdom/seekers-space/student-life/getting-started-at-uwa/2020/10/Your-checklist-for-starting-uni" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            Checklist
        </a>
        &nbsp;|&nbsp;
        <a href="https://www.uwa.edu.au/unistart/prepare" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
            Prepare your journey
        </a>
      </Section>
      <Section title="Troubleshooting">
        <ul className="list-disc pl-5 space-y-1">
          <li>File upload errors: check file size and type.</li>
          <li>Ensure all fields are filled.</li>
        </ul>
      </Section>
    </div>
  );

  const UCManual = () => (
    <div className="overflow-y-auto max-h-[60vh] pr-2 text-sm space-y-4">
      <Section title="Dashboard overview">
        View of applications assigned to you as Unit Coordinator based on the unit requested.
      </Section>
      <Section title="Review flow">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Log in with your staff credentials.</li>
          <li>Open a pending application.</li>
          <li>Review unit code equivalences, assessments, outcomes, docs, and outlines.</li>
          <li>You can request further information and approve/reject unit equivalences that Student Services have requested you to look at.</li>
          <li>Add comments as required.</li>
        </ol>
      </Section>
    </div>
  );

  const AdminManual = () => (
    <div className="overflow-y-auto max-h-[60vh] pr-2 text-sm space-y-4">
      <Section title="Dashboard overview">
        Full view of all applications. Accept/Reject unit equivalences when an articulation agreement exists, or a prior database record of approval for specific unit equivalences exists.
      </Section>
      <Section title="Workflow">
        <ol className="list-decimal pl-5 space-y-1">
          <li>Assign to correct Unit Coordinator or you may also approve/reject decisions without requesting for Unit Coordinator approval.</li>
          <li>Track Unit Coordinator responses.</li>
          <li>Student Services may also override approve/reject decisions made by a Unit Coordinator.</li>
        </ol>
      </Section>
      <Section title="Recordkeeping">
        Keep audit trail, follow retention policy.
      </Section>
      <Section title="Batch handling">
        Use Dashboard filters (timestamp, university, status) to search for relevant applications.
      </Section>
      <Section title="Troubleshooting">
        Unit Coordinator not responding, unreadable docs, or system errors → escalate to relevant staffs or request re-upload.
      </Section>
    </div>
  );


  return (
    <>
      {open && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div
            id="quickassist-dialog"
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="quickassist-title"
            className="relative z-10 w-full sm:w-[700px] max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              {role && (
                <button onClick={() => setRole(null)} className="px-3 py-1 text-sm rounded bg-blue-50 text-slate-800 hover:bg-blue-100">
                  ← Back
                </button>
              )}
              <h2 id="quickassist-title" className="text-xl font-bold">
                {role ? (role === "applicant" ? "Applicant Guide" : role === "uc" ? "Unit Coordinator Guide" : "Student Services / Admin Guide") : "Quick Assist"}
              </h2>
              <button onClick={close} className="px-2 py-1 rounded text-sm border bg-slate-100 hover:bg-slate-200 text-slate-800">✕</button>
            </div>

            {!role && <RoleMenu />}
            {role === "applicant" && <ApplicantManual />}
            {role === "uc" && <UCManual />}
            {role === "admin" && <AdminManual />}
          </div>
        </div>
      )}
    </>
  );
}