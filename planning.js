/* Shared, cent-exact planning calculations. No database or browser side effects. */
(function(root) {
  const months = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
  const cents = n => Math.round((Number(n) + Number.EPSILON) * 100);
  function period(value) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) throw Error('Kies een geldige maand en jaar.');
    const [year, month] = value.split('-').map(Number);
    if (year < 2024 || year > 2100) throw Error('Kies een jaar tussen 2024 en 2100.');
    return year * 12 + month - 1;
  }
  function distribute(omzet, margin, start, end) {
    const first = period(start), last = period(end), count = last - first + 1;
    if (count < 1 || count > 120) throw Error('Kies een eindmaand na de startmaand, maximaal 120 maanden.');
    if (![omzet, margin].every(Number.isFinite)) throw Error('Vul geldige bedragen in.');
    const share = (total, index) => (Math.round(total * (index + 1) / count) - Math.round(total * index / count)) / 100;
    return Array.from({length: count}, (_, i) => ({
      year: Math.floor((first + i) / 12), month: months[(first + i) % 12],
      omzet: share(cents(omzet), i), margin: share(cents(margin), i)
    }));
  }
  function validate(parts, omzet, margin) {
    if (!Array.isArray(parts) || !parts.length || parts.length > 120) throw Error('Voeg een geldige maandverdeling toe.');
    const seen = new Set();
    for (const p of parts) {
      const key = `${p.year}-${p.month}`;
      if (!Number.isInteger(p.year) || p.year < 2024 || p.year > 2100 || !months.includes(p.month) || seen.has(key)) throw Error('Elke maand mag slechts één keer voorkomen.');
      if (![p.omzet, p.margin].every(Number.isFinite)) throw Error('Vul geldige bedragen in de verdeling in.');
      seen.add(key);
    }
    if (parts.reduce((s,p) => s + cents(p.omzet), 0) !== cents(omzet) || parts.reduce((s,p) => s + cents(p.margin), 0) !== cents(margin)) throw Error('De verdeelde omzet en marge moeten exact gelijk zijn aan de opdrachtbedragen.');
    return parts;
  }
  function slices(row) {
    return row.allocations?.length ? row.allocations : [{year: row.year, month: row.month, omzet: row.omzet ?? row.quantity * row.rate, margin: row.margin}];
  }
  function projectYear(row, year) {
    const parts = slices(row).filter(p => p.year === year);
    if (!parts.length) return null;
    const omzet = parts.reduce((s,p) => s + cents(p.omzet), 0) / 100;
    const margin = parts.reduce((s,p) => s + cents(p.margin), 0) / 100;
    return {...row, omzet, margin, parts, month: parts[0].month,
      gewogen_omzet: omzet * (row.chance ?? 100) / 100,
      gewogen_marge: margin * (row.chance ?? 100) / 100};
  }
  function totals(actual, forecast, year, quarterly = false) {
    const result = Array.from({length: quarterly ? 4 : 12}, (_, i) => ({label: quarterly ? `Kwartaal ${i+1}` : months[i], wo:0, wm:0, fo:0, fm:0}));
    for (const [rows, weighted] of [[actual,false],[forecast,true]]) for (const r of rows) for (const p of slices(r)) {
      if (p.year !== year || !months.includes(p.month)) continue;
      const index = months.indexOf(p.month), d = result[quarterly ? Math.floor(index/3) : index];
      const factor = weighted ? r.chance / 100 : 1;
      d[weighted ? 'fo' : 'wo'] += cents(p.omzet) * factor / 100;
      d[weighted ? 'fm' : 'wm'] += cents(p.margin) * factor / 100;
    }
    return result;
  }
  const api = {months, cents, distribute, validate, slices, projectYear, totals};
  if (typeof module !== 'undefined') module.exports = api;
  else root.Planning = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
