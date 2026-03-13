resource "hcloud_network" "cluster" {
  name              = "${local.name_prefix}-network"
  ip_range          = var.network_cidr
  delete_protection = var.enable_delete_protection

  labels = local.common_labels
}

resource "hcloud_network_subnet" "cluster" {
  network_id   = hcloud_network.cluster.id
  type         = "cloud"
  network_zone = var.network_zone
  ip_range     = var.subnet_cidr
}

resource "hcloud_primary_ip" "system_ipv4" {
  name          = "${local.system_name}-ipv4"
  type          = "ipv4"
  assignee_type = "server"
  location      = var.location
  auto_delete   = false

  labels = merge(local.common_labels, {
    "k6nis.dev/node-pool" = "system"
  })
}

resource "hcloud_primary_ip" "apps_ipv4" {
  count = var.create_apps_node ? 1 : 0

  name          = "${local.apps_name}-ipv4"
  type          = "ipv4"
  assignee_type = "server"
  location      = var.location
  auto_delete   = false

  labels = merge(local.common_labels, {
    "k6nis.dev/node-pool" = "applications"
  })
}

resource "hcloud_firewall" "system" {
  name = "${local.system_name}-firewall"

  labels = merge(local.common_labels, {
    "k6nis.dev/node-pool" = "system"
  })

  rule {
    description = "Allow ICMP"
    direction   = "in"
    protocol    = "icmp"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "Allow SSH from admin CIDRs"
    direction   = "in"
    protocol    = "tcp"
    port        = "22"
    source_ips  = var.admin_cidrs
  }

  rule {
    description = "Allow k3s API from admin CIDRs"
    direction   = "in"
    protocol    = "tcp"
    port        = "6443"
    source_ips  = var.admin_cidrs
  }

  rule {
    description = "Allow HTTP ingress"
    direction   = "in"
    protocol    = "tcp"
    port        = "80"
    source_ips  = var.public_ingress_cidrs
  }

  rule {
    description = "Allow HTTPS ingress"
    direction   = "in"
    protocol    = "tcp"
    port        = "443"
    source_ips  = var.public_ingress_cidrs
  }
}

resource "hcloud_firewall" "apps" {
  count = var.create_apps_node ? 1 : 0

  name = "${local.apps_name}-firewall"

  labels = merge(local.common_labels, {
    "k6nis.dev/node-pool" = "applications"
  })

  rule {
    description = "Allow ICMP"
    direction   = "in"
    protocol    = "icmp"
    source_ips  = ["0.0.0.0/0", "::/0"]
  }

  rule {
    description = "Allow SSH from admin CIDRs"
    direction   = "in"
    protocol    = "tcp"
    port        = "22"
    source_ips  = var.admin_cidrs
  }
}
