# PMFusion – EPC Project Management Toolkit

PMFusion is an end-to-end web application that empowers EPC (Engineering, Procurement & Construction) project managers to:

1. **Upload** CTR (Cost, Task & Resource) and MDR (Master Document Register) spreadsheets.  
2. **Parse** these files to extract structured project data.  
3. **Generate** a Primavera P6-style Work Breakdown Structure (WBS) automatically.  
4. **Visualise & manage** tasks, documents and progress in an intuitive React UI or via a REST API.

---

## 1. Feature Matrix

| Capability | Description | UI Support | API Route |
|------------|-------------|------------|-----------|
|CTR Upload  |Excel / CSV secure upload, server-side validation|✅|`POST /api/pmfusion/upload/ctr`|
|MDR Upload  |Excel / CSV secure upload|✅|`POST /api/pmfusion/upload/mdr`|
|Auto-detect File Type|Content heuristics choose CTR vs MDR when unknown|—|internal|
|Parsing Engine|Normalises columns, infers data types, cleans values|—|internal|
|Storage|Files on disk, metadata & parsed JSON in MongoDB|—|—|
|WBS Generator|Hierarchical algorithm converts tasks → WBS; links docs|✅|`POST /api/pmfusion/generate/wbs`|
|Data Retrieval|Download parsed CTR/MDR/WBS JSON|—|`GET /api/pmfusion/data/...`|
|Project Dashboard|Create projects, track uploads, generate WBS|✅|UI only|
|Visual WBS Tree|Collapsible tree with progress, hours & discipline badges|✅|UI only|

---

## 2. High-Level Architecture

```
┌───────────────┐        Upload        ┌────────────┐
│   Frontend    │ ───────────────────► │ FastAPI    │
│ React + Chakra│ ◄─────────────────── │  API       │
└──────┬────────┘     JSON responses   └────┬───────┘
       │                                   │
       │Axios                              │
       ▼                                   ▼
┌─────────────────────────┐     ┌────────────────────┐
│  pmfusion.parsers       │     │ pmfusion.wbs_gen   │
│  • detect_file_type()   │     │ • WBSGenerator     │
│  • parse_ctr_file()     │     │ • generate_wbs()   │
│  • parse_mdr_file()     │     └─────────┬──────────┘
└─────────┬───────────────┘               │Produces
          │Writes JSON                    │WBS JSON
          ▼                               ▼
  Disk (uploads & data)        MongoDB (files, parsed, wbs meta)
```

### Backend Stack
* **FastAPI** – REST endpoints (`backend/server.py`).
* **pmfusion** package  
  * `models.py` – Pydantic domain models.  
  * `parsers.py` – CTR / MDR parser utilities.  
  * `wbs_generator.py` – builds WBS.  
  * `api.py` – router mounted under `/api/pmfusion`.
* **MongoDB** – metadata persistence (files, parsed datasets, WBS summaries).
* **Filesystem** – raw uploads & parsed JSON snapshots.

### Frontend Stack
* **React 19** (CRA) + **Chakra UI**.  
* **Axios** for API calls.  
* Key components:
  * `PMFusionApp` – overall shell & routing.
  * `FileUploader` – upload & parse workflow.
  * `WBSGenerator` – select datasets & render WBS tree.

---

## 3. Folder Layout (excerpt)

```
backend/
 ├─ pmfusion/
 │   ├─ __init__.py
 │   ├─ models.py
 │   ├─ parsers.py
 │   ├─ wbs_generator.py
 │   └─ api.py
 ├─ documents/
 │   ├─ uploads/{ctr,mdr}/
 │   └─ data/{ctr,mdr,wbs}/
 └─ server.py          # FastAPI entry-point
frontend/
 └─ src/
     ├─ components/
     │   ├─ FileUploader.js
     │   ├─ WBSGenerator.js
     │   └─ PMFusionApp.js
     ├─ App.js
     └─ ...
```

