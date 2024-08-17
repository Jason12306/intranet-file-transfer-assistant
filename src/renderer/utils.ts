export const progres2Display = (progress?: number) => {
  return ((progress || 0) * 100).toFixed() + '%'
}

export let inElectron = true

export const checkIfInElectron = () => {
  inElectron = window.navigator.userAgent.toLowerCase().includes('electron')
}

export const withElectron = (fn: () => any) => inElectron && fn()

export const getUrlQueryParams = (key: string) =>
  new URLSearchParams(location.search).get(key) || ''
