#!/usr/bin/env python3
"""Strip the Authenticode certificate table from a PE file.

After copying node.exe, the original digital signature is no longer valid
(postject injects a blob). The OS then reports a "corrupted signature".
Removing the certificate-table directory entry cleanly marks the binary as
unsigned instead of corrupted. This avoids the warning and SmartScreen
false-positives triggered by a broken signature.
"""
import sys

def strip_cert(path: str) -> None:
    with open(path, "r+b") as f:
        data = bytearray(f.read())
    if data[:2] != b"MZ":
        print(f"skip (not MZ): {path}")
        return
    e_lfanew = int.from_bytes(data[0x3C:0x40], "little")
    if data[e_lfanew:e_lfanew + 4] != b"PE\x00\x00":
        print(f"skip (no PE): {path}")
        return
    opt = e_lfanew + 24
    magic = int.from_bytes(data[opt:opt + 2], "little")
    if magic == 0x20B:          # PE32+
        sec_off = opt + 144
    elif magic == 0x10B:        # PE32
        sec_off = opt + 128
    else:
        print(f"skip (unknown PE magic {hex(magic)}): {path}")
        return
    data[sec_off:sec_off + 8] = b"\x00\x00\x00\x00\x00\x00\x00\x00"
    with open(path, "wb") as f:
        f.write(data)
    print(f"cert table stripped: {path}")

if __name__ == "__main__":
    for p in sys.argv[1:]:
        strip_cert(p)
