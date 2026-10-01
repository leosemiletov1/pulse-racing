"""
Export the car from Onshape and save it as a web-ready .glb file.

Usage (from this tools/ folder):

    py export_from_onshape.py
    py export_from_onshape.py --url "https://cad.onshape.com/documents/<did>/w/<wid>/e/<eid>"
    py export_from_onshape.py --quality medium
    py export_from_onshape.py --from-file some_export.gltf     (convert only, no API calls)

Needs the environment variables ONSHAPE_ACCESS_KEY and ONSHAPE_SECRET_KEY.
A Part Studio export uses 2 Onshape API calls (1 to check the element type, 1 to download).
An Assembly uses 2 + 1 per Part Studio it contains (the E23 car + helmet = 4 calls).
Every call is appended to onshape_api_calls.log so you can track your quota.

Part names and colours from Onshape are kept in the .glb, so config/render.js
can restyle parts by name (e.g. "wheel*").
"""
import argparse, base64, datetime, json, os, re, struct, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
# Assembly 2: the E23 car + helmet. (The E23 Part Studio alone is .../e/0c5b0ccc95871b117580b6ec)
DEFAULT_URL = "https://cad.onshape.com/documents/685a30b0b14ab60ce9252a13/w/c521f0109c22e5f86f019f8c/e/79011d0f6c898b3238fb3b7d"
DEFAULT_PART_QUALITY = {"Solid1": "coarse"}  # the helmet: tiny but very detailed, so keep it light
DEFAULT_OUT = HERE.parent / "assets" / "car.glb"
LOG = HERE / "onshape_api_calls.log"

# Tessellation settings: smaller tolerances = smoother curves but a bigger file.
QUALITY = {
    "coarse": {"chordTolerance": 0.0002, "angleTolerance": 0.2},
    "medium": {"chordTolerance": 0.0001, "angleTolerance": 0.1},
    "fine": {"chordTolerance": 0.00005, "angleTolerance": 0.06},  # ~5.6 MB for the E23 car
}


# ---------------------------------------------------------------- Onshape API
def api(path, accept="application/json"):
    try:
        ak, sk = os.environ["ONSHAPE_ACCESS_KEY"], os.environ["ONSHAPE_SECRET_KEY"]
    except KeyError:
        sys.exit("Set ONSHAPE_ACCESS_KEY and ONSHAPE_SECRET_KEY first (Onshape > My account > Developer > API keys).")
    req = urllib.request.Request("https://cad.onshape.com" + path)
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{ak}:{sk}".encode()).decode())
    req.add_header("Accept", accept)
    with LOG.open("a") as f:
        f.write(f"{datetime.datetime.now().isoformat(timespec='seconds')}  GET {path}\n")
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Onshape returned HTTP {e.code}: {e.read()[:500]!r}")


def parse_url(url):
    m = re.search(r"documents/([0-9a-f]{24})/([wvm])/([0-9a-f]{24})/e/([0-9a-f]{24})", url)
    if not m:
        sys.exit("Couldn't read that Onshape URL. It should look like .../documents/<id>/w/<id>/e/<id>")
    return m.groups()


def download_gltf(url, quality, part_quality=None):
    did, wvm, wvmid, eid = parse_url(url)
    els = json.loads(api(f"/api/v10/documents/d/{did}/{wvm}/{wvmid}/elements?elementId={eid}"))
    kind = els[0]["elementType"] if els else "PARTSTUDIO"
    print(f"Element: {els[0]['name'] if els else eid} ({kind})")
    if kind == "PARTSTUDIO":
        return studio_gltf(did, wvm, wvmid, eid, quality)
    if kind == "ASSEMBLY":
        return assembly_gltf(did, wvm, wvmid, eid, quality, part_quality)
    sys.exit(f"Element type {kind} can't be exported as 3D. Link a Part Studio or Assembly tab.")


def studio_gltf(did, wvm, wvmid, eid, quality, configuration=None):
    q = QUALITY[quality]
    qs = f"outputFaceAppearances=true&chordTolerance={q['chordTolerance']}&angleTolerance={q['angleTolerance']}"
    if configuration and configuration != "default":
        qs += "&configuration=" + urllib.parse.quote(configuration)
    return json.loads(api(f"/api/v10/partstudios/d/{did}/{wvm}/{wvmid}/e/{eid}/gltf?{qs}", accept="model/gltf+json"))


