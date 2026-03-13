module "k3s" {
  source = "../../../../../modules/hetzner/personal/k3s"

  cluster_name             = local.cluster_name
  location                 = local.location
  network_zone             = local.network_zone
  network_cidr             = local.network_cidr
  subnet_cidr              = local.subnet_cidr
  system_private_ip        = local.system_private_ip
  apps_private_ip          = local.apps_private_ip
  create_apps_node         = local.create_apps_node
  ssh_key_names            = local.ssh_key_names
  server_image             = local.server_image
  system_server_type       = local.system_server_type
  apps_server_type         = local.apps_server_type
  enable_ipv6              = local.enable_ipv6
  enable_backups           = local.enable_backups
  enable_delete_protection = local.enable_delete_protection
  admin_cidrs              = local.admin_cidrs
  public_ingress_cidrs     = local.public_ingress_cidrs
  labels                   = local.labels
}
