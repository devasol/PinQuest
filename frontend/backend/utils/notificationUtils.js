const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/posts');

// Create notification when user likes a post
const createLikeNotification = async (postId, likerId, postOwnerId) => {
  try {
    if (likerId.toString() === postOwnerId.toString()) {
      // Don't notify if user liked their own post
      return;
    }
    
    const post = await Post.findById(postId);
    const liker = await User.findById(likerId);
    
    if (!post || !liker) return;
    
    const notification = new Notification({
      recipient: postOwnerId,
      sender: likerId,
      type: 'like',
      post: postId,
      message: `${liker.name} liked your post: "${post.title}"`
    });
    
    await notification.save();
  } catch (error) {
    console.error('Error creating like notification:', error);
  }
};

// Create notification when user comments on a post
const createCommentNotification = async (postId, commenterId, postOwnerId, commentText) => {
  try {
    if (commenterId.toString() === postOwnerId.toString()) {
      // Don't notify if user commented on their own post
      return;
    }
    
    const post = await Post.findById(postId);
    const commenter = await User.findById(commenterId);
    
    if (!post || !commenter) return;
    
    const notification = new Notification({
      recipient: postOwnerId,
      sender: commenterId,
      type: 'comment',
      post: postId,
      message: `${commenter.name} commented on your post: "${post.title}"`
    });
    
    await notification.save();
  } catch (error) {
    console.error('Error creating comment notification:', error);
  }
};

// Create notification when user follows another user
const createFollowNotification = async (followerId, followedUserId) => {
  try {
    if (followerId.toString() === followedUserId.toString()) {
      // Don't notify if user follows themselves (shouldn't happen anyway)
      return;
    }
    
    const follower = await User.findById(followerId);
    
    if (!follower) return;
    
    const notification = new Notification({
      recipient: followedUserId,
      sender: followerId,
      type: 'follow',
      message: `${follower.name} started following you`
    });
    
    await notification.save();
  } catch (error) {
    console.error('Error creating follow notification:', error);
  }
};

// Create notification when mentioned in a comment
const createMentionNotification = async (postId, mentionerId, mentionedUserId, commentText) => {
  try {
    if (mentionerId.toString() === mentionedUserId.toString()) {
      // Don't notify if user mentioned themselves
      return;
    }
    
    const post = await Post.findById(postId);
    const mentioner = await User.findById(mentionerId);
    
    if (!post || !mentioner) return;
    
    const notification = new Notification({
      recipient: mentionedUserId,
      sender: mentionerId,
      type: 'mention',
      post: postId,
      message: `${mentioner.name} mentioned you in a comment: "${post.title}"`
    });
    
    await notification.save();
  } catch (error) {
    console.error('Error creating mention notification:', error);
  }
};

module.exports = {
  createLikeNotification,
  createCommentNotification,
  createFollowNotification,
  createMentionNotification
};