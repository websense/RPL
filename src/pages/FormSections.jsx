import React, { useState, useEffect } from "react";
import RequestedUnitsTable from "../components/RequestedUnitsTable";
import ReviewUnitsTable from "../components/ReviewUnitsTable";
/*
This is for uploading previously saved forms - I don't know where to put it for now
function Popup() {
  return (
  <div> 
	<label htmlFor="load">Load from Previous Save</label>
	<input type="file" name="load" id="load" onChange={loadFormData} ></input>
  </div>
  );
}*/

export function PersonalDetails({ formData, updateFormData }) {
	return (
		<form id="personal-form" onSubmit={(e) => e.preventDefault()} noValidate>
			<div className="grid grid-cols-[120px_1fr] gap-4 [&_label]:text-left">
				<label htmlFor="firstName">First Name</label>
				<input type='text' name="firstName" id="firstName" required className="flex w-80 border px-2" onChange={updateFormData} value={formData.firstName}></input>
				<label htmlFor="lastName">Last Name</label>
				<input type='text' name="lastName" id="lastName" required className="flex w-80 border px-2" onChange={updateFormData} value={formData.lastName}></input>
				<label htmlFor="emailAddress">Email Address</label>
        		<input type="email" name="emailAddress" id="emailAddress" required pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" title="Please enter a valid email address (e.g. name@example.com)" className="flex w-80 border px-2" onChange={updateFormData} value={formData.emailAddress || ""}/>
			
			</div>
			<p className="text-left italic pt-10">*This is how you will be contacted regarding the outcome of this form.</p>
		
		</form>

	);
}

// Helper Functions for RequestedUnits and for Review

// Safe ID generator (no hard requirement on crypto.randomUUID)
const genId = () => {
	if (
		typeof globalThis !== "undefined" &&
		globalThis.crypto &&
		typeof globalThis.crypto.randomUUID === "function"
	) {
		try {
			return globalThis.crypto.randomUUID();
		} catch { }
	}
	return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};

const emptyUnit = () => ({
	code: "",
	name: "",
	level: "",
	outcomes: "",
	assessments: "",
	creditPoints: "",
	contactHours: "",
	outlineLink: "",
	yearCompleted: "",
});

const makeRow = () => ({
	id: genId(),
	// UWA unit data
	uwa: emptyUnit(),
	// Array of multiple institutions
	otherInstitutions: [""], // Array of institution names
	others: [emptyUnit()], // Array of unit objects
	attachments: [],
	collapsed: false,
});

// Build "UWA, <UWA code> = <other Inst>, <other code>"
function buildSummaryLine(row) {
	const uCode = (row?.uwa?.code || "").trim() || "__";
	
	// Build all institution-unit pairs, but only for entries that have actual data
	const institutionPairs = [];
	const institutions = row?.otherInstitutions || [""];
	const units = row?.others || [{}];
	
	// Take the maximum length to handle cases where arrays might be different sizes
	const maxLength = Math.max(institutions.length, units.length);
	
	for (let i = 0; i < maxLength; i++) {
		const institution = (institutions[i] || "").trim();
		const unitCode = (units[i]?.code || "").trim();
		
		// Only add this pair if either institution or unit code has actual content
		if (institution || unitCode) {
			const displayInstitution = institution || "Other Institution";
			const displayUnitCode = unitCode || "__";
			institutionPairs.push(`${displayInstitution}, ${displayUnitCode}`);
		}
	}
	
	// If no pairs were found, show default
	if (institutionPairs.length === 0) {
		institutionPairs.push("Other Institution, __");
	}
	
	const otherPart = institutionPairs.join(" & ");
	return `UWA, ${uCode} = ${otherPart}`;
}


