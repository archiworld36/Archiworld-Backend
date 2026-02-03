const SubscriptionPlan = require("../models/subscriptionPlan");

/* CREATE */
exports.createPlan = async (req, res) => {
  try {
    const { name, amount, priority } = req.body;
    const parentId = req.parentId;
    const createdUser = req.userId;
    console.log(parentId, createdUser)
    if(parentId !== undefined){
        return res.status(400).json({message: "Access denied"})
    }
    const plan = await SubscriptionPlan.create({
      name,
      amount,
      priority,
      createdBy: createdUser,
    });

    res.status(201).json({
      message: "Subscription plan created",
      data: plan,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Plan already exists" });
    }
    console.log(err)
    res.status(500).json({ message: "Server error" });
  }
};

/*READ ALL*/
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find()
      .sort({ priority: -1 });

    res.json(plans);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" });
  }
};

/*READ ONE*/
exports.getPlanById = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" });
  }
};

/*UPDATE*/
exports.updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    console.log(req.body)
    const parentId = req.parentId;
    if(parentId !== undefined){
        return res.status(400).json({message: "Access denied"})
    }
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({
      message: "Subscription plan updated",
      data: plan,
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" });
  }
};

/*DELETE (soft recommended)*/
exports.deletePlan = async (req, res) => {
  try {
    const parentId = req.parentId;
    if(parentId !== undefined){
        return res.status(400).json({message: "Access denied"})
    }
    const plan = await SubscriptionPlan.findByIdAndDelete(
      req.params.id,
    );

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ id:req.params.id, message: "Subscription plan deactivated" });
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Server error" });
  }
};
