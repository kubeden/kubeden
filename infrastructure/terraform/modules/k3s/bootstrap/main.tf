terraform {
  required_version = ">= 1.11.0"

  required_providers {
    external = {
      source  = "hashicorp/external"
      version = "~> 2.3"
    }
  }
}

locals {
  system_node_name        = "${var.cluster_name}-system"
  apps_node_name          = "${var.cluster_name}-apps"
  effective_cluster_token = var.cluster_token != null ? var.cluster_token : ""

  server_install_flags = trimspace(join(" ", compact([
    "server",
    "--node-name ${local.system_node_name}",
    "--node-ip ${var.system_private_ipv4}",
    "--advertise-address ${var.system_private_ipv4}",
    "--tls-san ${var.system_public_ipv4}",
    "--tls-san ${var.system_private_ipv4}",
    "--write-kubeconfig-mode 0644",
    "--node-label k6nis.dev/node-pool=system",
    "--node-label k6nis.dev/role=server",
    var.server_extra_args,
  ])))

  agent_install_flags = var.create_apps_node ? trimspace(join(" ", compact([
    "agent",
    "--node-name ${local.apps_node_name}",
    "--node-ip ${var.apps_private_ipv4}",
    "--node-label k6nis.dev/node-pool=applications",
    "--node-label k6nis.dev/role=agent",
    var.agent_extra_args,
  ]))) : null
}

resource "terraform_data" "system" {
  triggers_replace = [sha256(jsonencode({
    cluster_name        = var.cluster_name
    ssh_user            = var.ssh_user
    system_public_ipv4  = var.system_public_ipv4
    system_private_ipv4 = var.system_private_ipv4
    k3s_channel         = var.k3s_channel
    cluster_token       = local.effective_cluster_token
    server_extra_args   = var.server_extra_args
  }))]

  connection {
    type        = "ssh"
    user        = var.ssh_user
    host        = var.system_public_ipv4
    private_key = file(var.ssh_private_key_path)
    timeout     = var.ssh_timeout
  }

  provisioner "remote-exec" {
    inline = [<<EOT
set -eu

if ! systemctl cat k3s.service >/dev/null 2>&1; then
  curl -sfL https://get.k3s.io -o /tmp/install-k3s.sh
  chmod 700 /tmp/install-k3s.sh
  if [ -n '${local.effective_cluster_token}' ]; then
    INSTALL_K3S_CHANNEL='${var.k3s_channel}' \
    K3S_TOKEN='${local.effective_cluster_token}' \
    INSTALL_K3S_EXEC='${local.server_install_flags}' \
    sh /tmp/install-k3s.sh
  else
    INSTALL_K3S_CHANNEL='${var.k3s_channel}' \
    INSTALL_K3S_EXEC='${local.server_install_flags}' \
    sh /tmp/install-k3s.sh
  fi
else
  systemctl enable --now k3s
fi

until systemctl is-active --quiet k3s; do sleep 2; done
until [ -f /var/lib/rancher/k3s/server/node-token ]; do sleep 2; done
EOT
    ]
  }
}

data "external" "server_token" {
  depends_on = [terraform_data.system]

  program = [
    "/bin/sh",
    "-c",
    "set -eu; token=$(ssh -i \"${var.ssh_private_key_path}\" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 ${var.ssh_user}@${var.system_public_ipv4} \"cat /var/lib/rancher/k3s/server/node-token\" | tr -d '\\r\\n'); printf '{\"token\":\"%s\"}\\n' \"$token\"",
  ]
}

resource "terraform_data" "agent" {
  count = var.create_apps_node ? 1 : 0

  depends_on = [terraform_data.system]

  triggers_replace = [sha256(jsonencode({
    cluster_name        = var.cluster_name
    ssh_user            = var.ssh_user
    apps_public_ipv4    = var.apps_public_ipv4
    apps_private_ipv4   = var.apps_private_ipv4
    system_private_ipv4 = var.system_private_ipv4
    k3s_channel         = var.k3s_channel
    cluster_token       = data.external.server_token.result.token
    agent_extra_args    = var.agent_extra_args
  }))]

  connection {
    type        = "ssh"
    user        = var.ssh_user
    host        = var.apps_public_ipv4
    private_key = file(var.ssh_private_key_path)
    timeout     = var.ssh_timeout
  }

  provisioner "remote-exec" {
    inline = [<<EOT
set -eu

until curl -sk https://${var.system_private_ipv4}:6443 >/dev/null 2>&1; do sleep 2; done

if ! systemctl cat k3s-agent.service >/dev/null 2>&1; then
  curl -sfL https://get.k3s.io -o /tmp/install-k3s.sh
  chmod 700 /tmp/install-k3s.sh
  INSTALL_K3S_CHANNEL='${var.k3s_channel}' \
  K3S_URL='https://${var.system_private_ipv4}:6443' \
  K3S_TOKEN='${data.external.server_token.result.token}' \
  INSTALL_K3S_EXEC='${local.agent_install_flags}' \
  sh /tmp/install-k3s.sh
else
  systemctl enable --now k3s-agent
fi

until systemctl is-active --quiet k3s-agent; do sleep 2; done
EOT
    ]
  }
}
