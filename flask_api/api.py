import time
from flask import Flask, Response, request, jsonify, send_file, send_from_directory, session, current_app
from flask_mail import Mail, Message
import pymongo
import json
from bson.json_util import dumps
from bson import ObjectId
from flask_wtf import FlaskForm
from wtforms import StringField
from wtforms.validators import DataRequired
import gridfs
from bson.errors import InvalidId
import os, requests
import mimetypes
from io import BytesIO
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from werkzeug.security import check_password_hash
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from datetime import timedelta

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")
# set session / remember durations for "remember me" functionality
app.permanent_session_lifetime = timedelta(days=30)
app.config['REMEMBER_COOKIE_DURATION'] = timedelta(days=30)

app.logger.setLevel("INFO")

# setup login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login"

class User(UserMixin):
    def __init__(self, username, view_unitcode=None):
        self.id = username  # UserMixin expects id property / get_id()
        self.username = username
        self.view_unitcode = view_unitcode

@login_manager.user_loader
def load_user(user_id):
    acct = accounts.find_one({"username": user_id})
    if not acct:
        return None
    return User(acct["username"], acct.get("view_unitcode"))

# mail server config options
app.config['MAIL_SERVER'] = 'mailhog'
app.config['MAIL_PORT'] = 1025
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False
#following needed for live server, which I don't have yet
#app.config['MAIL_USERNAME'] = 'professionalcomputing_team@gmail.com'
#app.config['MAIL_PASSWORD'] = 'password'
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_DEFAULT_SENDER", "test@example.com")


mongo = pymongo.MongoClient(os.environ.get("MONGO_URI", "mongodb://localhost:27017/")) # or whatever your connection URL is

database = mongo["RPL_database"]

test_col = database["testCol"] # note a collection in mongodb is essentially the same as a table in SQL

accounts = database["accounts"] # the accounts table
applications = database["applications"]
comments = database["comments"]
incoming_units = database["incoming_units"]
revisions = database["revisions"]
fs = gridfs.GridFS(database)


mail = Mail(app) # sets up a mailing server

NODE_SCRAPER_BASE = os.getenv("WEBSCRAPER_URI", "http://localhost:5175")

@app.route("/api/uwa/<code>")
def api_uwa_autofill(code):
    node_url = f"{NODE_SCRAPER_BASE}/api/uwa/{code}"
    try:
        r = requests.get(node_url, timeout=12)
        if r.status_code >= 400:
            return jsonify(r.json()), r.status_code  # bubble up node error
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": f"Proxy to Node failed: {str(e)}"}), 502

@app.route('/api/time')
def get_current_time():
    inserted_entry = test_col.insert_one({"time": time.time()})
    data = {'time': time.time(), 'id': inserted_entry.inserted_id}
    return dumps(data)

