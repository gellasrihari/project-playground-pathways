import { useEffect, useRef } from "react";

export function Mol2D({ smiles, dark = false }: { smiles: string; dark?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    let cancelled = false;
    import("smiles-drawer").then((mod: any) => {
      const SD = mod.default ?? mod;
      if (cancelled || !ref.current) return;
      ref.current.innerHTML = "";
      const drawer = new SD.SvgDrawer({ width: 420, height: 320 });
      SD.parse(
        smiles,
        (tree: any) => drawer.draw(tree, ref.current, dark ? "dark" : "light"),
        () => {},
      );
    });
    return () => { cancelled = true; };
  }, [smiles, dark]);
  return <svg ref={ref} className="h-80 w-full" viewBox="0 0 420 320" />;
}