def assembly_gltf(did, wvm, wvmid, eid, quality, part_quality=None):
    """Onshape's own assembly glTF export ignores the quality settings and comes out
    very coarse. Instead: read where every part sits in the assembly, export each
    Part Studio it uses at full quality, and place the parts ourselves.
    Costs 1 call + 1 per Part Studio used."""
    a = json.loads(api(f"/api/v10/assemblies/d/{did}/{wvm}/{wvmid}/e/{eid}?includeMateFeatures=false"))
    insts = {i["id"]: i for i in a["rootAssembly"]["instances"]}
    for sub in a.get("subAssemblies", []):
        insts.update({i["id"]: i for i in sub["instances"]})

    out = {"asset": {"version": "2.0"}, "scene": 0, "scenes": [{"nodes": []}],
           "nodes": [], "meshes": [], "accessors": [], "bufferViews": [], "materials": []}
    blob = bytearray()
    studios = {}  # (document, version, element, configuration) -> {partId: (mesh index, part name)}
    for occ in a["rootAssembly"]["occurrences"]:
        inst = insts.get(occ["path"][-1])
        if not inst or inst.get("type") != "Part" or occ.get("hidden") or inst.get("suppressed"):
            continue
        key = (inst["documentId"], inst.get("documentMicroversion") or inst.get("documentVersion"),
               inst["elementId"], inst.get("configuration", "default"))
        if key not in studios:
            if inst.get("documentMicroversion"):
                where = ("m", inst["documentMicroversion"])
            elif inst.get("documentVersion"):
                where = ("v", inst["documentVersion"])
            else:
                where = (wvm, wvmid)
            name = re.sub(r" <\d+>$", "", inst.get("name", ""))
            q = (part_quality or {}).get(name, quality)
            g = studio_gltf(inst["documentId"], *where, inst["elementId"], q, inst.get("configuration"))
            studios[key] = _merge_meshes(out, blob, g)
        part = studios[key].get(inst["partId"])
        if not part:
            print(f"  skipped {inst.get('name')}: part not found in its Part Studio export")
            continue
        mesh, name = part
        t = occ["transform"]  # row-major 4x4, metres; glTF wants column-major
        out["nodes"].append({"name": name, "mesh": mesh, "matrix": [t[r * 4 + c] for c in range(4) for r in range(4)]})
        out["scenes"][0]["nodes"].append(len(out["nodes"]) - 1)
    out["buffers"] = [{"byteLength": len(blob), "uri": "data:application/octet-stream;base64," + base64.b64encode(bytes(blob)).decode()}]
    return out


def _merge_meshes(out, blob, g):
    """Append one Part Studio glTF's meshes into `out`. Returns {partId: (mesh index, part name)}."""
    starts = []
    for b in g["buffers"]:
        blob.extend(b"\0" * ((-len(blob)) % 4))
        starts.append(len(blob))
        blob.extend(base64.b64decode(b["uri"].split(",", 1)[1]))
    bv0, acc0, mat0, mesh0 = len(out["bufferViews"]), len(out["accessors"]), len(out["materials"]), len(out["meshes"])
    for bv in g["bufferViews"]:
        out["bufferViews"].append({**bv, "buffer": 0, "byteOffset": bv.get("byteOffset", 0) + starts[bv["buffer"]]})
    for acc in g["accessors"]:
        out["accessors"].append({**acc, "bufferView": acc["bufferView"] + bv0})
    out["materials"].extend(g.get("materials", []))
    for m in g["meshes"]:
        prims = []
        for p in m["primitives"]:
            p = {**p, "attributes": {k: v + acc0 for k, v in p["attributes"].items()}}
            if "indices" in p:
                p["indices"] += acc0
            if "material" in p:
                p["material"] += mat0
            prims.append(p)
        out["meshes"].append({**m, "primitives": prims})
    parts = {}
    for n in g["nodes"]:
        if "mesh" in n:
            pid = n.get("extensions", {}).get("PTC_onshape_metadata", {}).get("id", [None])[0]
            parts[pid] = (n["mesh"] + mesh0, n.get("name"))
    return parts


# ---------------------------------------------------------------- glTF -> GLB
def to_glb(gltf):
    """Pack a glTF with base64 data-URI buffers into a single binary .glb."""
    blobs, offset = [], 0
    for b in gltf["buffers"]:
        uri = b.pop("uri")
        data = base64.b64decode(uri.split(",", 1)[1])
        blobs.append(data)
        pad = (-len(data)) % 4
        blobs.append(b"\0" * pad)
        b["_offset"] = offset
        offset += len(data) + pad
    # Merge all buffers into buffer 0 (GLB allows one binary chunk).
    starts = [b.pop("_offset") for b in gltf["buffers"]]
    for bv in gltf["bufferViews"]:
        bv["byteOffset"] = bv.get("byteOffset", 0) + starts[bv["buffer"]]
        bv["buffer"] = 0
    gltf["buffers"] = [{"byteLength": offset}]
    gltf.setdefault("asset", {})["generator"] = "export_from_onshape.py"

    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * ((-len(js)) % 4)
    binary = b"".join(blobs)
    total = 12 + 8 + len(js) + 8 + len(binary)
    return (struct.pack("<III", 0x46546C67, 2, total)
            + struct.pack("<II", len(js), 0x4E4F534A) + js
            + struct.pack("<II", len(binary), 0x004E4942) + binary)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", default=DEFAULT_URL, help="Onshape Part Studio / Assembly URL")
    ap.add_argument("--quality", choices=QUALITY, default="fine")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--from-file", help="convert an existing .gltf instead of downloading")
    ap.add_argument("--part-quality", action="append", default=[], metavar="PART=LEVEL",
                    help="assemblies only: e.g. --part-quality Solid1=coarse keeps small detailed parts light")
    args = ap.parse_args()

    part_quality = {**DEFAULT_PART_QUALITY, **dict(pq.split("=", 1) for pq in args.part_quality)}
    gltf = json.loads(Path(args.from_file).read_text()) if args.from_file else download_gltf(args.url, args.quality, part_quality)
    parts = [n.get("name") for n in gltf.get("nodes", []) if "mesh" in n]
    tris = sum(gltf["accessors"][p["indices"]]["count"] // 3 for m in gltf["meshes"] for p in m["primitives"])
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(to_glb(gltf))
    # The website's loading bar reads the true file size from here (hosts send the file compressed).
    info = {"bytes": out.stat().st_size, "triangles": tris, "parts": parts,
            "exported": datetime.datetime.now().isoformat(timespec="seconds"),
            "source": None if args.from_file else args.url}
    out.with_name(out.stem + ".info.json").write_text(json.dumps(info, indent=1))
    print(f"Saved {out} ({out.stat().st_size / 1e6:.1f} MB, {tris:,} triangles)")
    print("Parts:", ", ".join(parts))


if __name__ == "__main__":
    main()