@app.route('/api/db') # GET /api/db returns full database, GET /api/db?attr1=val1&attr2=val2... returns simply queried db
def view_database():
    queryParams = request.args.to_dict() # returns a dict in format {attribute:value} to sort by
    finalQuery = {}
    sortQuery = {}
    # detect if there is view_unitcode param, if so, only return applications with that uwa_unit_code
    view_unitcode = request.args.get("view_unitcode")
    app.logger.info(f"view_unitcode param: {view_unitcode}")
    if view_unitcode and is_unit_code_valid(view_unitcode):
        finalQuery["uwa_unit_code"] = {"$regex": f"^{view_unitcode}$", "$options": "i"}
        app.logger.info(f"Final query with unit code filter: {finalQuery}")
    if sortQuery == {}:
        app.logger.info(f"Final query without unit code filter: {finalQuery}")
        sortQuery = {"timestamp":-1}

    for key, value in queryParams.items():
        if key == "_sort" or key == "view_unitcode":
            continue
        finalQuery[key] = {"$regex": f".*{value}.*", "$options": "i"}
    aggregation = applications.aggregate([
        # aggregation query pipeline
        {"$match": finalQuery},
        {"$lookup": {
            "from": "incoming_units",
            "localField": "proposed_units",
            "foreignField": "_id",
            "as": "incomingunit_objs"
        }},
        {"$addFields": {
            "first_proposed_unit": {"$arrayElemAt": ["$incomingunit_objs", 0]} # so that we can display the 1st requested element in the database
        }},
        {"$addFields": {"application_id": "$_id"}},
{"$addFields": { # this bit adds a string summary of all incoming units (single string containing all units) so database.jsx can be simpler
            "incomingunit_summary": {
                "$reduce": {
                    "input": {
                        "$map": {
                            "input": "$incomingunit_objs",
                            "as": "obj",
                            "in": {
                                "$concat": [
                                    "$$obj.university_name",
                                    ": ",
                                    "$$obj.unit_name",
                                    " (",
                                    "$$obj.unit_code",
                                    ")"
                                ]
                            }
                        }
                    },
                    "initialValue": "",
                    "in": {
                        "$concat": [
                            {"$cond": [{ "$eq": ["$$value", ""] }, "", {"$concat": ["$$value", " and "]}]},
                            "$$this"
                        ]
                    }
                }
            }
        }},
        {"$lookup": {
            "from": "comments",
            "let": { "app_id": "$_id" },
            "pipeline": [
                { "$match": { "$expr": { "$eq": ["$application_id", "$$app_id"] } } },
                { "$sort": { "timestamp": -1 } },
                { "$limit": 1 },
                { "$project": { "_id": 0, "author": 1, "timestamp": 1, "text": 1 } }
            ],
            "as": "latest_comment"
        }},
        {"$unwind": {
            "path": "$latest_comment",
            "preserveNullAndEmptyArrays": True
        }},
        {"$addFields": {
            "latest_comment_author": {
                "$ifNull": ["$latest_comment.author", "N/A"]
            },
            "latest_comment_timestamp": {
                "$ifNull": ["$latest_comment.timestamp", "$timestamp"]
            },
            "latest_comment_text": {
                "$ifNull": ["$latest_comment.text", "N/A"]
            }
        }},
        {"$replaceRoot": {
            "newRoot": {"$mergeObjects": ["$$ROOT", "$first_proposed_unit"]}
        }},
        {"$sort": sortQuery},
        {"$project": {
            "latest_comment": 0  # drop the nested object
        }}
    ])
    query = list(aggregation)
    print("QUERY: ",query)
    return Response(dumps(query), mimetype="application/json")

def _store_file_obj(f, subdir="SUPPORTING"):
    """Store uploaded werkzeug FileStorage to GridFS (if available) or disk.
       Returns stored value: GridFS id string or app-relative URL.
    """
    filename = secure_filename(f.filename)
    if _HAS_GRIDFS:
        fid = fs.put(f.stream, filename=filename, content_type=f.mimetype)  # type: ignore[name-defined]
        return str(fid)
    dest_dir = os.path.join(UPLOAD_ROOT, subdir)
    os.makedirs(dest_dir, exist_ok=True)
    save_path = os.path.join(dest_dir, filename)
    f.stream.seek(0)
    f.save(save_path)
    return f"/uploads/{subdir}/{filename}"


@app.route("/api/upload-supporting", methods=["POST"])
def upload_supporting():
    """Upload single file (multipart/form-data 'file') -> return {"fileId": "<id>"} or {"url": "/uploads/..."}"""
    if "file" not in request.files:
        return jsonify({"error": "no file"}), 400
    f = request.files["file"]
    if not f or f.filename == "":
        return jsonify({"error": "no file"}), 400
    try:
        # debug log so we can confirm server received the upload request
        app.logger.info("upload_supporting received file: %s (mimetype=%s, size=%s)", f.filename, f.mimetype, getattr(f, "content_length", "unknown"))
        stored = _store_file_obj(f)
        # return consistent shape: fileId when looks like ObjectId, else url
        try:
            ObjectId(stored)
            return jsonify({"fileId": stored})
        except Exception:
            return jsonify({"url": stored})
    except Exception as e:
        current_app.logger.exception("upload_supporting failed")
        return jsonify({"error": "upload failed", "detail": str(e)}), 500


