const Challenge = require("../Models/Challenges/challenges");
const { generateChallengeContent } = require("../Services/chatgpt.service");

const Participation = require("../Models/Challenges/participation.model");


exports.createChallenge = async (req, res) => {
  try {
    const {
      transportMode,
      emissionTarget,
      durationDays,
      difficulty,
      type,
      rewardPoints
    } = req.body;

    // Ask ChatGPT to write description + tagline
    const aiContent = await generateChallengeContent({
      transportMode,
      emissionTarget,
      durationDays,
      difficulty,
      type
    });

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + durationDays);

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
      createdBy: req.user.id
      
    });

    res.status(201).json(challenge);

  } catch (error) {
    console.error("Create challenge failed:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getChallenges = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      difficulty,
      transportMode
    } = req.query;

    const filter = {
      isDeleted: false,
      status: "ACTIVE"
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
      challenges
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getChallengeById = async (req, res) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
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
      isDeleted: false
    });

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const allowedUpdates = [
      "emissionTarget",
      "deadline",
      "status",
      "durationDays",
      "rewardPoints"
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        challenge[field] = req.body[field];
      }
    });

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

// if user info isn't available we simply return the most
// recent active challenges (or you could randomize / paginate)
exports.getRecommendedChallenges = async (req, res) => {
  try {
    let filter = { status: "ACTIVE", isDeleted: false };

    // optional query param `excludeMode` can be supplied by client
    // to emulate previous behaviour where we filtered out a user's
    // preferred transport mode.  eg.  /recommended?excludeMode=Bus
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

    if (!challenge || challenge.status !== "ACTIVE") {
      return res.status(404).json({ message: "Challenge not available" });
    }

    const participation = await Participation.create({
      user: req.user.id,
      challenge: challenge._id
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
      status: "ACTIVE"
    }).populate("challenge");

    res.status(200).json(participations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    const participation = await Participation.findOne({
      user: req.user.id,
      challenge: req.params.id,
      status: "ACTIVE"
    });

    if (!participation) {
      return res.status(404).json({ message: "Participation not found" });
    }

    participation.progress += progress;

    const challenge = await Challenge.findById(req.params.id);

    if (participation.progress >= challenge.emissionTarget) {
      participation.status = "COMPLETED";
    }

    await participation.save();

    res.status(200).json(participation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.leaveChallenge = async (req, res) => {
  try {
    const participation = await Participation.findOne({
      user: req.user.id,
      challenge: req.params.id,
      status: "ACTIVE"
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