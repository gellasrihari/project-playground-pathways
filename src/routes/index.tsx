import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mol2D } from "@/components/Mol2D";
import { Mol3D, type Style3D } from "@/components/Mol3D";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cheminformatics Virtual Lab — SMILES, 2D/3D & Properties" },
      { name: "description", content: "Explore aspirin, caffeine and paracetamol: SMILES, 2D/3D structures, molecular properties and an assessment." },
      { property: "og:title", content: "Cheminformatics Virtual Lab" },
      { property: "og:description", content: "Interactive SMILES, 2D/3D visualization and molecular property lab." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Lab,
});

const EXAMPLES = [
  { name: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O", use: "Pain reliever & anti-inflammatory" },
  { name: "Caffeine", smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C", use: "Central nervous system stimulant" },
  { name: "Paracetamol", smiles: "CC(=O)NC1=CC=C(C=C1)O", use: "Analgesic & antipyretic" },
];

type Props = {
  CID: number; MolecularFormula: string; MolecularWeight: string; XLogP?: number;
  TPSA?: number; HBondDonorCount: number; HBondAcceptorCount: number;
  RotatableBondCount: number; HeavyAtomCount: number; IUPACName?: string;
};

const FIELDS = "MolecularFormula,MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount,IUPACName";

async function fetchProps(smiles: string): Promise<Props> {
  const r = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/property/${FIELDS}/JSON`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "smiles=" + encodeURIComponent(smiles),
  });
  if (!r.ok) throw new Error("Invalid SMILES or molecule not found");
  const j = await r.json();
  return j.PropertyTable.Properties[0];
}

function lipinski(p: Props) {
  const v = [Number(p.MolecularWeight) > 500, (p.XLogP ?? 0) > 5, p.HBondDonorCount > 5, p.HBondAcceptorCount > 10].filter(Boolean).length;
  return v;
}

const QUIZ = [
  { q: "What does SMILES stand for?", o: ["Simplified Molecular Input Line Entry System", "Standard Molecule Image Layout System", "Structured Molecular Index of Linked Elements"], a: 0 },
  { q: "In SMILES, what does 'c' (lowercase) represent?", o: ["Charged carbon", "Aromatic carbon", "Chiral carbon"], a: 1 },
  { q: "Which Lipinski rule limit applies to molecular weight?", o: ["< 300 Da", "≤ 500 Da", "≤ 1000 Da"], a: 1 },
  { q: "Which of the three examples contains a purine ring?", o: ["Aspirin", "Paracetamol", "Caffeine"], a: 2 },
  { q: "TPSA is mainly used to predict…", o: ["Boiling point", "Membrane permeability", "Color"], a: 1 },
];

function Lab() {
  const [student, setStudent] = useState({ name: "", reg: "" });
  const [smiles, setSmiles] = useState(EXAMPLES[0].smiles);
  const [input, setInput] = useState(EXAMPLES[0].smiles);
  const [props, setProps] = useState<Props | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<Style3D>("ballstick");
  const [all, setAll] = useState<Record<string, Props>>({});
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setLoading(true); setErr("");
    fetchProps(smiles).then(setProps).catch((e) => { setProps(null); setErr(e.message); }).finally(() => setLoading(false));
  }, [smiles]);

  useEffect(() => {
    EXAMPLES.forEach((e) => fetchProps(e.smiles).then((p) => setAll((a) => ({ ...a, [e.name]: p }))).catch(() => {}));
  }, []);

  const score = QUIZ.filter((q, i) => answers[i] === q.a).length;

  const download = () => {
    const lines = [
      "CHEMINFORMATICS VIRTUAL LAB — REPORT",
      `Student: ${student.name || "-"}   Reg. No: ${student.reg || "-"}`,
      `Date: ${new Date().toLocaleString()}`, "",
      ...EXAMPLES.flatMap((e) => {
        const p = all[e.name];
        return p ? [
          `== ${e.name} ==`, `SMILES: ${e.smiles}`, `IUPAC: ${p.IUPACName}`, `Formula: ${p.MolecularFormula}`,
          `MW: ${p.MolecularWeight} g/mol`, `XLogP: ${p.XLogP}`, `TPSA: ${p.TPSA} Å²`,
          `HBD/HBA: ${p.HBondDonorCount}/${p.HBondAcceptorCount}`, `Rotatable bonds: ${p.RotatableBondCount}`,
          `Lipinski violations: ${lipinski(p)}`, "",
        ] : [];
      }),
      submitted ? `Assessment score: ${score}/${QUIZ.length}` : "Assessment: not submitted",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "virtual-lab-report.txt"; a.click();
  };

  const card = "rounded-xl border bg-card p-6 shadow-sm";
  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen">
      <header className="border-b bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="font-mono text-xs uppercase tracking-widest opacity-80">Division of Chemistry · Virtual Laboratory</p>
          <h1 className="mt-2 text-4xl font-semibold md:text-5xl">Cheminformatics Virtual Lab</h1>
          <p className="mt-3 max-w-2xl opacity-90">Enter a SMILES string, see the molecule in 2D and 3D, calculate its properties, compare three classic drugs, and test yourself.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className={card}>
          <h2 className="text-2xl font-semibold">1. Student information</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className={field} placeholder="Student name" value={student.name} onChange={(e) => setStudent({ ...student, name: e.target.value })} />
            <input className={field} placeholder="Registration number" value={student.reg} onChange={(e) => setStudent({ ...student, reg: e.target.value })} />
          </div>
        </section>

        <section className={card}>
          <h2 className="text-2xl font-semibold">2. Choose an example or enter SMILES</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {EXAMPLES.map((e) => (
              <button key={e.name} onClick={() => { setInput(e.smiles); setSmiles(e.smiles); }}
                className={`rounded-lg border p-4 text-left transition hover:border-primary ${smiles === e.smiles ? "border-primary bg-secondary" : "bg-background"}`}>
                <p className="font-display text-lg font-semibold">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.use}</p>
                <p className="mt-2 break-all font-mono text-xs text-primary">{e.smiles}</p>
              </button>
            ))}
          </div>
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setSmiles(input.trim()); }}>
            <input className={`${field} font-mono`} value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. CCO" />
            <button className="rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90">Analyze</button>
          </form>
          {err && <p className="mt-2 text-sm text-destructive">✗ {err}</p>}
          {props && !err && <p className="mt-2 text-sm text-success">✓ Valid structure · {props.IUPACName}</p>}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className={card}>
            <h2 className="text-2xl font-semibold">3. 2D structure</h2>
            <Mol2D smiles={smiles} />
          </div>
          <div className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">4. 3D structure</h2>
              <select className="rounded-md border bg-background px-2 py-1 text-sm" value={style} onChange={(e) => setStyle(e.target.value as Style3D)}>
                <option value="ballstick">Ball & stick</option><option value="stick">Stick</option>
                <option value="sphere">Space-filling</option><option value="line">Line</option>
              </select>
            </div>
            <Mol3D cid={props?.CID ?? null} style={style} />
          </div>
        </section>

        <section className={card}>
          <h2 className="text-2xl font-semibold">5. Molecular properties</h2>
          {loading ? <p className="mt-4 text-sm text-muted-foreground">Calculating…</p> : props && (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ["Formula", props.MolecularFormula], ["Mol. weight", `${props.MolecularWeight} g/mol`],
                ["XLogP", props.XLogP ?? "—"], ["TPSA", `${props.TPSA ?? "—"} Å²`],
                ["H-bond donors", props.HBondDonorCount], ["H-bond acceptors", props.HBondAcceptorCount],
                ["Rotatable bonds", props.RotatableBondCount], ["Lipinski violations", lipinski(props)],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-lg bg-muted p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                  <p className="font-mono text-lg">{v}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={card}>
          <h2 className="text-2xl font-semibold">6. Structure–property comparison</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-muted-foreground">
                {["Molecule", "Formula", "MW", "XLogP", "TPSA", "HBD", "HBA", "Drug-like?"].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
              </tr></thead>
              <tbody>
                {EXAMPLES.map((e) => { const p = all[e.name]; return (
                  <tr key={e.name} className="border-b font-mono">
                    <td className="py-2 pr-4 font-sans font-semibold">{e.name}</td>
                    <td className="pr-4">{p?.MolecularFormula ?? "…"}</td><td className="pr-4">{p?.MolecularWeight}</td>
                    <td className="pr-4">{p?.XLogP}</td><td className="pr-4">{p?.TPSA}</td>
                    <td className="pr-4">{p?.HBondDonorCount}</td><td className="pr-4">{p?.HBondAcceptorCount}</td>
                    <td className="text-success">{p ? (lipinski(p) === 0 ? "Yes ✓" : "No") : ""}</td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">All three obey Lipinski's Rule of Five. Caffeine has the lowest XLogP (most water-soluble); aspirin's carboxylic acid gives it the highest TPSA.</p>
        </section>

        <section className={card}>
          <h2 className="text-2xl font-semibold">7. Assessment</h2>
          <div className="mt-4 space-y-5">
            {QUIZ.map((q, i) => (
              <div key={i}>
                <p className="font-medium">{i + 1}. {q.q}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.o.map((o, j) => {
                    const chosen = answers[i] === j;
                    const state = submitted ? (j === q.a ? "border-success bg-success/10" : chosen ? "border-destructive bg-destructive/10" : "") : chosen ? "border-primary bg-secondary" : "";
                    return <button key={j} disabled={submitted} onClick={() => setAnswers({ ...answers, [i]: j })} className={`rounded-md border px-3 py-1.5 text-sm ${state}`}>{o}</button>;
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-4">
            {!submitted ? (
              <button onClick={() => setSubmitted(true)} className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground">Submit answers</button>
            ) : (
              <><p className="font-display text-xl">Score: {score}/{QUIZ.length}</p>
              <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="text-sm underline">Retry</button></>
            )}
          </div>
        </section>

        <section className={`${card} flex flex-col items-start justify-between gap-4 md:flex-row md:items-center`}>
          <div>
            <h2 className="text-2xl font-semibold">8. Final report</h2>
            <p className="text-sm text-muted-foreground">Download your details, all three molecules' properties and your score.</p>
          </div>
          <button onClick={download} className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Download report</button>
        </section>
      </main>
      <footer className="py-8 text-center text-xs text-muted-foreground">Cheminformatics Virtual Lab · Data from PubChem</footer>
    </div>
  );
}
