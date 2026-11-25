param(
  [string]$StoreHost = ""
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $PSScriptRoot
$AndroidDir = Join-Path $RootDir "android"
$PublicApk = Join-Path $RootDir "public\elloll.apk"
$SignedApk = Join-Path $AndroidDir "elloll-release-signed.apk"

$JdkHome = "C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
if (Test-Path $JdkHome) {
  $env:JAVA_HOME = $JdkHome
  $env:PATH = "$JdkHome\bin;$env:PATH"
}

$BuildTools = "C:\Users\MR__CODER__\.bubblewrap\android_sdk\build-tools\35.0.0"
$ZipAlign = Join-Path $BuildTools "zipalign.exe"
$ApkSigner = Join-Path $BuildTools "apksigner.bat"
$Keystore = Join-Path $AndroidDir "android.keystore"

# Resolve host from NEXT_PUBLIC_SITE_URL in .env.local if not explicitly provided
if (-not $StoreHost) {
  $EnvLocal = Join-Path $RootDir ".env.local"
  if (Test-Path $EnvLocal) {
    $line = Get-Content $EnvLocal | Where-Object { $_ -match '^\s*NEXT_PUBLIC_SITE_URL=' } | Select-Object -First 1
    if ($line) {
      $rawUrl = ($line -replace '^\s*NEXT_PUBLIC_SITE_URL=', '').Trim().Trim('"').Trim("'")
      if ($rawUrl -and $rawUrl -notmatch 'localhost') {
        $uri = [Uri]$rawUrl
        $StoreHost = $uri.Host
      }
    }
  }
}
if (-not $StoreHost) { $StoreHost = "elloll.vercel.app" }

Write-Host "Building elloll Android APK for host: $StoreHost"

# Ensure keytool / keystore exists
if (-not (Test-Path $Keystore)) {
  & keytool -genkeypair -v -keystore $Keystore -alias elloll -keyalg RSA -keysize 2048 -validity 10000 -storepass elloll2026 -keypass elloll2026 -dname "CN=elloll, OU=Store, O=elloll, L=Cairo, ST=Cairo, C=EG"
}

# Build unsigned release APK with Gradle
Push-Location $AndroidDir
try {
  & .\gradlew.bat assembleRelease "-PstoreHost=$StoreHost"
  if ($LASTEXITCODE -ne 0) { throw "Gradle assembleRelease failed." }
} finally {
  Pop-Location
}

$UnsignedApk = Join-Path $AndroidDir "app\build\outputs\apk\release\app-release-unsigned.apk"
if (-not (Test-Path $UnsignedApk)) {
  throw "Expected APK not found at $UnsignedApk"
}

$AlignedApk = Join-Path $AndroidDir "app-release-unsigned-aligned.apk"
if (Test-Path $AlignedApk) { Remove-Item $AlignedApk -Force }
if (Test-Path $SignedApk) { Remove-Item $SignedApk -Force }

& $ZipAlign -p -f 4 $UnsignedApk $AlignedApk
if ($LASTEXITCODE -ne 0) { throw "zipalign failed." }

& $ApkSigner sign --ks $Keystore --ks-key-alias elloll --ks-pass pass:elloll2026 --key-pass pass:elloll2026 --out $SignedApk $AlignedApk
if ($LASTEXITCODE -ne 0) { throw "apksigner failed." }

& $ApkSigner verify --print-certs $SignedApk
if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed." }

Copy-Item $SignedApk $PublicApk -Force
$sizeMb = [Math]::Round((Get-Item $PublicApk).Length / 1MB, 2)
Write-Host "APK ready: $PublicApk ($sizeMb MB)"