@app.route('/api/submit', methods=["POST"])
def submit_rpl_form():

    def combine_institutions_with_units(institutions, units):
        external_units_list = []
        for i in range(len(institutions)):
            unit = units[i]
            unit["university_name"] = institutions[i]
            external_units_list.append(unit)
        return external_units_list

    submitted_data = request.get_json()
    submitted_ids = []
    if not submitted_data:
        return jsonify({"error": "missing json body"}), 400
    try:
        for unit_equivalence in submitted_data.get('requestedUnits', []):
            # attachments expected to be a list of strings (fileId or url)
            attachments = unit_equivalence.get("attachments", []) or []
            external_institutions = unit_equivalence.get("otherInstitutions", [])
            external_units = unit_equivalence.get("others", [])
            external_unit_codes = [u["code"] for u in external_units]
            # Need to do this because the institution name is stored separately to the unit
            # This function puts together the institution name with the unit
            external_units_complete = combine_institutions_with_units(external_institutions, external_units)

            inserted_units = []
            for unit in external_units_complete:
                incoming_unit = {
                    "university_name": unit["university_name"],
                    "unit_code": unit["code"],
                    "level": unit["level"],
                    "contact_hours": unit["contactHours"],
                    "learning_outcomes": unit["outcomes"],
                    "indicative_assessments": unit["assessments"],
                    "unit_name": unit["name"],
                    "credit_points": unit["creditPoints"],
                    "outline_link": unit["outlineLink"],
                    "completed_year": unit["yearCompleted"],
                    "timestamp": time.time()
                }
                inserted_unit = incoming_units.insert_one(incoming_unit)
                inserted_units.append(inserted_unit.inserted_id)
            
            application = {
                "first_name": submitted_data.get("firstName"),
                "last_name": submitted_data.get("lastName"),
                "email": submitted_data.get("emailAddress"),
                "status": "Pending",
                "submitted": True,
                "reviewed": True,
                "timestamp": time.time(),
                "proposed_units": inserted_units,
                "uwa_unit_code": unit_equivalence.get("uwa", {}).get("code"),
                "comments": [],
                "supporting_documents": attachments
            }

            candidate_apps = applications.find({
                "uwa_unit_code": application["uwa_unit_code"],
                "status": {"$in": ["Approve", "Reject"]}
            })

            existing = None
            incoming_set = {(u["code"], u["university_name"]) for u in external_units_complete}
            for app in candidate_apps:
                proposed_units = list(incoming_units.find({"_id": {"$in": app["proposed_units"]}}))
                proposed_set = {(u["unit_code"], u["university_name"]) for u in proposed_units}

                if proposed_set == incoming_set:
                    existing = app
                    break

            if existing:
                application["status"] = existing["status"]

            finished_application = applications.insert_one(application)
            submitted_ids.append(str(finished_application.inserted_id))

            external_codes_str = ", ".join(external_unit_codes)
            # Always send thank you email regardless of any automatic outcome
            send_email("Thanks for submitting your unit equivalence request!", 
                       [submitted_data.get("emailAddress")], 
                       "Thanks for submitting your request for unit(s) "+external_codes_str+ \
                        " to be equivalent to UWA unit "+application['uwa_unit_code']+".\n Your application number is "+ \
                        str(finished_application.inserted_id)+".\n You will be contacted with the result of your application, or if more information is required.\n Thanks!"
            )
            send_email("New RPL request pending for "+unit_equivalence.get("uwa", {}).get("code")+"!", [unit_equivalence.get("uwa", {}).get("code")+"_coordinator@uwa.edu.au"],
                       "A unit equivalence request for your unit has been made using the RPL app! \nPlease review it as soon as possible.")
            
            if application["status"] in ["Approve", "Reject"]:
                action = "approved" if application["status"] == "Approve" else "rejected"
                send_email("Automatic unit equivalence outcome",
                           [submitted_data.get("emailAddress")],
                           f"Your request for unit(s) {external_codes_str} to be equivalent to UWA unit {application['uwa_unit_code']} has been automatically {action} based on past data."
                           )
        if len(submitted_data.get("originalIds", [])) > 0: # if this is a response to a request for more information, store that this is a revised version of an existing form
            for i in range(len(submitted_data.get("originalIds"))):
                revisions.insert_one({"originalId": ObjectId(submitted_data.get("originalIds")[i]), "revisedId": ObjectId(submitted_ids[i])})
                applications.update_one({"_id": ObjectId(submitted_data.get("originalIds")[i])}, {"$set": {"status": "Obsolete"}})
                
        return jsonify({"message": "Form submitted", "ids": submitted_ids}), 201
    except Exception:
        app.logger.exception("submit_rpl_form failed")
        return jsonify({"error": "internal"}), 500

