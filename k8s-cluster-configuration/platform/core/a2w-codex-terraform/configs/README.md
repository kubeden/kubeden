# A2W Codex Terraform

Self-hosted A2W-Codex-Terraform deployment for the Kubeden platform cluster.

The runtime Secret is intentionally not committed here. Generate it with `kubeseal` and add the resulting `secrets-sealed.yml` to this directory before syncing the Argo CD Application.

Terraform sandbox actions run with `A2W_SANDBOX_BACKEND=kubernetes`. Each run creates a short-lived Kubernetes Job in this namespace, mounts the shared app data PVC to the selected workspace repository, injects provider credentials through a temporary Secret, captures pod logs into A2W chat/run history, and cleans up the temporary Job resources after completion.

The sandbox runner image is configured through `A2W_SANDBOX_IMAGE`; publish both the web app image and the sandbox image before syncing this Application.
