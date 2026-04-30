# CloudBase 部署

推荐走 CloudBase 云托管，保留当前 Next.js SSR、`app/api/*` 和服务端 AI 调用能力。

## 部署前

1. 按 [.env.example](/Users/libaixin/Desktop/ai-game/.env.example) 配好环境变量。
2. 本地先运行 `npm run check:deploy`。
3. 代码仓库保留根目录 `Dockerfile` 和 `scf_bootstrap`。

## CloudBase

1. 在 CloudBase 云托管创建服务，代码来源选 GitHub 或本地代码包。
2. 端口填 `3000`。
3. 运行环境使用 Node 18.18+，推荐 Node 20。
4. 如果当前环境要求根目录启动脚本，使用 `scf_bootstrap` 作为入口。
5. 把 `.env.example` 里的服务端环境变量填入 CloudBase 环境配置。
6. 首次上线建议先用二级域名验证，再接自定义域名、备案和 CDN。
