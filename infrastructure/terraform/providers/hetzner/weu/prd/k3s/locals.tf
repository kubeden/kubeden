locals {
  cluster_name = "kubeden-weu-prd-k3s"

  location     = "nbg1"
  network_zone = "eu-central"

  network_cidr      = "10.42.0.0/16"
  subnet_cidr       = "10.42.1.0/24"
  system_private_ip = "10.42.1.10"
  apps_private_ip   = "10.42.1.20"

  create_apps_node = false

  ssh_key_names = [
    "kuberdenis-local",
  ]

  server_image       = "ubuntu-24.04"
  system_server_type = "cpx32"
  apps_server_type   = "cpx32"

  enable_ipv6              = false
  enable_backups           = false
  enable_delete_protection = false

  admin_cidrs = [
    "0.0.0.0/0",
    "::/0",
  ]

  public_ingress_cidrs = [
    "0.0.0.0/0",
    "::/0",
  ]

  labels = {
    "k6nis.dev/environment" = "prd"
    "k6nis.dev/provider"    = "hetzner"
    "k6nis.dev/region"      = "weu"
  }
}
