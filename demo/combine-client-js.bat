@echo off
set DEMO_DIR=%~dp0
set SOURCE_DIR=%DEMO_DIR%..\src
pushd "%SOURCE_DIR%"

set CMD=copy /b sockjs-0.3.min.js
set CMD=%CMD% + box2d.js
set CMD=%CMD% + caat.js
set CMD=%CMD% + Utils.js
set CMD=%CMD% + Constant.js
set CMD=%CMD% + Msg.js
set CMD=%CMD% + DirectorBase.js
set CMD=%CMD% + DirectorClient.js
set CMD=%CMD% + Entity.js 
set CMD=%CMD% + Projectile.js
set CMD=%CMD% + Effect.js 
set CMD=%CMD% + Skill.js
set CMD=%CMD% + Virus.js 
set CMD=%CMD% + Cell.js 
set CMD=%CMD% + Client.js 
set CMD=%CMD% + PowerUp.js
set CMD=%CMD% combine-client-code.js
set CMD=%CMD% /Y  
	
echo %CMD%	

%CMD%
	
popd

set COPY_CMD=xcopy "%SOURCE_DIR%\combine-client-code.js" "%DEMO_DIR%combine-client-code.js" /Y
echo %COPY_CMD%
%COPY_CMD%

