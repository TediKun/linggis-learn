#!/usr/bin/env python3
"""
Extract, clean, deduplicate, and structure offline English-Indonesian learning
datasets from the decompiled reference APK (/tmp/jadx-ref) into data/apk/*.json.
"""

from __future__ import annotations

import html
import json
import os
import re
import unicodedata
from pathlib import Path
from typing import Any

JADX_ROOT = Path("/tmp/jadx-ref/sources")
PKG_ROOT = JADX_ROOT / "com" / "nofta" / "bahasainggrispemula"
OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "apk"

# Remove decorative emojis per Anti AI-Slop design rules
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002600-\U000027BF"
    "\U0001F1E0-\U0001F1FF"
    "\u200d\ufe0f"
    "]+",
    flags=re.UNICODE,
)


def strip_emojis(text: str) -> str:
    cleaned = EMOJI_RE.sub("", text)
    # Also replace common symbol check/cross markers inside text with clean prose markers
    cleaned = cleaned.replace("✔", "[Benar]").replace("❌", "[Salah]").replace("👉", "->")
    return re.sub(r"[ \t]{2,}", " ", cleaned).strip()


def slugify(text: str) -> str:
    s = unicodedata.normalize("NFKD", text.lower())
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "item"


def decode_java_string(raw: str) -> str:
    """Decode Java string literal contents (without surrounding quotes)."""
    out: list[str] = []
    i = 0
    n = len(raw)
    while i < n:
        ch = raw[i]
        if ch == "\\" and i + 1 < n:
            nxt = raw[i + 1]
            if nxt == "n":
                out.append("\n")
                i += 2
            elif nxt == "r":
                out.append("\r")
                i += 2
            elif nxt == "t":
                out.append("\t")
                i += 2
            elif nxt == '"':
                out.append('"')
                i += 2
            elif nxt == "'":
                out.append("'")
                i += 2
            elif nxt == "\\":
                out.append("\\")
                i += 2
            elif nxt == "u" and i + 5 < n:
                hex_part = raw[i + 2 : i + 6]
                try:
                    out.append(chr(int(hex_part, 16)))
                    i += 6
                except ValueError:
                    out.append(ch)
                    i += 1
            else:
                out.append(nxt)
                i += 2
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def parse_java_args(arg_str: str) -> list[str | int]:
    """Parse comma-separated Java constructor literal arguments (strings & ints)."""
    args: list[str | int] = []
    i = 0
    n = len(arg_str)
    while i < n:
        while i < n and arg_str[i] in " \t\n\r,":
            i += 1
        if i >= n:
            break
        if arg_str[i] == '"':
            i += 1
            buf: list[str] = []
            while i < n:
                ch = arg_str[i]
                if ch == "\\" and i + 1 < n:
                    buf.append(ch)
                    buf.append(arg_str[i + 1])
                    i += 2
                elif ch == '"':
                    i += 1
                    break
                else:
                    buf.append(ch)
                    i += 1
            args.append(decode_java_string("".join(buf)).strip())
        else:
            start = i
            while i < n and arg_str[i] not in ",)":
                i += 1
            token = arg_str[start:i].strip()
            if re.fullmatch(r"-?\d+", token):
                args.append(int(token))
            else:
                args.append(token)
    return args


def extract_constructor_calls(text: str, class_name: str) -> list[list[str | int]]:
    """Extract all `new <class_name>(...)` literal arguments."""
    results: list[list[str | int]] = []
    pattern = re.compile(rf"new\s+{re.escape(class_name)}\s*\(")
    for m in pattern.finditer(text):
        i = m.end()
        n = len(text)
        depth = 1
        in_str = False
        buf: list[str] = []
        while i < n and depth > 0:
            ch = text[i]
            if in_str:
                buf.append(ch)
                if ch == "\\" and i + 1 < n:
                    buf.append(text[i + 1])
                    i += 2
                    continue
                elif ch == '"':
                    in_str = False
            else:
                if ch == '"':
                    in_str = True
                    buf.append(ch)
                elif ch == "(":
                    depth += 1
                    buf.append(ch)
                elif ch == ")":
                    depth -= 1
                    if depth > 0:
                        buf.append(ch)
                else:
                    buf.append(ch)
            i += 1
        results.append(parse_java_args("".join(buf)))
    return results


def extract_string_array(text: str, field_or_pattern: str) -> list[str]:
    """Extract string array initialized right after `field_or_pattern`."""
    m = re.search(field_or_pattern + r"\s*(?:new\s+String\[\])?\s*\{", text)
    if not m:
        return []
    i = m.end()
    n = len(text)
    in_str = False
    depth = 1
    buf: list[str] = []
    while i < n and depth > 0:
        ch = text[i]
        if in_str:
            buf.append(ch)
            if ch == "\\" and i + 1 < n:
                buf.append(text[i + 1])
                i += 2
                continue
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
                buf.append(ch)
            elif ch == "{":
                depth += 1
                buf.append(ch)
            elif ch == "}":
                depth -= 1
                if depth > 0:
                    buf.append(ch)
            else:
                buf.append(ch)
        i += 1
    parsed = parse_java_args("".join(buf))
    return [str(x).strip() for x in parsed]


