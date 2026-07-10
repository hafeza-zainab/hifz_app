# Release Checklist

## Pre-Release

### Environment
- [ ] Backend `.env` file configured with all required variables
- [ ] Frontend `.env` file configured (if needed)
- [ ] JWT_SECRET is strong and unique (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] GROQ_API_KEY is valid and has sufficient credits
- [ ] ALLOWED_ORIGINS includes production domain(s)
- [ ] NODE_ENV set to `production`

### Build
- [ ] Frontend production build succeeds: `npm run build`
- [ ] Build output verified in `frontend/build/`
- [ ] No build warnings or errors
- [ ] Bundle size is acceptable (check build output)
- [ ] Environment variables are not hardcoded in build

### Database
- [ ] Database schema is up to date
- [ ] All migrations applied successfully
- [ ] Database backup created before release
- [ ] Database file permissions are correct
- [ ] SQLite file is in correct location (`backend/data/quran.db`)

### Backups
- [ ] Database backup created and stored securely
- [ ] Backup location documented
- [ ] Backup restoration tested
- [ ] Backup schedule established (if applicable)

## Deployment

### Backend
- [ ] Backend dependencies installed: `npm install --production`
- [ ] Environment variables loaded correctly
- [ ] Database connection verified
- [ ] Server starts without errors
- [ ] Health check endpoint responds (if implemented)
- [ ] API routes are accessible
- [ ] Authentication middleware working

### Frontend
- [ ] Frontend build deployed to web server
- [ ] Static files served correctly
- [ ] API proxy configured (if needed)
- [ ] CORS configuration matches production domain
- [ ] HTTPS enabled
- [ ] Assets load correctly

### Verification
- [ ] User can access application
- [ ] Login works correctly
- [ ] All features functional
- [ ] API calls succeed
- [ ] No console errors in browser
- [ ] No server errors in logs

## Post-Release

### Monitoring
- [ ] Error tracking configured (Sentry, LogRocket, etc.)
- [ ] Performance monitoring configured
- [ ] Database query monitoring
- [ ] API rate limit monitoring
- [ ] AI API usage monitoring

### Rollback
- [ ] Rollback procedure documented
- [ ] Previous version backup available
- [ ] Database rollback tested
- [ ] Frontend rollback tested
- [ ] Rollback time < 5 minutes

### Documentation
- [ ] Release notes published
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Known issues documented
- [ ] Migration notes documented

## Security Checklist

### Authentication
- [ ] JWT_SECRET is not committed to version control
- [ ] JWT expiration is reasonable (7d recommended)
- [ ] Password hashing uses bcrypt with sufficient rounds
- [ ] Token refresh mechanism working

### API Security
- [ ] Rate limiting enabled on all endpoints
- [ ] CORS configured correctly
- [ ] Helmet middleware enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS protection (CSP headers)

### Data Security
- [ ] Sensitive data not logged
- [ ] Database file permissions restricted
- [ ] Environment variables not exposed
- [ ] API keys not exposed in client code

## Performance Checklist

### Frontend
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Code splitting implemented
- [ ] Cache headers configured

### Backend
- [ ] Database queries optimized
- [ ] Indexes created on frequently queried columns
- [ ] Response times acceptable
- [ ] Memory usage monitored
- [ ] Connection pooling configured (if using PostgreSQL)

## Testing Checklist

### Manual Testing
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works (if implemented)
- [ ] All features tested end-to-end
- [ ] Error states tested
- [ ] Loading states tested

### Automated Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if implemented)
- [ ] Test coverage meets threshold (if defined)

## Communication

### Stakeholders
- [ ] Team notified of release
- [ ] Users notified of new features
- [ ] Documentation updated
- [ ] Support team briefed

### Incident Response
- [ ] On-call schedule established
- [ ] Incident response plan documented
- [ ] Emergency contacts available
- [ ] Monitoring alerts configured

## Final Verification

- [ ] All checklist items completed
- [ ] Sign-off from lead developer
- [ ] Sign-off from QA (if applicable)
- [ ] Release approved by product owner
- [ ] Release scheduled for appropriate time
