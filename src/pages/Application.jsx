import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react'
import React from "react";
import {PersonalDetails, RequestedUnits, Review, Declaration} from "./FormSections.jsx"
import "./Application.css"

const sections = ["Personal Details","Requested Units", "Review", "Declaration"]

function Disclaimer({nextStep}) {
  return (
    <div className="text-left p-10">
      <p className="text-[30px] font-bold w-50">Disclaimer</p>
      <p className="pt-10">
        Before starting or continuining an application, please note that no confidential information 
        (e.g. your academic transcript) is to be included in your responses to this form.
      </p>
      <div className="flex gap-4 justify-center pt-10">
        <Link to="/">
          <button type="button" name="decline" id="decline">Decline</button>
        </Link>
        <button type="button" name="accept" id="accept" onClick={nextStep}>Accept</button>
      </div>
    </div>
  );
}

function UploadPreviousSave({onClose, loadFormData, fileUploaded, uploadError}) {
  return (
    <div className="text-left p-10">
      <p className="text-[22px]">Would you like to start a new application or resume progress on an existing one?</p>
      <p className="pt-8 pb-3">Upload any existing application you would like to continue.</p>
      <input type="file" name="load" id="load" 
        className="block w-full text-sm text-gray-700 file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sky-700 hover:file:bg-sky-100"
        onChange={loadFormData} />
      {uploadError && <p className="text-red-500">{uploadError}</p>}
      <div className="flex justify-between pt-8">
        <button type="button" name="resume" id="resume" className={(fileUploaded && !uploadError) ? "" : "disabled"} onClick={onClose}>Resume progress</button>
        <button type="button" name="start-new" id="start-new" className={fileUploaded ? "disabled" : ""} onClick={onClose}>Start new application</button>
      </div>
    </div>
  );
}

function Popup({onClose, loadFormData, fileUploaded, uploadError}) {
  const [currentStep, setCurrentStep]  = useState(0);
  const nextStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentStep(current => Math.min(current + 1, 1));
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-300/50 bg-opacity-70 z-50">
      <div className="flex flex-col justify-between bg-white w-[600px] max-w-[90vw] max-h-[80vh] min-w-[450px] min-h-[300px] overflow-auto">
        {currentStep == 0 && <Disclaimer nextStep={nextStep}/>}
        {currentStep == 1 && <UploadPreviousSave onClose={onClose} loadFormData={loadFormData} fileUploaded={fileUploaded} uploadError={uploadError}/>}
        <div className="flex justify-center gap-2 pb-10">
          <div className={currentStep == 0 ? "w-10 h-1 bg-gray-500" : "w-10 h-1 bg-gray-100"}></div>
          <div className={currentStep == 1 ? "w-10 h-1 bg-gray-500" : "w-10 h-1 bg-gray-100"}></div>
        </div>
      </div>
    </div>
  );
}

function SectionCircle({currentSection, circleNumber, circleName}) {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-15 h-15 min-w-[4rem] min-h-[4rem] rounded-full inline-flex items-center justify-center" 
      style={{backgroundColor: currentSection == circleNumber? "var(--color-titles)": "var(--color-containers)"}}>
        {circleNumber + 1}
      </div>
      <span className="w-40">{circleName}</span>
    </div>
  );
}

function SectionIndicator({currentSection}) {
  return (
    <div className="flex flex-row gap-5">
      {sections.map((sectionName, index) => 
        <SectionCircle key={index} currentSection={currentSection} circleNumber={index} circleName={sectionName}/>)}
    </div>
  );
}

function SectionName({currentSection}) {
  return (
    <span className="text-[25px] font-bold">Section {currentSection + 1}: {sections[currentSection]}</span>
  );
}

