@echo off
echo Starting On Their Footsteps application with Docker...

REM Build and start all services
docker-compose up --build

REM To run in background, use:
REM docker-compose up --build -d

REM To stop all services, use:
REM docker-compose down

REM To view logs, use:
REM docker-compose logs -f

pause
