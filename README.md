# CloudPipe — Automated CI/CD Pipeline for a Containerized Web App on AWS

**Domain:** Cloud Infrastructure & DevOps
**One-line pitch:** Every `git push` automatically tests the code, builds a Docker image, and deploys it to an AWS EC2 server, with no manual steps. If the app crashes, it restarts on its own.

```
Developer ──git push──▶ GitHub ──▶ GitHub Actions
                                    │ 1. Run automated tests
                                    │ 2. Build Docker image
                                    │ 3. Push image to Docker Hub
                                    │ 4. SSH into EC2 → pull → run container
                                    ▼
                    AWS EC2 (ap-south-1, Mumbai) — Security Group: 80, 22
                    └── Docker container (restart: always, HEALTHCHECK)
                                    ▲
                              Users (browser, port 80)
```

## Concepts demonstrated
| Concept | Where |
|---|---|
| Containerization | `Dockerfile` (small Alpine image, non-root user, HEALTHCHECK) |
| CI (continuous integration) | `test` job, 4 automated tests must pass |
| CD (continuous deployment) | `build` + `deploy` jobs in `.github/workflows/deploy.yml` |
| Artifact versioning | Every image tagged with the git commit SHA |
| Cloud compute & networking | EC2 instance + Security Group (ports 80, 22) |
| Linux administration | `infra/ec2-user-data.sh` bootstraps Docker |
| Self-healing | `--restart always` + `/crash` demo button |
| Monitoring / health checks | `/health` endpoint, Docker HEALTHCHECK, smoke test after deploy |
| Infrastructure as Code (optional) | `infra/terraform/` |
| Secrets management | GitHub Actions encrypted secrets (no passwords in code) |

---

## Tonight's build plan (~2–3 hours)

### Step 0 — Accounts you need (10 min)
- AWS account (Free Tier is enough)
- GitHub account
- Docker Hub account (free) → **Account Settings → Personal access tokens → Generate** (Read & Write). Copy the token.

### Step 1 — Test the app locally (optional, 5 min)
```bash
cd app
npm test         # 4 tests should pass
npm start        # open http://localhost:3000
```

### Step 2 — Launch the EC2 server (15 min)
AWS Console → region **Asia Pacific (Mumbai) ap-south-1** → EC2 → **Launch instance**
1. Name: `cloudpipe-server`
2. AMI: **Amazon Linux 2023**
3. Instance type: **t2.micro** (or t3.micro, whichever says Free tier eligible)
4. Key pair: **Create new key pair** → name `cloudpipe-key`, type RSA, format `.pem` → it downloads. Keep it safe.
5. Network settings → Edit → Security group `cloudpipe-sg`:
   - SSH, port 22, source Anywhere (0.0.0.0/0)
   - HTTP, port 80, source Anywhere (0.0.0.0/0)
6. Advanced details → **User data** → paste the contents of `infra/ec2-user-data.sh`
7. Launch. Wait ~2 minutes and copy the **Public IPv4 address**.

Check it worked (optional):
```bash
chmod 400 cloudpipe-key.pem
ssh -i cloudpipe-key.pem ec2-user@<PUBLIC_IP>
docker --version
```

> Prefer code? `cd infra/terraform && terraform init && terraform apply -var key_name=cloudpipe-key` does Step 2 for you.

### Step 3 — Push the project to GitHub (10 min)
```bash
cd cloudpipe
git init
git add .
git commit -m "CloudPipe: initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/cloudpipe.git
git push -u origin main
```
(Create the empty `cloudpipe` repo on GitHub first.) The first run will fail until secrets are added, which is expected.

### Step 4 — Add GitHub secrets (10 min)
Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | your Docker Hub username |
| `DOCKERHUB_TOKEN` | the token from Step 0 |
| `EC2_HOST` | EC2 public IP |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | the **entire contents** of `cloudpipe-key.pem`, including the BEGIN/END lines |

### Step 5 — Run the pipeline (5 min)
Repo → **Actions** → "CI/CD — Test, Build, Deploy to EC2" → **Run workflow** (or push any commit).
All 3 jobs go green → open `http://<EC2_PUBLIC_IP>` → the CloudPipe dashboard is live.

### Step 6 — Take screenshots for your report
1. EC2 instance running (console)
2. Security group inbound rules
3. GitHub Actions run with all 3 green jobs
4. Docker Hub repo showing image tags (commit SHAs)
5. Live website in the browser
6. Status card showing "Down — restarting…", then healthy again with uptime reset
7. `docker ps` output over SSH

---

## Demo script for your teacher (5 minutes)

1. **Show the live site** at `http://<EC2_IP>` and point at the version (commit ID), deploy time and container ID.
2. **Make a live change.** Edit the `<h1>` or subtitle in `app/public/index.html`, then:
   ```bash
   git commit -am "Change heading for demo" && git push
   ```
3. **Open the GitHub Actions tab** and walk through it: tests → build → deploy.
4. After ~2 minutes, **refresh the site**. The new heading, new version and new container ID are all visible. "No one logged into the server, it deployed itself."
5. **Self-healing:** click **💥 Crash the app**. The status turns red and comes back green within seconds, and uptime resets to 0. "Docker's restart policy recovered it automatically."
6. **Bonus (shows CI blocking bad code):** break a test (e.g. change `"ok"` to `"okk"` in `app/test.js`) and push. The pipeline stops at step 1 and the broken code never reaches the server. Revert afterwards.

---

## Likely viva questions
- **CI vs CD?** CI automatically tests and builds every change; CD automatically releases the tested build to a server.
- **Why Docker?** The same image runs identically on a laptop, the CI runner and EC2: "works on my machine" problems go away.
- **Why tag images with the commit SHA?** Each deployment is traceable to exact code, and rollback means re-running an older tag.
- **How is it self-healing?** `--restart always` restarts the container whenever the process exits; HEALTHCHECK reports whether the app is actually responding.
- **Where are passwords stored?** In GitHub encrypted secrets, never in the code.
- **Security weakness?** SSH is open to 0.0.0.0/0 because GitHub's runner IPs change. In production you'd use AWS SSM or a self-hosted runner instead.

## Future enhancements
- Application Load Balancer + Auto Scaling group across 2 AZs (combine with the self-healing project)
- HTTPS with ACM certificate
- Push images to Amazon ECR instead of Docker Hub
- Prometheus + Grafana monitoring
- Deploy to Kubernetes (EKS) instead of a single EC2
- Replace SSH deploy with AWS Systems Manager

## ⚠️ After the demo
Stop or terminate the EC2 instance (or `terraform destroy`) so nothing bills you later.
