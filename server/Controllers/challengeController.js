const Challenge = require("../models/Challenges/challenges");
const { generateChallengeContent } = require("../Services/chatgpt.service");

const Participation = require("../models/Challenges/participation.model");
const Commute = require("../models/Commute");

const CHALLENGE_MODE_TO_COMMUTE_TYPE = {
  BUS: "Bus",
  TRAIN: "Train",
  BIKE: "Bike",
  WALK: "Walk",
  CAR: "Car",
  VAN: "Car",
};

const EXPIRED_MESSAGE = "This challenge has expired.";

function hasExpiredDeadline(challenge) {
  if (!challenge?.deadline) return false;
  return new Date(challenge.deadline).getTime() < Date.now();
}

function computeDeadlineFromDuration(durationDays) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + Number(durationDays));
  return deadline;
}

exports.createChallenge = async (req, res) => {
  try {
    const {
      transportMode,
      emissionTarget,
      durationDays,
      difficulty,
      type,
      rewardPoints,
    } = req.body;

    const aiContent = await generateChallengeContent({
      transportMode,
      emissionTarget,
      durationDays,
      difficulty,
      type,
    });

    const deadline = computeDeadlineFromDuration(durationDays);

    const challenge = await Challenge.create({
      title: aiContent.title,
      description: aiContent.description,
      tagline: aiContent.tagline,
      transportMode,
      emissionTarget,
      durationDays,
      difficulty,
      rewardPoints,
      type,
      deadline,
      createdBy: req.user.id,
    });

    res.status(201).json(challenge);
  } catch (error) {
    console.error("Create challenge failed:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getChallenges = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, difficulty, transportMode } = req.query;

    await Challenge.updateMany(
      {
        isDeleted: false,
        status: "ACTIVE",
        deadline: { $ne: null, $lt: new Date() },
      },
      { $set: { status: "EXPIRED" } }
    );

    const filter = {
      isDeleted: false,
      status: "ACTIVE",
      $or: [{ deadline: null }, { deadline: { $gt: new Date() } }],
    };

    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (transportMode) filter.transportMode = transportMode;

    const challenges = await Challenge.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Challenge.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      challenges,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAdminChallenges = async (req, res) => {
  try {
    const { page = 1, limit = 100, type, difficulty, transportMode, status } = req.query;

    await Challenge.updateMany(
      {
        isDeleted: false,
        status: "ACTIVE",
        deadline: { $ne: null, $lt: new Date() },
      },
      { $set: { status: "EXPIRED" } }
    );

    const filter = { isDeleted: false };

    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (transportMode) filter.transportMode = transportMode;
    if (status) filter.status = status;

    const challenges = await Challenge.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Challenge.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      challenges,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (challenge.status === "ACTIVE" && hasExpiredDeadline(challenge)) {
      challenge.status = "EXPIRED";
      await challenge.save();
    }

    res.json(challenge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    if (req.body.emissionTarget !== undefined) {
      challenge.emissionTarget = req.body.emissionTarget;
    }

    if (req.body.durationDays !== undefined) {
      challenge.durationDays = req.body.durationDays;
    }

    if (req.body.rewardPoints !== undefined) {
      challenge.rewardPoints = req.body.rewardPoints;
    }

    if (req.body.deadline !== undefined) {
      challenge.deadline = req.body.deadline === null || req.body.deadline === ""
        ? null
        : new Date(req.body.deadline);
    } else if (req.body.durationDays !== undefined) {
      challenge.deadline = computeDeadlineFromDuration(challenge.durationDays);
    }

    if (req.body.status !== undefined) {
      challenge.status = req.body.status;
    }

    if (challenge.status === "ACTIVE" && hasExpiredDeadline(challenge)) {
      challenge.status = "EXPIRED";
    }

    await challenge.save();

    res.json(challenge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    challenge.isDeleted = true;
    challenge.status = "INACTIVE";

    await challenge.save();

    res.json({ message: "Challenge soft deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRecommendedChallenges = async (req, res) => {
  try {
    await Challenge.updateMany(
      {
        isDeleted: false,
        status: "ACTIVE",
        deadline: { $ne: null, $lt: new Date() },
      },
      { $set: { status: "EXPIRED" } }
    );

    let filter = { status: "ACTIVE", isDeleted: false };
    filter.$or = [{ deadline: null }, { deadline: { $gt: new Date() } }];

    if (req.query.excludeMode) {
      filter.transportMode = { $ne: req.query.excludeMode };
    }

    const challenges = await Challenge.find(filter)
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.joinChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge || challenge.isDeleted) {
      return res.status(404).json({ message: "Challenge not available" });
    }

    if (challenge.status === "EXPIRED" || hasExpiredDeadline(challenge)) {
      challenge.status = "EXPIRED";
      await challenge.save();
      return res.status(409).json({ message: EXPIRED_MESSAGE });
    }

    if (challenge.status !== "ACTIVE") {
      return res.status(404).json({ message: "Challenge not available" });
    }

    const existingParticipation = await Participation.findOne({
      user: req.user.id,
      challenge: challenge._id,
    });

    if (existingParticipation) {
      if (existingParticipation.status === "ACTIVE") {
        return res.status(400).json({ message: "Already joined this challenge" });
      }

      if (existingParticipation.status === "COMPLETED") {
        return res.status(409).json({ message: "Challenge already completed" });
      }

      if (existingParticipation.status === "LEFT") {
        existingParticipation.status = "ACTIVE";
        existingParticipation.joinedAt = new Date();
        existingParticipation.lastAutoSyncAt = new Date();
        await existingParticipation.save();
        return res.status(200).json(existingParticipation);
      }
    }

    const participation = await Participation.create({
      user: req.user.id,
      challenge: challenge._id,
    });

    res.status(201).json(participation);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Already joined this challenge" });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.getMyChallenges = async (req, res) => {
  try {
    const participations = await Participation.find({
      user: req.user.id,
      status: { $in: ["ACTIVE", "COMPLETED"] },
    }).populate("challenge");

    res.status(200).json(participations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const autoSync = req.body.auto === true || req.body.auto === "true";
    const manualProgress = Number(req.body.progress);

    if (!autoSync && (!Number.isFinite(manualProgress) || manualProgress <= 0)) {
      return res.status(400).json({ message: "Progress increment must be a positive number" });
    }

    const participation = await Participation.findOne({
      user: req.user.id,
      challenge: req.params.id,
    });

    if (!participation) {
      return res.status(404).json({ message: "Participation not found" });
    }

    if (participation.status !== "ACTIVE") {
      return res.status(409).json({
        message: `Cannot update progress because participation is ${participation.status}.`,
      });
    }

    const challenge = await Challenge.findById(req.params.id);

    if (!challenge || challenge.isDeleted) {
      return res.status(404).json({ message: "Challenge not available" });
    }

    if (challenge.status === "EXPIRED" || hasExpiredDeadline(challenge)) {
      challenge.status = "EXPIRED";
      await challenge.save();
      return res.status(409).json({ message: EXPIRED_MESSAGE });
    }

    if (challenge.status !== "ACTIVE") {
      return res.status(404).json({ message: "Challenge not available" });
    }

    let progressIncrement = manualProgress;

    if (autoSync) {
      const transportType = CHALLENGE_MODE_TO_COMMUTE_TYPE[challenge.transportMode];
      const syncWindowStart = participation.lastAutoSyncAt || participation.joinedAt || participation.createdAt;

      const commuteFilter = {
        userId: req.user.id,
        createdAt: { $gt: syncWindowStart },
      };

      if (transportType) {
        commuteFilter.transportType = transportType;
      }

      const commutes = await Commute.find(commuteFilter)
        .select("co2Saved createdAt")
        .sort({ createdAt: 1 });

      progressIncrement = commutes.reduce((sum, c) => sum + Number(c.co2Saved || 0), 0);

      if (commutes.length > 0) {
        participation.lastAutoSyncAt = commutes[commutes.length - 1].createdAt;
      }

      if (progressIncrement <= 0) {
        return res.status(200).json({
          ...participation.toObject(),
          autoIncrement: 0,
          message: "No new commute progress available for this challenge yet.",
        });
      }
    }

    participation.progress += progressIncrement;

    if (participation.progress >= challenge.emissionTarget) {
      participation.status = "COMPLETED";

      // Settlement is idempotent on the participation document.
      if (!participation.rewardGranted) {
        participation.rewardGranted = true;
        participation.rewardedPoints = challenge.rewardPoints || 0;
        participation.rewardGrantedAt = new Date();
      }
    }

    await participation.save();

    res.status(200).json({
      ...participation.toObject(),
      autoIncrement: autoSync ? progressIncrement : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.leaveChallenge = async (req, res) => {
  try {
    const participation = await Participation.findOne({
      user: req.user.id,
      challenge: req.params.id,
      status: "ACTIVE",
    });

    if (!participation) {
      return res.status(404).json({ message: "Participation not found" });
    }

    participation.status = "LEFT";
    await participation.save();

    res.status(200).json({ message: "Left challenge successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
