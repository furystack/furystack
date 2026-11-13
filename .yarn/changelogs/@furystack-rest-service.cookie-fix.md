<!-- version-type: patch -->

# @furystack/rest-service

## 🐛 Bug Fixes

- Set `SameSite`, optional `Secure`, and `Max-Age` attributes on session cookies and apply the same attributes when clearing them.
- Enforce `Secure` when `SameSite=None` to prevent browsers rejecting cross-site session cookies.
