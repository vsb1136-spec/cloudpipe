output "public_ip" {
  value = aws_instance.cloudpipe.public_ip
}

output "app_url" {
  value = "http://${aws_instance.cloudpipe.public_ip}"
}
