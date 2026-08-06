import User from "../models/User.js";

// @route GET /api/users/profile
export const getProfile = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

// @route PUT /api/users/profile
// Used for both general profile edits and the onboarding flow.
// If `completeOnboarding` is truthy in the body, marks onboardingCompleted = true.
export const updateProfile = async (req, res) => {
  try {
    const { profile, completeOnboarding } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (profile && typeof profile === "object") {
      user.profile = {
        ...user.profile.toObject?.() ?? user.profile,
        ...profile,
      };
    }

    if (completeOnboarding) {
      user.onboardingCompleted = true;
    }

    await user.save();

    return res.status(200).json({ user: user.toSafeObject() });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ message: "Server error updating profile" });
  }
};
