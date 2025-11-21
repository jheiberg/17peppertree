# VPS Setup Script - Quick Access Methods

**Document Version:** 1.0  
**Last Updated:** 2025-11-21

---

## Problem

The VPS setup script is in the Git repository, but downloading it on a fresh VPS requires:
- Git installation
- SSH key exchange
- Repository cloning

This is a chicken-and-egg problem for initial setup.

---

## Solution: Multiple Access Methods

### Method 1: Direct Download (Raw GitHub URL) ⭐ **RECOMMENDED**

The easiest method - no authentication required:

```bash
# Download the script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh

# Make it executable
chmod +x vps-secure-setup.sh

# Run it
sudo bash vps-secure-setup.sh
```

**Why this works:**
- GitHub raw URLs are public (no authentication needed)
- Works immediately on fresh VPS
- Only requires `curl` (pre-installed on Ubuntu)

**Note:** Replace `yourusername` with your actual GitHub username.

---

### Method 2: Pastebin / Gist (Short URL)

Create a short URL for easy typing:

#### Create GitHub Gist:

1. Go to https://gist.github.com
2. Create new gist named `vps-setup.sh`
3. Paste the script content
4. Create as **public** gist
5. Click "Raw" button
6. Copy the short URL

**Example:**
```bash
curl -O https://gist.githubusercontent.com/yourusername/abc123/raw/vps-setup.sh
chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

**Advantages:**
- Short URL
- Easy to remember
- Version controlled
- Can update anytime

---

### Method 3: Your Own Server / CDN

Host the script on your own domain:

```bash
# Upload script to your server
scp scripts/vps-secure-setup.sh user@yourserver.com:/var/www/html/setup.sh

# Download from VPS
curl -O https://yourserver.com/setup.sh
chmod +x setup.sh
sudo bash setup.sh
```

**Advantages:**
- Complete control
- Memorable URL (e.g., https://17peppertree.co.za/vps-setup.sh)
- Can use your domain
- No third-party dependencies

---

### Method 4: Copy-Paste (Small VPS)

For ultimate simplicity, copy-paste the script:

```bash
# On VPS, create the file
nano vps-setup.sh

# Paste the script content (Ctrl+Shift+V)
# Save: Ctrl+O, Enter
# Exit: Ctrl+X

# Make executable and run
chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

**When to use:**
- Very fresh VPS
- No internet access from VPS
- Learning/testing

---

### Method 5: One-Liner (curl pipe)

**⚠️ USE WITH CAUTION - Only from trusted sources!**

```bash
# Download and execute in one command
curl -fsSL https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh | sudo bash
```

