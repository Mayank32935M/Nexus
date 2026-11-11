import pytest
from nexus.memory.vault import MemoryVault
from nexus.core.security import PermissionDeniedError


def test_vault_read_file(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    data = vault.read_file("CORE/SYSTEM.md")
    assert data["title"] == "NEXUS Core Test"
    assert data["category"] == "CORE"
    assert data["word_count"] > 0
    assert "version" in data["frontmatter"]


def test_vault_write_routine_file(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    doc = vault.write_file(
        "KNOWLEDGE/fastapi-patterns.md",
        "# FastAPI Patterns\nBest practices for async handlers.",
        agent="test-agent",
    )
    assert doc["title"] == "FastAPI Patterns"
    assert doc["category"] == "KNOWLEDGE"
    
    # Read back to verify persistence
    read_back = vault.read_file("KNOWLEDGE/fastapi-patterns.md")
    assert "Best practices" in read_back["content"]


def test_vault_write_governed_file_blocked(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    with pytest.raises(PermissionDeniedError):
        vault.write_file(
            "CORE/SYSTEM.md",
            "# Overwritten Core\nMalicious update.",
            agent="unauthorized-agent",
        )


def test_vault_write_governed_file_bypass_allowed(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    doc = vault.write_file(
        "CORE/SYSTEM.md",
        "# Approved Update\nLegitimate system update.",
        agent="human-admin",
        bypass_approval_check=True,
    )
    assert doc["title"] == "Approved Update"


def test_vault_list_tree(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    tree = vault.list_tree()
    dir_names = [item["name"] for item in tree if item["type"] == "directory"]
    assert "CORE" in dir_names
    assert "PROJECTS" in dir_names


def test_vault_stats(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    stats = vault.get_stats()
    assert stats["total_files"] >= 1
    assert stats["total_words"] > 0
    assert "CORE" in stats["categories"]

