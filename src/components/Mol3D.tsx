import { useEffect, useRef, useState } from "react";

export type Style3D = "stick" | "sphere" | "line" | "ballstick";

export function Mol3D({ cid, style }: { cid: number | null; style: Style3D }) {
  const ref = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!cid || !ref.current) return;
    let cancelled = false;
    setMsg("Loading 3D structure…");
    (async () => {
      try {
        const res = await fetch(
          `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`,
        );
        if (!res.ok) throw new Error();
        const sdf = await res.text();
        const $3Dmol: any = await import("3dmol");
        if (cancelled || !ref.current) return;
        ref.current.innerHTML = "";
        const viewer = $3Dmol.createViewer(ref.current, { backgroundColor: "white" });
        viewer.addModel(sdf, "sdf");
        const s =
          style === "sphere" ? { sphere: {} }
          : style === "line" ? { line: {} }
          : style === "ballstick" ? { stick: { radius: 0.15 }, sphere: { scale: 0.3 } }
          : { stick: {} };
        viewer.setStyle({}, s);
        viewer.zoomTo();
        viewer.render();
        viewer.spin("y", 0.5);
        setMsg("");
      } catch {
        setMsg("3D structure not available for this molecule.");
      }
    })();
    return () => { cancelled = true; };
  }, [cid, style]);
  return (
    <div className="relative h-80 w-full">
      <div ref={ref} className="absolute inset-0" />
      {msg && <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{msg}</p>}
    </div>
  );
}
