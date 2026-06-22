#!/usr/bin/env python3
"""Set meaningful alt text for the final HabiliTrace DOCX evidence images."""

from __future__ import annotations

import os
import sys
import tempfile
import zipfile
from pathlib import Path

from lxml import etree


NS = {
    "wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
}

ALT_TEXT = {
    "1": ("Portada HabiliTrace", "Imagen de portada del documento final del proyecto HabiliTrace."),
    "2": ("Figura 1 - Diagrama metodologico", "Diagrama metodologico final del proyecto HabiliTrace."),
    "3": ("Figura 2 - Arquitectura funcional", "Arquitectura funcional implementada en HabiliTrace con frontend, backend, base de datos, IA, validacion humana y credenciales."),
    "4": ("Figura 3 - Dashboard frontend", "Dashboard funcional del frontend de HabiliTrace ejecutado localmente."),
    "5": ("Figura 4 - API REST JSON", "Respuesta JSON de la raiz de la API REST de HabiliTrace."),
    "6": ("Figura 5 - Swagger OpenAPI", "Documentacion Swagger OpenAPI del backend de HabiliTrace."),
    "7": ("Figura 6 - Credencial con hash", "Credencial JSON generada por HabiliTrace con prueba criptografica SHA-256."),
    "8": ("Figura 7 - Validacion tecnica", "Resumen de validacion tecnica local con migracion, seed, pruebas backend y build frontend."),
    "9": ("Figura 8 - Pipeline Jenkins", "Pipeline Jenkins ejecutado satisfactoriamente como evidencia de integracion continua."),
    "10": ("Figura 9 - Consola Jenkins", "Consola Jenkins con pruebas automatizadas y construccion Docker."),
}


def _copy_info(info: zipfile.ZipInfo) -> zipfile.ZipInfo:
    copied = zipfile.ZipInfo(info.filename, date_time=info.date_time)
    copied.compress_type = info.compress_type
    copied.comment = info.comment
    copied.extra = info.extra
    copied.internal_attr = info.internal_attr
    copied.external_attr = info.external_attr
    copied.create_system = info.create_system
    return copied


def set_alt_text(path: Path) -> None:
    fd, tmp_name = tempfile.mkstemp(prefix=f"{path.stem}_", suffix=".docx", dir=path.parent)
    os.close(fd)
    tmp_path = Path(tmp_name)

    try:
        with zipfile.ZipFile(path, "r") as zin, zipfile.ZipFile(tmp_path, "w") as zout:
            document_xml = zin.read("word/document.xml")
            root = etree.fromstring(document_xml)
            changed = 0
            for doc_pr in root.xpath(".//wp:docPr", namespaces=NS):
                image_id = doc_pr.get("id")
                if image_id in ALT_TEXT:
                    name, descr = ALT_TEXT[image_id]
                    doc_pr.set("name", name)
                    doc_pr.set("descr", descr)
                    changed += 1

            new_document_xml = etree.tostring(
                root,
                xml_declaration=True,
                encoding="UTF-8",
                standalone="yes",
            )

            for info in zin.infolist():
                if info.filename == "word/document.xml":
                    zout.writestr(_copy_info(info), new_document_xml)
                else:
                    zout.writestr(_copy_info(info), zin.read(info.filename))

        os.replace(tmp_path, path)
        print(f"updated {changed} image alt descriptions: {path}")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: set_docx_image_alt_text.py FILE.docx [FILE.docx ...]", file=sys.stderr)
        return 2
    for arg in argv[1:]:
        set_alt_text(Path(arg))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
