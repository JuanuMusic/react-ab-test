# 4.0.4
Fixed error on Server Side rendering hydration issues.

# 4.0.3
Added console debugging to know store used.

# 4.0.2
The store now has a cookie-based implementation that will work in both client and server environments where cookies are supported. The implementation has this priority:
- Cookies - used when document.cookie is available (works for both client and server with cookie access)
- LocalStorage - used as a fallback when cookies aren't available but localStorage is
- Memory store - used for server environments where neither cookies nor localStorage are available

# 4.0.1
Initial release with support for React 19 on Next.js