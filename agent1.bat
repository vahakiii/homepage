rem powershell -ExecutionPolicy Bypass -File "$env:LOCALAPPDATA\cursor-agent\cursor-agent.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command "& (Join-Path $env:LOCALAPPDATA 'cursor-agent\cursor-agent.ps1')"
