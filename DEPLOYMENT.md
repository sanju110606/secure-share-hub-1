# Deploying to Vercel

This guide will help you deploy the VaultDrop secure file sharing application to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier works great!)
- A GitHub account (if deploying via GitHub integration)
- Node.js installed locally (for testing)

## Deployment Methods

### Method 1: Deploy via Vercel Dashboard (Recommended for beginners)

This is the easiest way to deploy your application.

#### Step 1: Push to GitHub

Make sure your code is pushed to a GitHub repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### Step 2: Import to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository (`VHarichandana/secure-share-hub`)
4. Vercel will automatically detect that it's a Vite project

#### Step 3: Configure Build Settings

Vercel should auto-detect these settings, but verify:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

#### Step 4: Deploy

Click "Deploy" and wait for the build to complete (usually 1-2 minutes).

Once complete, you'll receive a URL like: `https://your-project-name.vercel.app`

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Deploy

From your project directory:

```bash
# For production deployment
vercel --prod

# For preview deployment
vercel
```

The CLI will guide you through the setup and deploy your application.

## Configuration Details

This project includes a `vercel.json` configuration file that ensures:

- React Router works correctly with client-side routing
- Build commands are properly configured
- Static assets are served correctly

### Key Configuration in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

The `rewrites` section is crucial for single-page applications (SPAs) like this one. It ensures that all routes are handled by React Router instead of Vercel's routing.

## Environment Variables

If your application uses environment variables:

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add your variables for each environment (Production, Preview, Development)

**Note:** This current version uses mock data and doesn't require environment variables, but if you add a backend API, you'll need to configure them.

## Custom Domain

### Adding a Custom Domain

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Domains"
3. Click "Add Domain"
4. Follow the instructions to configure your DNS records

Vercel provides free SSL certificates for all custom domains.

## Post-Deployment

### Testing Your Deployment

After deployment, test these key features:

1. **User Login:** Navigate to `/login` and test with `user@example.com / User123!`
2. **Admin Login:** Navigate to `/login/admin` and test with `admin@example.com / Admin123!`
3. **File Access:** Test file download links
4. **Route Protection:** Verify admin routes are protected
5. **Responsive Design:** Test on mobile devices

### Monitoring

Vercel provides:
- Automatic deployment logs
- Analytics (on paid plans)
- Error tracking
- Performance insights

Access these from your project dashboard at [https://vercel.com/dashboard](https://vercel.com/dashboard)

## Continuous Deployment

Once connected to GitHub, Vercel automatically:

- Deploys the `main` branch to production
- Creates preview deployments for pull requests
- Runs builds on every push

## Troubleshooting

### Build Fails

1. Check the build logs in Vercel dashboard
2. Ensure `package.json` dependencies are correct
3. Try building locally with `npm run build`

### Routes Not Working (404 on refresh)

- Verify `vercel.json` includes the rewrite rules
- Check that `outputDirectory` is set to `dist`

### Assets Not Loading

- Ensure all assets are in the `public` directory or properly imported
- Check browser console for CORS or path errors

## Local Testing Before Deployment

Before deploying, test your build locally:

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

Open `http://localhost:4173` to test the production build locally.

## Performance Optimization

For better performance on Vercel:

1. **Enable Edge Caching:** Vercel automatically caches static assets
2. **Use Image Optimization:** Consider using Vercel's image optimization for uploaded files
3. **Monitor Bundle Size:** Keep the main bundle under 500KB (see build warnings)

## Costs

- **Free Tier:** Perfect for personal projects
  - 100GB bandwidth
  - Unlimited websites
  - Automatic HTTPS
  
- **Pro Tier ($20/month):** For production apps
  - Analytics
  - More bandwidth
  - Password protection
  - Priority support

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [React Router on Vercel](https://vercel.com/guides/deploying-react-with-vercel)

## Getting Help

If you encounter issues:
1. Check [Vercel Status](https://www.vercel-status.com/)
2. Visit [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Consult the [troubleshooting section](#troubleshooting) above
