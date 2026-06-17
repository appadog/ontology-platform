import os
import zipfile
from io import BytesIO

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["LOCAL_STORAGE_PATH"] = "/private/tmp/ontology-platform-backend-test-storage"

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import engine  # noqa: E402
from app.main import app  # noqa: E402


Base.metadata.create_all(bind=engine)
client = TestClient(app)


def test_health_and_dev_user() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    me = client.get("/api/v1/me")
    assert me.status_code == 200
    assert "PROJECT_ADMIN" in me.json()["roles"]


def test_project_ontology_graph_flow() -> None:
    project_response = client.post(
        "/api/v1/projects",
        json={"name": "Contract Test Project", "description": "Smoke flow"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    version_response = client.post(
        f"/api/v1/projects/{project_id}/ontology/versions",
        json={"created_by": "dev-user"},
    )
    assert version_response.status_code == 201
    version_id = version_response.json()["id"]

    company_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/classes",
        json={"name": "Company", "label": "Company", "position": {"x": 120, "y": 120}},
    )
    assert company_response.status_code == 201
    company_id = company_response.json()["id"]

    department_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/classes",
        json={"name": "Department", "label": "Department", "position": {"x": 320, "y": 120}},
    )
    assert department_response.status_code == 201
    department_id = department_response.json()["id"]

    property_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/properties",
        json={
            "class_id": company_id,
            "name": "company_name",
            "label": "Company Name",
            "data_type": "STRING",
            "cardinality": "REQUIRED",
            "required": True,
        },
    )
    assert property_response.status_code == 201

    relation_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/relations",
        json={
            "name": "HAS_DEPARTMENT",
            "label": "Has Department",
            "domain_class_id": company_id,
            "range_class_id": department_id,
            "cardinality": "ONE_TO_MANY",
        },
    )
    assert relation_response.status_code == 201

    graph_response = client.get(f"/api/v1/ontology/versions/{version_id}/graph")
    assert graph_response.status_code == 200
    graph = graph_response.json()
    assert graph["version_id"] == version_id
    assert len(graph["nodes"]) == 2
    assert len(graph["edges"]) == 1
    assert len(graph["properties"]) == 1