export function RequestedUnits({ value, onChange }) {
		const normalizeRows = (arr) => {
			if (!Array.isArray(arr) || arr.length === 0) return [makeRow()];

			return arr.map((r) => {
				// If it already looks canonical (has uwa & others arrays), keep it
				if (r && r.uwa && Array.isArray(r.others)) {
					return {
						id: r.id ?? genId(),
						uwa: { ...emptyUnit(), ...(r.uwa || {}) },
						otherInstitutions: Array.isArray(r.otherInstitutions) ? r.otherInstitutions : [""],
						others: Array.isArray(r.others) ? r.others : [emptyUnit()],
						attachments: Array.isArray(r.attachments) ? r.attachments : [],
						uploaded: Array.isArray(r.uploaded) ? r.uploaded : [],
						uploadedMeta: Array.isArray(r.uploadedMeta) ? r.uploadedMeta : [], // ← PRESERVE uploadedMeta
						collapsed: !!r.collapsed,
					};
				}

				// Legacy format or other formats → convert to canonical array format
				const legacyOtherInst = r?.otherInstitution || r?.institution || "";
				const legacyOther = r?.other || {};
				
				return {
					id: r.id ?? genId(),
					uwa: {
						...emptyUnit(),
						code: r?.unitCodeUWA ?? "",
						name: r?.unitName ?? "",
						level: r?.unitLevel ?? "",
						outcomes: r?.unitOutcomes ?? "",
						assessments: r?.indicativeAssessments ?? "",
						creditPoints: r?.creditPoints ?? "",
						contactHours: r?.contactHours ?? "",
						outlineLink: r?.unitOutlineLink ?? "",
					},
					otherInstitutions: [legacyOtherInst],
					others: [{
						...emptyUnit(),
						code: legacyOther?.code || r?.unitCode || "",
						name: legacyOther?.name || r?.unitName || "",
						level: legacyOther?.level || r?.unitLevel || "",
						outcomes: legacyOther?.outcomes || r?.unitOutcomes || "",
						assessments: legacyOther?.assessments || r?.indicativeAssessments || "",
						creditPoints: legacyOther?.creditPoints || r?.creditPoints || "",
						contactHours: legacyOther?.contactHours || r?.contactHours || "",
						outlineLink: legacyOther?.outlineLink || r?.unitOutlineLink || "",
						yearCompleted: legacyOther?.yearCompleted || r?.yearCompleted || "",
					}],
					attachments: r?.supportingDocuments ? [r.supportingDocuments] : [],
					uploaded: Array.isArray(r.uploaded) ? r.uploaded : [],
					uploadedMeta: Array.isArray(r.uploadedMeta) ? r.uploadedMeta : [], // ← PRESERVE uploadedMeta
					collapsed: false,
				};
			});
		};

		// Controlled if parent passes {value, onChange}; otherwise internal state
		const [rows, setRows] = useState(() =>
			Array.isArray(value) && value.length ? normalizeRows(value) : [makeRow()]
		);
		// when the parent value changes, normalizeRows will rewrite rows state
		// which will lead the unserialization of any File objects in attachments and id from child components to be rewriten
		// To avoid data loss, we use the following merge strategy:
		//  1) First, match prevRows by id (if exists); if not found, use a fallback key = (other.code + otherInstitution) for secondary matching.
		//  2) Preserve non-string items (local File objects) from prev.attachments, and merge in string attachments from parent.
		//  3) Merge prev.uploaded and parent-provided uploaded (only strings), deduplicate, and write back to nr.uploaded.
		// Notes and limitations:
		//  - The fallback key relies on the stability of other.code/otherInstitution; if these fields change or parent recreates objects, matching may fail and cause data loss.
		//  - Frontend deduplication by filename/string cannot guarantee 100% correctness (different files with the same name may be misidentified).
		//  - This merge is only to keep UI and local state consistent; parent should still receive and return serializable string attachments.
		useEffect(() => {
        if (!Array.isArray(value)) return;
        // try to load cached serial form (if parent didn't persist uploaded ids)
        let cached = null;
        try { cached = JSON.parse(localStorage.getItem("RequestedUnits.serial") || "null"); } catch (e) { /* ignore */ }

    setRows((prevRows) => {
        const normalized = normalizeRows(value);
        return normalized.map((nr) => {
            // try find by id first
            let prev = prevRows.find((r) => r.id === nr.id);
            // fallback: try to match by unique-ish key (other code + otherInstitution)
            if (!prev) {
                const key = `${(nr.others?.[0]?.code || "").trim().toLowerCase()}|${(nr.otherInstitutions?.[0] || "").trim().toLowerCase()}`;
                prev = prevRows.find((r) => {
                    const rk = `${(r.others?.[0]?.code || "").trim().toLowerCase()}|${(r.otherInstitutions?.[0] || "").trim().toLowerCase()}`;
                    return rk && rk === key;
                });
            }

                // preserve local File objects previously chosen (non-string attachments)
                if (prev && Array.isArray(prev.attachments)) {
                    const preservedFiles = prev.attachments.filter((a) => typeof a !== "string");
                    const incomingStrings = Array.isArray(nr.attachments)
                        ? nr.attachments.filter((a) => typeof a === "string")
                        : [];
                    nr.attachments = [...preservedFiles, ...incomingStrings];
                }

                // preserve any uploaded URLs/ids from prev (so parent not wiping uploaded links)
                const prevUploaded = Array.isArray(prev?.uploaded) ? prev.uploaded.filter(u => typeof u === "string") : [];
                const incomingUploaded = Array.isArray(nr.uploaded) ? nr.uploaded.filter(u => typeof u === "string") : [];

                // also merge any cached uploaded ids for this row (when parent didn't persist)
                const cachedForRow = Array.isArray(cached) ? (cached.find(r => r.id === nr.id)?.attachments || []) : [];
                const mergedUploaded = [...new Set([...prevUploaded, ...incomingUploaded, ...cachedForRow])];
                if (mergedUploaded.length) nr.uploaded = mergedUploaded;

                return nr;
            });
        });
    }, [value]);

	//  - First, update the local state to next (setRows) so the UI reflects changes immediately.
	//  - Build a "serializable" copy to pass to the parent component:
	//      * Prioritize r.uploaded (backend-returned id/url strings) in attachments,
	//      * Then append any string items already in r.attachments,
	//      * Merge and deduplicate (keeping uploaded order priority) to avoid duplicates sent to the parent.
	//  - Purpose: Ensure the parent receives attachments containing only serializable strings (no File objects),
	//    and includes all uploaded id/url values, preventing the parent from overwriting or losing this info on reflow.
	//  - Also exposes current rows on window.__FormSections_latest for debugging.
	const setAndNotify = (next) => {
    setRows(next);
    try {
        console.log(
            "[FormSections] setAndNotify -> rows summary:",
            next.map((r) => ({
                id: r.id,
                attachments: (r.attachments || []).map((a) =>
                    typeof a === "string" ? "[str]" : a?.name || "[file]"
                ),
                uploaded: Array.isArray(r.uploaded) ? r.uploaded : [],
                uploadedMeta: Array.isArray(r.uploadedMeta) ? r.uploadedMeta : [], // ← LOG uploadedMeta
            }))
        );
    } catch (e) {
        /* ignore logging errors */
    }

    // Build serializable copy: include uploaded (server strings) first,
    // then any string items already in attachments. Deduplicate to avoid repeats.
    if (typeof onChange === "function") {
        const serial = next.map((r) => {
            const uploadedStrings = Array.isArray(r.uploaded) ? r.uploaded.filter(a => typeof a === "string") : [];
            const otherStrings = (Array.isArray(r.attachments) ? r.attachments : []).filter(a => typeof a === "string");
            // merge and dedupe, keep order: uploadedStrings first
            const combined = [...uploadedStrings, ...otherStrings];
            const deduped = Array.from(new Set(combined));
            return {
                ...r,
                attachments: deduped,
                uploadedMeta: r.uploadedMeta || [], // ← INCLUDE uploadedMeta in serialization
            };
        });

        // notify parent
        onChange(serial);

        // persist a local cached copy so navigation away/back doesn't lose uploaded ids
        try { localStorage.setItem("RequestedUnits.serial", JSON.stringify(serial)); } catch (e) { /* ignore */ }
    }

    // expose for manual inspection in console
    if (typeof window !== "undefined") window.__FormSections_latest = next;
};

	const addRow = () =>
		setAndNotify([
			...rows.map((r) => ({ ...r, collapsed: true })),
			makeRow(),
		]);

	const updateRow = (id, nextRow) =>
		setAndNotify(rows.map((r) => (r.id === id ? nextRow : r)));

	const toggleRow = (id) =>
		setAndNotify(rows.map((r) => (r.id === id ? { ...r, collapsed: !r.collapsed } : r)));

	const deleteRow = (id) => {
		const next = rows.length === 1 ? [makeRow()] : rows.filter((r) => r.id !== id);
		setAndNotify(next);
	};

	const handleUnitChange = (row, side, key, v, index = 0) => {
		if (side === "other") {
			// Update specific other institution by index
			const newOthers = [...row.others];
			newOthers[index] = { ...newOthers[index], [key]: v };
			updateRow(row.id, { ...row, others: newOthers });
		} else {
			// UWA side
			updateRow(row.id, { ...row, [side]: { ...row[side], [key]: v } });
		}
	};

	const handleotherInstChange = (row, v, index = 0) => {
		// Update specific institution name by index
		const newInstitutions = [...row.otherInstitutions];
		newInstitutions[index] = v;
		updateRow(row.id, { ...row, otherInstitutions: newInstitutions });
	};

	// Handler to add another institution
	const addOtherInstitution = (rowId) => {
		const row = rows.find(r => r.id === rowId);
		if (!row) return;

		const newOthers = [...row.others, emptyUnit()];
		const newInstitutions = [...row.otherInstitutions, ""];

		updateRow(rowId, {
			...row,
			others: newOthers,
			otherInstitutions: newInstitutions
		});
	};

	// Handler to delete a specific unit from the same institution
	const deleteOtherUnit = (rowId, unitIndex) => {
		const row = rows.find(r => r.id === rowId);
		if (!row || !row.others || row.others.length <= 1) return; // Don't delete if it's the only unit

		const newOthers = row.others.filter((_, index) => index !== unitIndex);
		const newInstitutions = row.otherInstitutions.filter((_, index) => index !== unitIndex);

		updateRow(rowId, {
			...row,
			others: newOthers,
			otherInstitutions: newInstitutions
		});
	};

	const handleFilesChange = (row, files) => {
		const fileArr = Array.from(files || []);
		// set files locally and mark row as having pending files to upload
		updateRow(row.id, { ...row, attachments: fileArr });
		setStatus(row.id, { hasPending: fileArr.length > 0, error: "" });
	};

     // upload a single file to the server, return the fileId or url
     async function uploadFileToServer(file) {
		const fd = new FormData();
		fd.append("file", file, file.name);
		const r = await fetch("/api/upload-supporting", { method: "POST", body: fd });
		if (!r.ok) {
			const j = await r.json().catch(() => ({}));
			throw new Error(j.error || `Upload failed ${r.status}`);
		}
		const j = await r.json();
		return j.fileId || j.url;
	}

	// when click "Upload" button for a row, upload all pending File objects in attachments
	// take the returned ids/urls and append to uploaded, remove File objects from attachments
	const handleUploadAttachments = async (rowId) => {
        const row = rows.find(r => r.id === rowId);
        if (!row) return;

        // gather current uploaded ids + meta (name->id) to avoid re-uploading same file
        const uploaded = Array.isArray(row.uploaded) ? [...row.uploaded] : [];
        const uploadedMeta = Array.isArray(row.uploadedMeta) ? [...row.uploadedMeta] : [];

        // pending files = non-string attachments
        const pendingFiles = (row.attachments || []).filter(f => typeof f !== "string");
        const hasPending = !!rowStatus[rowId]?.hasPending;
        if (!pendingFiles.length || !hasPending) {
            console.log("[FormSections] no pending files to upload for row", rowId);
            return;
        }

        console.log("[FormSections] uploadAttachmentsForRow start rowId=", rowId, "files:", pendingFiles.map(f => f.name || f));
        setStatus(rowId, { loading: true, error: "" });

        try {
            for (const f of pendingFiles) {
                if (!(f instanceof File)) continue;
                // skip if we already have this filename uploaded (avoid duplicate upload)
                if (uploadedMeta.some(m => m.name === f.name)) {
                    console.log("[FormSections] skipping already-uploaded file by name:", f.name);
                    continue;
                }
                const idOrUrl = await uploadFileToServer(f);
                console.log("[FormSections] uploaded file:", f.name, "->", idOrUrl);
                uploaded.push(idOrUrl);
                uploadedMeta.push({ id: idOrUrl, name: f.name });
            }

            // dedupe uploaded ids (in case server returned same id multiple times)
            const dedupedUploaded = Array.from(new Set(uploaded));
            // dedupe uploadedMeta by id, keep last occurrence
            const metaById = Object.fromEntries(uploadedMeta.map(m => [m.id, m]));
            const dedupedMeta = Object.values(metaById);

            // remove uploaded File objects from attachments, keep any remaining strings
            const remaining = (row.attachments || []).filter(a => typeof a === "string");
            const nextRow = { ...row, attachments: remaining, uploaded: dedupedUploaded, uploadedMeta: dedupedMeta };
            const nextRows = rows.map(r => (r.id === rowId ? nextRow : r));

            // ensure UI updates immediately
            setRows(nextRows);
            if (typeof window !== "undefined") window.__FormSections_latest = nextRows;
            console.log("[FormSections] uploadAttachmentsForRow completed (local state set). nextRows summary:", nextRows.map(r => ({ id: r.id, attachments: (r.attachments||[]).map(a=> typeof a === 'string' ? '[str]': a?.name||'[file]'), uploaded: r.uploaded })));

            // clear pending flag now that upload succeeded
            setStatus(rowId, { hasPending: false });

            // notify parent (serializes uploaded ids into attachments)
            setAndNotify(nextRows);
        } catch (err) {
            console.error("[FormSections] uploadAttachmentsForRow error:", err);
            setStatus(rowId, { loading: false, error: err.message || "Upload failed" });
            setStatus(rowId, { hasPending: true });
        } finally {
            setStatus(rowId, { loading: false });
        }
    };

	const cancelUploadedFile = async (rowId, fileId, opts = {}) => {
      const { appId, incomingId } = opts || {};

      // if this application is already saved server-side, unlink reference first
      if (appId) {
        try {
          const res = await fetch(`/api/application/${encodeURIComponent(appId)}/unlink-supporting`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId, incomingId }),
            credentials: "include",
          });
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            console.error("[FormSections] unlink failed:", res.status, txt);
            return;
          }
          console.log("[FormSections] Unlinked fileId from application:", fileId, "appId:", appId);
        } catch (err) {
          console.error("[FormSections] unlink request failed:", err);
          return;
        }
      }

      // update local UI state: remove from uploaded, uploadedMeta AND attachments
      const row = rows.find(r => r.id === rowId);
      if (!row) return;

      const nextUploaded = (row.uploaded || []).filter(u => u !== fileId);
      const nextUploadedMeta = (row.uploadedMeta || []).filter(m => m.id !== fileId);
      const nextAttachments = (row.attachments || []).filter(a => a !== fileId);

      const nextRow = { ...row, attachments: nextAttachments, uploaded: nextUploaded, uploadedMeta: nextUploadedMeta };
      updateRow(rowId, nextRow);
    };

	/* ---------- NEW: minimal state + handler for UWA Autofill ---------- */
	const [rowStatus, setRowStatus] = useState({}); // { [rowId]: { loading: bool, error: string } }
	const setStatus = (rowId, patch) =>
		setRowStatus((s) => ({ ...s, [rowId]: { loading: false, error: "", ...(s[rowId] || {}), ...patch } }));

	const isValidUwaCode = (code) => /^[A-Z]{3,}\d{3,}$/i.test((code || "").trim());

	async function autofillUWA(row) {
		const code = (row?.uwa?.code || "").trim();
		if (!isValidUwaCode(code)) {
			setStatus(row.id, { error: "Please enter a valid UWA code (e.g., CITS1401)" });
			return;
		}

		try {
			setStatus(row.id, { loading: true, error: "" });
			// Calls Flask → which proxies to Node (WebScrapeUWA.js)
			const res = await fetch(`/api/uwa/${encodeURIComponent(code)}`);
			if (!res.ok) {
				const j = await res.json().catch(() => ({}));
				throw new Error(j.error || `HTTP ${res.status}`);
			}
			const data = await res.json();

			updateRow(row.id, {
				...row,
				uwa: {
					...row.uwa,
					code: data.code ?? row.uwa.code,
					name: data.unitName ?? row.uwa.name,
					level: data.unitLevel ?? row.uwa.level,
					outcomes: data.outcomes ?? row.uwa.outcomes,
					assessments: data.assessments ?? row.uwa.assessments,
					creditPoints: data.creditPoints ?? row.uwa.creditPoints,
					contactHours: data.contactHours ?? row.uwa.contactHours,
					outlineLink: data.outlineLink ?? row.uwa.outlineLink,
				},
			});

			setStatus(row.id, { loading: false, error: "" });
		} catch (err) {
			setStatus(row.id, { loading: false, error: err?.message || "Autofill failed" });
		}
	}
	/* ------------------------------------------------------------------- */

	return (
		<div>
			<p className="text-left">
				Please enter your proposed unit equivalences. Make sure to include unit
				descriptions and links to unit outlines.
			</p>

			<RequestedUnitsTable
			       rows={rows}
			       rowStatus={rowStatus}
			       buildSummaryLine={buildSummaryLine}
			       toggleRow={toggleRow}
			       deleteRow={deleteRow}
			       handleotherInstChange={handleotherInstChange}
			       handleUnitChange={handleUnitChange}
				   addOtherInstitution={addOtherInstitution}
				   deleteOtherUnit={deleteOtherUnit}
			       autofillUWA={autofillUWA}
			       isValidUwaCode={isValidUwaCode}
			       handleFilesChange={handleFilesChange}
			       handleUploadAttachments={handleUploadAttachments}
				   cancelUploadedFile={cancelUploadedFile}
		       />

			<div className="pt-3">
				<button
					type="button"
					onClick={addRow}
					id="add"
					className="hover:text-sky-900 hover:underline"
				>
					+ Add row
				</button>
			</div>
		</div>
	);
}


