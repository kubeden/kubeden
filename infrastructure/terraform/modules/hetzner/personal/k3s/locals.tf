locals {
  name_prefix = var.cluster_name

  common_labels = merge(var.labels, {
    "app.kubernetes.io/managed-by" = "terraform"
    "k6nis.dev/cluster"            = var.cluster_name
  })

  system_name = "${local.name_prefix}-system"
  apps_name   = "${local.name_prefix}-apps"

  ssh_key_ids = [for key in data.hcloud_ssh_key.selected : key.id]
}