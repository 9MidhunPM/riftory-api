const express = require('express');
const router = express.Router();
const { DeviceProfile } = require('../models');
const { uploadImage, deleteImage } = require('../config/cloudinary');

/**
 * GET /api/profile/:deviceId
 * Get or create a device profile
 */
router.get('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Find or create profile
    let profile = await DeviceProfile.findOne({ deviceId });

    if (!profile) {
      // Create new profile for device
      profile = new DeviceProfile({ deviceId });
      await profile.save();
      console.log(`[Profile] Created new profile for device: ${deviceId}`);
    } else {
      // Update last active
      profile.lastActive = new Date();
      await profile.save();
    }

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('[Profile] Get error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

/**
 * PUT /api/profile/:deviceId
 * Update device profile
 */
router.put('/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { name, email, phone, address, avatar, settings } = req.body;

    let profile = await DeviceProfile.findOne({ deviceId });

    if (!profile) {
      profile = new DeviceProfile({ deviceId });
    }

    // Update fields
    if (name !== undefined) profile.name = name;
    if (email !== undefined) profile.email = email;
    if (phone !== undefined) profile.phone = phone;
    if (address !== undefined) profile.address = address;
    if (settings !== undefined) {
      profile.settings = { ...profile.settings, ...settings };
    }

    // Handle avatar upload
    if (avatar && avatar.startsWith('data:')) {
      // Delete old avatar if exists
      if (profile.avatar?.publicId) {
        await deleteImage(profile.avatar.publicId);
      }

      // Upload new avatar
      const uploadedAvatar = await uploadImage(avatar, 'riftory/avatars');
      profile.avatar = uploadedAvatar;
    }

    await profile.save();
    console.log(`[Profile] Updated profile for device: ${deviceId}`);

    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('[Profile] Update error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

/**
 * GET /api/profile/:deviceId/stats
 * Get user stats (listings count, favorites count)
 */
router.get('/:deviceId/stats', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { Product, Favorite } = require('../models');

    const [listingsCount, favoritesCount] = await Promise.all([
      Product.countDocuments({ deviceId, isActive: true }),
      Favorite.countDocuments({ deviceId }),
    ]);

    res.json({
      success: true,
      data: {
        listingsCount,
        favoritesCount,
      },
    });
  } catch (error) {
    console.error('[Profile] Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

module.exports = router;
