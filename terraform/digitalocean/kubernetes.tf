resource "digitalocean_kubernetes_cluster" "cluster" {
  name   = "kubeden"
  region = "fra1"
  version = "1.29.0-do.0"

  node_pool {
    name       = "kubeden"
    size       = "s-1vcpu-2gb"
    node_count = 2
  }
}