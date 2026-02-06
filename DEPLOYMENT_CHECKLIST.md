# ✅ Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

- [ ] All code changes committed to Git
- [ ] Code pushed to GitHub repository
- [ ] Build tested locally (`npm run build`)
- [ ] Preview tested locally (`npm run preview`)
- [ ] All tests passing (`npm test`)

## Vercel Account Setup

- [ ] Vercel account created at [vercel.com](https://vercel.com)
- [ ] GitHub account connected to Vercel
- [ ] Repository access granted to Vercel

## Initial Deployment

- [ ] Repository imported to Vercel
- [ ] Framework detected as "Vite"
- [ ] Build settings verified:
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`
- [ ] Click "Deploy" button
- [ ] Wait for deployment to complete (1-2 minutes)
- [ ] Deployment successful message received
- [ ] Live URL obtained (e.g., `https://your-app.vercel.app`)

## Post-Deployment Testing

Test all critical features on the live site:

### Authentication
- [ ] Navigate to live URL
- [ ] Access `/login` page loads correctly
- [ ] User login works (`user@example.com / User123!`)
- [ ] Access `/login/admin` page loads correctly
- [ ] Admin login works (`admin@example.com / Admin123!`)
- [ ] Logout functionality works

### Routing
- [ ] Home page (`/`) loads after login
- [ ] Activity page (`/activity`) accessible
- [ ] Admin dashboard (`/admin`) accessible (admin only)
- [ ] File access page (`/file/:id`) works with tokens
- [ ] Routes work after page refresh (no 404s)
- [ ] Direct URL access works for all routes

### File Sharing Features
- [ ] File upload interface loads
- [ ] File cards display correctly
- [ ] Copy link button works
- [ ] File download links function properly
- [ ] Token validation works
- [ ] Expired/revoked links show proper errors

### UI/UX
- [ ] All pages render correctly
- [ ] Navigation menu works
- [ ] Responsive design works on mobile
- [ ] Images and icons load properly
- [ ] CSS styling applied correctly
- [ ] Animations work smoothly

### Performance
- [ ] Initial page load is fast (< 3 seconds)
- [ ] Navigation between pages is smooth
- [ ] No console errors in browser
- [ ] No broken links or resources

## Optional Enhancements

- [ ] Custom domain configured (if desired)
- [ ] DNS records updated for custom domain
- [ ] SSL certificate verified (automatic with Vercel)
- [ ] Environment variables added (if needed)
- [ ] Analytics enabled (Pro plan)
- [ ] Error tracking configured

## Continuous Deployment Setup

- [ ] Push-to-deploy verified (make a test commit)
- [ ] Preview deployments working for PRs
- [ ] Production branch configured (usually `main`)
- [ ] Deployment notifications enabled (optional)

## Documentation

- [ ] Deployment URL shared with team
- [ ] README updated with live URL
- [ ] Environment variables documented (if any)
- [ ] Custom domain instructions provided (if applicable)

## Monitoring

- [ ] Deployment logs reviewed
- [ ] No build warnings or errors
- [ ] Analytics baseline established (if using Pro)
- [ ] Error monitoring configured (if needed)

## Rollback Plan

In case of issues:
- [ ] Know how to rollback to previous deployment
- [ ] Previous deployment URL saved
- [ ] Team notified of deployment schedule

## Success Criteria

Your deployment is successful when:
- ✅ Site is accessible via Vercel URL
- ✅ All features work as expected
- ✅ No errors in browser console
- ✅ No build errors or warnings
- ✅ Authentication flows work correctly
- ✅ Routes and navigation function properly
- ✅ Mobile responsive design verified

---

## Quick Rollback (If Needed)

If something goes wrong:

1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Find previous working deployment
5. Click "⋯" menu → "Promote to Production"

---

## Next Deployment

For future updates, simply:
```bash
git add .
git commit -m "Your update message"
git push
```

Vercel handles the rest automatically! 🚀

---

**Questions?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) or [VISUAL_DEPLOYMENT_GUIDE.md](./VISUAL_DEPLOYMENT_GUIDE.md)
