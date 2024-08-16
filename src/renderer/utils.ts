export const progres2Display = (progress?: number) => {
  return ((progress || 0) * 100).toFixed() + '%'
}
