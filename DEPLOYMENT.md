# Deployment Guide

This guide will help you deploy the Textile Marketplace to production using Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account with the project pushed to a repository
- MongoDB Atlas account (or your own MongoDB instance)
- Vercel account (for frontend deployment)
- Render account (for backend deployment)
- Groq API key (for AI functionality)

## Step 1: Prepare for Deployment

### 1.1 Update Environment Variables

**Server Environment Variables (`.env`):**
- Set `NODE_ENV=production`
- Update `CLIENT_URL` to your Vercel app URL (after deploying frontend)
- Ensure `MONGO_URI` points to your production MongoDB
- Update `JWT_SECRET` to a secure random string
- Add your `GROQ_API_KEY` for AI functionality

**Client Environment Variables (`.env`):**
- Set `VITE_API_URL` to your Render backend URL (after deploying backend)

### 1.2 Build the Frontend Locally (Optional)

```bash
cd client
npm run build
```

This will create a `dist` folder that can be deployed.

## Step 2: Deploy Backend to Render

### 2.1 Create a New Web Service on Render

1. Go to [Render.com](https://render.com) and log in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `textile-marketplace-api`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Runtime**: Node 18+

### 2.2 Add Environment Variables in Render

Add these environment variables in the Render dashboard:

```
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-vercel-app.vercel.app
GROQ_API_KEY=your_groq_api_key
HF_API_KEY=your_huggingface_api_key (optional)
ADMIN_EMAIL=admin@textile.dev
ADMIN_PASSWORD=your_secure_admin_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=support@yourdomain.com
```

### 2.3 Deploy and Test

1. Click "Create Web Service"
2. Wait for the deployment to complete
3. Note your Render service URL (e.g., `https://textile-marketplace-api.onrender.com`)
4. Test the health endpoint: `https://your-service.onrender.com/api/health`

### 2.4 Seed Admin Account

After successful deployment, run the admin seed script:

1. Go to your Render service dashboard
2. Click "Shell" in the left sidebar
3. Run: `npm run seed:admin`
4. This will create the admin account with credentials from your environment variables

## Step 3: Deploy Frontend to Vercel

### 3.1 Create a New Project on Vercel

1. Go to [Vercel.com](https://vercel.com) and log in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Add Environment Variables in Vercel

Add this environment variable:

```
VITE_API_URL=https://your-render-service.onrender.com/api
```

### 3.3 Deploy and Test

1. Click "Deploy"
2. Wait for the deployment to complete
3. Note your Vercel app URL (e.g., `https://textile-marketplace.vercel.app`)
4. Test the application by visiting the URL

### 3.4 Update Backend CLIENT_URL

Go back to your Render service and update the `CLIENT_URL` environment variable to match your Vercel app URL. Then redeploy the backend.

## Step 4: Post-Deployment Checklist

### 4.1 Test Core Functionality

- [ ] User registration (buyer and supplier)
- [ ] User login/logout
- [ ] Supplier onboarding flow
- [ ] Product creation and image upload
- [ ] Product browsing and search
- [ ] Cart functionality
- [ ] Checkout process
- [ ] Order status updates
- [ ] AI chat functionality
- [ ] Admin panel access

### 4.2 Test AI Features

- [ ] Semantic search
- [ ] Product recommendations
- [ ] AI chat responses
- [ ] Voice input/output

### 4.3 Security Checks

- [ ] JWT tokens are working correctly
- [ ] Protected routes are secure
- [ ] Environment variables are not exposed
- [ ] File uploads are working and secure
- [ ] CORS is properly configured

### 4.4 Performance Checks

- [ ] Page load times are acceptable
- [ ] API responses are fast
- [ ] Images are optimized
- [ ] Database queries are efficient

## Alternative Deployment Options

### Railway

1. Create a Railway account
2. Import your GitHub repository
3. Configure similar to Render
4. Set environment variables
5. Deploy

### DigitalOcean App Platform

1. Create a DigitalOcean account
2. Create a new App
3. Connect your GitHub repository
4. Configure build and run commands
5. Set environment variables
6. Deploy

### Self-Hosting (VPS)

1. Get a VPS (DigitalOcean, Linode, etc.)
2. Install Node.js, MongoDB, and Nginx
3. Clone your repository
4. Install dependencies
5. Set up PM2 for process management
6. Configure Nginx as reverse proxy
7. Set up SSL with Let's Encrypt
8. Configure environment variables
9. Start the services

## Troubleshooting

### Common Issues

**Build fails on Render:**
- Check build logs for specific errors
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**Environment variables not working:**
- Double-check variable names (case-sensitive)
- Ensure no trailing spaces
- Restart the service after updating variables

**CORS errors:**
- Verify CLIENT_URL is correct in backend
- Check CORS configuration in server/app.js
- Ensure frontend is calling correct API URL

**Database connection issues:**
- Verify MONGO_URI is correct
- Check MongoDB Atlas IP whitelist
- Ensure database user has proper permissions

**AI features not working:**
- Verify GROQ_API_KEY is valid
- Check API key has sufficient credits
- Review API logs for specific errors

## Monitoring and Maintenance

### Recommended Tools

- **Error Tracking**: Sentry
- **Analytics**: Google Analytics
- **Uptime Monitoring**: UptimeRobot
- **Performance**: Lighthouse, WebPageTest
- **Logs**: Render Dashboard, Vercel Analytics

### Regular Maintenance Tasks

- Monitor error logs regularly
- Update dependencies monthly
- Review and optimize database queries
- Check API rate limits
- Monitor storage usage (especially uploads)
- Backup database regularly

## Scaling Considerations

When your application grows, consider:

- **Database**: Use MongoDB Atlas for automatic scaling
- **CDN**: Use Cloudflare for static assets
- **Load Balancing**: Add multiple backend instances
- **Caching**: Implement Redis for session and API caching
- **File Storage**: Move to AWS S3 or similar for uploads
- **Email**: Use dedicated email service (SendGrid, Mailgun)

## Security Best Practices

1. **Never commit .env files** to version control
2. **Use strong, random secrets** for JWT and other sensitive data
3. **Enable HTTPS** in production (automatic on Vercel/Render)
4. **Implement rate limiting** on API endpoints
5. **Validate and sanitize** all user inputs
6. **Keep dependencies updated** to patch security vulnerabilities
7. **Use CORS** properly to restrict cross-origin requests
8. **Implement proper authentication** for all protected routes
9. **Regular security audits** of your codebase
10. **Monitor for suspicious activity** in logs

## Support

For issues specific to:
- **Vercel**: https://vercel.com/docs
- **Render**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Groq API**: https://console.groq.com/docs

## Cost Estimates

**Render (Free Tier):**
- Web Service: Free (with limitations)
- Database: Use MongoDB Atlas free tier

**Vercel (Free Tier):**
- Hosting: Free for personal projects
- Bandwidth: 100GB/month
- Build minutes: 6,000/month

**MongoDB Atlas (Free Tier):**
- Shared cluster: 512MB storage
- Good for development and small production apps

**Groq API:**
- Free tier available for development
- Check current pricing for production usage

Total cost for small production app: $0/month (using free tiers)
Estimated cost for medium app: $20-50/month