import React, { useState } from "react";

function Tooltip({hint}) {
  return(
    <div className="relative inline-block group pl-2">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700 cursor-help">
        ?
      </span>
      <span className="absolute left-0 bottom-full mt-1 w-max max-w-xs hidden rounded-md bg-gray-700 px-2 py-1 text-xs text-white shadow-md group-hover:block z-10">
        {hint}
      </span>
    </div>
  );
}

export default function RequestedUnitsTable({
  rows,
  rowStatus,
  buildSummaryLine,
  toggleRow,
  deleteRow,
  handleotherInstChange,
  handleUnitChange,
  addOtherInstitution,
  deleteOtherUnit,
  autofillUWA,
  isValidUwaCode,
  handleFilesChange,
  handleUploadAttachments,
  // new prop name: cancelUploadedFile (non-destructive unlink)
  cancelUploadedFile,
  // keep old name for compatibility if parent passed it
  removeUploadedFile,
  currentAppId, // <- add this (if parent provides application id)
}) {
  // State to track current unit index for each row (multiple units from same institution)
  const [currentUnitIndex, setCurrentUnitIndex] = useState({});

  // Helper function to get current unit data
  const getCurrentInstitute = (row) => {
    const index = currentUnitIndex[row.id] || 0;
    return row.others?.[index] || {};
  };

  // Helper function to get current other institution name
  const getCurrentInstituteName = (row) => {
    const index = currentUnitIndex[row.id] || 0;
    return row.otherInstitutions?.[index] || "";
  };

  // Helper function to get total number of units from the institution
  const getUnitCount = (row) => {
    return row.others?.length || 1;
  };

  // Function to navigate between units from the same institution
  const navigateUnits = (rowId, direction) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    
    const currentIndex = currentUnitIndex[rowId] || 0;
    const maxIndex = getUnitCount(row) - 1;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
    } else {
      newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
    }
    
    setCurrentUnitIndex(prev => ({
      ...prev,
      [rowId]: newIndex
    }));
  };

  // Function to handle deleting a unit and adjust current index
  const handleDeleteUnit = (rowId) => {
    const row = rows.find(r => r.id === rowId);
    if (!row || getUnitCount(row) <= 1) return; // Don't delete if it's the only unit

    const currentIndex = currentUnitIndex[rowId] || 0;
    const unitCount = getUnitCount(row);
    
    // Delete the current unit
    deleteOtherUnit(rowId, currentIndex);
    
    // Adjust the current index after deletion
    let newIndex = currentIndex;
    if (currentIndex >= unitCount - 1) {
      // If we deleted the last unit, move to the previous one
      newIndex = Math.max(0, currentIndex - 1);
    }
    // If we deleted a unit in the middle, the current index stays the same
    // but now points to what was the next unit
    
    setCurrentUnitIndex(prev => ({
      ...prev,
      [rowId]: newIndex
    }));
  };

  return (
    <div className="mt-9 space-y-4 pr-5">
      {rows.map((row, idx) => {
        const status = rowStatus[row.id] || { loading: false, error: "" };
        return (
          <div key={row.id} className="border shadow-sm">
            {/* Collapsed Header */}
            <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold">{idx + 1}</span>
                <span className="text-lg font-semibold">{buildSummaryLine(row)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleRow(row.id)}
                  id="collapse"
                  className="text-sm rounded-md border px-2 py-1 hover:bg-white"
                >
                  {row.collapsed ? "Expand" : "Collapse"}
                </button>
                <button
                  type="button"
                  onClick={() => deleteRow(row.id)}
                  id="delete"
                  className="text-sm text-red-600 rounded-md border px-2 py-1 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
            {/* Expanded Content */}
            {!row.collapsed && (
              <div className="border rounded-b-lg">
                <table className="w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="bg-primary border-b text-white">
                      <th className="w-56 px-3 py-2 text-left" />
                      <th className="px-3 py-2 text-center font-semibold w-[20vw]">UWA</th>
                      <th className="px-3 py-2 text-center font-semibold relative w-[25vw]">
                        <div className="flex items-center justify-between">
                          {getUnitCount(row) > 1 ? (
                            <button
                              type="button"
                              onClick={() => navigateUnits(row.id, 'prev')}
                              className="text-white hover:text-gray-200 text-lg mr-1"
                            >
                              ←
                            </button>
                          ) : (
                            <div className="w-6"></div> // Spacer to balance the layout
                          )}
                          <div className="flex flex-col items-center">
                            <span>{getCurrentInstituteName(row)}</span>
                            {getUnitCount(row) > 1 && (
                              <span className="text-xs opacity-75">
                                {(currentUnitIndex[row.id] || 0) + 1} of {getUnitCount(row)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getUnitCount(row) > 1 && (
                              <button
                                type="button"
                                onClick={() => navigateUnits(row.id, 'next')}
                                className="text-white hover:text-gray-200 text-lg"
                              >
                                →
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                addOtherInstitution(row.id);
                                // Switch to the newly added unit (will be the last one in the array)
                                const newIndex = getUnitCount(row); // This will be the index of the new unit
                                setCurrentUnitIndex(prev => ({
                                  ...prev,
                                  [row.id]: newIndex
                                }));
                              }}
                              className="text-xs px-2 py-1 rounded"
                              title="Add another institution for comparison"
                            >
                              + Add Unit
                            </button>
                            {getUnitCount(row) > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteUnit(row.id)}
                                className="text-red-600 text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700"
                                title="Delete current unit"
                              >
                                Delete Unit
                              </button>
                            )}
                          </div>                            
                        </div>
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Institution row */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Institution</th>
                      <td className="px-3 py-2 align-top">
                        <div className="py-1">UWA</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="e.g., Curtin University"
                          value={getCurrentInstituteName(row)}
                          onChange={(e) => handleotherInstChange(row, e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                          required
                        />
                      </td>
                    </tr>
                    {/* Unit Code */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Unit Code</th>
                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="please enter a valid unit code e.g. CITS1401"
                            value={row.uwa.code || ""}
                            onChange={(e) => handleUnitChange(row, "uwa", "code", e.target.value)}
                            className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => autofillUWA(row)}
                            disabled={status.loading || !isValidUwaCode(row.uwa.code)}
                            className="shrink-0 rounded-md border px-2 py-1 text-sm hover:bg-sky-50 disabled:opacity-50"
                            title="Fetch unit details from UWA Handbooks"
                          >
                            {status.loading ? "Loading…" : "Autofill"}
                          </button>
                        </div>
                        {status.error ? (
                          <p className="mt-1 text-xs text-red-600">Autofill error: {status.error}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter a valid unit code"
                          value={getCurrentInstitute(row).code || ""}
                          onChange={(e) => handleUnitChange(row, "other", "code", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                          required
                        />
                      </td>
                    </tr>
                    {/* Unit Name */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Unit Name</th>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="(prefilled based on unit code)"
                          value={row.uwa.name || ""}
                          onChange={(e) => handleUnitChange(row, "uwa", "name", e.target.value)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter unit name"
                          value={getCurrentInstitute(row).name || ""}
                          onChange={(e) => handleUnitChange(row, "other", "name", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                          required
                        />
                      </td>
                    </tr>
                    {/* Unit Level */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">
                          Unit Level
                          <Tooltip hint={"The year in which the unit is normally taken in a degree (often indicated by the first number in the unit code)."}/>
                      </th>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="(prefilled based on unit code)"
                          value={row.uwa.level ?? ""}
                          onChange={(e) => handleUnitChange(row, "uwa", "level", e.target.value)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter unit level"
                          value={getCurrentInstitute(row).level ?? ""}
                          onChange={(e) => handleUnitChange(row, "other", "level", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                          required
                        />
                      </td>
                    </tr>
                    {/* Unit Outcomes */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">
                        Unit Outcomes
                        <Tooltip hint={"The key learning objectives of the unit."}/>
                      </th>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="(prefilled based on unit code)"
                          value={row.uwa.outcomes || ""}
                          onChange={(e) => handleUnitChange(row, "uwa", "outcomes", e.target.value)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter unit outcomes for this unit"
                          value={getCurrentInstitute(row).outcomes || ""}
                          onChange={(e) => handleUnitChange(row, "other", "outcomes", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                          required
                        />
                      </td>
                    </tr>
                    {/* Indicative assessments */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Indicative assessments</th>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="(prefilled based on unit code)"
                          value={row.uwa.assessments || ""}
                          onChange={(e) => handleUnitChange(row, "uwa", "assessments", e.target.value)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter assessments for this unit"
                          value={getCurrentInstitute(row).assessments || ""}
                          onChange={(e) => handleUnitChange(row, "other", "assessments", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                    </tr>
                    {/* Credit points */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">
                        Credit points
                        <Tooltip hint={"UWA equivalent 6 points is 1/8 of a full time load for the year."}/>
                      </th>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="(prefilled based on unit code)"
                          value={row.uwa.creditPoints ?? ""}
                          onChange={(e) => handleUnitChange(row, "uwa", "creditPoints", e.target.value)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter credit points for this unit"
                          value={getCurrentInstitute(row).creditPoints ?? ""}
                          onChange={(e) => handleUnitChange(row, "other", "creditPoints", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                    </tr>
                    {/* Contact Hours */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Contact Hours</th>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="(prefilled based on unit code)"        
                          value={row.uwa.contactHours ?? ""}
                          onChange={(e) => handleUnitChange(row, "uwa", "contactHours", e.target.value)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter contact hours for this unit"
                          value={getCurrentInstitute(row).contactHours ?? ""}
                          onChange={(e) => handleUnitChange(row, "other", "contactHours", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                    </tr>
                    {/* Link to Unit Outline */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Link to Unit Outline</th>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="https://handbooks.uwa.edu.au/..."
                          value={row.uwa.outlineLink || ""}
                          onChange={(e) => handleUnitChange(row, "uwa", "outlineLink", e.target.value)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="enter link to unit outline"
                          value={getCurrentInstitute(row).outlineLink || ""}
                          onChange={(e) => handleUnitChange(row, "other", "outlineLink", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                    </tr>
                    {/* Year Completed */}
                    <tr className="border-b">
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Year Completed or Year Planned to be Taken
                      </th>
                      {/* UWA side: not required */}
                      <td className="px-3 py-2 align-top">
                        <div className="text-sm text-gray-500 italic">Not required for UWA</div>
                      </td>
                      {/* other side: still editable */}
                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          placeholder="e.g. 2023"
                          value={getCurrentInstitute(row).yearCompleted ?? ""}
                          onChange={(e) => handleUnitChange(row, "other", "yearCompleted", e.target.value, currentUnitIndex[row.id] || 0)}
                          className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </td>
                    </tr>
                    {/* Supporting Documents (file input and Upload button) */}
                    <tr>
                      <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">
                        Supporting Documents
                        <Tooltip hint={"Please submit any non-confidential documents which may help to demonstrate the equivalence between the proposed units. e.g. past assessments, unit schedule etc. PDF files preferred to fit within the 700kB file size limit. If you see Error 413, you exceeded the file size limit."}/>
                      </th>
                      <td className="px-3 py-2 align-top" colSpan={2}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="file"
                              multiple
                              onChange={(e) => handleFilesChange(row, e.target.files)}
                              className="block text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sky-700 hover:file:bg-sky-100"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log("[RequestedUnitsTable] Upload clicked rowId=", row.id);
                                if (typeof handleUploadAttachments === "function") handleUploadAttachments(row.id);
                              }}
                              disabled={status.loading}
                              className="ml-2 text-sm px-2 py-1 bg-sky-600 rounded"
                            >
                              {status.loading ? "Uploading…" : "Upload"}
                            </button>
                          </div>

                          <div>
                            {/* show the number of locally selected files (not uploaded) */}
                            {row.attachments?.filter(a => typeof a !== "string")?.length > 0 && (
                              <p className="mt-1 text-xs text-gray-500">
                                {row.attachments.filter(a => typeof a !== "string").length} file(s) selected (not uploaded)
                              </p>
                            )}

                            {/* show uploaded links to the right of Upload button */}
                            {Array.isArray(row.uploaded) && row.uploaded.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {row.uploaded.map((u, i) => {
                                  const isUrl = /^https?:\/\//i.test(u) || u.startsWith("/uploads");
                                  const isObjectId = /^[a-f\d]{24}$/i.test(u);
                                  const href = isUrl ? u : isObjectId ? `/api/files/${u}` : `/api/supporting/${encodeURIComponent(u)}`;
                                  const meta = Array.isArray(row.uploadedMeta) ? row.uploadedMeta.find(m => m.id === u) : null;
                                  const name = meta?.name || u.split("/").pop();
                                  return (
                                    <div key={i} className="flex items-center gap-2">
                                      <a href={href} target="_blank" rel="noreferrer" className="text-sm text-sky-700 hover:underline">
                                        {name}
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const cb = typeof cancelUploadedFile === "function" ? cancelUploadedFile : removeUploadedFile;
                                          if (typeof cb === "function") cb(row.id, u, { appId: currentAppId || null });
                                        }}
                                        title="Cancel association with this application (non-destructive)"
                                        className="text-xs text-red-600 hover:text-red-800 ml-1"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}