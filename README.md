# WSL Printer Setup Guide

## Project Description

This project provides a user-friendly web interface for managing and using printers in Windows Subsystem for Linux ### Troubleshooting

### USB Connection Issues

**Reconnect Printer to WSL:**
```powershell
# First check current USB devices
usbipd list

# Unbind if already bound
usbipd unbind --busid 1-4

# Bind and attach (use your actual busid)
usbipd bind --busid 1-4
usbipd attach --busid 1-4 --wsl Ubuntu

# Or use automated method with admin elevation
powershell -Command "Start-Process PowerShell -ArgumentList '-NoProfile -Command usbipd bind --busid 1-4; usbipd attach --busid 1-4 --wsl Ubuntu; Read-Host \"Press Enter to continue\"' -Verb RunAs"
```

**Verify USB connection in WSL:**
```bash
lsusb
# Should show: Bus 001 Device 002: ID 04a9:1748 Canon, Inc. PIXMA MG5100 Series
```hout requiring direct Linux commands. It combines a comprehensive setup guide with an intuitive web application that simplifies the printing process for WSL users.

The web interface allows users to:
- Manage printer connections
- Send print jobs easily
- Monitor printer status
- Configure printer settings

All of this is achieved through a modern, easy-to-use interface that eliminates the need for command-line interaction.

## Author

Lukas Van der Spiegel

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Setup Guide

This guide explains how to set up and configure a printer in Windows Subsystem for Linux (WSL) environment using CUPS.

## Prerequisites

- Windows with WSL installed
- Administrative privileges
- USB printer (this guide uses Canon MG5100 as an example)

## Installation Steps

### 1. Install USBIPD

```powershell
winget install usbipd
# Restart PowerShell after installation
```

### 2. Connect Printer to WSL

First, check which USB devices are available:
```powershell
usbipd list
```

Example output:
```
BUSID  VID:PID    DEVICE                        STATE
1-4    04a9:1748  Canon MG5100 ser, Canon MG5100 series  Not shared
```

Then bind and attach the printer (requires admin rights):
```powershell
# Method 1: Manual steps (requires separate admin PowerShell)
usbipd bind --busid 1-4
usbipd attach --busid 1-4 --wsl Ubuntu

# Method 2: Automatic with admin elevation
powershell -Command "Start-Process PowerShell -ArgumentList '-NoProfile -Command usbipd bind --busid 1-4; usbipd attach --busid 1-4 --wsl Ubuntu; Read-Host \"Press Enter to continue\"' -Verb RunAs"
```

Verify printer connection in WSL:
```bash
lsusb
# Should show: Bus 001 Device 002: ID 04a9:1748 Canon, Inc. PIXMA MG5100 Series
```

### 3. Configure Port Forwarding

```powershell
netsh interface portproxy add v4tov4 listenport=631 listenaddress=127.0.0.1 connectport=631 connectaddress=localhost
```

Access CUPS web interface at: http://localhost:631

### 4. Install CUPS and Drivers

```bash
# Update package index
sudo apt update

# Install CUPS daemon and client tools
sudo apt install cups-daemon cups-client cups-bsd

# Install Gutenprint drivers for Canon printers
sudo apt install printer-driver-gutenprint

# Install IPP-USB for driverless printing
sudo apt install ipp-usb

# Add user to lpadmin group
sudo usermod -a -G lpadmin $USER

# Start CUPS service
sudo systemctl start cups

# Check CUPS status
sudo systemctl status cups
```

### 5. Add Printer

First, check available drivers for your printer model:
```bash
lpinfo -m | grep -i mg5100
# Should show: gutenprint.5.3://bjc-PIXMA-MG5100/expert Canon PIXMA MG5100 - CUPS+Gutenprint v5.3.3
```

Check available devices:
```bash
sudo lpinfo -v
```

Add the printer (choose one method):

**Method A: USB Connection (after USB binding)**
```bash
sudo lpadmin -p MG5100 -E -v "usb://Canon/MG5100%20series?serial=306BCF&interface=1" -m "gutenprint.5.3://bjc-PIXMA-MG5100/expert"
```

