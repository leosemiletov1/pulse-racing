@echo off
rem Double-click to upload your latest changes to the live website.
cd /d "%~dp0.."
git add -A
git commit -m "Update website"
git push
echo.
echo Done. The live site updates in about a minute:
echo https://leosemiletov1.github.io/pulse-racing/
echo.
pause