def test_source_upload_csv_txt_excel_preview_flow() -> None:
    project_response = client.post(
        "/api/v1/projects",
        json={"name": "Source Test Project", "description": "Source smoke flow"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    csv_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "CSV", "display_name": "Companies"},
        files={
            "file": (
                "companies.csv",
                b"company_name,employee_count\nAcme Corp,42\nBeta LLC,7\n",
                "text/csv",
            )
        },
    )
    assert csv_response.status_code == 201
    csv_source = csv_response.json()
    assert csv_source["status"] == "UPLOADED"
    assert csv_source["preview_status"] == "READY"

    preview_response = client.get(f"/api/v1/sources/{csv_source['id']}/preview")
    assert preview_response.status_code == 200
    preview = preview_response.json()
    assert preview["row_count_sampled"] == 2
    assert preview["total_row_count"] == 2
    assert preview["columns"][1]["name"] == "employee_count"
    assert preview["columns"][1]["data_type"] == "INTEGER"
    assert preview["rows"][0]["company_name"] == "Acme Corp"

    txt_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "TXT"},
        files={"file": ("notes.txt", b"plain text document", "text/plain")},
    )
    assert txt_response.status_code == 201
    txt_source = txt_response.json()
    assert txt_source["status"] == "UPLOADED"
    assert txt_source["preview_status"] == "NOT_AVAILABLE"
    txt_preview = client.get(f"/api/v1/sources/{txt_source['id']}/preview").json()
    assert txt_preview["columns"] == []
    assert txt_preview["warnings"]

    excel_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "EXCEL"},
        files={
            "file": (
                "companies.xlsx",
                _minimal_xlsx_bytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert excel_response.status_code == 201
    excel_source = excel_response.json()
    assert excel_source["preview_status"] == "READY"
    excel_preview = client.get(f"/api/v1/sources/{excel_source['id']}/preview").json()
    assert excel_preview["sheet_name"] == "Sheet1"
    assert excel_preview["rows"][0]["company_name"] == "Gamma Inc"

    project_detail = client.get(f"/api/v1/projects/{project_id}").json()
    assert project_detail["source_count"] == 3

    list_response = client.get(f"/api/v1/projects/{project_id}/sources")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 3


def test_openapi_exposes_source_contract() -> None:
    schema = client.get("/api/v1/openapi.json").json()
    paths = schema["paths"]
    assert "/api/v1/projects/{project_id}/sources" in paths
    assert "/api/v1/projects/{project_id}/sources/upload" in paths
    assert "/api/v1/sources/{source_id}" in paths
    assert "/api/v1/sources/{source_id}/preview" in paths
    assert "/api/v1/sources/{source_id}/profile" in paths
    assert "/api/v1/sources/{source_id}/parse" in paths
    assert "/api/v1/sources/{source_id}/segments" in paths
    assert "/api/v1/projects/{project_id}/prompts" in paths
    assert "/api/v1/prompts/{prompt_id}/versions" in paths
    assert "/api/v1/projects/{project_id}/extraction-jobs" in paths
    assert "/api/v1/extraction-jobs/{job_id}" in paths
    assert "/api/v1/extraction-jobs/{job_id}/run" in paths
    assert "/api/v1/extraction-jobs/{job_id}/retry" in paths
    assert "/api/v1/extraction-jobs/{job_id}/candidates/entities" in paths
    assert "/api/v1/extraction-jobs/{job_id}/candidates/relations" in paths
    assert "/api/v1/candidate-evidence/{evidence_id}" in paths
    assert "SourceData" in schema["components"]["schemas"]
    assert "SourcePreview" in schema["components"]["schemas"]
    assert "SourceProfile" in schema["components"]["schemas"]
    assert "SourceSegment" in schema["components"]["schemas"]
    assert "SourceStatus" in schema["components"]["schemas"]
    assert "SourcePreviewStatus" in schema["components"]["schemas"]
    assert "SourceSegmentType" in schema["components"]["schemas"]
    assert "ProfileInferredType" in schema["components"]["schemas"]
    assert "PromptTemplate" in schema["components"]["schemas"]
    assert "PromptVersion" in schema["components"]["schemas"]
    assert "ExtractionJob" in schema["components"]["schemas"]
    assert "ExtractionJobDetail" in schema["components"]["schemas"]
    assert "ModelRun" in schema["components"]["schemas"]
    assert "ModelRunStatus" in schema["components"]["schemas"]
    assert "CandidateEntity" in schema["components"]["schemas"]
    assert "CandidateRelation" in schema["components"]["schemas"]
    assert "CandidateEvidence" in schema["components"]["schemas"]
    assert "CandidateValidationCode" in schema["components"]["schemas"]


def test_mvp2_source_profile_and_parse_flow() -> None:
    project_response = client.post(
        "/api/v1/projects",
        json={"name": "MVP2 Source Project", "description": "Source profiling smoke flow"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    csv_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "CSV", "display_name": "Companies"},
        files={
            "file": (
                "companies.csv",
                b"company_name,employee_count\nAcme Corp,42\nBeta LLC,7\n",
                "text/csv",
            )
        },
    )
    assert csv_response.status_code == 201
    source_id = csv_response.json()["id"]

    profile_response = client.post(f"/api/v1/sources/{source_id}/profile")
    assert profile_response.status_code == 200
    profile = profile_response.json()
    assert profile["row_count"] == 2
    assert profile["sample_size"] == 2
    assert profile["columns"][1]["name"] == "employee_count"
    assert profile["columns"][1]["inferred_type"] == "INTEGER"
    assert profile["columns"][0]["candidate_key_score"] == 1.0

    parse_response = client.post(f"/api/v1/sources/{source_id}/parse")
    assert parse_response.status_code == 200
    parse = parse_response.json()
    assert parse["segment_count"] == 7
    assert set(parse["segment_types"]) == {"SHEET", "ROW", "CELL"}

    row_segments = client.get(f"/api/v1/sources/{source_id}/segments?segment_type=ROW").json()
    assert len(row_segments) == 2
    assert row_segments[0]["text"] == "company_name=Acme Corp | employee_count=42"

    txt_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "TXT"},
        files={
            "file": (
                "notes.txt",
                b"First paragraph about Acme.\n\nSecond paragraph about Beta.",
                "text/plain",
            )
        },
    )
    assert txt_response.status_code == 201
    txt_parse_response = client.post(
        f"/api/v1/sources/{txt_response.json()['id']}/parse",
        json={"chunk_size": 100},
    )
    assert txt_parse_response.status_code == 200
    assert set(txt_parse_response.json()["segment_types"]) == {"PARAGRAPH", "CHUNK"}

    pdf_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "PDF"},
        files={
            "file": (
                "brief.pdf",
                b"%PDF-1.4\n1 0 obj\n(Company evidence)\nendobj\n%%EOF",
                "application/pdf",
            )
        },
    )
    assert pdf_response.status_code == 201
    pdf_parse_response = client.post(
        f"/api/v1/sources/{pdf_response.json()['id']}/parse",
        json={"chunk_size": 100},
    )
    assert pdf_parse_response.status_code == 200
    pdf_parse = pdf_parse_response.json()
    assert set(pdf_parse["segment_types"]) == {"PAGE", "CHUNK"}
    assert pdf_parse["warnings"]


