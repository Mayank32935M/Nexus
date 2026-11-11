import pytest
from nexus.memory.vault import MemoryVault
from nexus.projects.service import ProjectService


def test_create_project_with_standard_templates(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    svc = ProjectService(vault)

    res = svc.create_project(
        name="alpha-omega",
        description="Core test platform",
        author="Architect",
    )

    assert res["name"] == "ALPHA-OMEGA"
    expected_files = [
        "PROJECT-OVERVIEW.md",
        "CURRENT-STATE.md",
        "ARCHITECTURE.md",
        "DECISIONS.md",
        "TASKS.md",
        "CHANGELOG.md",
    ]
    for ef in expected_files:
        assert ef in res["files_created"]
        # Verify file exists on disk
        p_file = temp_env["vault_dir"] / "PROJECTS" / "ALPHA-OMEGA" / ef
        assert p_file.exists()


def test_project_context_bundle(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    svc = ProjectService(vault)

    svc.create_project("BETA-SYSTEM", "Beta test workspace")
    context = svc.get_project_context("BETA-SYSTEM")

    assert context["project_name"] == "BETA-SYSTEM"
    assert "PROJECT-OVERVIEW.md" in context["documents"]
    assert "BETA-SYSTEM" in context["context_bundle"]
    assert "ARCHITECTURE" in context["context_bundle"]


def test_project_progress_update(temp_env):
    vault = MemoryVault(temp_env["vault_dir"])
    svc = ProjectService(vault)

    svc.create_project("GAMMA", "Gamma platform")
    
    # Update progress
    svc.update_project_progress(
        project_name="GAMMA",
        task="Implement user auth",
        status="completed",
        notes="JWT verified",
        agent="coder-agent",
    )

    # Read TASKS.md and CHANGELOG.md
    tasks_content = vault.read_file("PROJECTS/GAMMA/TASKS.md")["content"]
    assert "[x] Implement user auth" in tasks_content

    changelog_content = vault.read_file("PROJECTS/GAMMA/CHANGELOG.md")["content"]
    assert "**Implement user auth** [COMPLETED] by `coder-agent`" in changelog_content
    assert "JWT verified" in changelog_content
