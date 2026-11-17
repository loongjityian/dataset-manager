def quote(name: str) -> str:
    """Quote a table or column name so it can be written into SQL safely."""
    return '"' + name.replace('"', '""') + '"'