def clean_html_to_markdown(raw_html: str) -> tuple[str, str]:
    """Convert Android WebView HTML document into (title, clean Markdown)."""
    title_m = re.search(r"<title>(.*?)</title>", raw_html, flags=re.S | re.I)
    title = html.unescape(title_m.group(1)).strip() if title_m else ""
    body_m = re.search(r"<body[^>]*>(.*)</body>", raw_html, flags=re.S | re.I)
    body = body_m.group(1) if body_m else raw_html
    body = re.sub(r"<style[^>]*>.*?</style>", "", body, flags=re.S | re.I)
    body = re.sub(r"<script[^>]*>.*?</script>", "", body, flags=re.S | re.I)
    body = re.sub(r"<!--.*?-->", "", body, flags=re.S)

    # Convert HTML tables cleanly to Markdown tables
    def convert_table(match: re.Match[str]) -> str:
        tbl_html = match.group(0)
        rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbl_html, flags=re.S | re.I)
        md_rows: list[str] = []
        for idx, row in enumerate(rows):
            cells = re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", row, flags=re.S | re.I)
            if not cells:
                continue
            cleaned_cells = []
            for c in cells:
                c_txt = re.sub(r"<br\s*/?>", " / ", c, flags=re.I)
                c_txt = re.sub(r"<[^>]+>", "", c_txt)
                c_txt = strip_emojis(html.unescape(c_txt)).replace("|", "/")
                cleaned_cells.append(re.sub(r"\s+", " ", c_txt).strip())
            md_rows.append("| " + " | ".join(cleaned_cells) + " |")
            if idx == 0:
                md_rows.append("| " + " | ".join(["---"] * len(cleaned_cells)) + " |")
        return "\n\n" + "\n".join(md_rows) + "\n\n" if md_rows else ""

    body = re.sub(r"<table[^>]*>.*?</table>", convert_table, body, flags=re.S | re.I)

    # Headings
    for lvl in range(1, 5):
        hashes = "#" * lvl
        body = re.sub(
            rf"<h{lvl}[^>]*>(.*?)</h{lvl}>",
            lambda m, h=hashes: f"\n\n{h} {re.sub(r'<[^>]+>', '', m.group(1)).strip()}\n\n",
            body,
            flags=re.S | re.I,
        )

    # Lists
    body = re.sub(r"<li[^>]*>(.*?)</li>", lambda m: f"\n- {m.group(1).strip()}", body, flags=re.S | re.I)
    body = re.sub(r"</?(?:ul|ol)[^>]*>", "\n", body, flags=re.I)

    # Inline formatting
    body = re.sub(r"<(?:strong|b)[^>]*>(.*?)</(?:strong|b)>", r"**\1**", body, flags=re.S | re.I)
    body = re.sub(r"<(?:em|i)[^>]*>(.*?)</(?:em|i)>", r"*\1*", body, flags=re.S | re.I)
    body = re.sub(r"<br\s*/?>", "\n", body, flags=re.I)
    body = re.sub(r"<hr\s*/?>", "\n\n---\n\n", body, flags=re.I)

    # Example / tip / callout divs -> blockquotes or paragraphs
    body = re.sub(
        r'<div[^>]*class="[^"]*(?:example|tip|note|orange|blue|green|error-card|step-card|comparison-box|intro)[^"]*"[^>]*>',
        "\n\n> ",
        body,
        flags=re.I,
    )
    body = re.sub(r"</?(?:p|div|span|section)[^>]*>", "\n", body, flags=re.I)
    body = re.sub(r"<[^>]+>", "", body)
    body = html.unescape(body)

    lines: list[str] = []
    for raw_line in body.splitlines():
        line = strip_emojis(raw_line)
        # collapse excessive empty bold/markers
        line = re.sub(r"\*\*\s*\*\*", "", line)
        lines.append(line)

    md = "\n".join(lines)
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    # Fix blockquote continuation lines lightly
    title = strip_emojis(title)
    return title, md


def extract_webview_html(java_text: str) -> str | None:
    m = re.search(r"loadDataWithBaseURL\s*\(\s*null\s*,\s*\"", java_text)
    if not m:
        return None
    i = m.end()
    n = len(java_text)
    buf: list[str] = []
    while i < n:
        ch = java_text[i]
        if ch == "\\" and i + 1 < n:
            buf.append(ch)
            buf.append(java_text[i + 1])
            i += 2
        elif ch == '"':
            break
        else:
            buf.append(ch)
            i += 1
    return decode_java_string("".join(buf))


