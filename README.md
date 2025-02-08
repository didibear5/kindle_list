# kindle list
利用 puppeteer 抓取電子書資訊，並存入 mongoDB 做價格的追蹤。

demo: https://kindle-list.vercel.app/

## Getting Started

set the MongoDB key
```bash
// .env.local
MONGODB_URI={{DB_URI}}
MONGODB_DB={{DB_NAME}}
```

run the development server:

```bash
npm run install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