**Why this can be dangerous:**
- Script executes immediately (can't review first)
- No verification
- Only use from trusted sources (your own repo)

**Safer version (review first):**
```bash
# Download
curl -fsSL https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh -o setup.sh

# Review
less setup.sh

# Execute if satisfied
sudo bash setup.sh
```

---

## Recommended Setup Flow

### Step 1: Prepare Short URL

**Option A: GitHub Raw URL (Public Repo)**
```
https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh
```

**Option B: Create Short URL Service**

Use URL shortener (bit.ly, tinyurl.com) for easier typing:
```
Original: https://raw.githubusercontent.com/.../vps-secure-setup.sh
Short:    https://bit.ly/peppertree-vps-setup
```

**Option C: Custom Domain**

Point to your script:
```
https://setup.17peppertree.co.za/vps-setup.sh
```

### Step 2: Document the URL

Keep this in a safe place:
- Password manager
- Internal wiki
- Documentation

### Step 3: First-Time VPS Setup

```bash
# 1. SSH to fresh VPS
ssh root@new-vps-ip

# 2. Download script (use your prepared URL)
curl -O https://bit.ly/peppertree-vps-setup

# 3. Make executable
chmod +x vps-setup.sh

# 4. Run
sudo bash vps-setup.sh
```

---

## Creating Your Own Short Access

### Using GitHub Pages

1. Create `gh-pages` branch
2. Add script to `setup/vps-setup.sh`
3. Access via: `https://yourusername.github.io/17peppertree/setup/vps-setup.sh`

### Using Netlify Drop

1. Go to https://app.netlify.com/drop
2. Drag your script folder
3. Get instant URL: `https://random-name.netlify.app/vps-setup.sh`
4. Free, instant, no signup required

### Using Your Domain

**Apache/Nginx config:**
```nginx
# /etc/nginx/sites-available/scripts
server {
    listen 80;
    server_name setup.17peppertree.co.za;
    
    root /var/www/scripts;
    
    location / {
        default_type text/plain;
        add_header Content-Type "text/plain; charset=utf-8";
    }
}
```

**Upload script:**
```bash
scp scripts/vps-secure-setup.sh root@server:/var/www/scripts/vps-setup.sh
```

**Access:**
```bash
curl -O https://setup.17peppertree.co.za/vps-setup.sh
```

---

## Security Considerations

### Verification Methods

**1. SHA256 Checksum**

```bash
# On your machine, generate checksum
sha256sum scripts/vps-secure-setup.sh
# Output: abc123...def456  vps-secure-setup.sh

# On VPS, verify after download
echo "abc123...def456  vps-setup.sh" | sha256sum -c
# Should output: vps-setup.sh: OK
```

**2. GPG Signature**

```bash
# Sign the script
gpg --detach-sign --armor vps-secure-setup.sh
# Creates: vps-secure-setup.sh.asc

# Verify on VPS
curl -O https://yoururl.com/vps-secure-setup.sh
curl -O https://yoururl.com/vps-secure-setup.sh.asc
gpg --verify vps-secure-setup.sh.asc vps-secure-setup.sh
```

**3. HTTPS Only**

Always use HTTPS URLs to prevent man-in-the-middle attacks:
- ✅ `https://raw.githubusercontent.com/...`
- ❌ `http://raw.githubusercontent.com/...`

---

## Pre-Flight Checklist

Before running script on production VPS:

- [ ] Script downloaded from trusted source
- [ ] Checksum verified (if using)
- [ ] Reviewed script content (`less vps-setup.sh`)
- [ ] VPS backed up (if not fresh install)
- [ ] You have non-root user access (or can access via console)
- [ ] You understand what the script does

---

## Troubleshooting

### "curl: command not found"

```bash
# Install curl first
apt update && apt install -y curl
```

### "Permission denied"

```bash
# Make sure you're root or use sudo
sudo curl -O https://...
sudo chmod +x vps-setup.sh
sudo bash vps-setup.sh
```

### "Failed to connect"

```bash
# Check internet connectivity
ping -c 3 8.8.8.8

# Check DNS
ping -c 3 github.com

# Try wget instead
wget https://raw.githubusercontent.com/.../vps-secure-setup.sh
```

### Download Interrupted

```bash
# Resume download with wget
wget -c https://raw.githubusercontent.com/.../vps-secure-setup.sh

# Or force fresh download with curl
curl -fL https://... -o vps-setup.sh
```

---

## Quick Reference Card

Keep this for quick access:

```
╔══════════════════════════════════════════════════════════╗
║         VPS SETUP SCRIPT - QUICK ACCESS                  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Method 1: Direct Download (No Auth Required)           ║
║  ────────────────────────────────────────────────       ║
║  curl -O https://raw.githubusercontent.com/             ║
║    USERNAME/17@peppertree/main/scripts/                 ║
║    vps-secure-setup.sh                                  ║
║                                                          ║
║  chmod +x vps-secure-setup.sh                           ║
║  sudo bash vps-secure-setup.sh                          ║
║                                                          ║
║──────────────────────────────────────────────────────────║
║                                                          ║
║  Method 2: Short URL (Create First)                     ║
║  ────────────────────────────────────────────────       ║
║  curl -O https://bit.ly/your-short-url                  ║
║  chmod +x vps-setup.sh                                  ║
║  sudo bash vps-setup.sh                                 ║
║                                                          ║
║──────────────────────────────────────────────────────────║
║                                                          ║
║  Script Size: ~23KB                                     ║
║  Time to Run: 10-15 minutes                            ║
║  Requires: root/sudo access                             ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Example: Complete Setup Flow

```bash
# 1. SSH to fresh VPS
ssh root@154.12.34.56

# 2. Update system (optional but recommended)
apt update

# 3. Download setup script
curl -O https://raw.githubusercontent.com/jheiberg/17peppertree/main/scripts/vps-secure-setup.sh

# 4. Verify size (should be ~23KB)
ls -lh vps-secure-setup.sh

# 5. Quick review (optional)
head -50 vps-secure-setup.sh

# 6. Make executable
chmod +x vps-secure-setup.sh

# 7. Run setup
sudo bash vps-secure-setup.sh

# 8. Follow prompts and wait 10-15 minutes

# 9. Reboot when done
reboot
```

---

## For Multiple Deployments

If setting up multiple VPS servers, create a deployment package:

```bash
# On your local machine
mkdir peppertree-deploy
cd peppertree-deploy

# Copy essential scripts
cp ~/17peppertree/scripts/vps-secure-setup.sh .
cp ~/17peppertree/scripts/setup-staging-auth.sh .
cp ~/17peppertree/.env.example .

# Create README
cat > README.txt << 'EOF'
Peppertree VPS Deployment Package

1. Upload this folder to new VPS:
   scp -r peppertree-deploy root@vps-ip:~

2. SSH to VPS:
   ssh root@vps-ip

3. Run setup:
   cd peppertree-deploy
   sudo bash vps-secure-setup.sh

4. After setup, configure staging:
   sudo bash setup-staging-auth.sh
EOF

# Create archive
tar -czf peppertree-deploy.tar.gz peppertree-deploy/

# Now you can upload this archive to any VPS
```

---

## Related Documentation

- [VPS_SETUP_GUIDE.md](./VPS_SETUP_GUIDE.md) - Detailed setup guide
- [STAGING_SETUP_QUICK_START.md](./STAGING_SETUP_QUICK_START.md) - Staging setup
- [SYSTEM_REQUIREMENTS.md](./SYSTEM_REQUIREMENTS.md) - Requirements

---

**Tip:** Bookmark this page and keep your script URL handy for quick VPS deployments!
