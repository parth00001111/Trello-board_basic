const mongoose = require("mongoose");

const ISSUE_STATUSES = ["backlog", "todo", "in-progress", "review", "done"];
const ISSUE_PRIORITIES = ["low", "medium", "high", "urgent"];

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true }
);

const organizationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
  },
  { timestamps: true }
);

organizationSchema.index({ admin: 1 });
organizationSchema.index({ members: 1 });

const boardsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "organizations",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
  },
  { timestamps: true }
);

boardsSchema.index({ organizationId: 1, createdAt: -1 });

const issueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "boards",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    status: {
      type: String,
      enum: ISSUE_STATUSES,
      default: "backlog",
      required: true,
    },
    position: {
      type: Number,
      min: 0,
      default: 0,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "position must be an integer",
      },
    },
    priority: {
      type: String,
      enum: ISSUE_PRIORITIES,
      default: "medium",
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

issueSchema.index({ boardId: 1, status: 1, position: 1 });
issueSchema.index({ assignedTo: 1, updatedAt: -1 });

const boardsModel = mongoose.models.boards || mongoose.model("boards", boardsSchema);
const issueModel = mongoose.models.issues || mongoose.model("issues", issueSchema);
const organizationModel =
  mongoose.models.organizations || mongoose.model("organizations", organizationSchema);
const userModel = mongoose.models.users || mongoose.model("users", userSchema);

module.exports = {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  organizationModel,
  userModel,
  boardsModel,
  issueModel,
};
