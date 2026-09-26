#!/usr/bin/env bash
# Build, sign, notarize and staple Chops for macOS on this machine.
#
# Notarization credentials come from a notarytool Keychain profile, so no
# password lives in this repo or in environment variables. One-time setup
# (Apple prompts for your app-specific password and stores it in your Keychain):
#
#   xcrun notarytool store-credentials chops-notary \
#     --apple-id <your Apple ID email> --team-id A52FG8L4Z8
#
# App-specific passwords are created at https://account.apple.com (Sign-In and
# Security > App-Specific Passwords). Override the profile name with
# CHOPS_NOTARY_PROFILE. GitHub release builds notarize separately, using the
# repository secrets in .github/workflows/build.yml.
set -euo pipefail

PROFILE="${CHOPS_NOTARY_PROFILE:-chops-notary}"
cd "$(dirname "$0")/.."

if ! xcrun notarytool history --keychain-profile "$PROFILE" >/dev/null 2>&1; then
  echo "No working notarytool profile named \"$PROFILE\"." >&2
  echo "Create it with: xcrun notarytool store-credentials $PROFILE --apple-id <email> --team-id A52FG8L4Z8" >&2
  exit 1
fi

npm run tauri:build

BUNDLE=src-tauri/target/release/bundle
APP="$BUNDLE/macos/Chops.app"
VERSION=$(node -p "require('./package.json').version")
DMG=$(ls "$BUNDLE"/dmg/Chops_"$VERSION"_*.dmg | head -1)

echo "Submitting $DMG for notarization (usually a few minutes)..."
xcrun notarytool submit "$DMG" --keychain-profile "$PROFILE" --wait

# Notarizing the DMG also covers the app inside it, so both can be stapled
xcrun stapler staple "$DMG"
xcrun stapler staple "$APP"

spctl --assess --type open --context context:primary-signature -v "$DMG"
spctl --assess --type execute -v "$APP"
echo "Notarized: $APP"
echo "Notarized: $DMG"
