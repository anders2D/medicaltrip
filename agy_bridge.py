#!/usr/bin/env python3
"""
Antigravity Universal LAN Bridge (Cross-Platform: Linux, macOS, Windows).
Zero external dependencies (pure standard Python library).

Auto-detects the local Antigravity port and exposes a transparent TCP bridge
on 0.0.0.0 so you can access Antigravity from any other computer on your local network (LAN).
"""

import sys
import os
import socket
import select
import threading
import ssl
import http.client
import struct
from typing import Optional, List

DEFAULT_LAN_PORT = 8888


def test_https_antigravity(port: int, timeout: float = 0.3) -> bool:
    """Comprueba si un socket local responde con la aplicación web de Antigravity."""
    ctx = ssl._create_unverified_context()
    conn = None
    try:
        conn = http.client.HTTPSConnection("127.0.0.1", port, context=ctx, timeout=timeout)
        conn.request("GET", "/")
        res = conn.getresponse()
        if res.status == 200:
            body = res.read(2048).decode("utf-8", errors="ignore")
            conn.close()
            return "antigravity" in body.lower()
        conn.close()
    except Exception:
        if conn:
            try:
                conn.close()
            except Exception:
                pass
    return False


def detect_antigravity_port_windows() -> Optional[int]:
    """Detector ultrarrápido en memoria para Windows usando la API Win32 Ctypes."""
    try:
        import ctypes
        from ctypes import wintypes

        TH32CS_SNAPPROCESS = 0x00000002
        AF_INET = 2
        TCP_TABLE_OWNER_PID_ALL = 5
        MIB_TCP_STATE_LISTEN = 2

        class PROCESSENTRY32(ctypes.Structure):
            _fields_ = [
                ('dwSize', wintypes.DWORD),
                ('cntUsage', wintypes.DWORD),
                ('th32ProcessID', wintypes.DWORD),
                ('th32DefaultHeapID', ctypes.c_size_t),
                ('th32ModuleID', wintypes.DWORD),
                ('cntThreads', wintypes.DWORD),
                ('th32ParentProcessID', wintypes.DWORD),
                ('pcPriClassBase', ctypes.c_long),
                ('dwFlags', wintypes.DWORD),
                ('szExeFile', ctypes.c_char * 260)
            ]

        kernel32 = ctypes.windll.kernel32
        iphlpapi = ctypes.windll.iphlpapi

        hSnapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
        if hSnapshot == wintypes.HANDLE(-1).value:
            return None

        pe = PROCESSENTRY32()
        pe.dwSize = ctypes.sizeof(PROCESSENTRY32)
        target_pids = set()

        if kernel32.Process32First(hSnapshot, ctypes.byref(pe)):
            while True:
                exe = pe.szExeFile.decode('utf-8', errors='ignore').lower()
                if exe == 'language_server.exe':
                    target_pids.add(pe.th32ProcessID)
                if not kernel32.Process32Next(hSnapshot, ctypes.byref(pe)):
                    break
        kernel32.CloseHandle(hSnapshot)

        if not target_pids:
            return None

        size = wintypes.DWORD(0)
        iphlpapi.GetExtendedTcpTable(None, ctypes.byref(size), True, AF_INET, TCP_TABLE_OWNER_PID_ALL, 0)
        buf = ctypes.create_string_buffer(size.value)
        if iphlpapi.GetExtendedTcpTable(buf, ctypes.byref(size), True, AF_INET, TCP_TABLE_OWNER_PID_ALL, 0) != 0:
            return None

        num_entries = struct.unpack('I', buf[:4])[0]
        row_size = 24
        for i in range(num_entries):
            offset = 4 + i * row_size
            state, laddr, lport, raddr, rport, pid = struct.unpack('IIIIII', buf[offset:offset + row_size])
            if state == MIB_TCP_STATE_LISTEN and pid in target_pids:
                port = socket.ntohs(lport)
                if test_https_antigravity(port):
                    return port
    except Exception:
        pass
    return None


