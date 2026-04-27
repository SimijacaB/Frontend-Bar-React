declare module 'sockjs-client' {
  const SockJS: any
  export default SockJS
}

declare module 'date-fns' {
  export function formatDistanceToNow(date: Date | number, options?: any): string
}

declare module 'date-fns/locale' {
  export const es: any
}
