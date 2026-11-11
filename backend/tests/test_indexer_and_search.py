from nexus.memory.vault import MemoryVault
from nexus.memory.indexer import VaultIndexer
from nexus.memory.search import MemorySearchEngine


def test_indexer_and_search_full_cycle(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    indexer = VaultIndexer(vault, temp_env["db_path"])
    search_eng = MemorySearchEngine(temp_env["db_path"])

    # Add a knowledge document
    vault.write_file(
        "KNOWLEDGE/distributed_consensus.md",
        "---\ntitle: Distributed Consensus Guide\ntags: [raft, paxos, consensus]\n---\n# Distributed Consensus\nRaft algorithm provides reliable leader election and log replication.",
        agent="researcher",
    )

    # Sync
    count = indexer.sync_vault()
    assert count >= 2  # CORE/SYSTEM.md + KNOWLEDGE/distributed_consensus.md

    # Search by keyword
    hits = search_eng.search("leader election")
    assert len(hits) > 0
    assert hits[0]["title"] == "Distributed Consensus Guide"
    assert "consensus" in hits[0]["path"].lower()

    # Search with category filter
    hits_core = search_eng.search("system", category="CORE")
    assert len(hits_core) > 0
    assert hits_core[0]["category"] == "CORE"

    # Search with category filter that has no matches
    hits_empty = search_eng.search("system", category="DECISIONS")
    assert len(hits_empty) == 0


def test_indexer_removes_deleted_files(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    indexer = VaultIndexer(vault, temp_env["db_path"])
    search_eng = MemorySearchEngine(temp_env["db_path"])

    # Create and index
    doc = vault.write_file(
        "KNOWLEDGE/temporary_note.md",
        "# Temporary Note\nTransient data to be deleted.",
    )
    indexer.index_single_file("KNOWLEDGE/temporary_note.md")
    assert len(search_eng.search("Transient data")) == 1

    # Delete from filesystem
    (temp_env["vault_dir"] / "KNOWLEDGE" / "temporary_note.md").unlink()

    # Resync
    indexer.sync_vault()
    assert len(search_eng.search("Transient data")) == 0

