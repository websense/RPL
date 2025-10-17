import React, { useState } from "react";

export default function ReviewUnitsTable({ rows, collapsedRows, toggleRow, buildSummaryLine }) {
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
  const navigateOther = (rowId, direction) => {
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

  return (
    <div className="mt-9 space-y-4 pr-5">
      {rows.map((row, idx) => (
        <div key={row.id || idx} className="border shadow-sm">
          {/* Collapsed Header */}
          <div className="flex items-center justify-between bg-gray-100 px-3 py-2 border">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold">{idx + 1}</span>
              <span className="text-lg font-semibold">{buildSummaryLine(row)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toggleRow(idx)}
                className="text-sm rounded-md border px-2 py-1 hover:bg-white"
              >
                {collapsedRows[idx] ? "Expand" : "Collapse"}
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {!collapsedRows[idx] && (
            <div className="border rounded-b-lg">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="bg-primary border-b text-white">
                    <th className="w-56 px-3 py-2 text-left" />
                    <th className="px-3 py-2 text-center font-semibold">UWA</th>
                    <th className="px-3 py-2 text-center font-semibold relative">
                      <div className={`flex items-center ${getUnitCount(row) > 1 ? 'justify-between' : 'justify-center'}`}>
                        {getUnitCount(row) > 1 && (
                          <button
                            type="button"
                            onClick={() => navigateOther(row.id, 'prev')}
                            className="text-white hover:text-gray-200 text-lg mr-1"
                          >
                            ←
                          </button>
                        )}
                        <div className="flex flex-col items-center">
                          <span>{getCurrentInstituteName(row)}</span>
                          {getUnitCount(row) > 1 && (
                            <span className="text-xs opacity-75">
                              {(currentUnitIndex[row.id] || 0) + 1} of {getUnitCount(row)}
                            </span>
                          )}
                        </div>
                        {getUnitCount(row) > 1 && (
                          <button
                            type="button"
                            onClick={() => navigateOther(row.id, 'next')}
                            className="text-white hover:text-gray-200 text-lg ml-1"
                          >
                            →
                          </button>
                        )}
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
                        value={getCurrentInstituteName(row)}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Unit Code */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Unit Code</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.code || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).code || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Unit Name */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Unit Name</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.name || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).name || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Unit Level */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Unit Level</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.level ?? ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).level ?? ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Unit Outcomes */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Unit Outcomes</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.outcomes || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).outcomes || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Indicative assessments */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Indicative assessments</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.assessments || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).assessments || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Credit points */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Credit points</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.creditPoints ?? ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).creditPoints ?? ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Contact Hours */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Contact Hours</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.contactHours ?? ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).contactHours ?? ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Link to Unit Outline */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Link to Unit Outline</th>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={row.uwa?.outlineLink || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).outlineLink || ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Year Completed */}
                  <tr className="border-b">
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Year Completed</th>
                    <td className="px-3 py-2 align-top">
                      <div className="text-sm text-gray-500 italic">Not required for UWA</div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={getCurrentInstitute(row).yearCompleted ?? ""}
                        readOnly
                        className="w-full rounded-md border px-2 py-1 bg-gray-50 text-gray-700"
                      />
                    </td>
                  </tr>
                  {/* Supporting Documents */}
                  <tr>
                    <th className="w-56 bg-sky-50 px-3 py-2 text-left align-top">Supporting Documents</th>
                    <td className="px-3 py-2 align-top" colSpan={2}>
                      <div className="flex flex-col gap-2">
                        {/* Show uploaded files */}
                        {Array.isArray(row.uploaded) && row.uploaded.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {row.uploaded.map((u, i) => {
                              const isUrl = /^https?:\/\//i.test(u) || u.startsWith("/uploads");
                              const isObjectId = /^[a-f\d]{24}$/i.test(u);
                              const href = isUrl
                                ? u
                                : isObjectId
                                ? `/api/files/${u}`
                                : `/api/supporting/${encodeURIComponent(u)}`;
                              // Get the file name from uploadedMeta if available
                              const meta = Array.isArray(row.uploadedMeta) ? row.uploadedMeta.find(m => m.id === u) : null;
                              const name = meta?.name || u.split("/").pop();
                              return (
                                <a key={i} href={href} target="_blank" rel="noreferrer" className="text-sm text-sky-700 hover:underline mr-2">
                                  {name}
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {/* Show message if no documents */}
                        {(!Array.isArray(row.uploaded) || row.uploaded.length === 0) && (
                          <span className="text-gray-500 italic text-sm">No documents uploaded</span>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