@app.get("/api/files/<fid>")
def download_file(fid):
    """Stream a file from MongoDB GridFS by its ObjectId.

    Path params:
        fid (str): Hex string ObjectId.

    Responses:
        200: Returns the file bytes with best-effort Content-Type and inline display.
        400: {"error": "invalid file id"} when fid is not a valid ObjectId.
        404: {"error": "not found"} when the file does not exist in GridFS.

    Notes:
        - Content type is guessed from the stored filename; unknown types default to application/octet-stream.
        - Intended for read-only downloads referenced as '/api/files/<fid>'.
    """
    try:
        oid = ObjectId(fid)
    except (InvalidId, TypeError):
        return jsonify({"error": "invalid file id"}), 400
    try:
        g = fs.get(oid)
    except gridfs.NoFile:
        return jsonify({"error": "not found"}), 404
    # guess mime from filename
    mime, _ = mimetypes.guess_type(g.filename or "")
    data = g.read()
    return send_file(
        BytesIO(data),
        mimetype=mime or "application/octet-stream",
        as_attachment=False,
        download_name=g.filename or fid
    )

def _normalize_supporting_docs(values):
    """
    Normalize 'Supporting Documents' into a list of {'name', 'url'} dicts.

    Accepts:
        - str URL: 'https://.../file.pdf'
        - str GridFS id: '<hex ObjectId>'
        - dict: {'name':'...', 'url':'...'} or {'name':'...', 'fileId':'<id>'}
        - list of any of the above or a single value

    Returns:
        list[dict]: Each item has:
            - name (str): Display name (filename or provided name)
            - url  (str): Absolute http(s) URL, or app-relative '/api/files/<id>' for GridFS,
                          or '' when not resolvable.

    Notes:
        - For GridFS ids, tries to resolve the filename via fs.get(); falls back to the id string.
        - Invalid items are skipped silently to keep the response robust.
    """
    if not values:
        return []
    if not isinstance(values, list):
        values = [values]

    out = []
    for v in values:
        try:
            if isinstance(v, str):
                if v.lower().startswith("http://") or v.lower().startswith("https://"):
                    name = v.rsplit("/", 1)[-1] or v
                    out.append({"name": name, "url": v})
                else:
                    # try as GridFS id
                    try:
                        oid = ObjectId(v)
                        try:
                            g = fs.get(oid)
                            name = g.filename or str(oid)
                        except gridfs.NoFile:
                            name = str(oid)
                        out.append({"name": name, "url": f"/api/files/{oid}"})
                    except InvalidId:
                        # plain string fallback
                        out.append({"name": v, "url": ""})
            elif isinstance(v, dict):
                name = v.get("name") or v.get("filename") or ""
                if "url" in v and v["url"]:
                    url = v["url"]
                elif "fileId" in v and v["fileId"]:
                    try:
                        oid = ObjectId(v["fileId"])
                        url = f"/api/files/{oid}"
                        if not name:
                            try:
                                g = fs.get(oid)
                                name = g.filename or str(oid)
                            except gridfs.NoFile:
                                name = str(oid)
                    except InvalidId:
                        url = ""
                else:
                    url = ""
                if not name and url:
                    name = url.rsplit("/", 1)[-1]
                out.append({"name": name or "document", "url": url})
        except Exception:
            continue
    return out

# Try to use initialized GridFS (if you have already created fs = gridfs.GridFS(db), it can be used) it just the test the support document feature
try:
    fs  # type: ignore
    _HAS_GRIDFS = True
except NameError:
    _HAS_GRIDFS = False

# Local upload directory (as a fallback if GridFS is not available)
UPLOAD_ROOT = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

# If you have not provided static upload file access, add this route (for /uploads/... links)
@app.route("/uploads/<unit_code>/<filename>")
def serve_supporting_doc(unit_code, filename):
    unit_dir = os.path.join(UPLOAD_ROOT, secure_filename(unit_code))
    return send_from_directory(unit_dir, secure_filename(filename))


