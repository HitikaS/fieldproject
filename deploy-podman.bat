@echo off
REM Podman Deployment Script for Windows - Sustainable Lifestyle Companion
REM Native Podman commands without requiring podman-compose

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=sustainable-lifestyle
set NETWORK_NAME=sustainable-network
set VOLUME_PREFIX=sustainable

REM Colors for Windows
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

goto :main

:print_banner
echo.
echo %BLUE%╔══════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║         Podman Deployment - Sustainable Lifestyle            ║%NC%
echo %BLUE%║                Full Stack MERN + WebSocket                   ║%NC%
echo %BLUE%╚══════════════════════════════════════════════════════════════╝%NC%
echo.
goto :eof

:log_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:log_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:log_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:log_error
echo %RED%[ERROR]%NC% %~1
goto :eof

:check_podman
call :log_info "Checking Podman installation..."

podman --version >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "Podman not found. Please install Podman first."
    exit /b 1
)

for /f "tokens=*" %%i in ('podman --version') do set PODMAN_VERSION=%%i
call :log_success "Podman found: %PODMAN_VERSION%"
goto :eof

:setup_network
call :log_info "Setting up Podman network..."

REM Check if network exists
podman network ls | findstr "%NETWORK_NAME%" >nul
if %errorlevel% equ 0 (
    call :log_info "Network %NETWORK_NAME% already exists"
) else (
    podman network create "%NETWORK_NAME%"
    call :log_success "Created network: %NETWORK_NAME%"
)
goto :eof

:setup_volumes
call :log_info "Setting up Podman volumes..."

REM Create volumes if they don't exist
set volumes=%VOLUME_PREFIX%_mongodb_data %VOLUME_PREFIX%_mongodb_config %VOLUME_PREFIX%_redis_data %VOLUME_PREFIX%_backend_uploads %VOLUME_PREFIX%_backend_logs

for %%v in (%volumes%) do (
    podman volume ls | findstr "%%v" >nul
    if !errorlevel! equ 0 (
        call :log_info "Volume %%v already exists"
    ) else (
        podman volume create "%%v"
        call :log_success "Created volume: %%v"
    )
)
goto :eof

:build_images
call :log_info "Building images with Podman..."

REM Build backend image
call :log_info "Building backend image..."
cd backend
podman build -t sustainable-backend:latest -f Dockerfile .
if %errorlevel% neq 0 (
    call :log_error "Failed to build backend image"
    exit /b 1
)
cd ..

REM Build frontend image
call :log_info "Building frontend image..."
cd frontend
podman build -t sustainable-frontend:latest -f Dockerfile .
if %errorlevel% neq 0 (
    call :log_error "Failed to build frontend image"
    exit /b 1
)
cd ..

call :log_success "Images built successfully"
goto :eof

:start_mongodb
call :log_info "Starting MongoDB container..."

REM Check if MongoDB container is already running
podman ps | findstr "sustainable-mongodb" >nul
if %errorlevel% equ 0 (
    call :log_info "MongoDB container already running"
    goto :eof
)

REM Remove existing container if it exists but is stopped
podman rm -f sustainable-mongodb >nul 2>&1

podman run -d ^
    --name sustainable-mongodb ^
    --network "%NETWORK_NAME%" ^
    -p 27017:27017 ^
    -e MONGO_INITDB_ROOT_USERNAME=admin ^
    -e MONGO_INITDB_ROOT_PASSWORD=adminpassword ^
    -e MONGO_INITDB_DATABASE=sustainable_lifestyle ^
    -v "%VOLUME_PREFIX%_mongodb_data:/data/db" ^
    -v "%VOLUME_PREFIX%_mongodb_config:/data/configdb" ^
    --restart unless-stopped ^
    mongo:6.0-bullseye

call :log_success "MongoDB container started"
goto :eof

:start_redis
call :log_info "Starting Redis container..."

REM Check if Redis container is already running
podman ps | findstr "sustainable-redis" >nul
if %errorlevel% equ 0 (
    call :log_info "Redis container already running"
    goto :eof
)

