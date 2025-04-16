#!/bin/bash

gnome-terminal -- bash -c "
echo '📡 Checking VPN...';
if curl -s ifconfig.me | grep -q '147.100'; then
  echo '✅ VPN already connected';
else
  echo '🔐 Connecting to VPN...';
  sudo openconnect vpn.inrae.fr;
fi

echo '🔫 Killing anything on port 8000...';
fuser -k 8000/tcp || echo 'No process on 8000.'

echo '🚀 Starting FastAPI backend...';
cd ~/Documents/PhyloGraph/backend
source ~/miniconda3/etc/profile.d/conda.sh
conda activate phylograph
uvicorn api:app --reload &

sleep 2

echo '📦 Starting React frontend...';
cd ~/Documents/PhyloGraph/frontend
npm install
npm run dev
exec bash
"
