@echo off
echo --- LISTING ALL FILES ---
dir /a
echo.
echo --- CHECKING FOR HIDDEN .GIT FOLDERS ---
if exist server\.git echo FOUND .git IN SERVER
if exist client\.git echo FOUND .git IN CLIENT
echo.
echo --- READING .GITIGNORE ---
if exist .gitignore type .gitignore
if not exist .gitignore echo NO .GITIGNORE FOUND
pause
