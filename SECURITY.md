# Security Policy

## Known Vulnerabilities

### Frontend Development Dependencies

The frontend currently has known vulnerabilities in development dependencies (as of 2024-11-21):

- **9 vulnerabilities (3 moderate, 6 high)** reported by `npm audit`
- All vulnerabilities are in **development-only dependencies** (transitive dependencies of `react-scripts@5.0.1`)
- **These do NOT affect production builds or runtime security**

#### Affected Packages
- `nth-check` - SVG optimization (build time only)
- `postcss` - CSS processing (build time only)
- `webpack-dev-server` - Development server (dev mode only)
- `svgo`, `css-select`, `@svgr/*` - Build tools (build time only)

#### Why Not Fixed?

Running `npm audit fix --force` would:
- Break the application (attempts to install `react-scripts@0.0.0`)
- Introduce breaking changes
- Not provide meaningful security improvements

The project uses **react-scripts@5.0.1**, which is the latest stable version from Create React App. These are known issues that the CRA team hasn't fully resolved.

#### Mitigation

**For Development:**
- These vulnerabilities only affect the development environment
- The main risks (ReDoS, command injection) require an attacker to control input to development tools
- Use the application only in trusted development environments

**For Production:**
- Production builds (`npm run build`) do not include these vulnerable packages
- The built application is static HTML/CSS/JS with no vulnerable code
- Deploy only the production build from the `build/` directory

#### Monitoring

We monitor these vulnerabilities and will update when:
1. Create React App releases an updated version of `react-scripts` that resolves these issues
2. A critical vulnerability affecting production builds is discovered

## Reporting a Vulnerability

If you discover a security vulnerability that affects the **production build** or **backend runtime**, please report it by:

1. Creating a private security advisory on GitHub
2. Contacting the repository maintainers directly
3. Providing detailed information about the vulnerability and its impact

## Security Best Practices

When deploying this application:

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **Database**: Use strong passwords and enable SSL for database connections
3. **API Keys**: Rotate API keys regularly (Supabase, Cloudinary)
4. **HTTPS**: Always serve the application over HTTPS in production
5. **Access Control**: Implement proper authentication and authorization
6. **Updates**: Keep Node.js and production dependencies updated

## Backend Security

The backend has **0 vulnerabilities** as of the last check. We maintain:

- Password hashing with bcryptjs
- Session-based authentication
- Input validation and sanitization
- Role-based access control
- Secure database queries using parameterized statements
