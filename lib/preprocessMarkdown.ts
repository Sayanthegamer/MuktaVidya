export function preprocessMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\\[/g, () => '$$')
    .replace(/\\\]/g, () => '$$')
    .replace(/\\\(/g, () => '$')
    .replace(/\\\)/g, () => '$');
}
