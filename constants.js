export const NODE_ENV = process.env.NODE_ENV

export const DOMAIN = {
  development: 'http://localhost:3000',
  production: 'https://kindle-list.vercel.app',
}[NODE_ENV]

