const ActivityLog = require("../models/activitylog");
const User = require("../models/user");

exports.getLogs = async (req, res) => {
  try {
    const { userid, role, organizationId } = req;
    const {
      page = 1,
      limit = 10,
      search = "",
      action = "",
      module = "",
      startDate = "",
      endDate = "",
      targetUserId = ""
    } = req.query;

    const query = { organizationId };

    // Handle user access permissions
    let associatedUserIds = [userid];
    if (role === 'admin') {
      // Admin can see all users in organization
      const allUsers = await User.find({ organizationId }).select('_id');
      associatedUserIds = allUsers.map(u => u._id.toString());
    } else if (role === 'manager') {
      // Manager can see assigned users + own
      const manager = await User.findById(userid).select('assignedUsers');
      const assignedUsers = manager?.assignedUsers || [];
      associatedUserIds = [userid, ...assignedUsers.map(id => id.toString())];
    }

    // Apply user filter
    if (targetUserId && targetUserId.trim() !== '') {
      if (associatedUserIds.includes(targetUserId)) {
        query.user = targetUserId;
      } else {
        return res.status(403).json({ success: false, message: 'Unauthorized to view logs for this user' });
      }
    } else if (role !== 'admin') {
      query.user = { $in: associatedUserIds };
    }

    // Apply action filter - exact match
    if (action && action.trim() !== '') {
      query.action = action.trim();
    }

    // Apply module filter - exact match
    if (module && module.trim() !== '') {
      query.module = module.trim();
    }

    // Apply date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Apply search filter
    if (search && search.trim() !== '') {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const matchingUsers = await User.find({
        organizationId,
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');

      const searchConditions = [
        { action: searchRegex },
        { module: searchRegex },
        { entityName: searchRegex },
        { description: searchRegex }
      ];

      if (matchingUsers.length > 0) {
        searchConditions.push({ user: { $in: matchingUsers.map(u => u._id) } });
      }

      query.$or = searchConditions;
    }

    const logs = await ActivityLog.find(query)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { userid, role } = req;

    const log = await ActivityLog.findById(id);

    if (!log) {
      return res.status(404).json({ success: false, message: 'Activity log not found' });
    }

    if (role !== 'admin' && log.user.toString() !== userid) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this log' });
    }

    await ActivityLog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Activity log deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLog = async (req, res) => {
  try {
    const { action, module, entityId, entityName, description } = req.body;
    const userId = req.userid;
    const ipAddress = req.ip || req.connection.remoteAddress;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!action || !module) {
      return res.status(400).json({
        success: false,
        message: 'Action and module are required'
      });
    }

    const log = new ActivityLog({
      user: userId,
      action,
      module,
      entityId,
      entityName,
      description,
      ipAddress,
      organizationId: req.organizationId
    });

    await log.save();
    await log.populate('user', 'name email');

    res.status(201).json({
      success: true,
      data: log,
      message: 'Activity logged successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getLogStats = async (req, res) => {
  try {
    const { userid, role, organizationId } = req;

    const statsQuery = { organizationId };

    if (role === 'admin') {
      // Admin sees stats for all users in organization
      const allUsers = await User.find({ organizationId }).select('_id');
      statsQuery.user = { $in: allUsers.map(u => u._id) };
    } else if (role === 'manager') {
      // Manager sees stats for assigned users + own
      const manager = await User.findById(userid).select('assignedUsers');
      const assignedUsers = manager?.assignedUsers || [];
      statsQuery.user = { $in: [userid, ...assignedUsers.map(id => id.toString())] };
    } else {
      statsQuery.user = userid;
    }

    const stats = await ActivityLog.aggregate([
      { $match: statsQuery },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 }
        }
      }
    ]);

    const moduleStats = await ActivityLog.aggregate([
      { $match: statsQuery },
      {
        $group: {
          _id: "$module",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        actionStats: stats,
        moduleStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
