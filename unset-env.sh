#!/bin/bash

ENV_FILE=".env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "No .env file found. Nothing to unset."
    exit 0
fi

# Read each line from .env file
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" ]] || [[ "$line" =~ ^# ]]; then
        continue
    fi
    
    # Extract variable name (everything before the = sign)
    var_name=$(echo "$line" | cut -d= -f1)
    
    # Trim whitespace
    var_name=$(echo "$var_name" | xargs)
    
    # Unset the variable if it's not empty
    if [ ! -z "$var_name" ]; then
        unset "$var_name"
        echo "Unset $var_name"
    fi
done < "$ENV_FILE"

echo "Environment variables have been unset."