from __future__ import annotations

import csv
import re
import zipfile
from dataclasses import dataclass
from io import BytesIO, StringIO
from typing import Any
from xml.etree import ElementTree

from app.core.enums import PropertyDataType, SourceType

MAX_PREVIEW_ROWS = 20
MAX_SAMPLE_VALUES = 5
XML_NS = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
RELS_NS = {"rel": "http://schemas.openxmlformats.org/package/2006/relationships"}


@dataclass
class PreviewResult:
    columns: list[dict[str, Any]]
    rows: list[dict[str, Any]]
    row_count_sampled: int
    total_row_count: int
    sheet_name: str | None
    warnings: list[str]


def build_preview(source_type: SourceType, content: bytes) -> PreviewResult:
    if source_type == SourceType.CSV:
        return parse_csv_preview(content)
    if source_type == SourceType.EXCEL:
        return parse_xlsx_preview(content)
    return PreviewResult(
        columns=[],
        rows=[],
        row_count_sampled=0,
        total_row_count=0,
        sheet_name=None,
        warnings=[f"Preview is not available for {source_type.value} sources in MVP 1."],
    )


def parse_csv_preview(content: bytes) -> PreviewResult:
    text, decode_warning = _decode_text(content)
    reader = csv.DictReader(StringIO(text))
    warnings: list[str] = []
    if decode_warning:
        warnings.append(decode_warning)
    if not reader.fieldnames:
        return PreviewResult([], [], 0, 0, None, warnings + ["CSV header row was not found."])

    fieldnames = [_clean_header(header, index) for index, header in enumerate(reader.fieldnames)]
    rows: list[dict[str, Any]] = []
    total_row_count = 0
    for raw_row in reader:
        total_row_count += 1
        normalized_row = {
            fieldnames[index]: _normalize_cell(raw_row.get(original_header))
            for index, original_header in enumerate(reader.fieldnames)
        }
        if len(rows) < MAX_PREVIEW_ROWS:
            rows.append(normalized_row)

    return PreviewResult(
        columns=_build_columns(fieldnames, rows),
        rows=rows,
        row_count_sampled=len(rows),
        total_row_count=total_row_count,
        sheet_name=None,
        warnings=warnings,
    )


def parse_xlsx_preview(content: bytes) -> PreviewResult:
    try:
        with zipfile.ZipFile(BytesIO(content)) as workbook:
            sheet_name, worksheet_path = _first_worksheet(workbook)
            shared_strings = _shared_strings(workbook)
            table_rows = _worksheet_rows(workbook, worksheet_path, shared_strings)
    except (KeyError, zipfile.BadZipFile, ElementTree.ParseError) as exc:
        return PreviewResult(
            columns=[],
            rows=[],
            row_count_sampled=0,
            total_row_count=0,
            sheet_name=None,
            warnings=[f"Excel preview failed: {exc}"],
        )

    if not table_rows:
        return PreviewResult(
            columns=[],
            rows=[],
            row_count_sampled=0,
            total_row_count=0,
            sheet_name=sheet_name,
            warnings=["Excel worksheet is empty."],
        )

    headers = [_clean_header(str(value), index) for index, value in enumerate(table_rows[0])]
    data_rows = table_rows[1:]
    preview_rows: list[dict[str, Any]] = []
    for raw_row in data_rows[:MAX_PREVIEW_ROWS]:
        preview_rows.append(
            {
                headers[index]: _normalize_cell(raw_row[index] if index < len(raw_row) else "")
                for index in range(len(headers))
            }
        )

    return PreviewResult(
        columns=_build_columns(headers, preview_rows),
        rows=preview_rows,
        row_count_sampled=len(preview_rows),
        total_row_count=len(data_rows),
        sheet_name=sheet_name,
        warnings=[],
    )


def _decode_text(content: bytes) -> tuple[str, str | None]:
    for encoding in ("utf-8-sig", "utf-8", "cp949"):
        try:
            return content.decode(encoding), None if encoding != "cp949" else "CSV decoded with cp949."
        except UnicodeDecodeError:
            continue
    return content.decode("utf-8", errors="replace"), "CSV contained invalid UTF-8 bytes."


def _clean_header(header: str | None, index: int) -> str:
    value = (header or "").strip()
    return value or f"column_{index + 1}"


