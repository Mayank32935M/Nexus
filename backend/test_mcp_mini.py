import asyncio
from mcp.server.mcpserver import MCPServer

server = MCPServer(name="nexus-mcp-test")

@server.tool()
def add_numbers(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

async def main():
    tools = await server.list_tools()
    print("Registered tools:", [t.name for t in tools])

if __name__ == "__main__":
    asyncio.run(main())