def extract_vocabulary() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    menu_text = (PKG_ROOT / "menu" / "MainVocabularyActivity.java").read_text(errors="ignore")
    categories: list[dict[str, Any]] = []
    current_group = "Basic Vocabulary"
    current_cefr = "A1"

    # Parse q(...) and r(...) calls in order
    for line in menu_text.splitlines():
        qm = re.search(r'\bq\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', line)
        if qm:
            current_group = qm.group(1)
            if "Basic" in current_group:
                current_cefr = "A1"
            elif "Daily" in current_group:
                current_cefr = "A2"
            elif "Advanced" in current_group:
                current_cefr = "B1"
            else:
                current_cefr = "A1"
            continue
        rm = re.search(r'\br\([^,]+,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"(\d+)"\s*\)', line)
        if rm:
            idx = int(rm.group(3))
            categories.append(
                {
                    "id": idx,
                    "group": current_group,
                    "cefr": current_cefr,
                    "title_id": rm.group(1),
                    "title_en": rm.group(2),
                }
            )

    cat_by_id = {c["id"]: c for c in categories}
    pos_map_by_cat = {
        44: "noun",
        45: "pronoun",
        46: "verb",
        47: "preposition",
        48: "conjunction",
        49: "adverb",
        50: "interjection",
        51: "adjective",
    }

    words_by_slug: dict[str, dict[str, Any]] = {}
    # In MainVocabularyActivity menu, ID "5" opens Vocab11 (Food) and ID "11" opens Vocab05 (Transportation)
    activity_to_cat_id = {5: 11, 11: 5}
    for idx in range(1, 52):
        fpath = PKG_ROOT / "inggriskosakata" / f"Vocab{idx:02d}Activity.java"
        if not fpath.exists():
            continue
        txt = fpath.read_text(errors="ignore")
        mapped_cat_id = activity_to_cat_id.get(idx, idx)
        cat = cat_by_id.get(mapped_cat_id, {"group": "Basic Vocabulary", "cefr": "A1", "title_id": f"Vocab {idx}", "title_en": f"Vocab {idx}"})
        items = extract_constructor_calls(txt, "y60")
        pos = pos_map_by_cat.get(idx, "verb" if idx in (21, 22, 26) else "noun")
        for item in items:
            if len(item) < 4:
                continue
            word_en = strip_emojis(str(item[1])).strip()
            read_hint = strip_emojis(str(item[2])).strip()
            meaning_id = strip_emojis(str(item[3])).strip()
            if not word_en or not meaning_id:
                continue
            # Clean "(sound)" style suffix into note if present, keep clean word
            base_word = re.sub(r"\s*\([^)]*\)\s*$", "", word_en).strip() or word_en
            s = slugify(base_word)
            meanings = [m.strip() for m in re.split(r"\s*/\s*", meaning_id) if m.strip()]
            if s in words_by_slug:
                existing = words_by_slug[s]
                for m in meanings:
                    if m not in existing["translations_id"]:
                        existing["translations_id"].append(m)
                if cat["title_id"] not in existing["topics"]:
                    existing["topics"].append(cat["title_id"])
            else:
                words_by_slug[s] = {
                    "slug": s,
                    "word": base_word,
                    "pos": pos,
                    "cefr_level": cat["cefr"],
                    "pronunciation_hint_id": read_hint,
                    "translations_id": meanings,
                    "category": cat["group"],
                    "topics": [cat["title_id"]],
                    "source": "apk_vocab",
                }

    return categories, list(words_by_slug.values())


