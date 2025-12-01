#!/bin/bash

# ==============================================
# 17 @ Peppertree - Server Setup Script
# ==============================================
# 
# DEPRECATED: This script is now a wrapper for vps-secure-setup.sh
# 
# The comprehensive VPS setup script (vps-secure-setup.sh) includes
# all features from this script plus enhanced security, monitoring,
# and system optimization.
#
# This wrapper is kept for backwards compatibility.
# ==============================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root or with sudo"
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     17 @ Peppertree - Server Setup (Wrapper)                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
warning "NOTICE: This script (setup-server.sh) is deprecated."
warning ""
info "This script now calls the comprehensive VPS setup script which includes:"
info "  ✓ All features from setup-server.sh"
info "  ✓ Enhanced security hardening"
info "  ✓ SSH hardening and fail2ban"
info "  ✓ Automatic security updates"
info "  ✓ System monitoring tools"
info "  ✓ Cloud backup configuration"
info "  ✓ Swap file and kernel optimization"
info "  ✓ Security audit tools"
echo ""
read -p "Continue with comprehensive VPS setup? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Setup cancelled"
    exit 0
fi

log "Starting comprehensive VPS setup..."
echo ""

# Check if vps-secure-setup.sh exists
VPS_SETUP_SCRIPT="$SCRIPT_DIR/vps-secure-setup.sh"

if [[ -f "$VPS_SETUP_SCRIPT" ]]; then
    log "Found vps-secure-setup.sh, executing..."
    bash "$VPS_SETUP_SCRIPT"
    exit $?
else
    # Download if not found locally
    warning "vps-secure-setup.sh not found locally"
    info "Downloading from GitHub..."
    
    curl -fsSL https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh -o /tmp/vps-secure-setup.sh
    
    if [[ -f /tmp/vps-secure-setup.sh ]]; then
        chmod +x /tmp/vps-secure-setup.sh
        bash /tmp/vps-secure-setup.sh
        rm /tmp/vps-secure-setup.sh
        exit $?
    else
        error "Failed to download vps-secure-setup.sh"
    fi
fi