---

## 4. Installation & Local Development

### Prerequisites
* Node ≥ 18, Yarn or npm
* Python ≥ 3.10
* MongoDB running locally (or change `MONGODB_URL`)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# env vars
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="pmfusion_db"
# run
uvicorn server:app --reload --port 8000
```

### Frontend

```bash
cd frontend
yarn install
REACT_APP_BACKEND_URL=http://localhost:8000 yarn start
```

Navigate to `http://localhost:3000/pmfusion`.

---

## 5. API Reference (selected)

### Upload CTR

`POST /api/pmfusion/upload/ctr`

Form-data fields  
| key | type | required |
|-----|------|----------|
| `file` | file (.xlsx/.xls/.csv) | ✅ |
| `project_id` | string | ✅ |
| `description` | string | ❌ |

Returns `FileUploadResponse`.

### Parse File

`POST /api/pmfusion/parse/file/{file_id}`  
Parses uploaded file, stores structured JSON, returns `ParseFileResponse`.

### Generate WBS

`POST /api/pmfusion/generate/wbs`

JSON body (WBSGenerationRequest):
```json
{
  "ctr_data_id": "uuid",
  "mdr_data_id": "uuid (optional)",
  "project_id": "project-uuid",
  "name": "Project Alpha WBS",
  "description": "P6-style hierarchy"
}
```

Returns `WBSGenerationResponse` with summary metrics.

### Retrieve Data

```
GET /api/pmfusion/data/ctr/{data_id}
GET /api/pmfusion/data/mdr/{data_id}
GET /api/pmfusion/data/wbs/{wbs_id}
```

---

## 6. Parsing Logic (CTR & MDR)

* **Column mapping**: heuristic templates match many naming variations (e.g., “Task ID”, “Activity ID”, “Code”).  
* **Data normalisation**: dates, percentages, statuses, disciplines parsed into enums.  
* **Error handling**: rows with parsing issues are skipped with warnings; metadata includes `status: error` on fatal issues.

---

## 7. WBS Generation Algorithm

1. **Build task map** – index tasks by ID.  
2. **Identify roots** – tasks without valid parent become root WBS elements.  
3. **Recursive expansion** – depth-first creation of child WBSElements.  
4. **Link documents** – by matching discipline & keyword overlap.  
5. **Roll-up metrics** – dates, hours, progress bubble up bottom-up.  
6. **Code assignment** – dotted numeric codes (`1`, `1.1`, `1.1.1`) mirroring Primavera P6.

---

## 8. Using the React UI

1. **Create Project** – sidebar ➜ *New Project*.  
2. **Upload CTR / MDR** – “Upload Files” tab. Progress bars show upload & parsing stages.  
3. **Generate WBS** – select parsed CTR (and optional MDR), name your WBS, press *Generate*.  
4. **Explore** – WBS tree renders with collapsible rows, colour-coded progress, hours & discipline badges.  
5. **Iterate** – re-upload newer spreadsheets and regenerate to update structure.

---

## 9. Extending PMFusion

* **Custom Column Templates** – add patterns to `parsers.map_column_names()` templates.  
* **Additional File Types** – extend `FileType` enum & detection logic.  
* **Alternative DB** – replace `motor` MongoDB calls with another backend; models are Pydantic.  
* **Gantt Charts** – integrate an open-source React Gantt library and feed WBSElements.

---

## 10. Deployment Notes

* **Docker** images can be produced via existing `Dockerfile`.  
* Mount `/data` volume for file persistence.  
* Set environment variables:
  * `MONGODB_URL` – remote cluster string
  * `DB_NAME` – database name
  * `ALLOWED_ORIGINS` – CORS domains (optional)

---

## 11. License & Acknowledgements

PMFusion is released under the MIT License.  
Dependencies: FastAPI, Pydantic, Pandas, React, Chakra-UI, MongoDB, etc.

---

Happy project planning! ✨
