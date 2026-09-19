#!/usr/bin/env python3
"""
Servidor MCP básico sobre stdio compatible con el estándar Model Context Protocol JSON-RPC 2.0.
"""

import sys
import json
from typing import Dict, Any

TOOLS_REGISTRY = {
    "echo_ping": {
        "description": "Comprueba conectividad con el servidor MCP.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "Texto a reflejar"}
            },
            "required": ["message"]
        }
    }
}

def handle_request(req: Dict[str, Any]) -> Dict[str, Any]:
    req_id = req.get("id")
    method = req.get("method")
    params = req.get("params", {})

    if method == "tools/list":
        tools_list = []
        for name, meta in TOOLS_REGISTRY.items():
            tools_list.append({
                "name": name,
                "description": meta["description"],
                "inputSchema": meta["inputSchema"]
            })
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": tools_list}}

    elif method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})
        if tool_name == "echo_ping":
            msg = args.get("message", "pong")
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [{"type": "text", "text": f"MCP Echo: {msg}"}],
                    "isError": False
                }
            }
        else:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Herramienta desconocida: {tool_name}"}
            }

    elif method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "skill-mcp-server", "version": "1.0.0"}
            }
        }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Método no soportado: {method}"}
    }

def main():
    for line in sys.stdin:
        line_str = line.strip()
        if not line_str:
            continue
        try:
            req = json.loads(line_str)
            resp = handle_request(req)
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {e}"}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
