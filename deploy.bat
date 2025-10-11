@echo off
REM Deployment script for Windows - Sustainable Lifestyle Companion
REM Works with Docker Desktop, Podman, or other container runtimes

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_NAME=sustainable-lifestyle
set COMPOSE_FILE=docker-compose.yml
set ENV_FILE=.env

REM Colors for Windows (using echo with special characters)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

goto :main

:print_banner
echo.
echo %BLUE%╔══════════════════════════════════════════════════════════════╗%NC%
echo %BLUE%║         Sustainable Lifestyle Companion Deployment          ║%NC%
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

:check_requirements
call :log_info "Checking system requirements..."

REM Check for Docker
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    set CONTAINER_CMD=docker
    set COMPOSE_CMD=docker-compose
    call :log_success "Docker found"
) else (
    REM Check for Podman
    podman --version >nul 2>&1
    if %errorlevel% equ 0 (
        set CONTAINER_CMD=podman
        set COMPOSE_CMD=podman-compose
        call :log_success "Podman found"
    ) else (
        call :log_error "No container runtime found. Please install Docker Desktop or Podman."
        exit /b 1
    )
)

REM Check for compose
%COMPOSE_CMD% --version >nul 2>&1
if %errorlevel% neq 0 (
    call :log_error "%COMPOSE_CMD% not found. Please install docker-compose or podman-compose."
    exit /b 1
)

REM Check if compose file exists
if not exist "%COMPOSE_FILE%" (
    call :log_error "docker-compose.yml not found in current directory"
    exit /b 1
)

goto :eof

:setup_environment
call :log_info "Setting up environment..."

if not exist "%ENV_FILE%" (
    if exist ".env.example" (
        copy .env.example .env >nul
        call :log_warning "Created .env from .env.example. Please update the values!"
        call :log_warning "Important: Update JWT secrets and database passwords before deployment!"
    ) else (
        call :log_error "No .env file found and no .env.example to copy from"
        exit /b 1
    )
) else (
    call :log_success "Environment file found"
)

goto :eof

:build_images
call :log_info "Building Docker images..."

%COMPOSE_CMD% build

if %errorlevel% equ 0 (
    call :log_success "Images built successfully"
) else (
    call :log_error "Failed to build images"
    exit /b 1
)

goto :eof

:start_services
call :log_info "Starting services..."

%COMPOSE_CMD% up -d

if %errorlevel% equ 0 (
    call :log_success "Services started successfully"
) else (
    call :log_error "Failed to start services"
    exit /b 1
)

goto :eof

:check_health
call :log_info "Checking service health..."

REM Wait for services to start
timeout /t 10 /nobreak >nul

REM Check if containers are running
%COMPOSE_CMD% ps | findstr "Up" >nul
if %errorlevel% equ 0 (
    call :log_success "Containers are running"
) else (
    call :log_error "Some containers failed to start"
    %COMPOSE_CMD% ps
    exit /b 1
)

REM Check backend health (simple approach for Windows)
call :log_info "Waiting for backend to be ready..."
timeout /t 15 /nobreak >nul

REM Try to connect to backend
powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5000/health' -UseBasicParsing | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    call :log_success "Backend is healthy"
) else (
    call :log_warning "Backend health check failed, but it might still be starting"
)

goto :eof

:show_status
call :log_info "Service status:"
%COMPOSE_CMD% ps

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
%COMPOSE_CMD% down -v --remove-orphans
call :log_success "Cleanup completed"
goto :eof

:deploy
call :print_banner
call :check_requirements
if %errorlevel% neq 0 exit /b 1

call :setup_environment
if %errorlevel% neq 0 exit /b 1

echo.
set /p cleanup_choice="Clean up previous deployment? (y/N): "
if /i "%cleanup_choice%"=="y" call :cleanup

call :build_images
if %errorlevel% neq 0 exit /b 1

call :start_services
if %errorlevel% neq 0 exit /b 1

call :check_health
call :show_status

call :log_success "Deployment completed successfully!"
echo.
call :log_info "Useful commands:"
echo   View logs: %COMPOSE_CMD% logs -f
echo   Stop services: %COMPOSE_CMD% down
echo   Restart service: %COMPOSE_CMD% restart ^<service^>
echo   Scale service: %COMPOSE_CMD% up -d --scale backend=3

goto :eof

:main
set ACTION=%~1
if "%ACTION%"=="" set ACTION=deploy

if "%ACTION%"=="deploy" (
    call :deploy
) else if "%ACTION%"=="start" (
    call :log_info "Starting services..."
    %COMPOSE_CMD% up -d
    call :show_status
) else if "%ACTION%"=="stop" (
    call :log_info "Stopping services..."
    %COMPOSE_CMD% down
    call :log_success "Services stopped"
) else if "%ACTION%"=="restart" (
    call :log_info "Restarting services..."
    %COMPOSE_CMD% restart
    call :log_success "Services restarted"
) else if "%ACTION%"=="status" (
    call :show_status
) else if "%ACTION%"=="logs" (
    %COMPOSE_CMD% logs -f
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
    echo   logs    - Show and follow logs
    echo   clean   - Clean up containers and volumes
    echo   build   - Build images only
    echo   health  - Check service health
    exit /b 1
)

endlocal