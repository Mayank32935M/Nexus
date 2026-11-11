from nexus.memory.vault import MemoryVault
from nexus.memory.approvals import ApprovalEngine


def test_propose_and_approve_workflow(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    engine = ApprovalEngine(vault, temp_env["db_path"])

    original = vault.read_file("CORE/SYSTEM.md")["content"]
    proposed_update = original + "\n\n## Extension Directive\nApproved by human oversight."

    # 1. Propose
    proposal = engine.propose_update(
        file_path="CORE/SYSTEM.md",
        proposed_content=proposed_update,
        reason="Adding extension directive to core.",
        agent="claude-mcp",
    )

    assert proposal["status"] == "PENDING"
    assert "diff" in proposal
    assert "+## Extension Directive" in proposal["diff"]
    p_id = proposal["id"]

    # 2. List pending
    pending = engine.list_approvals(status="PENDING")
    assert any(p["id"] == p_id for p in pending)

    # 3. Approve
    approved = engine.approve(p_id, reviewer="Admin-User")
    assert approved["status"] == "APPROVED"
    assert approved["reviewed_by"] == "Admin-User"

    # 4. Verify disk change
    updated_file = vault.read_file("CORE/SYSTEM.md")
    assert "## Extension Directive" in updated_file["content"]


def test_reject_proposal_workflow(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    engine = ApprovalEngine(vault, temp_env["db_path"])

    original = vault.read_file("CORE/SYSTEM.md")["content"]
    malicious = "# Hacked System Core\nComplete wipe."

    proposal = engine.propose_update(
        file_path="CORE/SYSTEM.md",
        proposed_content=malicious,
        reason="Malicious attempt",
        agent="rogue-agent",
    )
    p_id = proposal["id"]

    # Reject
    rejected = engine.reject(p_id, reviewer="Admin-User", reason="Security policy violation")
    assert rejected["status"] == "REJECTED"

    # Verify original file untouched
    current = vault.read_file("CORE/SYSTEM.md")["content"]
    assert current == original
    assert "Hacked" not in current

