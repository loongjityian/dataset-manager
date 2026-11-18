import pytest

from app.domain import ColumnType
from app.utils.column_types import from_text, infer


@pytest.mark.parametrize(
    ("values", "expected"),
    [
        (["true", "FALSE", None, "True"], "boolean"),
        (["1", "-20", "2.50", "-0.1", None], "number"),
        ([str(2**63 - 1), str(-(2**63))], "number"),
        (["1", str(2**63)], "text"),  # too big to store exactly
        (["001", "2"], "text"),  # leading zeros are kept
        (["+5"], "text"),
        (["1e5"], "text"),
        (["1,000"], "text"),
        ([".5"], "text"),
        (["5."], "text"),
        (["nan"], "text"),
        (["1", "0", "yes"], "text"),
        (["1", "true"], "text"),
        ([None, None], "text"),
        ([], "text"),
    ],
)
def test_infer(values: list[str | None], expected: ColumnType) -> None:
    assert infer(values) == expected


@pytest.mark.parametrize(("text", "expected"), [("10.00", 10), ("-0", 0), ("2.50", 2.5), (f"{2**63 - 1}.0", 2**63 - 1)])
def test_whole_numbers_are_stored_as_integers(text: str, expected: int | float) -> None:
    stored = from_text(text, "number")
    assert stored == expected
    assert type(stored) is type(expected)
