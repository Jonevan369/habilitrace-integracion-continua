#!/usr/bin/env python3
"""Mark DOCX files so Word refreshes fields such as TOC/PAGEREF on open."""

from __future__ import annotations

import os
import sys
import tempfile
import zipfile
from pathlib import Path

from lxml import etree


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = f"{{{W_NS}}}"


def _copy_info(info: zipfile.ZipInfo) -> zipfile.ZipInfo:
    copied = zipfile.ZipInfo(info.filename, date_time=info.date_time)
    copied.compress_type = info.compress_type
    copied.comment = info.comment
    copied.extra = info.extra
    copied.internal_attr = info.internal_attr
    copied.external_attr = info.external_attr
    copied.create_system = info.create_system
    return copied


def _settings_with_update_fields(raw: bytes | None) -> bytes:
    if raw:
        root = etree.fromstring(raw)
    else:
        root = etree.Element(f"{W}settings", nsmap={"w": W_NS})

    node = root.find(f"{W}updateFields")
    if node is None:
        node = etree.Element(f"{W}updateFields")
        root.append(node)
    node.set(f"{W}val", "true")

    return etree.tostring(
        root,
        xml_declaration=True,
        encoding="UTF-8",
        standalone="yes",
    )


def mark(path: Path) -> None:
    if not path.exists():
        raise FileNotFoundError(path)

    fd, tmp_name = tempfile.mkstemp(prefix=f"{path.stem}_", suffix=".docx", dir=path.parent)
    os.close(fd)
    tmp_path = Path(tmp_name)

    try:
        with zipfile.ZipFile(path, "r") as zin, zipfile.ZipFile(tmp_path, "w") as zout:
            settings_raw = zin.read("word/settings.xml") if "word/settings.xml" in zin.namelist() else None
            new_settings = _settings_with_update_fields(settings_raw)

            wrote_settings = False
            for info in zin.infolist():
                if info.filename == "word/settings.xml":
                    zout.writestr(_copy_info(info), new_settings)
                    wrote_settings = True
                else:
                    zout.writestr(_copy_info(info), zin.read(info.filename))

            if not wrote_settings:
                zout.writestr("word/settings.xml", new_settings)

        os.replace(tmp_path, path)
        print(f"marked updateFields=true: {path}")
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("Usage: mark_docx_update_fields.py FILE.docx [FILE.docx ...]", file=sys.stderr)
        return 2
    for arg in argv[1:]:
        mark(Path(arg))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