def extract_phrases_and_expressions() -> dict[str, list[dict[str, Any]]]:
    data: dict[str, list[dict[str, Any]]] = {
        "hafalan": [],
        "expressions": [],
        "phrasal_verbs": [],
        "idioms": [],
        "slang": [],
        "patterns": [],
        "i_statements": [],
    }

    # 1. Hafalan01..84 + MainHafalanActivity levels
    mh_txt = (PKG_ROOT / "more" / "MainHafalanActivity.java").read_text(errors="ignore")
    hafalan_levels: dict[int, str] = {}
    for m in re.finditer(r'new\s+zy\(\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', mh_txt):
        idx = int(m.group(1)) + 1
        hafalan_levels[idx] = m.group(3)

    def map_hafalan_cefr(level_label: str) -> str:
        if any(k in level_label for k in ("Level 1:", "Level 2:")):
            return "A1"
        if any(k in level_label for k in ("Level 3:", "Level 4:")):
            return "A2"
        if any(k in level_label for k in ("Level 5:", "Level 6:", "Level 7:")):
            return "B1"
        if any(k in level_label for k in ("Level 8:", "Level 9:", "Level-10:")):
            return "B2"
        return "C1"

    for i in range(1, 85):
        fp = PKG_ROOT / "more" / f"Hafalan{i:02d}Activity.java"
        if not fp.exists():
            continue
        txt = fp.read_text(errors="ignore")
        lvl_label = hafalan_levels.get(i, "Level 1: Pemula")
        cefr = map_hafalan_cefr(lvl_label)
        items = extract_constructor_calls(txt, "y60")
        entries = []
        seen: set[str] = set()
        for it in items:
            if len(it) < 4:
                continue
            en = strip_emojis(str(it[1])).strip()
            hint = strip_emojis(str(it[2])).strip()
            id_txt = strip_emojis(str(it[3])).strip()
            if en and en.lower() not in seen:
                seen.add(en.lower())
                entries.append({"en": en, "read_hint": hint, "id": id_txt})
        data["hafalan"].append(
            {
                "part": i,
                "slug": f"hafalan-part-{i:02d}",
                "title": f"Ungkapan Harian Part {i}",
                "level_label": lvl_label,
                "cefr": cefr,
                "items": entries,
            }
        )

    # 2. Expressions (ListExpressionActivity01..30 + ListExpressionNewActivity01)
    me_txt = (PKG_ROOT / "menu" / "MainExpressionActivity.java").read_text(errors="ignore")
    expr_meta = {
        int(m.group(1)): (m.group(2), m.group(3))
        for m in re.finditer(r'new\s+vv3\(\s*"(\d+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', me_txt)
    }
    for fp in sorted((PKG_ROOT / "inggrisexpression").glob("ListExpression*.java")):
        txt = fp.read_text(errors="ignore")
        t1 = re.search(r'\.setText\("([^"]+)"\)', txt)
        title = t1.group(1) if t1 else fp.stem
        items = extract_constructor_calls(txt, "vh0")
        entries = []
        seen = set()
        for it in items:
            if len(it) < 5:
                continue
            en = strip_emojis(str(it[2])).strip()
            hint = strip_emojis(str(it[3])).strip()
            id_txt = strip_emojis(str(it[4])).strip()
            if en and en.lower() not in seen:
                seen.add(en.lower())
                entries.append({"en": en, "read_hint": hint, "id": id_txt})
        if entries:
            data["expressions"].append(
                {
                    "slug": slugify(f"expr-{fp.stem}-{title}"),
                    "title": title,
                    "cefr": "A1",
                    "items": entries,
                }
            )

    # 3. Phrasal Verbs
    mp_txt = (PKG_ROOT / "menu" / "MainPhrasalVerbActivity.java").read_text(errors="ignore")
    phrasal_meta: dict[str, tuple[str, str, str]] = {}
    grp = "Daily Life"
    for line in mp_txt.splitlines():
        qm = re.search(r'\bq\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', line)
        if qm:
            grp = qm.group(1)
        rm = re.search(r'\br\([^,]+,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"(\d+)"\s*\)', line)
        if rm:
            phrasal_meta[rm.group(3)] = (rm.group(1), rm.group(2), grp)

    for fp in sorted((PKG_ROOT / "phrasal").glob("Phrasal*.java")):
        txt = fp.read_text(errors="ignore")
        num = re.search(r"(\d+)", fp.stem)
        n_key = str(int(num.group(1))) if num else fp.stem
        meta = phrasal_meta.get(n_key, (fp.stem, "Phrasal Verb", "Daily Life"))
        cefr = "B1" if meta[2] in ("Daily Life", "Social & Communication") else "B2"
        items = extract_constructor_calls(txt, "y60")
        entries = []
        seen = set()
        for it in items:
            if len(it) < 4:
                continue
            en = strip_emojis(str(it[1])).strip()
            hint = strip_emojis(str(it[2])).strip()
            id_txt = strip_emojis(str(it[3])).strip()
            if en and en.lower() not in seen:
                seen.add(en.lower())
                entries.append({"en": en, "read_hint": hint, "id": id_txt})
        if entries:
            data["phrasal_verbs"].append(
                {
                    "slug": slugify(f"phrasal-{meta[0]}"),
                    "title": meta[0],
                    "subtitle": meta[1],
                    "group": meta[2],
                    "cefr": cefr,
                    "items": entries,
                }
            )

    # 4. Idioms
    for i in range(1, 17):
        fp = PKG_ROOT / "inggrisidiom" / f"Idiom{i:02d}Activity.java"
        if not fp.exists():
            continue
        txt = fp.read_text(errors="ignore")
        cefr = "B1" if i <= 5 else ("B2" if i <= 10 else "C1")
        items = extract_constructor_calls(txt, "y60")
        entries = []
        seen = set()
        for it in items:
            if len(it) < 4:
                continue
            en = strip_emojis(str(it[1])).strip()
            hint = strip_emojis(str(it[2])).strip()
            id_txt = strip_emojis(str(it[3])).strip()
            if en and en.lower() not in seen:
                seen.add(en.lower())
                entries.append({"en": en, "read_hint": hint, "id": id_txt})
        if entries:
            data["idioms"].append(
                {
                    "part": i,
                    "slug": f"idiom-part-{i:02d}",
                    "title": f"Idiom Part {i}",
                    "cefr": cefr,
                    "items": entries,
                }
            )

    # 5. Slang
    ms_txt = (PKG_ROOT / "menu" / "MainSlangActivity.java").read_text(errors="ignore")
    slang_meta = {
        int(m.group(1)): (m.group(2), m.group(3))
        for m in re.finditer(r'new\s+vv3\(\s*"(\d+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', ms_txt)
    }
    for i in range(1, 13):
        fp = PKG_ROOT / "inggrisslang" / f"Slang{i:02d}Activity.java"
        if not fp.exists():
            continue
        txt = fp.read_text(errors="ignore")
        meta = slang_meta.get(i, (f"Slang {i}", "Bahasa gaul sehari-hari"))
        items = extract_constructor_calls(txt, "jm1")
        entries = []
        seen = set()
        for it in items:
            if len(it) < 5:
                continue
            en = strip_emojis(str(it[2])).strip()
            hint = strip_emojis(str(it[3])).strip()
            id_txt = strip_emojis(str(it[4])).strip()
            if en and en.lower() not in seen:
                seen.add(en.lower())
                entries.append({"en": en, "read_hint": hint, "id": id_txt})
        if entries:
            data["slang"].append(
                {
                    "slug": slugify(f"slang-{meta[0]}"),
                    "title": meta[0],
                    "subtitle": meta[1],
                    "cefr": "B2",
                    "items": entries,
                }
            )

    # 6. Unique Patterns (Frasa Unik)
    mpat_txt = (PKG_ROOT / "menu" / "MainPaternActivity.java").read_text(errors="ignore")
    pat_meta = {
        int(str(args[0])): (str(args[1]), str(args[2]))
        for args in extract_constructor_calls(mpat_txt, "vv3")
        if len(args) >= 3 and str(args[0]).isdigit()
    }
    for i in range(1, 21):
        fp = PKG_ROOT / "patterns" / f"Frasa{i:02d}Activity.java"
        if not fp.exists():
            continue
        txt = fp.read_text(errors="ignore")
        meta = pat_meta.get(i, (f"Frasa {i}", "Pola frasa"))
        items = extract_constructor_calls(txt, "y60")
        entries = []
        seen = set()
        for it in items:
            if len(it) < 4:
                continue
            en = strip_emojis(str(it[1])).strip()
            hint = strip_emojis(str(it[2])).strip()
            id_txt = strip_emojis(str(it[3])).strip()
            if en and en.lower() not in seen:
                seen.add(en.lower())
                entries.append({"en": en, "read_hint": hint, "id": id_txt})
        if entries:
            data["patterns"].append(
                {
                    "slug": slugify(f"pattern-{meta[0]}"),
                    "title": meta[0],
                    "subtitle": meta[1],
                    "cefr": "B1",
                    "items": entries,
                }
            )

    # 7. I Statements (saya)
    for i in range(1, 17):
        fp = PKG_ROOT / "saya" / f"Saya{i:02d}Activity.java"
        if not fp.exists():
            continue
        txt = fp.read_text(errors="ignore")
        items = extract_constructor_calls(txt, "y60")
        entries = []
        seen = set()
        for it in items:
            if len(it) < 4:
                continue
            en = strip_emojis(str(it[1])).strip()
            hint = strip_emojis(str(it[2])).strip()
            id_txt = strip_emojis(str(it[3])).strip()
            if en and en.lower() not in seen:
                seen.add(en.lower())
                entries.append({"en": en, "read_hint": hint, "id": id_txt})
        if entries:
            data["i_statements"].append(
                {
                    "slug": f"i-statement-{i:02d}",
                    "title": f"I Statement Bagian {i}",
                    "cefr": "A2" if i <= 8 else "B1",
                    "items": entries,
                }
            )

    return data