def test_mvp2_prompt_extraction_candidate_thin_flow() -> None:
    project_response = client.post(
        "/api/v1/projects",
        json={"name": "MVP2 Extraction Project", "description": "Extraction smoke flow"},
    )
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    version_response = client.post(f"/api/v1/projects/{project_id}/ontology/versions")
    assert version_response.status_code == 201
    version_id = version_response.json()["id"]
    company_id = client.post(
        f"/api/v1/ontology/versions/{version_id}/classes",
        json={"name": "Company", "label": "Company", "position": {"x": 100, "y": 100}},
    ).json()["id"]
    department_id = client.post(
        f"/api/v1/ontology/versions/{version_id}/classes",
        json={"name": "Department", "label": "Department", "position": {"x": 300, "y": 100}},
    ).json()["id"]
    relation_response = client.post(
        f"/api/v1/ontology/versions/{version_id}/relations",
        json={
            "name": "HAS_DEPARTMENT",
            "label": "Has Department",
            "domain_class_id": company_id,
            "range_class_id": department_id,
            "cardinality": "ONE_TO_MANY",
        },
    )
    assert relation_response.status_code == 201

    source_response = client.post(
        f"/api/v1/projects/{project_id}/sources/upload",
        data={"source_type": "CSV"},
        files={
            "file": (
                "companies.csv",
                b"company_name,department_name\nAcme Corp,Research\nBeta LLC,Sales\n",
                "text/csv",
            )
        },
    )
    assert source_response.status_code == 201
    source_id = source_response.json()["id"]
    assert client.post(f"/api/v1/sources/{source_id}/parse").status_code == 200

    prompt_response = client.post(
        f"/api/v1/projects/{project_id}/prompts",
        json={"name": "Extract source candidates", "description": "MVP2 thin prompt"},
    )
    assert prompt_response.status_code == 201
    prompt_id = prompt_response.json()["id"]
    prompt_version_response = client.post(
        f"/api/v1/prompts/{prompt_id}/versions",
        json={
            "template": "Extract candidate entities and relations.",
            "output_schema": {"type": "object"},
        },
    )
    assert prompt_version_response.status_code == 201
    prompt_version_id = prompt_version_response.json()["id"]

    job_response = client.post(
        f"/api/v1/projects/{project_id}/extraction-jobs",
        json={
            "source_id": source_id,
            "ontology_version_id": version_id,
            "prompt_version_id": prompt_version_id,
            "fixture_id": "default",
        },
    )
    assert job_response.status_code == 201
    job_id = job_response.json()["id"]

    run_response = client.post(f"/api/v1/extraction-jobs/{job_id}/run")
    assert run_response.status_code == 200
    run = run_response.json()
    assert run["status"] == "SUCCESS"
    assert run["candidate_entity_count"] == 2
    assert run["candidate_relation_count"] == 1
    assert run["model_runs"][0]["status"] == "SUCCESS"
    assert "Acme Corp" not in str(run["model_runs"][0]["raw_request"])
    assert run["model_runs"][0]["redaction_summary"]["policy"] == "no_source_text_or_secrets"

    entities_response = client.get(
        f"/api/v1/extraction-jobs/{job_id}/candidates/entities?has_evidence=true"
    )
    assert entities_response.status_code == 200
    entities = entities_response.json()
    assert len(entities) == 2
    assert entities[0]["review_status"] == "PENDING"
    assert entities[0]["publish_status"] == "NOT_PUBLISHED"
    assert entities[0]["validation_status"] == "PASSED"

    relations_response = client.get(f"/api/v1/extraction-jobs/{job_id}/candidates/relations")
    assert relations_response.status_code == 200
    assert len(relations_response.json()) == 1

    evidence_response = client.get(f"/api/v1/candidate-evidence/{entities[0]['evidence_ids'][0]}")
    assert evidence_response.status_code == 200
    assert evidence_response.json()["source_id"] == source_id

    missing_fixture_response = client.post(
        f"/api/v1/projects/{project_id}/extraction-jobs",
        json={
            "source_id": source_id,
            "ontology_version_id": version_id,
            "prompt_version_id": prompt_version_id,
            "fixture_id": "missing",
        },
    )
    assert missing_fixture_response.status_code == 201
    failed_run_response = client.post(
        f"/api/v1/extraction-jobs/{missing_fixture_response.json()['id']}/run"
    )
    assert failed_run_response.status_code == 200
    failed_run = failed_run_response.json()
    assert failed_run["status"] == "FAILED"
    assert failed_run["error_code"] == "MOCK_FIXTURE_NOT_FOUND"
    assert failed_run["model_runs"][0]["status"] == "FAILED"


def test_openapi_ontology_graph_compat_fields_are_optional_deprecated() -> None:
    schema = client.get("/api/v1/openapi.json").json()
    ontology_graph = schema["components"]["schemas"]["OntologyGraph"]
    required_fields = set(ontology_graph["required"])
    assert {"nodes", "edges", "properties"}.issubset(required_fields)
    assert "classes" not in required_fields
    assert "relations" not in required_fields
    assert ontology_graph["properties"]["classes"]["deprecated"] is True
    assert ontology_graph["properties"]["relations"]["deprecated"] is True


def _minimal_xlsx_bytes() -> bytes:
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w") as workbook:
        workbook.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>""",
        )
        workbook.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""",
        )
        workbook.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets>
</workbook>""",
        )
        workbook.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>""",
        )
        workbook.writestr(
            "xl/worksheets/sheet1.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>company_name</t></is></c>
      <c r="B1" t="inlineStr"><is><t>employee_count</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Gamma Inc</t></is></c>
      <c r="B2"><v>13</v></c>
    </row>
  </sheetData>
</worksheet>""",
        )
    return buffer.getvalue()
