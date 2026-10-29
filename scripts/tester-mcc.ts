// Tests du simulateur de moyenne (src/lib/mcc.ts) : maquette du MCC et calculs.
// Lancer : npx tsx scripts/tester-mcc.ts
import assert from "node:assert/strict";
import { MCC, anneeParDefaut, bilan, calculerSemestre, lireNote, lirePoints, moyenneComposante, noteInvalide, noteUe, uesDuSemestre } from "../src/lib/mcc";

let nombre = 0;
function test(nom: string, corps: () => void) {
  try {
    corps();
    nombre++;
    console.log(`  ok  ${nom}`);
  } catch (e) {
    console.error(`  ÉCHEC  ${nom}\n`, e);
    process.exitCode = 1;
  }
}

const proche = (reel: number | null, attendu: number) => assert.ok(reel !== null && Math.abs(reel - attendu) < 1e-9, `${reel} ≠ ${attendu}`);
const semestre = (n: number) => MCC.flatMap((a) => a.semestres).find((s) => s.numero === n)!;

// ─── Maquette ───────────────────────────────────────────────────────────────────
test("30 crédits par semestre, avec chaque option de l'enseignement au choix", () => {
  for (const s of MCC.flatMap((a) => a.semestres)) {
    const options = s.choix ? s.choix.options.map((o) => ({ [s.choix!.id]: o.id })) : [{}];
    for (const choix of options) assert.equal(uesDuSemestre(s, choix).reduce((t, u) => t + u.coef, 0), 30, `S${s.numero}`);
  }
});

test("codes uniques (ils servent de clés de saisie) et coefficients positifs", () => {
  const codes = MCC.flatMap((a) => a.semestres).flatMap((s) => [
    ...[...s.ues, ...(s.choix?.options ?? [])].flatMap((u) => [u.id, ...(u.elements ?? []).map((e) => e.id)]),
    ...s.bonus.map((b) => b.id),
  ]);
  assert.equal(new Set(codes).size, codes.length);
  for (const u of MCC.flatMap((a) => a.semestres).flatMap((s) => s.ues)) for (const e of u.elements ?? []) assert.ok(e.coef > 0);
});

// ─── Saisie ─────────────────────────────────────────────────────────────────────
test("lecture des notes", () => {
  assert.equal(lireNote("12,5"), 12.5);
  assert.equal(lireNote(" 14 "), 14);
  assert.equal(lireNote(""), null);
  assert.equal(lireNote("21"), null);
  assert.equal(lireNote("-2"), null);
  assert.ok(noteInvalide("abc"));
  assert.ok(!noteInvalide(""));
  assert.equal(lirePoints("5", 3), 3);
  assert.equal(lirePoints("", 3), 0);
});

// ─── Calculs ────────────────────────────────────────────────────────────────────
test("note d'UE pondérée par ses éléments (CM coef 3, TD coef 1)", () => {
  const isp = semestre(1).ues[0];
  proche(noteUe(isp, { DA1SSCCM: "12", DA1SSCTD: "16" }).note, 13);
  const partielle = noteUe(isp, { DA1SSCCM: "12" });
  proche(partielle.note, 12);
  assert.equal(partielle.coefSaisi, 3);
  assert.equal(partielle.complete, false);
});

test("semestre complet à 10 partout, bonus de 3 points = +0,1", () => {
  const s1 = semestre(1);
  const saisies: Record<string, string> = {};
  for (const u of s1.ues) for (const id of u.elements ? u.elements.map((e) => e.id) : [u.id]) saisies[id] = "10";
  proche(calculerSemestre(s1, saisies).moyenne, 10);
  const avecBonus = calculerSemestre(s1, { ...saisies, EAL1SPSP: "3" });
  proche(avecBonus.moyenne, 10.1);
  assert.equal(bilan([avecBonus]).necessaire, null);
});

test("moyenne nécessaire sur les coefficients restants", () => {
  // Seule « Principes d'économie » (coef 4) est saisie, à 8 : il faut (300 − 32) / 26 sur le reste.
  const r = calculerSemestre(semestre(1), { EAL1SPPE: "8" });
  proche(r.moyenne, 8);
  proche(bilan([r]).necessaire, 268 / 26);
});

test("année : compensation entre les deux semestres", () => {
  const [s1, s2] = MCC[0].semestres;
  const tout = (s: typeof s1, note: string) =>
    Object.fromEntries(s.ues.flatMap((u) => (u.elements ? u.elements.map((e) => e.id) : [u.id])).map((id) => [id, note]));
  const annee = bilan([calculerSemestre(s1, tout(s1, "8")), calculerSemestre(s2, tout(s2, "12"))]);
  proche(annee.moyenne, 10);
  assert.equal(annee.total, 60);
});

test("moyennes par composante : sans l'anglais ni les bonus", () => {
  const r = calculerSemestre(semestre(1), { DA1SHSOC: "14", EAL1SPPE: "9", DA1SANG: "20", EAL1SPSP: "3" });
  proche(moyenneComposante([r], "SCPO"), 14);
  proche(moyenneComposante([r], "ECO"), 9);
  assert.equal(moyenneComposante([calculerSemestre(semestre(1), { DA1SANG: "20" })], "ECO"), null);
});

test("enseignement au choix du S5 : seule l'option retenue compte", () => {
  const s5 = semestre(5);
  const saisies = { EAL5SPPE: "15", EAL5SPEC: "5" };
  proche(calculerSemestre(s5, saisies).moyenne, 15);
  proche(calculerSemestre(s5, saisies, { EASP3S5C: "EAL5SPEC" }).moyenne, 5);
});

test("année affichée par défaut d'après la promotion", () => {
  assert.equal(anneeParDefaut(2024, new Date("2026-10-15T12:00:00Z")), "L3");
  assert.equal(anneeParDefaut(2024, new Date("2026-07-15T12:00:00Z")), "L2");
  assert.equal(anneeParDefaut(2026, new Date("2026-09-02T12:00:00Z")), "L1");
  assert.equal(anneeParDefaut(2021, new Date("2026-10-15T12:00:00Z")), "L1");
  assert.equal(anneeParDefaut(null), "L1");
});

console.log(`\n${nombre} tests réussis.`);
