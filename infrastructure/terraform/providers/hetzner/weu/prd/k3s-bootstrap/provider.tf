terraform {
  required_version = ">= 1.11.0"

  backend "s3" {
    bucket = "kubeden"
    key    = "infra/tf/state/weu/prd/k3s-bootstrap/terraform.tfstate"
    region = "fsn1"

    endpoints = {
      s3 = "https://fsn1.your-objectstorage.com"
    }

    use_lockfile                = true
    use_path_style              = true
    skip_credentials_validation = true
    skip_region_validation      = true
    skip_requesting_account_id  = true
    skip_metadata_api_check     = true
  }
}
