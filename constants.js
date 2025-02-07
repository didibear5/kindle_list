export const APP_ENV = process.env.APP_ENV

export const DOMAIN = {
  dev: 'http://localhost:3000',
  prod: 'https://kindle-list.vercel.app',
}[APP_ENV]