def _normalize_cell(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped != "" else None
    return str(value)


def _build_columns(headers: list[str], rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    columns = []
    for header in headers:
        values = [row.get(header) for row in rows]
        non_empty_values = [value for value in values if value not in (None, "")]
        sample_values = []
        for value in non_empty_values:
            if value not in sample_values:
                sample_values.append(value)
            if len(sample_values) >= MAX_SAMPLE_VALUES:
                break
        columns.append(
            {
                "name": header,
                "data_type": _infer_data_type(non_empty_values).value,
                "nullable": len(non_empty_values) < len(values),
                "sample_values": sample_values,
            }
        )
    return columns


def _infer_data_type(values: list[Any]) -> PropertyDataType:
    if not values:
        return PropertyDataType.STRING
    string_values = [str(value) for value in values]
    if all(_is_boolean(value) for value in string_values):
        return PropertyDataType.BOOLEAN
    if all(_is_integer(value) for value in string_values):
        return PropertyDataType.INTEGER
    if all(_is_float(value) for value in string_values):
        return PropertyDataType.FLOAT
    if all(_is_date(value) for value in string_values):
        return PropertyDataType.DATE
    return PropertyDataType.STRING


def _is_boolean(value: str) -> bool:
    return value.lower() in {"true", "false", "yes", "no", "0", "1"}


def _is_integer(value: str) -> bool:
    return bool(re.fullmatch(r"[-+]?\d+", value))


def _is_float(value: str) -> bool:
    return bool(re.fullmatch(r"[-+]?\d+(\.\d+)?", value))


def _is_date(value: str) -> bool:
    return bool(re.fullmatch(r"\d{4}-\d{2}-\d{2}", value))


def _first_worksheet(workbook: zipfile.ZipFile) -> tuple[str, str]:
    workbook_xml = ElementTree.fromstring(workbook.read("xl/workbook.xml"))
    rels_xml = ElementTree.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    first_sheet = workbook_xml.find("main:sheets/main:sheet", XML_NS)
    if first_sheet is None:
        raise KeyError("xl/workbook.xml has no sheets")
    sheet_name = first_sheet.attrib.get("name", "Sheet1")
    rel_id = first_sheet.attrib.get(
        "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
    )
    target = None
    for relationship in rels_xml.findall("rel:Relationship", RELS_NS):
        if relationship.attrib.get("Id") == rel_id:
            target = relationship.attrib.get("Target")
            break
    if target is None:
        raise KeyError(f"worksheet relationship {rel_id} was not found")
    if not target.startswith("xl/"):
        target = f"xl/{target.lstrip('/')}"
    return sheet_name, target


def _shared_strings(workbook: zipfile.ZipFile) -> list[str]:
    try:
        shared_xml = ElementTree.fromstring(workbook.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    values = []
    for item in shared_xml.findall("main:si", XML_NS):
        parts = [text.text or "" for text in item.findall(".//main:t", XML_NS)]
        values.append("".join(parts))
    return values


def _worksheet_rows(
    workbook: zipfile.ZipFile, worksheet_path: str, shared_strings: list[str]
) -> list[list[str]]:
    worksheet_xml = ElementTree.fromstring(workbook.read(worksheet_path))
    rows: list[list[str]] = []
    for row in worksheet_xml.findall(".//main:sheetData/main:row", XML_NS):
        values_by_index: dict[int, str] = {}
        for cell in row.findall("main:c", XML_NS):
            index = _column_index(cell.attrib.get("r", "A1"))
            values_by_index[index] = _cell_value(cell, shared_strings)
        if values_by_index:
            max_index = max(values_by_index)
            rows.append([values_by_index.get(index, "") for index in range(max_index + 1)])
    return rows


def _column_index(cell_ref: str) -> int:
    letters = "".join(character for character in cell_ref if character.isalpha()).upper()
    index = 0
    for character in letters:
        index = index * 26 + (ord(character) - ord("A") + 1)
    return max(index - 1, 0)


def _cell_value(cell: ElementTree.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        parts = [text.text or "" for text in cell.findall(".//main:t", XML_NS)]
        return "".join(parts)
    value = cell.find("main:v", XML_NS)
    if value is None or value.text is None:
        return ""
    if cell_type == "s":
        string_index = int(value.text)
        return shared_strings[string_index] if string_index < len(shared_strings) else ""
    return value.text
