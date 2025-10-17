import { useState, useEffect, useImperativeHandle, useRef } from 'react'
import "./Database.css"
import { useNavigate } from 'react-router-dom';

function formatTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts * 1000);
    return date.toLocaleString();
}

function getStatusColour(status) {
    const status_lower = status?.toLowerCase();
    if (status_lower == "approve")  {
        return "bg-approvebg text-approvetext"
    }
    else if (status_lower == "reject") {
        return "bg-rejectbg text-rejecttext"
    }
    else if (status_lower == "pending" || status_lower == "request further information") {
        return "bg-commentbg text-commenttext"
    }
}

function TableRow({ row, application_id, attributesToDisplay}) {
    const navigate = useNavigate();
    
    const redirect = () => {
        navigate(`/review/${application_id}`)
    }
    return (
        // attach click to the whole row and use the correct application_id
        <tr onClick={redirect} style={{cursor: 'pointer'}}>
            {row.map((field, index) => {
                const attr = attributesToDisplay[index];
                if (attr == "status") {
                    return (
                        <td key={index}>
                            <span className={`px-2 py-1 rounded-full ${getStatusColour(field)}`}>
                                {field}
                            </span>
                        </td>
                    )
                }
                if (attr == "timestamp" || attr == "latest_comment_timestamp") {
                    return (<td key={index} onClick={redirect}>{formatTimestamp(field)}</td>)
                }
                return (<td key={index}>{String(field)}</td>)
            })}
        </tr>
    )
}

function FormatMongoObjectIntoDatabaseRow({obj, attributesToDisplay}) {
    // helper to extract string id from possible shapes:
    // - { "$oid": "abc123" } (bson JSON)
    // - { "oid": "abc123" } or { "id": "abc123" }
    const extractId = (val) => {
        if (!val) return null;
        if (typeof val === "string") return val;
        if (typeof val === "object") {
            if (val.$oid) return val.$oid;
            if (val.oid) return val.oid;
            if (val.id) return val.id;
        }
        try { return String(val); } catch { return null; }
    };

    const idFromApplication = extractId(obj.application_id); // get the id from application_id field
    // ensure obj is an object
    const id = idFromApplication
    console.log("Formatting object with ID:", id, "Object:", obj);
    let listOfCells = new Array(attributesToDisplay.length);
    for (let i = 0; i < attributesToDisplay.length; i++) {
        listOfCells[i] = Object.hasOwn(obj, attributesToDisplay[i]) ? obj[attributesToDisplay[i]] : "N/A";
    }
    console.log(obj._id)
    return <TableRow row={listOfCells} application_id={obj["application_id"].$oid} attributesToDisplay={attributesToDisplay}/>
}

