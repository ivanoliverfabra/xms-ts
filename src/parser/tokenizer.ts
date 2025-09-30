export function splitTokens(input: string): string[] {
  const tokens: string[] = []
  let current = ""
  let inQuotes = false
  let escaped = false
  for (const ch of input) {
    if (escaped) {
      current += ch
      escaped = false
    } else if (ch === "\\") {
      current += ch
      escaped = true
    } else if (ch === '"') {
      current += ch
      inQuotes = !inQuotes
    } else if (ch === ";" && !inQuotes) {
      tokens.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  tokens.push(current)
  return tokens
}