export function Review({ formData }) {

		// Normalize rows from formData.requestedUnits
		const rows = Array.isArray(formData.requestedUnits) ? formData.requestedUnits : [];
		const [collapsedRows, setCollapsedRows] = React.useState(() => rows.map(() => false));

		const toggleRow = (idx) => {
			setCollapsedRows((prev) => prev.map((c, i) => (i === idx ? !c : c)));
		};

		return (
			<div className="flex flex-col gap-10">
				<div className="grid grid-cols-[120px_1fr] gap-4 [&_label]:text-left">
					<label>First Name</label>
					<div className="flex w-80 px-3 py-2 bg-gray-100 text-gray-900">{formData.firstName}</div>
					<label>Last Name</label>
					<div className="flex w-80 px-3 py-2 bg-gray-100 text-gray-900">{formData.lastName}</div>
					<label>Email Address</label>
					<div className="flex w-80 px-3 py-2 bg-gray-100 text-gray-900">{formData.emailAddress}</div>
				</div>
				<p className="text-left text-sm italic">*This is how you will be contacted regarding the outcome of this form.</p>

		       <ReviewUnitsTable
			       rows={rows}
			       collapsedRows={collapsedRows}
			       toggleRow={toggleRow}
			       buildSummaryLine={buildSummaryLine}
		       />
			</div>
		);
}

export function Declaration({ formData }) {
	return (
		<div className="flex flex-col gap-5 text-left w-3/5">
			<p className="text-xl">Please read the declaration below:</p>
			<p className="italic">If any unit description or outline is in a language other than English, it must be accompanied by a certificate English translation. You may be required to provide detailed descriptions of subjects studied.</p>
			<p className="italic">I hereby declare that the information provided is complete and correct. I authorise The University of Western Australia's nominated delegate(s) to obtain further official records and reports if necessary from any university or tertiary institution previously attended by me.</p>
			<p>Please sign by typing your full name.</p>
			<input type='text' name="signature" id="signature" className="flex w-80 border px-2" placeholder={`${formData?.firstName || ""} ${formData?.lastName || ""}`} required></input>
		</div>
	)
}