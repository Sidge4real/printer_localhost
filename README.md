# WSL Printer Setup Guide

## Project Description

This project provides a user-friendly web interface for managing and using printers in Windows Subsystem for Linux (WSL) without requiring direct Linux commands. It combines a comprehensive setup guide with an intuitive web application that simplifies the printing process for WSL users.

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

```powershell
# List USB connections (requires admin rights)
usbipd wsl list

# Connect printer to WSL
usbipd attach --busid <your-printer-busid> --wsl Ubuntu

# Verify printer connection in WSL
wsl lsusb
```

### 3. Configure Port Forwarding

```powershell
netsh interface portproxy add v4tov4 listenport=631 listenaddress=127.0.0.1 connectport=631 connectaddress=localhost
```

Access CUPS web interface at: http://localhost:631

### 4. Install CUPS and Drivers

```bash
sudo apt update
sudo apt install cups printer-driver-gutenprint
```

### 5. Add Printer

First, check available devices:
```bash
sudo lpinfo -v
```

Then add the printer:
```bash
sudo lpadmin -p MG5100 -E -v "usb://Canon/MG5100%20series?serial=306BCF&interface=1" -m gutenprint.5.3://bjc-PIXMA-MG5100/expert
sudo cupsenable MG5100
sudo cupsaccept MG5100
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

```bash
# Check printer status
lpstat -p

# Print a test file
echo "Test print from WSL2" > test.txt
lp -d MG5100 test.txt

# Print from Windows path
wsl lp -d MG5100 /mnt/c/Users/username/Downloads/file.pdf
```

### Additional Commands

```bash
# Restart CUPS service
sudo service cups restart

# List Windows printers
Get-Printer  # Run in PowerShell

# Search for Gutenprint drivers
lpinfo -m | grep -i mg5100
```

## Backend Development Note

To allow nodemon to run on your device via PowerShell:

```powershell
Set-ExecutionPolicy RemoteSigned
```