def convertFormStateToDatabaseEntries(state_object):
    for unit_pair in state_object.requestedUnits:
        incoming_unit = {
            "university_name": unit_pair.otherInstitution,
            "unit_code": unit_pair.other.code,
            "level": unit_pair.other.level,
            "contact_hours": unit_pair.other.contactHours,
            "learning_outcomes": unit_pair.other.outcomes,
            "indicative_assessments": unit_pair.other.assessments,
            "unit_name": unit_pair.other.name,
            "credit_points": unit_pair.other.creditPoints,
            "outline_link": unit_pair.other.outlineLink,
            "completed_year": unit_pair.other.yearCompleted,
            "timestamp": time.time(),
            "supporting_documents": [],
        }
        application = {
            "first_name": state_object.firstName,
            "last_name": state_object.lastName,
            "email": state_object.emailAddress,
            "status": "Pending",
            "submitted": True,
            "reviewed": True,
            "timestamp": time.time(),
            "proposed_units": [],
            "uwa_unit_code": unit_pair.uwa.code,
        }
        applications.insert_one(application)
        incoming_units.insert_one(incoming_unit)

@app.route("/api/application/<id>/unlink-supporting", methods=["POST"])
def unlink_supporting(id):
    """
    Remove a file reference from an application (non-destructive).
    JSON body: { "fileId": "<id-or-url>", "incomingId": "<optional incoming unit id>" }
    """
    try:
        aid = ObjectId(id)
    except Exception:
        return jsonify({"error": "invalid application id"}), 400

    body = request.get_json(silent=True) or {}
    file_id = body.get("fileId")
    incoming_id = body.get("incomingId")

    if not file_id:
        return jsonify({"error": "missing fileId"}), 400

    try:
        # remove from application.supporting_documents (if present)
        res = applications.update_one({"_id": aid}, {"$pull": {"supporting_documents": file_id}})

        # optionally remove from incoming_units.supporting_documents too (if you stored there)
        if incoming_id:
            try:
                inc_oid = ObjectId(incoming_id)
                incoming_units.update_one({"_id": inc_oid}, {"$pull": {"supporting_documents": file_id}})
            except Exception:
                # ignore invalid incoming id
                pass

        return jsonify({"ok": True, "modifiedCount": res.modified_count})
    except Exception:
        app.logger.exception("unlink_supporting failed")
        return jsonify({"error": "internal"}), 500


