@echo off
setlocal

:: Get timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set timestamp=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%-%datetime:~10,2%-%datetime:~12,2%

set archive_name=archive_%timestamp%.zip

echo Creating %archive_name%...

:: Use PowerShell to create the zip
:: Adds 'src' folder and essential root files
powershell -Command "Compress-Archive -Path 'src', 'Documents', 'package.json', 'vite.config.ts', 'agents.md', 'design.md', 'product.md', 'readme.md', 'static' -DestinationPath '%archive_name%'"

echo Done.
pause
