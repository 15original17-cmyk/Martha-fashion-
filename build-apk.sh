#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "=== 1. Building React Web application ==="
npm run build

echo "=== 2. Preparing Android build tree ==="
rm -rf android-build/assets android-build/bin android-build/dex android-build/gen
mkdir -p android-build/assets/web
mkdir -p android-build/bin
mkdir -p android-build/dex
mkdir -p android-build/gen

# Copy dist files and essential public images to assets/web
cp -r dist/* android-build/assets/web/
cp -r public/femme.jpg public/icon-*.png public/apple-touch-icon.png public/manifest.json android-build/assets/web/ 2>/dev/null || true

# Process index.html cleanly using Python to avoid sed corruption
python3 -c '
import os, re

index_path = "android-build/assets/web/index.html"
with open(index_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Convert module script to standard deferred script for file:/// WebView compatibility
content = re.sub(r"<script\s+type=[\"\x27]module[\"\x27]\s+crossorigin\s+src=[\"\x27]", "<script defer src=\"", content)
content = re.sub(r"<script\s+type=[\"\x27]module[\"\x27]\s+src=[\"\x27]", "<script defer src=\"", content)

# 2. Remove crossorigin from stylesheet links
content = content.replace("crossorigin href=", "href=")

# 3. Ensure all asset and manifest links are strictly relative (./)
content = content.replace("src=\"/", "src=\"./").replace("href=\"/", "href=\"./")
content = content.replace("src=\"assets/", "src=\"./assets/").replace("href=\"assets/", "href=\"./assets/")

# 4. Protect against any double dot / dot corruption
content = content.replace(".assets/", "./assets/")
content = content.replace("././", "./")

with open(index_path, "w", encoding="utf-8") as f:
    f.write(content)

print("index.html adapted successfully for Android WebView local assets.")
'

echo "=== 3. Generating R.java and compiling resources with aapt ==="
aapt package -f -m \
    -J android-build/gen \
    -M android-build/AndroidManifest.xml \
    -S android-build/res \
    -I /usr/lib/android-sdk/platforms/android-23/android.jar

echo "=== 4. Compiling Java source files with javac ==="
javac -encoding UTF-8 -source 8 -target 8 \
    -d android-build/bin \
    -cp "/usr/lib/android-sdk/platforms/android-23/android.jar:android-build/gen" \
    android-build/gen/com/marthafashion/app/R.java \
    android-build/src/com/marthafashion/app/*.java

echo "=== 5. Converting bytecode to classes.dex with dalvik-exchange ==="
/usr/bin/dalvik-exchange --dex --output=android-build/dex/classes.dex android-build/bin/

echo "=== 6. Packaging APK with aapt ==="
rm -f android-build/unaligned.apk android-build/aligned.apk
aapt package -f \
    -M android-build/AndroidManifest.xml \
    -S android-build/res \
    -A android-build/assets \
    -I /usr/lib/android-sdk/platforms/android-23/android.jar \
    -F android-build/unaligned.apk

# Add classes.dex into unaligned.apk
(cd android-build/dex && aapt add ../unaligned.apk classes.dex)

echo "=== 7. 4-byte zip alignment ==="
zipalign -f -p 4 android-build/unaligned.apk android-build/aligned.apk

echo "=== 8. Signing APK with apksigner (v1, v2, v3) ==="
mkdir -p public
apksigner sign \
    --ks martha.keystore \
    --ks-pass pass:martha2024 \
    --key-pass pass:martha2024 \
    --out public/martha-fashion.apk \
    android-build/aligned.apk

echo "=== 9. Verifying APK signature ==="
apksigner verify --verbose --print-certs public/martha-fashion.apk

echo "=== SUCCESS! Fully autonomous installable Android APK compiled at public/martha-fashion.apk ==="
ls -lh public/martha-fashion.apk
