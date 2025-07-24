#!/bin/bash
# Script to launch VS Code with the Postman extension and set up the workspace

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "VS Code is not installed or not in PATH"
    exit 1
fi

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$(dirname "$DIR")"

# Launch VS Code with the pip-vc-service workspace
code "$PARENT_DIR/pip-vc-service.code-workspace"

# Instructions for the user
echo "VS Code is launching..."
echo ""
echo "To set up Postman in VS Code:"
echo "1. Click on the Postman icon in the Activity Bar (side bar)"
echo "2. Sign in to your Postman account"
echo "3. Import the collections from the project"
echo "4. Set up your environments"
echo ""
echo "See the POSTMAN_GUIDE.md file for detailed instructions."