def detect_antigravity_port_unix() -> Optional[int]:
    """Detector para Linux y macOS usando lsof, pgrep y /proc nativo."""
    import subprocess

    # 1. macOS y la gran mayoría de distribuciones Linux (lsof / pgrep)
    try:
        pids = subprocess.check_output(["pgrep", "-f", "language_server"], text=True).split()
        for pid in pids:
            out = subprocess.check_output(["lsof", "-Pan", "-p", pid, "-iTCP", "-sTCP:LISTEN"], text=True)
            for line in out.splitlines():
                if "LISTEN" in line and ":" in line:
                    parts = line.split()
                    for p in parts:
                        if ":" in p:
                            port_str = p.split(":")[-1]
                            if port_str.isdigit():
                                port = int(port_str)
                                if test_https_antigravity(port):
                                    return port
    except Exception:
        pass

    # 2. Linux nativo: parseo directo de /proc/net/tcp
    if os.path.exists("/proc/net/tcp"):
        try:
            with open("/proc/net/tcp", "r") as f:
                lines = f.readlines()[1:]
            for line in lines:
                parts = line.split()
                if len(parts) > 3 and parts[3] == "0A":  # TCP_LISTEN
                    local_addr = parts[1]
                    port_hex = local_addr.split(":")[1]
                    port = int(port_hex, 16)
                    if test_https_antigravity(port):
                        return port
        except Exception:
            pass

    # 3. macOS / Linux netstat fallback
    try:
        out = subprocess.check_output(["netstat", "-an", "-p", "tcp"], text=True)
        for line in out.splitlines():
            if "LISTEN" in line and ("127.0.0.1" in line or "*." in line):
                for token in line.split():
                    if "." in token:
                        port_str = token.split(".")[-1]
                        if port_str.isdigit() and int(port_str) > 1024:
                            port = int(port_str)
                            if test_https_antigravity(port):
                                return port
    except Exception:
        pass

    return None


def detect_port() -> Optional[int]:
    """Punto de entrada universal para detección de puerto según el SO."""
    if sys.platform == "win32":
        port = detect_antigravity_port_windows()
        if port:
            return port
    else:
        port = detect_antigravity_port_unix()
        if port:
            return port

    # Escaneo de respaldo de puertos efímeros si las APIs fallaran
    for p in range(50000, 65000):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.02)
        if sock.connect_ex(('127.0.0.1', p)) == 0:
            sock.close()
            if test_https_antigravity(p, timeout=0.1):
                return p
        else:
            sock.close()

    return None


def get_local_lan_ip() -> str:
    """Detecta la IP activa de este equipo en la red local (WiFi o Ethernet)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip


def forward_stream(src: socket.socket, dst: socket.socket):
    """Tubería TCP bidireccional transparente (no altera TLS ni WebSockets)."""
    try:
        while True:
            data = src.recv(65536)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try: src.close()
        except Exception: pass
        try: dst.close()
        except Exception: pass


def run_bridge(lan_port: int, target_port: int):
    """Abre el socket en 0.0.0.0:<lan_port> y redirige a 127.0.0.1:<target_port>."""
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    try:
        server.bind(('0.0.0.0', lan_port))
    except Exception as e:
        print(f"\n❌ Error al enlazar el puerto {lan_port}: {e}", file=sys.stderr)
        print(f"👉 Intenta con otro puerto: python agy_bridge.py <otro_puerto>\n", file=sys.stderr)
        sys.exit(1)

    server.listen(50)
    lan_ip = get_local_lan_ip()

    print("=" * 68)
    print(" 🚀 ANTIGRAVITY UNIVERSAL LAN BRIDGE (ACTIVO)")
    print("=" * 68)
    print(f" 💻 Sistema Operativo:   {sys.platform.capitalize()}")
    print(f" 🎯 Antigravity Local:   127.0.0.1:{target_port}")
    print(f" 🌐 Red Local (LAN):     0.0.0.0:{lan_port}")
    print(f" 📍 IP de este equipo:   {lan_ip}")
    print("-" * 68)
    print(" 👉 Abre en el navegador de tu computador Windows:")
    print(f"\n    👉  https://{lan_ip}:{lan_port}  👈\n")
    print(" (Presiona Ctrl+C en cualquier momento para detener el puente)")
    print("=" * 68)

    try:
        while True:
            client_sock, client_addr = server.accept()
            target_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                target_sock.connect(('127.0.0.1', target_port))
            except Exception:
                client_sock.close()
                continue

            t1 = threading.Thread(target=forward_stream, args=(client_sock, target_sock), daemon=True)
            t2 = threading.Thread(target=forward_stream, args=(target_sock, client_sock), daemon=True)
            t1.start()
            t2.start()
    except KeyboardInterrupt:
        print("\n🛑 Puente detenido por el usuario.")
    finally:
        server.close()


if __name__ == "__main__":
    lan_port = DEFAULT_LAN_PORT
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        lan_port = int(sys.argv[1])

    print("🔍 Detectando instancia activa de Antigravity...")
    target_port = detect_port()

    if not target_port:
        print("\n❌ No se encontró ninguna instancia activa de Antigravity en este equipo.", file=sys.stderr)
        print("   Asegúrate de que Antigravity esté abierto y vuelve a ejecutar este script.", file=sys.stderr)
        sys.exit(1)

    run_bridge(lan_port, target_port)