def extract_grammar_modules() -> list[dict[str, Any]]:
    mg_txt = (PKG_ROOT / "menu" / "MainGrammarListviewActivity.java").read_text(errors="ignore")
    t5_txt = (PKG_ROOT / ".." / ".." / ".." / "defpackage" / "t5.java")
    t5_txt = (JADX_ROOT / "defpackage" / "t5.java").read_text(errors="ignore")

    # Get ordered items in MainGrammarListviewActivity
    menu_items: list[tuple[int, str, str]] = []
    for m in re.finditer(r'new\s+zy\(\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', mg_txt):
        menu_items.append((int(m.group(1)), m.group(2), m.group(3)))

    # Parse case 6 switch in t5.java (MainGrammarListviewActivity)
    c6_start = t5_txt.find("MainGrammarListviewActivity mainGrammarListviewActivity =")
    c7_start = t5_txt.find("MainHafalanActivity mainHafalanActivity =", c6_start)
    c6_block = t5_txt[c6_start:c7_start] if c6_start != -1 and c7_start != -1 else ""
    # Note: ListView position i includes section headers! Let's map in exact sequence of non-Exercise items.
    # Actually let's extract case -> Activity class in c6_block, and match by non-KuisSantai order!
    activity_classes = re.findall(r"(\w+Activity)\.class", c6_block)
    grammar_classes = [cls for cls in activity_classes if not cls.startswith("KuisSantai")]
    non_ex_menu = [item for item in menu_items if item[1] != "Exercise"]

    def map_grammar_cefr(level_str: str) -> str:
        if "Beginner" in level_str:
            return "A1"
        if "Elementary" in level_str:
            return "A2"
        if "Pre-Intermediate" in level_str or "Intermediate" in level_str:
            return "B1"
        if "Upper" in level_str:
            return "B2"
        return "C1"

    modules: list[dict[str, Any]] = []
    for idx, (menu_item, cls_name) in enumerate(zip(non_ex_menu, grammar_classes), start=1):
        _, title, level_str = menu_item
        fp = PKG_ROOT / "inggrisgrammar" / f"{cls_name}.java"
        if not fp.exists():
            continue
        raw_html = extract_webview_html(fp.read_text(errors="ignore"))
        if not raw_html:
            continue
        html_title, md = clean_html_to_markdown(raw_html)
        modules.append(
            {
                "order": idx,
                "slug": slugify(f"grammar-{idx:02d}-{title}"),
                "title": title,
                "html_title": html_title or title,
                "apk_level": level_str,
                "cefr_level": map_grammar_cefr(level_str),
                "markdown": md,
            }
        )
    return modules


