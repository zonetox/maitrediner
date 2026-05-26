// Minimal safe-ish markdown -> HTML for blog content.
// Supports: headings (#..######), bold **, italic *, links [t](u), images ![alt](u),
// inline code `x`, code fence ```, blockquotes >, unordered/ordered lists, paragraphs.
// Escapes raw HTML to prevent injection. Not a full CommonMark.

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s: string) {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-secondary text-gold text-[0.9em]">$1</code>');
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" class="rounded-xl my-6 w-full" />');
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" class="text-gold underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(md: string): string {
  const lines = (md ?? "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let inUl = false, inOl = false;

  const closeLists = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      closeLists();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre class="my-6 p-4 rounded-xl bg-secondary overflow-x-auto"><code class="text-xs">${escapeHtml(buf.join("\n"))}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeLists();
      const level = h[1].length;
      const sizes = ["", "text-4xl", "text-3xl", "text-2xl", "text-xl", "text-lg", "text-base"];
      out.push(`<h${level} class="font-serif ${sizes[level]} mt-10 mb-4">${inline(h[2])}</h${level}>`);
      i++; continue;
    }

    if (line.startsWith("> ")) {
      closeLists();
      out.push(`<blockquote class="border-l-2 border-gold pl-4 my-6 italic text-muted-foreground">${inline(line.slice(2))}</blockquote>`);
      i++; continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      if (!inUl) { closeLists(); out.push('<ul class="list-disc pl-6 my-4 space-y-1">'); inUl = true; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      i++; continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOl) { closeLists(); out.push('<ol class="list-decimal pl-6 my-4 space-y-1">'); inOl = true; }
      out.push(`<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>`);
      i++; continue;
    }

    if (!line.trim()) { closeLists(); i++; continue; }

    closeLists();
    // paragraph: gather until blank
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !/^(#|>|```|\s*[-*]\s+|\s*\d+\.\s+)/.test(lines[i])) {
      buf.push(lines[i]); i++;
    }
    out.push(`<p class="my-4 leading-relaxed text-foreground/90">${inline(buf.join(" "))}</p>`);
  }
  closeLists();
  return out.join("\n");
}
