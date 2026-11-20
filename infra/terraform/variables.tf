variable "region" {
  default = "ap-south-1" # Mumbai
}

variable "instance_type" {
  default = "t2.micro" # Free Tier (use t3.micro if t2 isn't offered in your account)
}

variable "key_name" {
  description = "Name of an existing EC2 key pair in this region"
  type        = string
}
