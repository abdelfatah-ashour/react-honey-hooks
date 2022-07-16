export function messageError(error: any): string {
  return `Honey Hook Error: ${error.name}: ${error.message}`
}
