class InvalidFileError(ValueError):
    """The uploaded file can't be turned into a dataset."""


class InvalidRowError(ValueError):
    """The row values don't fit the dataset (e.g. unknown columns)."""


class DatasetNotFoundError(LookupError):
    def __init__(self) -> None:
        super().__init__("Dataset not found.")


class RowNotFoundError(LookupError):
    def __init__(self) -> None:
        super().__init__("Row not found.")