function NavigationButtons({
  currentSection,
  saveFormData,
  prevSection,
  nextSection,
  validateStep,
}) {
  const [errorMessage, setErrorMessage] = useState("");

  const handleNext = async (e) => {
    setErrorMessage("");

    if (currentSection === 0) {
      const f = document.getElementById("personal-form");
      if (f && !f.checkValidity()) {
        f.reportValidity();
        setErrorMessage("Please fill required fields.");
        return;
      }
    }

    if (typeof validateStep === "function") {
      try {
        const res = validateStep(currentSection);
        const ok = res && typeof res.then === "function" ? await res : !!res;
        if (!ok) {
          setErrorMessage("Please fill in all fields before continuing.");
          return;
        }
      } catch (err) {
        setErrorMessage("Validation failed. Please check your input.");
        return;
      }
    }

    // validation passed
    setErrorMessage("");
    nextSection && nextSection(e);
  };

  return (
    <div className="grid grid-cols-[auto_1fr] gap-10 pt-10 w-full">
      <button type="button" name="save" id="save" onClick={saveFormData}>
        Save Progress
      </button>

      <div className="flex flex-col items-end gap-2 pr-5">
        {errorMessage && <div className="text-red-600 text-sm">{errorMessage}</div>}

        <div className="flex gap-4">
          {currentSection !== 0 && (
            <button type="button" name="prev" id="prev" onClick={(e) => prevSection && prevSection(e)}>
              Previous
            </button>
          )}

          {currentSection !== 3 ? (
            <button type="button" name="next" id="next" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="submit" name="submit" id="submit">
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


export default function Application() {

  // State for displaying Disclaimer popup
  const [showPopup, setShowPopup] = useState(true);
  // State for form sections and methods to navigate between them
  const [currentSection, setCurrentSection] = useState(0);
  // State for uploading previous saves
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [originalIds, setOriginalIds] = useState([]); // if this is a request for more information, this contains the original ids

  const navigate = useNavigate();

  const nextSection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSection(current => Math.min(current + 1, sections.length - 1));
  }

  const prevSection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSection(current => Math.max(current - 1, 0));
  }

  // State and methods for form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    // This is just a suggestion for the table inputs, feel free to change if it doesn't work
    // Can dynamically add 'rows' to requestedUnits
    requestedUnits: [
      {
        institution: "",
        unitCode: "",
        unitName: "",
        unitLevel: null,
        unitOutcomes: "",
        indicativeAssessments: "",
        creditPoints: null,
        contactHours: null,
        unitOutlineLink: "",
        yearCompleted: null,
        supportingDocuments: null,
        // Only need to store UWA equivalent unit code, all other UWA fields are prefilled based on this
        unitCodeUWA: ""
      }
    ]
  })

  useEffect(() => {
    if (formData.submitted_ids) {
      saveFormData();
      navigate("/application/thankyou");
    }
  }, [formData.submitted_ids]); // only triggered on submit

  const updateFormData = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    //console.log(e.target.name, "=", e.target.value);  
  }
  const handleRequestedUnitsChange = (nextRows) => {
    setFormData((prev) => ({ ...prev, requestedUnits: nextRows }));
  };

  // At the moment this just renders the thankyou page regardless of whether form is successfully stored in database
  const handleSubmit = (e) => {
    e.preventDefault();
    fetch("/api/submit", {method:"POST", headers:{"Content-Type": "application/json"}, body:JSON.stringify(formData)})
    .then((res) => (res.json()))
    .then((data) => {console.log("Server response:", data); return data;})
    .then((data) => setFormData({...formData, submitted_ids: data.ids})) // then useEffect takes over
    .catch((err) => console.error("Error:", err));
  }

  // Downloads the current value of formData as a .json file
  const saveFormData = (e) => {
    // create a url linking to the json object to download
    const formDataString = JSON.stringify(formData, null, 2);
    const blob = new Blob([formDataString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    // simulate a click on a hidden temporary <a download> tag to download the form
    const a = document.createElement("a");
    a.href = url;
    a.download = "uwa_rpl_form_save.json"; // file name
    document.body.appendChild(a);
    a.click();
    // Clean up by removing the <a download> tag and the objecturl to prevent memory leaks
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const loadFormData = (e) => {
    setUploadError(false);

    const file = e.target.files?.[0];
    if (!file) {
      setFileUploaded(false);
      return;
    }

    setFileUploaded(true);

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const {submitted_ids = [], ...json_data} = json;
        setFormData((prev) => ({ ...prev, ...json_data, originalIds: submitted_ids })); // updates formData to match the json file uploaded
        setOriginalIds(submitted_ids);
      } catch (err) {
        console.error("Invalid JSON file", err);
        setUploadError("Invalid file. Please only upload a JSON file saved by this app.");
      }
    }
    fileReader.readAsText(file);
  }

  const validateStep = (stepIndex) => {
  if (stepIndex === 0) {
    const f = document.getElementById("personal-form");
    if (!f) return true;
    return f.checkValidity();
  }

  if (stepIndex === 1) {
    const rows = formData.requestedUnits;
    if (!Array.isArray(rows) || rows.length === 0) return false;

    for (const r of rows) {
      // Check UWA code (required)
      const uwaCode = (r.uwa?.code ?? r.unitCodeUWA ?? "").toString().trim();
      if (!uwaCode) {
        return false;
      }

      // Check arrays - must have at least one institution and corresponding unit
      const institutions = r.otherInstitutions || [];
      const others = r.others || [];
      
      if (institutions.length === 0 || others.length === 0) {
        return false;
      }

      // Check that each institution has corresponding data
      for (let i = 0; i < Math.max(institutions.length, others.length); i++) {
        const institution = (institutions[i] || "").toString().trim();
        const other = others[i] || {};
        
        const otherCode = (other.code || "").toString().trim();
        const otherName = (other.name || "").toString().trim();
        const otherLevel = (other.level || "").toString().trim();
        const otherOutcomes = (other.outcomes || "").toString().trim();
        const otherAssess = (other.assessments || "").toString().trim();
        const otherCredit = (other.creditPoints || "").toString().trim();
        const otherContact = (other.contactHours || "").toString().trim();
        const otherOutline = (other.outlineLink || "").toString().trim();
        const otherYear = (other.yearCompleted || "").toString().trim();

        // check each required field for this institution/unit pair
        const requiredMissing =
          !institution ||
          !otherCode ||
          !otherName ||
          !otherLevel ||
          !otherOutcomes ||
          !otherAssess ||
          !otherCredit ||
          !otherContact ||
          !otherOutline ||
          !otherYear;

        if (requiredMissing) {
          return false;
        }
      }
    }


    return true;
  }


  return true;
  };


  const sectionComponents = [
    <PersonalDetails formData={formData} updateFormData={updateFormData} loadFormData={loadFormData}/>,
    <RequestedUnits value={formData.requestedUnits} onChange={handleRequestedUnitsChange}/>,
    <Review formData={formData}/>,
    <Declaration formData={formData}/>
  ]

  return (
    <div className="pt-28 pl-5 pr-5 pb-5 min-h-screen">
      {showPopup && <Popup onClose={() => setShowPopup(false)} loadFormData={loadFormData} fileUploaded={fileUploaded} uploadError={uploadError}/>}
      <div className={showPopup ? "pointer-events-none" : ""}>
        <div className="grid grid-rows-[1fr] gap-10 grid-flow-row w-full">
          <SectionIndicator currentSection={currentSection}/>
          <div className="flex justify-start pl-5">
            <SectionName currentSection={currentSection} />
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col flex-grow justify-between pl-5 min-h-[calc(100vh-23rem)]">
            <div className="flex-grow">
              {sectionComponents[currentSection]}
            </div>
            <div>
              <NavigationButtons currentSection={currentSection} saveFormData={saveFormData} prevSection={prevSection} nextSection={nextSection} validateStep={validateStep}/>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}