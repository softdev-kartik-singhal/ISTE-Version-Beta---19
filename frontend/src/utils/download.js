// Browser download helpers used by the Export buttons (CSV for tables, JSON for proofs, HTML for the full report).

function saveFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// rows: array of plain objects; the first object's keys become the header row.
export function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))];
  saveFile(filename, lines.join('\n'), 'text/csv');
}

export function downloadJson(filename, data) {
  saveFile(filename, JSON.stringify(data, null, 2), 'application/json');
}

export function downloadHtml(filename, html) {
  saveFile(filename, html, 'text/html');
}