def extract_guides_and_readings() -> dict[str, Any]:
    result: dict[str, Any] = {
        "guides": [],
        "daily_talk": [],
        "conversations": [],
        "stories": [],
        "fun_facts": [],
        "movie_scenes": [],
        "daily_news": [],
        "speeches": [],
        "relatable": [],
    }

    # 1. 5 Learning Guides
    guide_specs = [
        ("cara-memulai-belajar-bahasa-inggris", "Kisah Aris: Memulai dari Nol", "TipsBelajarActivity.java", "A1"),
        ("4-kesalahan-umum-pemula", "Hindari 4 Kesalahan Umum Pemula", "KesalahanUmumActivity.java", "A1"),
        ("mastering-think-in-english", "Think in English: Berbicara Tanpa Terjemahan", "ThinkInEnglishActivity.java", "A1"),
        ("100-expressions-penting", "100 Ekspresi Penting Percakapan Sehari-hari", "QnAActivity.java", "A1"),
        ("basic-vs-advanced-casual", "Rahasia Lancar: Basic vs Advanced Casual English", "BasicVsAdvanceActivity.java", "B1"),
    ]
    for slug, label, fname, cefr in guide_specs:
        fp = PKG_ROOT / "kontenbelajar" / fname
        if fp.exists():
            raw = extract_webview_html(fp.read_text(errors="ignore"))
            if raw:
                t, md = clean_html_to_markdown(raw)
                result["guides"].append({"slug": slug, "title": t or label, "cefr": cefr, "markdown": md})

    # 2. Daily Talk (45)
    dt_menu = (PKG_ROOT / "menu" / "MainDailyTalkLIstviewActivity.java").read_text(errors="ignore")
    dt_meta = {
        int(m.group(1)) + 1: (m.group(2), m.group(3))
        for m in re.finditer(r'new\s+zy\(\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', dt_menu)
    }
    for i in range(1, 46):
        fp = PKG_ROOT / "bacadailytalk" / f"DailyTalk{i}Activity.java"
        if not fp.exists():
            continue
        raw = extract_webview_html(fp.read_text(errors="ignore"))
        if not raw:
            continue
        _, md = clean_html_to_markdown(raw)
        title, lvl = dt_meta.get(i, (f"Daily Talk {i}", "Beginner"))
        cefr = "A1" if "Beginner" in lvl else ("A2" if "Elementary" in lvl else ("B1" if "Intermediate" in lvl and "Upper" not in lvl else ("B2" if "Upper" in lvl else "C1")))
        result["daily_talk"].append(
            {
                "id": i,
                "slug": slugify(f"daily-talk-{i:02d}-{title}"),
                "title": title,
                "apk_level": lvl,
                "cefr": cefr,
                "markdown": md,
            }
        )

    # 3. Audio Conversations (17)
    conv_menu = (PKG_ROOT / "menu" / "MainPercakapanAudioActivity.java").read_text(errors="ignore")
    conv_meta = {
        int(m.group(1)): (m.group(2), m.group(3))
        for m in re.finditer(r'new\s+vv3\(\s*"(\d+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', conv_menu)
    }
    for i in range(1, 18):
        fp = PKG_ROOT / "audiopercakapan" / f"AudioPercakapanActivity{i:02d}.java"
        if not fp.exists():
            continue
        txt = fp.read_text(errors="ignore")
        turns_raw = extract_constructor_calls(txt, "wh0")
        turns = []
        for idx, t in enumerate(turns_raw):
            if len(t) < 3:
                continue
            turns.append(
                {
                    "speaker": "Pembicara A" if idx % 2 == 0 else "Pembicara B",
                    "en": strip_emojis(str(t[1])).strip(),
                    "id": strip_emojis(str(t[2])).strip(),
                }
            )
        meta = conv_meta.get(i, (f"Percakapan {i}", "Dialog sehari-hari"))
        result["conversations"].append(
            {
                "id": i,
                "slug": slugify(f"percakapan-{i:02d}-{meta[0]}"),
                "title": meta[0],
                "subtitle": meta[1],
                "cefr": "A1" if i <= 8 else "A2",
                "turns": turns,
            }
        )

    # 4. Stories (20), Fun Facts (20), Movie Scenes (20), Daily News (21), Speeches (28)
    html_groups = [
        ("stories", "MainCeritaActivity.java", "inggriscerita", "Cerita", 20, "A2"),
        ("fun_facts", "MainFaktaActivity.java", "bacafakta", "Fakta", 20, "B1"),
        ("movie_scenes", "MainMovieSceneActivity.java", "bacamovie", "Movie", 20, "B1"),
        ("daily_news", "MainNewsActivity.java", "bacanews", "News", 21, "B2"),
        ("speeches", "MainPidatoActivity.java", "inggrispidato", "Pidato", 28, "C1"),
    ]
    for key, menu_file, pkg_dir, cls_prefix, max_n, default_cefr in html_groups:
        mtxt = (PKG_ROOT / "menu" / menu_file).read_text(errors="ignore")
        meta = {
            int(m.group(1)): (m.group(2), m.group(3))
            for m in re.finditer(r'new\s+vv3\(\s*"(\d+)"\s*,\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\)', mtxt)
        }
        for i in range(1, max_n + 1):
            fp = PKG_ROOT / pkg_dir / f"{cls_prefix}{i}Activity.java"
            if not fp.exists():
                fp = PKG_ROOT / pkg_dir / f"{cls_prefix}{i:02d}Activity.java"
            if not fp.exists():
                continue
            raw = extract_webview_html(fp.read_text(errors="ignore"))
            if not raw:
                continue
            htitle, md = clean_html_to_markdown(raw)
            m_en, m_id = meta.get(i, (htitle or f"{cls_prefix} {i}", ""))
            result[key].append(
                {
                    "id": i,
                    "slug": slugify(f"{key}-{i:02d}-{m_en}"),
                    "title": m_en,
                    "subtitle": m_id,
                    "cefr": default_cefr,
                    "markdown": md,
                }
            )

    # 5. Relatable Conversation Scenarios (lu2.java)
    lu2_txt = (JADX_ROOT / "defpackage" / "lu2.java").read_text(errors="ignore")
    for idx, args in enumerate(extract_constructor_calls(lu2_txt, "ue"), start=1):
        if len(args) < 20:
            continue
        result["relatable"].append(
            {
                "id": idx,
                "slug": slugify(f"relate-{idx:02d}-{args[0]}"),
                "title": strip_emojis(str(args[0])),
                "situation": strip_emojis(str(args[1])),
                "question": strip_emojis(str(args[2])),
                "hint": strip_emojis(str(args[3])),
                "prompt_en": strip_emojis(str(args[4])),
                "prompt_id": strip_emojis(str(args[5])),
                "correct_en": strip_emojis(str(args[8])),
                "correct_id": strip_emojis(str(args[9])),
                "distractors": [strip_emojis(str(args[12])), strip_emojis(str(args[13])), strip_emojis(str(args[14]))],
                "correct_reason": strip_emojis(str(args[15])),
                "wrong_reasons": [strip_emojis(str(args[16])), strip_emojis(str(args[17])), strip_emojis(str(args[18]))],
                "tip": strip_emojis(str(args[19])),
                "cefr": "A2" if idx <= 10 else "B1",
            }
        )

    return result


