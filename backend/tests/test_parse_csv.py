import pytest

from app.exceptions import InvalidFileError
from app.services.datasets import parse_csv


def test_parses_header_and_rows() -> None:
    content = b'\xef\xbb\xbfid,city\n\n1,"Kuala Lumpur, MY"\n2,\n'  # BOM, blank line, quoted comma

    columns, rows = parse_csv(content, ",")

    assert columns == ["id", "city"]
    assert rows == [["1", "Kuala Lumpur, MY"], ["2", None]]


def test_skips_leading_blank_lines() -> None:
    assert parse_csv(b"\n\nid\n1\n", ",") == (["id"], [["1"]])


def test_semicolon_delimiter() -> None:
    assert parse_csv(b"id;amount\n1;10,5\n", ";") == (["id", "amount"], [["1", "10,5"]])


def test_quoted_single_column_with_other_delimiter_is_allowed() -> None:
    assert parse_csv(b'"a, b"\n"1, 2"\n', ";") == (["a, b"], [["1, 2"]])


def test_header_only_gives_no_rows() -> None:
    assert parse_csv(b"id,name\n", ",") == (["id", "name"], [])


def test_preserves_multiline_quotes_unicode_and_all_null_rows() -> None:
    content = 'name,note\r\nZoë,"first\r\nsecond ""quoted"""\r\n,\r\n\r\n'.encode()
    assert parse_csv(content, ",") == (
        ["name", "note"], [["Zoë", 'first\r\nsecond "quoted"'], [None, None]],
    )


def test_accepts_cells_over_default_csv_field_limit() -> None:
    value = "x" * 131073
    assert parse_csv(f"note\n{value}\n".encode(), ",") == (["note"], [[value]])


@pytest.mark.parametrize(
    ("content", "error"),
    [
        (b"name\nJos\xe9\n", "not UTF-8"),
        (b"", "empty"),
        (b"\n\n", "empty"),
        (b"a,b\n1,2\n3\n", "Line 3 has 1 values, but the header has 2 columns"),
        (b'a,b\n1,2\n"Alice,1\nBob,2\n', "row starting on line 3"),  # unclosed quote
        (b'name\n"Alice"extra\n', "row starting on line 2"),  # text after closing quote
        (b'\n\n"a"x,b\n', "row starting on line 3"),  # bad header after blank lines
        (b"a;b\n1;2\n", "separated by ';'"),  # wrong delimiter chosen
        (b"a;b\n1,5;2\n", "separated by ';'"),  # wrong delimiter, data has the chosen one
        (b"a,,c\n", "no name for column 2"),
        (b"_id,name\n", "'_id'"),
        (b"Name,name,x\n", "duplicate column names: Name, name"),
        (",".join(f"c{i}" for i in range(2000)).encode(), "maximum is 1999"),
    ],
)
def test_rejects_invalid_files(content: bytes, error: str) -> None:
    with pytest.raises(InvalidFileError, match=error):
        parse_csv(content, ",")