REM Remove existing container if it exists but is stopped
podman rm -f sustainable-redis >nul 2>&1

podman run -d ^
    --name sustainable-redis ^
    --network "%NETWORK_NAME%" ^
    -p 6379:6379 ^
    -e REDIS_PASSWORD=redispassword ^
    -v "%VOLUME_PREFIX%_redis_data:/data" ^
    --restart unless-stopped ^
    redis:7-alpine redis-server --requirepass redispassword

call :log_success "Redis container started"
goto :eof

:start_backend
call :log_info "Starting Backend container..."

REM Check if backend container is already running
podman ps | findstr "sustainable-backend" >nul
if %errorlevel% equ 0 (
    call :log_info "Backend container already running"
    goto :eof
)

REM Remove existing container if it exists but is stopped
podman rm -f sustainable-backend >nul 2>&1

REM Wait for MongoDB to be ready
call :log_info "Waiting for MongoDB to be ready..."
timeout /t 10 /nobreak >nul

podman run -d ^
    --name sustainable-backend ^
    --network "%NETWORK_NAME%" ^
    -p 5000:5000 ^
    -e NODE_ENV=production ^
    -e PORT=5000 ^
    -e MONGO_URI="mongodb://admin:adminpassword@sustainable-mongodb:27017/sustainable_lifestyle?authSource=admin" ^
    -e JWT_SECRET="your-super-secret-jwt-key-change-in-production" ^
    -e JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production" ^
    -e JWT_EXPIRES_IN="30d" ^
    -e JWT_REFRESH_EXPIRES_IN="7d" ^
    -e CORS_ORIGIN="http://localhost:3000" ^
    -e SOCKET_CORS_ORIGIN="http://localhost:3000" ^
    -v "%VOLUME_PREFIX%_backend_uploads:/app/uploads" ^
    -v "%VOLUME_PREFIX%_backend_logs:/app/logs" ^
    --restart unless-stopped ^
    sustainable-backend:latest

call :log_success "Backend container started"
goto :eof

:start_frontend
call :log_info "Starting Frontend container..."

REM Check if frontend container is already running
podman ps | findstr "sustainable-frontend" >nul
if %errorlevel% equ 0 (
    call :log_info "Frontend container already running"
    goto :eof
)

REM Remove existing container if it exists but is stopped
podman rm -f sustainable-frontend >nul 2>&1

REM Wait for backend to be ready
call :log_info "Waiting for backend to be ready..."
timeout /t 15 /nobreak >nul

podman run -d ^
    --name sustainable-frontend ^
    --network "%NETWORK_NAME%" ^
    -p 3000:80 ^
    -e REACT_APP_API_URL="http://localhost:5000" ^
    -e REACT_APP_WS_URL="http://localhost:5000" ^
    -e REACT_APP_ENV="production" ^
    -e REACT_APP_VERSION="1.0.0" ^
    --restart unless-stopped ^
    sustainable-frontend:latest

call :log_success "Frontend container started"
goto :eof

:check_health
call :log_info "Checking service health..."

REM Wait for services to start
timeout /t 10 /nobreak >nul

REM Check if containers are running
podman ps --format "table {{.Names}}" | findstr "sustainable-" >nul
if %errorlevel% equ 0 (
    call :log_success "Containers are running"
) else (
    call :log_error "Some containers failed to start"
    podman ps
    exit /b 1
)

REM Check backend health (simple approach for Windows)
call :log_info "Waiting for backend to be ready..."
timeout /t 15 /nobreak >nul

powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5000/health' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Backend is healthy"
) else (
    call :log_warning "Backend health check failed, but it might still be starting"
)

goto :eof

:show_status
call :log_info "Service status:"
podman ps --format "table {{.Names}}	{{.Status}}	{{.Ports}}"

echo.
call :log_info "Access URLs:"
echo %GREEN%Frontend:%NC% http://localhost:3000
echo %GREEN%Backend API:%NC% http://localhost:5000
echo %GREEN%MongoDB:%NC% localhost:27017
echo %GREEN%Redis:%NC% localhost:6379

