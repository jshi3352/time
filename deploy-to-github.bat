@echo off
chcp 65001 >nul
echo.
echo ==========================================
echo 🚀 GitHub 자동 배포 스크립트
echo ==========================================
echo.

:: Node.js 설치 확인
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다!
    echo 📥 https://nodejs.org 에서 Node.js를 다운로드하세요.
    pause
    exit /b 1
)

echo ✅ Node.js 설치 확인됨
echo.

:: 환경변수 확인
if "%GITHUB_TOKEN%"=="" (
    echo ⚠️  GITHUB_TOKEN 환경변수가 설정되지 않았습니다.
    echo.
    echo 📝 설정 방법:
    echo 1. GitHub에서 Personal Access Token 생성
    echo 2. PowerShell에서 다음 명령어 실행:
    echo    $env:GITHUB_TOKEN = "your_token_here"
    echo    $env:GITHUB_USERNAME = "your_username_here"
    echo.
    set /p token="GitHub Token을 입력하세요 (또는 Enter로 건너뛰기): "
    if not "%token%"=="" set GITHUB_TOKEN=%token%
)

if "%GITHUB_USERNAME%"=="" (
    set /p username="GitHub Username을 입력하세요 (또는 Enter로 건너뛰기): "
    if not "%username%"=="" set GITHUB_USERNAME=%username%
)

echo.
echo 🔧 현재 설정:
if not "%GITHUB_TOKEN%"=="" (
    echo    Token: %GITHUB_TOKEN:~0,10%...
) else (
    echo    Token: 설정되지 않음
)
if not "%GITHUB_USERNAME%"=="" (
    echo    Username: %GITHUB_USERNAME%
) else (
    echo    Username: 설정되지 않음
)
echo.

echo 🚀 배포를 시작합니다...
echo.

:: Node.js 스크립트 실행
node github-deploy.js

if errorlevel 1 (
    echo.
    echo ❌ 배포 중 오류가 발생했습니다.
    echo 📖 자세한 내용은 GITHUB_DEPLOY_README.md를 참조하세요.
) else (
    echo.
    echo 🎉 배포가 완료되었습니다!
    echo 🔗 GitHub에서 저장소를 확인해보세요.
)

echo.
echo 아무 키나 눌러서 종료하세요...
pause >nul