**Method B: Socket Connection (for testing without USB)**
```bash
sudo lpadmin -p MG5100 -E -v "socket://127.0.0.1" -m "gutenprint.5.3://bjc-PIXMA-MG5100/expert"
```

Enable and accept the printer:
```bash
sudo cupsenable MG5100
sudo cupsaccept MG5100
```

Verify printer is added:
```bash
lpstat -p
# Should show: printer MG5100 is idle. enabled since [timestamp]
```

## Driver Installation Methods

### Method 1: DEB Package Installation

```bash
# Install .deb driver package
sudo dpkg -i cnijfilter-mg5100series_3.40-1_amd64.deb
sudo apt --fix-broken install
```

### Method 2: PPD File Installation

```bash
# Install using PPD file from OpenPrinting
sudo lpadmin -p MG5100 -E -v usb://Canon/MG5100 -P /path/to/Canon-MG5100.ppd
```

### Method 3: Driverless IPP-USB

```bash
# Install required packages
sudo apt install ipp-usb printer-driver-gutenprint

# List available devices
lpinfo -v

# Add printer
sudo lpadmin -p MG5100 -E -v "usb://Canon/MG5100..." -m everywhere
```

## Troubleshooting

### Reconnect Printer to WSL

```powershell
usbipd unbind --busid 2-3
usbipd bind --busid 2-3
usbipd attach --busid 2-3 --wsl Ubuntu
```

### Check CUPS Permissions

```bash
ls -l $(which cups-brf)
sudo chmod 755 $(which cups-brf)
sudo chown root:root $(which cups-brf)
```

### Print Commands

**Understanding Print Process:**
- Adding to queue: `lp -d MG5100 test.txt` (places job in queue)
- Physical printing: Requires USB binding to WSL (see step 2)

```bash
# Check printer status
lpstat -p

# Create a test file
echo "Test print from WSL2 - Canon MG5100" > test.txt

# Add print job to queue
lp -d MG5100 test.txt
# Output: request id is MG5100-1 (1 file(s))

# Check print queue
lpstat -o
# Shows pending jobs

# Print from Windows path
lp -d MG5100 /mnt/c/Users/username/Downloads/file.pdf

# Print with specific options
lp -d MG5100 -o media=A4 -o sides=two-sided-long-edge test.txt
```

**Important Notes:**
- Jobs are automatically removed from queue after successful printing
- If printer is not physically connected via USB, jobs will remain in queue
- Use `lpstat -o` to monitor queue status

### Additional Commands

```bash
# Restart CUPS service
sudo systemctl restart cups

# Check CUPS service status
sudo systemctl status cups

# List all available printer models
lpinfo -m | grep -i canon

# Check print queue and remove jobs
lpstat -o                    # Show queue
cancel MG5100-1             # Cancel specific job
cancel -a MG5100            # Cancel all jobs for printer

# Enable/disable printer
sudo cupsdisable MG5100     # Disable printer
sudo cupsenable MG5100      # Enable printer

# Remove and re-add printer
sudo lpadmin -x MG5100      # Remove printer
# Then re-add with lpadmin command from step 5
```

**Windows Commands:**
```powershell
# List Windows printers
Get-Printer

# Check USBIPD status
usbipd list

# Search for Gutenprint drivers (in WSL)
lpinfo -m | grep -i mg5100
```

## Backend Development Note

To allow nodemon to run on your device via PowerShell:

```powershell
Set-ExecutionPolicy RemoteSigned
```

## Quick Reference - Essential Commands

**For the web application to work properly, these two operations must function:**

### 1. Add Print Job to Queue (WSL)
```bash
lp -d MG5100 test.txt
```
*This places the print job in the CUPS queue*

### 2. Physical Printing (Windows PowerShell)
```powershell
powershell -Command "Start-Process PowerShell -ArgumentList '-NoProfile -Command usbipd bind --busid 1-4; usbipd attach --busid 1-4 --wsl Ubuntu; Read-Host \"Press Enter to continue\"' -Verb RunAs"
```
*This enables actual physical printing by connecting the USB printer to WSL*

**Note:** The web application combines these operations to provide seamless printing functionality. The first command handles the print job submission, while the second ensures the printer is physically accessible for output.