#!/bin/bash
# Fix permissions on dist directory
sudo chown -R $USER:$USER dist 2>/dev/null || echo "Note: You may need to run: sudo chown -R $USER:$USER dist"

