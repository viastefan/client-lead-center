export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function htmlFromText(text: string, kicker = "Stefan Dirnberger"): string {
  const paragraphs = escapeHtml(text)
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;line-height:1.55;font-size:15px">${block.replaceAll("\n", "<br/>")}</p>`,
    )
    .join("");

  return `<!doctype html>
<html lang="de">
  <body style="margin:0;background:#0c0c0d;color:#ececee;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:28px 16px">
      <p style="margin:0 0 16px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a8a90">${escapeHtml(kicker)}</p>
      <div style="background:#141416;border:1px solid #232326;border-radius:10px;padding:24px">
        ${paragraphs}
      </div>
    </div>
  </body>
</html>`;
}
