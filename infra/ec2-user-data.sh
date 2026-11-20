#!/bin/bash
# Paste this into "User data" when launching the EC2 instance (Amazon Linux 2023).
# It installs Docker and lets ec2-user run it without sudo.
set -e
dnf update -y
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user
echo "Docker installed $(date)" > /home/ec2-user/setup-done.txt