function Database({ ref, count, rowsPerPage, attributesToDisplay, colNamesToDisplay, sortMethod, sortArrow, viewUnitCode }) { // added viewUnitCode prop
    const [pageNumber, setPageNumber] = useState(0); // note page number is zero-indexed
    const [database, setDatabase] = useState([]);
    const [numReturnedResults, setNumReturnedResults] = useState(0);
    useEffect(() => {
        // build URL with optional view_unitcode
        const qp = new URLSearchParams();
        if (viewUnitCode) qp.set("view_unitcode", viewUnitCode);
        const url = `/api/db${qp.toString() ? `?${qp.toString()}` : ""}`;
        fetch(url, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setDatabase(data.slice(pageNumber*rowsPerPage, (pageNumber+1)*rowsPerPage));
                setNumReturnedResults(data.length);
            })
            .catch(err => {
                console.error("Database fetch failed:", err);
                setDatabase([]);
                setNumReturnedResults(0);
            });
    }, [count, pageNumber, viewUnitCode]);

    // functions in this imperative handle (e.g. nextPage()) can be called by parent elements possessing a reference
    useImperativeHandle(ref, () => {
        return {
            nextPage() {
                if (numReturnedResults > (pageNumber + 1)*rowsPerPage) {
                    setPageNumber((pageNumber) => (pageNumber+1))
                }
            },
            prevPage() {
                setPageNumber((pageNumber) => Math.max(0, pageNumber-1));
            },
            queryDatabase(queryObject) { // Runs a simple query on the database, accepting only data such that field = value
                const qp = new URLSearchParams(queryObject || {});
                if (viewUnitCode) qp.set("view_unitcode", viewUnitCode);
                setPageNumber(0)
                const queryURL = `/api/db${qp.toString() ? `?${qp.toString()}` : ""}`;
                fetch(queryURL, { credentials: "include" })
                    .then(res => res.json())
                    .then(data => {
                        setDatabase(data.slice(0, rowsPerPage));
                        setNumReturnedResults(data.length);
                    })
                    .catch(err => {
                        console.error("queryDatabase failed:", err);
                        setDatabase([]);
                        setNumReturnedResults  (0);
                    });
            }
         };
     }, [pageNumber, setPageNumber, numReturnedResults, rowsPerPage, database, setDatabase])

    return (
        <div>
            <p>Displaying records {pageNumber*rowsPerPage + 1} to {pageNumber*rowsPerPage + database.length} of {numReturnedResults}.</p>
            <table id="database" className="database border-collapse border-1 w-full">
                <thead className="bg-blue-900 text-white">
                    <tr>
                        {colNamesToDisplay.map((field, index) => (<th data-colname={attributesToDisplay[index]} className="hover:underline" key={index} onClick={sortMethod}>{String(field) + sortArrow[index]}</th>))}
                    </tr>
                </thead>
                <tbody>
                    {database.map((record) => {
                        const rowId = record && record._id && (record._id.$oid || String(record._id));
                        // console.log("Rendering row with ID:", rowId, "Record:", record);
                        return <FormatMongoObjectIntoDatabaseRow key={rowId} obj={record} attributesToDisplay={attributesToDisplay}/>
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default function DatabasePage({count}) {
    const databaseRef = useRef();
    // prioritise localStorage over sessionStorage, then default to null if neither exist
    const viewUnitCode = localStorage.getItem("viewUnitCode") || sessionStorage.getItem("viewUnitCode") || null;
    const [attributeToQuery, setAttributeToQuery] = useState("timestamp");
    const [queryString, setQueryString] = useState("");
    const [attributeToSort, setAttributeToSort] = useState("timestamp");
    const [sortDirection, setSortDirection] = useState(-1);
    const [sortArrow, setSortArrow] = useState("▼   ");
    const rowsPerPage = 50; // adjust per preference, this may be adjustable by user later

    // rows to be displayed, in order of appearance left to right
    const databaseAttributes = {
        "Timestamp": "timestamp",
        "UWA Unit Code": "uwa_unit_code",
        "Current Status": "status",
        "Incoming Unit Info": "incomingunit_summary",
        "Most Recent Comment": "latest_comment_text",
        "Author": "latest_comment_author",
        "Date Modified": "latest_comment_timestamp"
    }

    // re-renders the database if the query or the sorting direction changes
    useEffect(() => {
        const queryObject = queryString ? {[attributeToQuery]:queryString} : {}
        queryObject["_sort"] = JSON.stringify({[attributeToSort]:sortDirection})
        databaseRef.current.queryDatabase(queryObject);
    }, [attributeToQuery, queryString, attributeToSort, sortDirection])

    // moves/rotates the arrow character in the header if the sorting direction changes
    useEffect(() => {
        const sortArrow = sortDirection == 1 ? "▼" : "▲"
        const sortArrowPos = Object.values(databaseAttributes).indexOf(attributeToSort)
        const blankString = " ".repeat(Object.values(databaseAttributes).length)
        setSortArrow(blankString.slice(0, sortArrowPos) + sortArrow + blankString.slice(sortArrowPos + 1))
    }, [attributeToSort, sortDirection])

    const updateCurrentQueryString = (e) => {
        setQueryString(e.target.value)
    }
    const setAttribute = (e) => {
        setAttributeToQuery(e.target.value)
    }

    const sortDatabase = (e) => {
        if (attributeToSort == e.target.dataset.colname) {
            setSortDirection((n) => (-1*n))
        } else {
            setAttributeToSort(e.target.dataset.colname)
            setSortDirection(1)
        }
    }
    return (
        <div className="grid grid-rows-[1fr] w-full pt-30 pl-10 pr-10">
            <div className="grid grid-cols-[1fr_8fr] gap-4 w-full justify-items-start">
                <span className="text-xl pb-2">Filter By</span>
            </div>
            <div className="grid grid-cols-[1fr_3fr] gap-4 w-full justify-items-end pb-5">
                <div className="flex w-full">
                    <select name='attribute' id='attribute' className="w-50 bg-blue-200 p-2 mr-2" onChange={setAttribute}>
                        {Object.keys(databaseAttributes).map((attribute, index) => <option key={index} value={databaseAttributes[attribute]}>{attribute}</option>) }
                    </select>
                    <input name="name" id="name" type="text" className="w-70" onChange={updateCurrentQueryString}></input>
                </div>
                <div className="flex">
                    <button id="database-prev" className="w-25 mr-3" onClick={() => databaseRef.current.prevPage()}>Previous</button>
                    <button id="database-next" className="w-25" onClick={() => databaseRef.current.nextPage()}>Next</button>
                </div>
            </div>
            <Database ref={databaseRef} viewUnitCode={viewUnitCode} count={count} rowsPerPage={rowsPerPage} attributesToDisplay={Object.values(databaseAttributes)} colNamesToDisplay={Object.keys(databaseAttributes)} sortMethod={sortDatabase} sortArrow={sortArrow}/>
        </div>
    )
}