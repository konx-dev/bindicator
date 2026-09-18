# Deployment & GitOps Guide

This document outlines containerization, homelab deployment, and GitOps workflows for Bindicator.

---

## 1. Deployment Topology

Bindicator is packaged as a single, lightweight Docker container:
- **Hono Backend:** Serves the `/api/v1/*` JSON endpoints and `/api/v1/calendar.ics` feed.
- **Static Frontend:** Serves the compiled React Vite production bundle under root `/`.
- **Database:** Embedded SQLite file stored on a persistent volume mount (`/data/bindicator.db`).

```text
               Internet / Local LAN
                        │
                        ▼
               Reverse Proxy / Ingress
              (Traefik / Nginx / Cloudflare)
                        │
                        ▼
         ┌──────────────────────────────┐
         │     Bindicator Container     │
         │                              │
         │  Port 3000                   │
         │  ├── /api/v1/*  (Hono)       │
         │  ├── /*         (Static Web) │
         │  └── SQLite     (/data/*.db) │
         └──────────────┬───────────────┘
                        │ (mount)
                        ▼
         ┌──────────────────────────────┐
         │   Persistent Volume Claim    │
         │   (/data)                    │
         └──────────────────────────────┘
```

---

## 2. Dockerfile Strategy (Multi-stage)

```dockerfile
# Stage 1: Build packages and applications
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/
COPY api/ ./api/
COPY web/ ./web/
RUN pnpm install --frozen-lockfile
RUN pnpm -r build

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/package.json
COPY api/package.json ./api/package.json
RUN pnpm install --prod --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/web/dist ./api/public
COPY data/ ./data/

VOLUME ["/data"]
EXPOSE 3000
CMD ["node", "api/dist/index.js"]
```

---

## 3. Kubernetes / k3s Manifests (GitOps Ready)

For deployment via ArgoCD or Flux in a homelab k3s cluster:

### PersistentVolumeClaim
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: bindicator-data
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 500Mi
```

### Deployment & Service
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bindicator
  namespace: default
spec:
  replicas: 1
  strategy:
    type: Recreate # Required for single SQLite volume write lock
  selector:
    matchLabels:
      app: bindicator
  template:
    metadata:
      labels:
        app: bindicator
    spec:
      containers:
        - name: bindicator
          image: ghcr.io/olivercox/bindicator:latest
          ports:
            - containerPort: 3000
          env:
            - name: PORT
              value: "3000"
            - name: DATABASE_PATH
              value: "/data/bindicator.db"
          volumeMounts:
            - name: data
              mountPath: "/data"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 30
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: bindicator-data
---
apiVersion: v1
kind: Service
metadata:
  name: bindicator
  namespace: default
spec:
  selector:
    app: bindicator
  ports:
    - port: 80
      targetPort: 3000
```

---

## 4. Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port for Hono web server |
| `DATABASE_PATH` | `./bindicator.db` | Filepath to SQLite database |
| `NODE_ENV` | `production` | Runtime mode |
| `PUBLIC_URL` | `http://localhost:3000` | Base URL used when generating calendar `.ics` subscribe links |
