from nexus.memory.vault import MemoryVault
from nexus.handoff.generator import HandoffGenerator


def test_generate_and_list_handoffs(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    generator = HandoffGenerator(vault, temp_env["db_path"])

    result = generator.generate_handoff(
        session_title="Backend Scaffold Completion",
        target_model="Claude Desktop",
        current_goal="Deliver foundational memory vault and security boundaries",
        completed_work=[
            "Implemented MemoryVault with path safety",
            "Implemented FTS5 Indexer",
            "Implemented ApprovalEngine for governance",
        ],
        decisions_made=["Adopted Dual-Store Markdown + SQLite"],
        next_steps=["Build React frontend command centre", "Integrate MCP Server"],
        project_name="NEXUS",
        agent="Lead-Architect",
    )

    assert result["session_id"] is not None
    assert "AI-HANDOFF/" in result["file_path"]

    # Verify file saved in vault
    file_info = vault.read_file(result["file_path"])
    assert "Backend Scaffold Completion" in file_info["content"]
    assert "Adopted Dual-Store" in file_info["content"]
    assert "**Target Model**: `Claude Desktop`" in file_info["content"]

    # Verify session listed in DB
    sessions = generator.list_sessions()
    assert len(sessions) > 0
    assert sessions[0]["title"] == "Backend Scaffold Completion"
    assert sessions[0]["target_model"] == "Claude Desktop"
