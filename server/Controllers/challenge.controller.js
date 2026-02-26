const Challenge = require("../Models/challenges");
const { generateChallengeContent } = require("../services/chatgpt.service");

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
      // createdBy: req.user.id
      createdBy: ""
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

exports.getRecommendedChallenges = async (req, res) => {
  try {
    const userPreferredMode = req.user.preferredTransportMode; 
    // assume stored in user profile for now

    const challenges = await Challenge.find({
      transportMode: { $ne: userPreferredMode },
      status: "ACTIVE",
      isDeleted: false
    }).limit(5);

    res.json(challenges);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};