<!-- version-type: patch -->

# @furystack/rest-service

## 🐛 Bug Fixes

- Fixed sendFile in static file serving to resolve/reject from the response stream lifecycle and clean up the read stream on disconnect or error, preventing requests from hanging when clients abort downloads.