echo.
call :log_info "Test accounts:"
echo %YELLOW%Admin:%NC% admin@sustainablelife.com / Admin123!
echo %YELLOW%User:%NC% user@test.com / User123!

goto :eof

:cleanup
call :log_info "Cleaning up previous deployment..."

REM Stop and remove containers
set containers=sustainable-frontend sustainable-backend sustainable-redis sustainable-mongodb
for %%c in (%containers%) do (
    podman stop "%%c" >nul 2>&1
    podman rm "%%c" >nul 2>&1
)

REM Remove network
podman network rm "%NETWORK_NAME%" >nul 2>&1

REM Remove volumes (ask user)
echo.
set /p cleanup_volumes="Remove volumes (will delete all data)? (y/N): "
if /i "%cleanup_volumes%"=="y" (
    set volumes=%VOLUME_PREFIX%_mongodb_data %VOLUME_PREFIX%_mongodb_config %VOLUME_PREFIX%_redis_data %VOLUME_PREFIX%_backend_uploads %VOLUME_PREFIX%_backend_logs
    for %%v in (!volumes!) do (
        podman volume rm "%%v" >nul 2>&1
    )
)

call :log_success "Cleanup completed"
goto :eof

:deploy
call :print_banner
call :check_podman
if %errorlevel% neq 0 exit /b 1

echo.
set /p cleanup_choice="Clean up previous deployment? (y/N): "
if /i "%cleanup_choice%"=="y" call :cleanup

call :setup_network
call :setup_volumes
call :build_images
if %errorlevel% neq 0 exit /b 1

REM Start services in order
call :start_mongodb
call :start_redis
call :start_backend
call :start_frontend

call :check_health
call :show_status

call :log_success "Podman deployment completed successfully!"
echo.
call :log_info "Useful commands:"
echo   View logs: podman logs ^<container_name^>
echo   Stop services: podman stop sustainable-frontend sustainable-backend sustainable-redis sustainable-mongodb
echo   Start services: podman start sustainable-mongodb sustainable-redis sustainable-backend sustainable-frontend
echo   Remove everything: %~nx0 clean

goto :eof

:main
set ACTION=%~1
if "%ACTION%"=="" set ACTION=deploy

if "%ACTION%"=="deploy" (
    call :deploy
) else if "%ACTION%"=="start" (
    call :log_info "Starting services..."
    podman start sustainable-mongodb sustainable-redis sustainable-backend sustainable-frontend
    call :show_status
) else if "%ACTION%"=="stop" (
    call :log_info "Stopping services..."
    podman stop sustainable-frontend sustainable-backend sustainable-redis sustainable-mongodb
    call :log_success "Services stopped"
) else if "%ACTION%"=="restart" (
    call :log_info "Restarting services..."
    podman restart sustainable-mongodb sustainable-redis sustainable-backend sustainable-frontend
    call :log_success "Services restarted"
) else if "%ACTION%"=="status" (
    call :show_status
) else if "%ACTION%"=="logs" (
    if not "%~2"=="" (
        podman logs -f "sustainable-%~2"
    ) else (
        echo Available services: mongodb, redis, backend, frontend
        echo Usage: %~nx0 logs ^<service^>
    )
) else if "%ACTION%"=="clean" (
    call :cleanup
) else if "%ACTION%"=="build" (
    call :build_images
) else if "%ACTION%"=="health" (
    call :check_health
) else (
    echo Usage: %~nx0 [deploy^|start^|stop^|restart^|status^|logs^|clean^|build^|health]
    echo.
    echo Commands:
    echo   deploy  - Full deployment ^(default^)
    echo   start   - Start services
    echo   stop    - Stop services
    echo   restart - Restart services
    echo   status  - Show service status
    echo   logs    - Show logs ^(specify service: mongodb^|redis^|backend^|frontend^)
    echo   clean   - Clean up containers and volumes
    echo   build   - Build images only
    echo   health  - Check service health
    exit /b 1
)

endlocal