@app.route("/api/application/<id>", methods=["GET"])
def get_application(id):
    """
    Return a single application in a normalized shape suitable for the review page.
    """
    # validate id
    try:
        aid = ObjectId(id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    try:
        # find application document
        app_doc = applications.find_one({"_id": aid})

        # gather incoming unit documents
        incoming_docs = []
        proposed = app_doc.get("proposed_units") or []
        for pid in proposed:
            try:
                pid_oid = pid if isinstance(pid, ObjectId) else ObjectId(pid)
                inc = incoming_units.find_one({"_id": pid_oid})
            except Exception:
                inc = None
            if not inc:
                continue
            normalized_inc = {
                "code": inc.get("unit_code") or inc.get("code") or "",
                "name": inc.get("unit_name") or inc.get("name") or "",
                "level": inc.get("level") or inc.get("unit_level") or None,
                "outcomes": inc.get("learning_outcomes") or inc.get("outcomes") or "",
                "indicativeAssessments": (
                    inc.get("indicative_assessments")
                    or inc.get("indicativeAssessments")
                    or inc.get("assessments")
                    or ""
                ),
                "creditPoints": inc.get("credit_points") or inc.get("creditPoints") or None,
                "contactHours": inc.get("contact_hours") or inc.get("contactHours") or None,
                "year": inc.get("completed_year") or inc.get("year") or None,
                "desc": inc.get("desc") or "",
                "university": inc.get("university_name") or inc.get("university") or "",
                "outline": inc.get("outline_link") or inc.get("outline") or "",
            }
            incoming_docs.append(normalized_inc)

        # fetch UWA unit from scraper (proposed_units only reference incoming_units)
        uwa_code = app_doc.get("uwa_unit_code") or app_doc.get("uwa_unit") or ""
        uwa_scrape = None
        if uwa_code:
            try:
                r = requests.get(f"{NODE_SCRAPER_BASE.rstrip('/')}/api/uwa/{uwa_code}", timeout=8)
                if r.status_code == 200:
                    uwa_scrape = r.json()
            except Exception as e:
                app.logger.warning("UWA scraper fetch failed for %s: %s", uwa_code, e)

        if uwa_scrape:
            uwa_unit = {
                "code": uwa_scrape.get("code") or uwa_scrape.get("unitCode") or uwa_code,
                "name": uwa_scrape.get("unitName") or uwa_scrape.get("unit_name") or "",
                "level": uwa_scrape.get("unitLevel") or uwa_scrape.get("level") or None,
                "outcomes": uwa_scrape.get("outcomes") or uwa_scrape.get("learningOutcomes") or "",
                "indicativeAssessments": (
                    uwa_scrape.get("assessments")
                    or uwa_scrape.get("indicative_assessments")
                    or ""
                ),
                "creditPoints": uwa_scrape.get("creditPoints") or uwa_scrape.get("credit_points") or None,
                "contactHours": uwa_scrape.get("contactHours") or uwa_scrape.get("contact_hours") or None,
                "year": uwa_scrape.get("year") or None,
                "desc": uwa_scrape.get("desc") or "",
                "university": "UWA",
                "outline": (
                    uwa_scrape.get("outlineLink")
                    or uwa_scrape.get("outline_link")
                    or f"https://handbooks.uwa.edu.au/unitdetails?code={uwa_code}"
                ),
                "incoming": incoming_docs,
            }
        else:
            uwa_unit = {
                "code": uwa_code,
                "name": app_doc.get("uwa_unit_name") or "",
                "level": app_doc.get("uwa_unit_level") or None,
                "outcomes": app_doc.get("uwa_outcomes") or "",
                "indicativeAssessments": app_doc.get("uwa_indicativeAssessments") or "",
                "creditPoints": app_doc.get("uwa_creditPoints") or None,
                "contactHours": app_doc.get("uwa_contactHours") or None,
                "year": app_doc.get("uwa_year") or None,
                "desc": app_doc.get("uwa_desc") or "",
                "university": "UWA",
                "outline": app_doc.get("uwa_outline") or (f"https://handbooks.uwa.edu.au/unitdetails?code={uwa_code}" if uwa_code else ""),
                "incoming": incoming_docs,
            }

        raw_comments = get_all_comments(aid)
        comments_serialized = []
        for c in raw_comments:
            if isinstance(c, dict):
                newc = {}
                for k, v in c.items():
                    if isinstance(v, ObjectId):
                        newc[k] = str(v)
                    else:
                        newc[k] = v
                comments_serialized.append(newc)
            else:
                comments_serialized.append(c)

        result = {
            "_id": str(app_doc["_id"]),
            "status": app_doc.get("status", ""),
            "personal": {
                "firstName": app_doc.get("first_name", ""),
                "surname": app_doc.get("last_name", ""),
                "email": app_doc.get("email", ""),
            },
            "units": [uwa_unit],
            "incomingUnits": incoming_docs,
            "comments": comments_serialized,
            "timestamp": app_doc.get("timestamp"),
            "previousId": str(app_doc.get("prev")) if app_doc.get("prev") else None,
            "newestVersion": str(most_recent_application(aid)),
            "supportingDocs": _normalize_supporting_docs(app_doc.get("supporting_documents")or app_doc.get("supportingDocs")or []),
        }
        return jsonify(result)

    except Exception:
        app.logger.exception("get_application failed")
        return jsonify({"error": "internal error"}), 500
    
# comment part
@app.route("/api/application/<id>/comments", methods=["POST"])
def post_application_comment(id):
    """
    POST JSON: { author: str, text: str, type?: "Comment"|"Approved"|"Rejected" }
    Appends comment to applications.comments and inserts a copy into comments collection.
    Status is decided by the most recent approval/denial comment:
      - If the most recent decision comment is Rejected -> status = "Reject"
      - If the most recent decision comment is Approved -> status = "Complete"
      - Else if any comments exist -> status = "Comment"
      - Else do not change status
    """
    try:
        aid = ObjectId(id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    body = request.get_json() or {}
    text = (body.get("text") or "").strip()
    author = body.get("author") or "Unknown"
    ctype = (body.get("type") or "Comment")
    if not text:
        return jsonify({"error": "empty comment"}), 400

    # normalize type strings
    norm_type = ctype.strip().title()  # e.g. "approved" -> "Approved"
    comment_doc = {
        "application_id": aid,
        "author": author,
        "text": text,
        "type": norm_type,
        "timestamp": time.time(),
    }

    try:
        # push into application's comments array (create field if missing)
        res = applications.update_one({"_id": aid}, {"$push": {"comments": comment_doc}})
        if res.matched_count == 0:
            return jsonify({"error": "application not found"}), 404

        # also insert into global comments collection for auditing/search
        comments.insert_one(comment_doc)

        # Determine new status by latest decision comment (Approved/Rejected)
        latest_decision = comments.find_one(
    {"application_id": aid, "type": {"$in": ["Approve", "Approved", "Reject", "Rejected", "Comment", "Obsolete"]}},
    sort=[("timestamp", -1)]
)

        new_status = None
        if latest_decision:
            lt = (latest_decision.get("type") or "").strip().title()
            if lt in ("Reject", "Rejected"):
                new_status = "Reject"
            elif lt in ("Approve", "Approved"):
                new_status = "Approve"
            elif lt == "Comment":
                new_status = "Request Further Information"

        if new_status and applications.find_one({"_id": aid}).get("status") != "Obsolete":
            applications.update_one({"_id": aid}, {"$set": {"status": new_status}})

        # send emails to all relevant parties
        applicant_email = applications.find_one({"_id": aid}).get("email")
        unit_coordinator_email = str(applications.find_one({"_id": aid}).get("uwa_unit_code"))+"_coordinator@uwa.edu.au"
        if new_status == "Request Further Information":
            send_email("Update on your unit equivalence application", [applicant_email],
                       "Additional information has been requested for your application! Here is the request: \n\n \
                        " + text + "\n\n Please submit a new form using the .json file provided upon submission of most recently updated form to add this information. Thanks!")
        else:
            send_email("Update on your unit equivalence application", [applicant_email],
                       "Your application is being reviewed - the current status is "+new_status+". Here is the most recent comment made on your application: \n\n \
                        " + text + "\n\n If your application is reviewed further, you will receive another email. Thanks!")
        send_email("An application for one of your units has been reviewed!", [unit_coordinator_email],
                   "Here is the latest review for application "+str(aid)+": \n\n \
                    Current Status: "+new_status+", New Comment: "+text+"\n\n For more details, see the RPL website. Thanks!")
        
        # return the appended comment and new status
        # make a JSON-serializable copy for response (convert ObjectId to str)
        resp = {"comment": comment_doc, "status": new_status}
        return Response(dumps(resp), mimetype="application/json"), 201
    except Exception:
        app.logger.exception("post_application_comment failed")
        return jsonify({"error": "internal error"}), 500


# test send 1 email
def send_email(subject, recipients, bodytext):
    message_data = request.get_json()
    msg = Message(subject, recipients=recipients, body=bodytext, sender="Sender <rpl@example.com>")
    mail.send(msg)
    return jsonify({"status":"Email sent."})

# the start of login routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = (data.get('username') or "").strip()
    password = data.get('password') or ""
    remember = bool(data.get('remember', False))

    # studentservices special case
    if username.lower() == "studentservices":
        account = accounts.find_one({"username": username})
        if not account:
            hashed_pw = generate_password_hash(password)
            new_account = {"username": username, "password": hashed_pw, "view_unitcode": None}
            accounts.insert_one(new_account)
            account = new_account
        else:
            if not check_password_hash(account["password"], password):
                return jsonify({"error": "Incorrect password"}), 401
        user = User(username, account.get("view_unitcode"))
        login_user(user, remember=remember)
        return jsonify({"success": True, "view_unitcode": user.view_unitcode})

    # unit-code account
    if is_unit_code_valid(username):
        account = accounts.find_one({"username": username})
        if not account:
            hashed_pw = generate_password_hash(password)
            new_account = {"username": username, "password": hashed_pw, "view_unitcode": username}
            accounts.insert_one(new_account)
            account = new_account
        else:
            if not check_password_hash(account["password"], password):
                return jsonify({"error": "Incorrect password"}), 401
        user = User(username, account.get("view_unitcode"))
        # make server session persistent when remember checked
        session.permanent = bool(remember)
        login_user(user, remember=remember)
        return jsonify({"success": True, "view_unitcode": user.view_unitcode})

    return jsonify({"error": "Login failed: invalid account"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    if current_user.is_authenticated:
        logout_user()
    return jsonify({"success": True})

@app.route("/api/whoami")
def whoami():
    if current_user.is_authenticated:
        return jsonify({"username": current_user.username, "view_unitcode": current_user.view_unitcode})
    return jsonify({"username": None, "view_unitcode": None}), 200

def is_unit_code_valid(unit_code):
    # use scraper to validate unit code
    try:
        node_url = f"{NODE_SCRAPER_BASE}/api/uwa/{unit_code}"
        r = requests.get(node_url, timeout=8)
        # If the response is 200 and contains content, consider it valid
        if r.status_code == 200 and r.json().get("code"):
            return True
    except Exception:
        pass
    return False

# returns True if there is an updated version of form with given ObjectId provided after a request for more information
def is_application_outdated(app_id):
    if revisions.find_one({"originalId":app_id}) is not None:
        return True
    return False

# returns the ObjectId of most recent application based off of application with given ObjectId
@app.route("/api/most_recent_app")
def most_recent_application(app_id):
    while is_application_outdated(app_id):
        app_id = revisions.find_one({"originalId": app_id})["revisedId"]
    return app_id

# returns a list of ObjectIds of this and all previous iterations of the form
def find_all_previous_versions(app_id):
    output = [app_id]
    while revisions.find_one({"revisedId": app_id}) is not None:
        app_id = revisions.find_one({"revisedId": app_id})["originalId"]
        output.append(app_id)
    return output

# returns a list of all comments for this application and all previous versions
def get_all_comments(app_id):
    return list(comments.find({"application_id": {"$in": find_all_previous_versions(app_id)}}))
@app.route("/api/application/<id>/assign-uc", methods=["POST"])
@login_required
def assign_uc(id):
    """
    Mark an application as needing Unit Coordinator attention.
    Only 'studentservices' can perform this action.
    Optionally accepts JSON {"recipients": ["uc@example.com", ...]} to send email.
    """
    if (getattr(current_user, "username", "") or "").lower() != "studentservices":
        return jsonify({"error": "forbidden"}), 403

    # parse id
    try:
        aid = ObjectId(id)
    except Exception:
        return jsonify({"error": "invalid id"}), 400

    app_doc = applications.find_one({"_id": aid})
    if not app_doc:
        return jsonify({"error": "not found"}), 404

    uwa_code = app_doc.get("uwa_unit_code") or app_doc.get("uwa_unit") or ""

    # update application: set status pending and append a system comment
    try:
        ts = time.time()
        applications.update_one(
            {"_id": aid},
            {
                "$set": {
                    "status": "Pending",
                    "assigned_to": "uc",
                    "assigned_unitcode": uwa_code,
                    "timestamp_updated": ts,
                },
                "$push": {
                    "comments": {
                        "type": "Pending",
                        "author": (getattr(current_user, "username", "") or "studentservices"),
                        "text": "Requested Unit Coordinator review",
                        "timestamp": ts,
                    }
                },
            },
        )
    except Exception as e:
        current_app.logger.exception("assign_uc update failed: %s", e)
        return jsonify({"error": "internal error"}), 500

    # optional email notify if recipients provided
    recipients = []
    try:
        data = request.get_json(silent=True) or {}
        recipients = data.get("recipients") or []
    except Exception:
        recipients = []
    if recipients:
        try:
            subject = "RPL application requires Unit Coordinator review"
            body = f"Application {str(aid)} requires UC review for UWA unit {uwa_code}."
            send_email(subject, recipients, body)
        except Exception as e:
            current_app.logger.warning("assign_uc email failed: %s", e)

    return jsonify({"ok": True, "status": "Pending"})
