const express = require("express")
const router = express.Router()
const admin = require("../controllers/adminController")
const postController = require('../controllers/postController');
const blogController = require('../controllers/blogController');
const engagementController = require('../controllers/engagementController');
const analyticsController = require('../controllers/analyticsController');
const notificationsController = require('../controllers/notificationsController');


// Dashboard routes
router.get("/stats", admin.getStats)
router.get("/status", admin.getStatus)
router.get("/activity", admin.getActivity)

// User management routes
router.get("/users", admin.getUsers)
router.delete("/users/:userId", admin.deleteUser)

// Bot management routes
router.get("/bots/status", admin.getBotStatus)
router.post("/bots/:botName/run", admin.runBot)
router.post("/bots/:botName/pause", admin.pauseBot)
router.post("/bots/:botName/restart", admin.resumeBot)
router.post('/bots/restart', admin.restartCronJobs)

// Cron job management routes
router.post("/cron/restart", admin.restartCronJobs)
router.post("/cron/:botName/pause", admin.pauseCronJob)

// Logs management routes
router.get("/logs", admin.getLogs)
router.delete("/logs", admin.clearLogs)

// Trap management routes
router.get("/traps", admin.getTrapData)

// Settings management routes
router.post("/settings", admin.saveSettings)
router.get("/settings", admin.getSettings)

//posts
router.post('/schedule-post', postController.schedulePost);
router.post('/preview-caption', postController.previewCaption);
router.post('/retry-failed', postController.retryFailedPosts);
router.post('/retry-platform', postController.retryByPlatform);
router.get('/queue', postController.getPostQueue);
router.get('/generated', postController.getGeneratedPosts);
router.delete('/:id', postController.deletePost);

// Create
router.post('/blog', blogController.createBlog);

// Read
router.get('/blog', blogController.getAllBlogs);
router.get('/blog/:id', blogController.getBlogById);

// Update
router.put('/blog/:id', blogController.updateBlog);

// Delete
router.delete('/blog/:id', blogController.deleteBlog);


// Manual publish trigger
router.post('/blog/publish-now', blogController.publishNow);


// Engagement routes
router.post('/engagement', engagementController.engagementCallback);

// Analytics routes
router.get('/engagement-stats', analyticsController.getEngagementStats);
router.get('/reward-stats', analyticsController.getRewardStats);
router.get('/top-users', analyticsController.getTopUsers);
router.get('/rewards/all', analyticsController.getAllRewards);
// Notifications routes
// Admin route to fetch all notifications
router.get('/notifications/all', notificationsController.getAllNotifications);

// Fetch all for user
router.get('/notifications/:user_id', notificationsController.getUserNotifications);

// Create
router.post('/notifications', notificationsController.createNotification);

// Mark as read
router.patch('/notifications/:id/read', notificationsController.markAsRead);

// Mark all as read
router.patch('/notifications/:user_id/mark-all-read', notificationsController.markAllAsRead);
// Delete
router.delete('/notifications/:id', notificationsController.deleteNotification);




module.exports = router
