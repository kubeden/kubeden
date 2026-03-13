data "hcloud_ssh_key" "selected" {
  for_each = toset(var.ssh_key_names)
  name     = each.value
}

resource "hcloud_server" "system" {
  name        = local.system_name
  server_type = var.system_server_type
  image       = var.server_image
  location    = var.location
  ssh_keys    = local.ssh_key_ids
  backups     = var.enable_backups

  delete_protection  = var.enable_delete_protection
  rebuild_protection = var.enable_delete_protection

  labels = merge(local.common_labels, {
    "k6nis.dev/node-pool" = "system"
    "k6nis.dev/k3s-role"  = "server"
  })

  public_net {
    ipv4_enabled = true
    ipv4         = hcloud_primary_ip.system_ipv4.id
    ipv6_enabled = var.enable_ipv6
  }

  firewall_ids = [hcloud_firewall.system.id]

  network {
    network_id = hcloud_network.cluster.id
    ip         = var.system_private_ip
    alias_ips  = []
  }

  depends_on = [hcloud_network_subnet.cluster]
}

resource "hcloud_server" "apps" {
  count = var.create_apps_node ? 1 : 0

  name        = local.apps_name
  server_type = var.apps_server_type
  image       = var.server_image
  location    = var.location
  ssh_keys    = local.ssh_key_ids
  backups     = var.enable_backups

  delete_protection  = var.enable_delete_protection
  rebuild_protection = var.enable_delete_protection

  labels = merge(local.common_labels, {
    "k6nis.dev/node-pool" = "applications"
    "k6nis.dev/k3s-role"  = "agent"
  })

  public_net {
    ipv4_enabled = true
    ipv4         = hcloud_primary_ip.apps_ipv4[0].id
    ipv6_enabled = var.enable_ipv6
  }

  firewall_ids = [hcloud_firewall.apps[0].id]

  network {
    network_id = hcloud_network.cluster.id
    ip         = var.apps_private_ip
    alias_ips  = []
  }

  depends_on = [hcloud_network_subnet.cluster]
}