def extract_quizzes(relatable: list[dict[str, Any]]) -> dict[str, Any]:
    mk_txt = (PKG_ROOT / "kuis" / "MenuKuisActivity.java").read_text(errors="ignore")
    topics = extract_string_array(mk_txt, r"public final String\[\] P\s*=")

    ujian_sets: list[dict[str, Any]] = []
    # Ujian01..37 + Ujian10 + Ujian38
    for idx in range(1, 39):
        fp = PKG_ROOT / "kuis" / f"Ujian{idx:02d}Activity.java"
        if not fp.exists():
            continue
        txt = fp.read_text(errors="ignore")
        topic = topics[idx - 1].strip() if idx - 1 < len(topics) else f"Ujian {idx}"
        questions: list[dict[str, Any]] = []
        seen_q: set[str] = set()

        if idx in (10, 38):
            prompts = extract_string_array(txt, r"public final String\[\] a0\s*=")
            opt_a = extract_string_array(txt, r"public final String\[\] b0\s*=")
            opt_b = extract_string_array(txt, r"public final String\[\] c0\s*=")
            opt_c = extract_string_array(txt, r"public final String\[\] d0\s*=")
            ans_letters = extract_string_array(txt, r"public final String\[\] f0\s*=")
            letter_idx = {"A": 0, "B": 1, "C": 2}
            for q_text, a, b, c, ans_l in zip(prompts, opt_a, opt_b, opt_c, ans_letters):
                q_clean = strip_emojis(q_text)
                if not q_clean or q_clean.lower() in seen_q:
                    continue
                seen_q.add(q_clean.lower())
                opts = [strip_emojis(a), strip_emojis(b), strip_emojis(c)]
                li = letter_idx.get(ans_l.strip().upper(), 0)
                correct = opts[li]
                questions.append(
                    {
                        "prompt": q_clean,
                        "options": opts,
                        "correct_answer": correct,
                        "explanation_id": f'Jawaban yang tepat adalah "{correct}".',
                    }
                )
        else:
            prompts = extract_string_array(txt, r"public final String\[\] Z\s*=")
            opt_a = extract_string_array(txt, r"public final String\[\] a0\s*=")
            opt_b = extract_string_array(txt, r"public final String\[\] b0\s*=")
            opt_c = extract_string_array(txt, r"public final String\[\] c0\s*=")
            opt_d = extract_string_array(txt, r"public final String\[\] d0\s*=")
            ans_letters = extract_string_array(txt, r"public final String\[\] e0\s*=")
            letter_idx = {"A": 0, "B": 1, "C": 2, "D": 3}
            for q_text, a, b, c, d, ans_l in zip(prompts, opt_a, opt_b, opt_c, opt_d, ans_letters):
                q_clean = strip_emojis(q_text)
                if not q_clean or q_clean.lower() in seen_q:
                    continue
                seen_q.add(q_clean.lower())
                opts = [strip_emojis(a), strip_emojis(b), strip_emojis(c), strip_emojis(d)]
                li = letter_idx.get(ans_l.strip().upper(), 0)
                correct = opts[li]
                questions.append(
                    {
                        "prompt": q_clean,
                        "options": opts,
                        "correct_answer": correct,
                        "explanation_id": f'Untuk topik {topic}, pilihan yang tepat melengkapi kalimat adalah "{correct}".',
                    }
                )

        cefr = "A1" if idx <= 15 else ("A2" if idx <= 23 else ("B1" if idx <= 35 else "B2"))
        ujian_sets.append(
            {
                "id": idx,
                "slug": slugify(f"ujian-{idx:02d}-{topic}"),
                "title": f"Latihan {topic}",
                "topic": topic,
                "cefr": cefr,
                "questions": questions,
            }
        )

    # KuisSantai (ur0 200 items + jm1 200 items -> 400 unique fill-in-the-blank items!)
    ks_txt = (PKG_ROOT / "kuissantai" / "KuisSantai01Activity.java").read_text(errors="ignore")
    jm1_txt = (JADX_ROOT / "defpackage" / "jm1.java").read_text(errors="ignore")

    ur0_arrays = re.search(r"new\s+ur0\((.*)\)\s*;", ks_txt, flags=re.S)
    fill_blank_questions: list[dict[str, Any]] = []
    seen_fb: set[str] = set()

    def add_fb_batch(qs: list[str], oa: list[str], ob: list[str], oc: list[str], ans: list[str], cefr: str) -> None:
        lmap = {"A": 0, "B": 1, "C": 2}
        for q, a, b, c, l in zip(qs, oa, ob, oc, ans):
            qc = strip_emojis(q)
            if not qc or qc.lower() in seen_fb:
                continue
            seen_fb.add(qc.lower())
            opts = [strip_emojis(a), strip_emojis(b), strip_emojis(c)]
            corr = opts[lmap.get(l.strip().upper(), 0)]
            fill_blank_questions.append(
                {
                    "prompt": qc,
                    "options": opts,
                    "correct_answer": corr,
                    "cefr": cefr,
                    "explanation_id": f'Bentuk kata/pola yang paling tepat mengisi bagian rumpang adalah "{corr}".',
                }
            )

    if ur0_arrays:
        # Find the 5 String[] blocks inside new ur0(...)
        block = ks_txt[ks_txt.find("new ur0(") : ks_txt.find("ArrayList arrayList = this.d0")]
        arrs = re.findall(r"new String\[\]\{([^}]+)\}", block)
        if len(arrs) == 5:
            parsed_arrs = [[str(x).strip() for x in parse_java_args(a)] for a in arrs]
            add_fb_batch(parsed_arrs[0], parsed_arrs[1], parsed_arrs[2], parsed_arrs[3], parsed_arrs[4], "A1")

    jm1_q = extract_string_array(jm1_txt, r"this\.q\s*=")
    jm1_r = extract_string_array(jm1_txt, r"this\.r\s*=")
    jm1_s = extract_string_array(jm1_txt, r"this\.s\s*=")
    jm1_t = extract_string_array(jm1_txt, r"this\.t\s*=")
    jm1_u = extract_string_array(jm1_txt, r"this\.u\s*=")
    add_fb_batch(jm1_q, jm1_r, jm1_s, jm1_t, jm1_u, "A2")

    # Vocab / Phrase / Idiom matching pairs (deduplicated)
    vocab_pairs: list[dict[str, Any]] = []
    seen_vp: set[str] = set()
    for fp in sorted((PKG_ROOT / "inggrislatihan").glob("Latihan*.java")):
        if "Hasil" in fp.name:
            continue
        txt = fp.read_text(errors="ignore")
        ens = extract_string_array(txt, r"public final String\[\] f0\s*=")
        ids = extract_string_array(txt, r"public final String\[\] g0\s*=")
        cefr = "A1" if "Elementary" not in fp.name and "Intermediate" not in fp.name and "Upper" not in fp.name else ("A2" if "Elementary" in fp.name else ("B1" if "Intermediate" in fp.name else "B2"))
        for en, id_txt in zip(ens, ids):
            enc = strip_emojis(en)
            idc = strip_emojis(id_txt)
            if enc and idc and enc.lower() not in seen_vp:
                seen_vp.add(enc.lower())
                vocab_pairs.append({"en": enc, "id": idc, "cefr": cefr, "group": fp.stem})

    # z42 phrases & Ujian40 idioms
    z42_txt = (JADX_ROOT / "defpackage" / "z42.java").read_text(errors="ignore")
    for en, id_txt in zip(extract_string_array(z42_txt, r"this\.q\s*="), extract_string_array(z42_txt, r"this\.r\s*=")):
        enc, idc = strip_emojis(en), strip_emojis(id_txt)
        if enc and idc and enc.lower() not in seen_vp:
            seen_vp.add(enc.lower())
            vocab_pairs.append({"en": enc, "id": idc, "cefr": "B1", "group": "Phrase"})

    u40_txt = (PKG_ROOT / "kuis" / "Ujian40Activity.java").read_text(errors="ignore")
    for en, id_txt in zip(extract_string_array(u40_txt, r"public final String\[\] R\s*="), extract_string_array(u40_txt, r"public final String\[\] S\s*=")):
        enc, idc = strip_emojis(en), strip_emojis(id_txt)
        if enc and idc and enc.lower() not in seen_vp:
            seen_vp.add(enc.lower())
            vocab_pairs.append({"en": enc, "id": idc, "cefr": "B2", "group": "Idiom"})

    # Relate conversation natural-response quiz
    relate_quiz = [
        {
            "prompt": f"{r['situation']} {r['question']} (\"{r['prompt_en']}\")",
            "options": [r["correct_en"]] + r["distractors"],
            "correct_answer": r["correct_en"],
            "explanation_id": f"{r['correct_reason']} Tips: {r['tip']}",
            "cefr": r["cefr"],
        }
        for r in relatable
    ]

    return {
        "ujian": ujian_sets,
        "fill_blank": fill_blank_questions,
        "vocab_match": vocab_pairs,
        "conversation_choice": relate_quiz,
    }


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    categories, words = extract_vocabulary()
    phrases = extract_phrases_and_expressions()
    grammar = extract_grammar_modules()
    readings = extract_guides_and_readings()
    quizzes = extract_quizzes(readings["relatable"])

    (OUT_DIR / "vocab_categories.json").write_text(json.dumps(categories, ensure_ascii=False, indent=2))
    (OUT_DIR / "words.json").write_text(json.dumps(words, ensure_ascii=False, indent=2))
    (OUT_DIR / "phrases.json").write_text(json.dumps(phrases, ensure_ascii=False, indent=2))
    (OUT_DIR / "grammar.json").write_text(json.dumps(grammar, ensure_ascii=False, indent=2))
    (OUT_DIR / "readings.json").write_text(json.dumps(readings, ensure_ascii=False, indent=2))
    (OUT_DIR / "quizzes.json").write_text(json.dumps(quizzes, ensure_ascii=False, indent=2))

    summary = {
        "vocab_categories": len(categories),
        "unique_words": len(words),
        "phrases": {k: sum(len(x["items"]) for x in v) for k, v in phrases.items()},
        "grammar_modules": len(grammar),
        "readings": {k: len(v) for k, v in readings.items()},
        "quizzes": {
            "ujian_sets": len(quizzes["ujian"]),
            "ujian_questions": sum(len(u["questions"]) for u in quizzes["ujian"]),
            "fill_blank": len(quizzes["fill_blank"]),
            "vocab_match_pairs": len(quizzes["vocab_match"]),
            "conversation_choice": len(quizzes["conversation_choice"]),
        },
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
