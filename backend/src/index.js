const dotenv = require("dotenv");
const path = require("node:path");

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const crypto = require("node:crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const connectDb = require("./db");
const { authMiddleware, getJwtSecret } = require("./middleware");
const { createFixedWindowRateLimiter } = require("./rateLimiter");
const {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  boardsModel,
  issueModel,
  organizationModel,
  userModel,
} = require("./model");


const app = express();
app.disable("x-powered-by");

const configuredTrustProxy = process.env.TRUST_PROXY?.trim();
if (configuredTrustProxy) {
  const trustProxySetting = /^\d+$/.test(configuredTrustProxy)
    ? Number(configuredTrustProxy)
    : configuredTrustProxy === "true"
      ? true
      : configuredTrustProxy === "false"
        ? false
        : configuredTrustProxy;
  app.set("trust proxy", trustProxySetting);
}

const port = Number(process.env.PORT) || 5000;
const TOKEN_TTL = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  "$2b$12$I7IStq2DOPPn9EmtRdl.Y.zgCtAMGApqmMx6AP55rVd7mgDyU/WgG";

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new HttpError(403, "Origin is not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  req.body ||= {};
  next();
});

const signupRateLimiter = createFixedWindowRateLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: "Too many accounts were created from this connection. Try again later.",
});

const signinIpRateLimiter = createFixedWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: "Too many sign-in attempts from this connection. Try again later.",
});

const signinRateLimiter = createFixedWindowRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: "Too many sign-in attempts. Wait a few minutes and try again.",
  keyGenerator: (req) => {
    const username =
      typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "unknown";
    return `${req.ip || req.socket?.remoteAddress || "unknown"}:${username}`;
  },
});

function cookieBaseOptions(httpOnly) {
  const secure =
    process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
  let sameSite = ["lax", "strict", "none"].includes(configuredSameSite)
    ? configuredSameSite
    : secure
      ? "none"
      : "lax";
  if (sameSite === "none" && !secure) {
    sameSite = "lax";
  }

  return {
    httpOnly,
    sameSite,
    secure,
    path: "/",
  };
}

function cookieOptions(httpOnly) {
  return {
    ...cookieBaseOptions(httpOnly),
    maxAge: COOKIE_MAX_AGE,
  };
}

function requireString(value, fieldName, { min = 1, max = Infinity } = {}) {
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string`);
  }

  const normalized = value.trim();
  if (normalized.length < min) {
    throw new HttpError(400, `${fieldName} is required`);
  }
  if (normalized.length > max) {
    throw new HttpError(400, `${fieldName} must be at most ${max} characters`);
  }
  return normalized;
}

function optionalString(value, fieldName, max) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length > max) {
    throw new HttpError(400, `${fieldName} must be at most ${max} characters`);
  }
  return normalized;
}

function requireObjectId(value, fieldName) {
  if (!mongoose.isValidObjectId(value)) {
    throw new HttpError(400, `${fieldName} is invalid`);
  }
  return value;
}

function idsEqual(left, right) {
  return left != null && right != null && left.toString() === right.toString();
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function hasOrganizationAccess(organization, userId) {
  return (
    idsEqual(organization.admin, userId) ||
    organization.members.some((memberId) => idsEqual(memberId, userId))
  );
}

async function requireOrganizationAccess(organizationId, userId, options = {}) {
  requireObjectId(organizationId, "organizationId");
  const organization = await organizationModel.findById(organizationId);

  if (!organization) {
    throw new HttpError(404, "Organization not found");
  }

  if (!hasOrganizationAccess(organization, userId)) {
    throw new HttpError(403, "You do not have access to this organization");
  }

  if (options.adminOnly && !idsEqual(organization.admin, userId)) {
    throw new HttpError(403, "Organization admin access is required");
  }

  return organization;
}

async function requireBoardAccess(boardId, userId) {
  requireObjectId(boardId, "boardId");
  const board = await boardsModel.findById(boardId);

  if (!board) {
    throw new HttpError(404, "Board not found");
  }

  const organization = await requireOrganizationAccess(board.organizationId, userId);
  return { board, organization };
}

async function getOrganizationMembers(organization) {
  const orderedIds = [organization.admin, ...organization.members]
    .filter(Boolean)
    .map((id) => id.toString());
  const uniqueIds = [...new Set(orderedIds)];

  const users = await userModel
    .find({ _id: { $in: uniqueIds } })
    .select("username")
    .lean();
  const usersById = new Map(users.map((user) => [user._id.toString(), user]));

  return uniqueIds
    .map((id) => usersById.get(id))
    .filter(Boolean)
    .map((user) => ({
      _id: user._id,
      username: user.username,
      role: idsEqual(user._id, organization.admin) ? "admin" : "member",
    }));
}

async function serializeOrganization(organization, userId) {
  const members = await getOrganizationMembers(organization);
  const admin = members.find((member) => member.role === "admin") || {
    _id: organization.admin,
    username: null,
    role: "admin",
  };

  return {
    _id: organization._id,
    title: organization.title,
    description: organization.description || "",
    admin,
    members,
    role: idsEqual(organization.admin, userId) ? "admin" : "member",
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  };
}

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]\$\d{2}\$/.test(value);
}

function safePlaintextCompare(submitted, stored) {
  if (typeof stored !== "string") {
    return false;
  }
  const submittedBuffer = Buffer.from(submitted);
  const storedBuffer = Buffer.from(stored);
  return (
    submittedBuffer.length === storedBuffer.length &&
    crypto.timingSafeEqual(submittedBuffer, storedBuffer)
  );
}

function parseDueDate(value) {
  if (value === null || value === "") {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "dueDate must be a valid date or null");
  }
  return parsed;
}

function assertStatus(status) {
  if (!ISSUE_STATUSES.includes(status)) {
    throw new HttpError(
      400,
      `status must be one of: ${ISSUE_STATUSES.join(", ")}`
    );
  }
  return status;
}

function assertPriority(priority) {
  if (!ISSUE_PRIORITIES.includes(priority)) {
    throw new HttpError(
      400,
      `priority must be one of: ${ISSUE_PRIORITIES.join(", ")}`
    );
  }
  return priority;
}

async function validateAssignee(assigneeId, organization) {
  if (assigneeId === undefined) {
    return undefined;
  }
  if (assigneeId === null || assigneeId === "") {
    return null;
  }

  requireObjectId(assigneeId, "assignedTo");
  const allowedIds = new Set(
    [organization.admin, ...organization.members]
      .filter(Boolean)
      .map((id) => id.toString())
  );

  if (!allowedIds.has(assigneeId.toString())) {
    throw new HttpError(400, "Assignee must be a member of this organization");
  }

  const assigneeExists = await userModel.exists({ _id: assigneeId });
  if (!assigneeExists) {
    throw new HttpError(404, "Assignee not found");
  }
  return assigneeId;
}

async function getNextPosition(boardId, status) {
  const lastIssue = await issueModel
    .findOne({ boardId, status })
    .sort({ position: -1, _id: -1 })
    .select("position")
    .lean();
  return Number.isFinite(lastIssue?.position) ? lastIssue.position + 1 : 0;
}

async function normalizePositions(boardId, status) {
  const issues = await issueModel
    .find({ boardId, status })
    .sort({ position: 1, createdAt: 1, _id: 1 })
    .select("_id position")
    .lean();

  const operations = issues
    .map((issue, index) => ({ issue, index }))
    .filter(({ issue, index }) => issue.position !== index)
    .map(({ issue, index }) => ({
      updateOne: {
        filter: { _id: issue._id, boardId },
        update: { $set: { position: index, updatedAt: new Date() } },
      },
    }));

  if (operations.length > 0) {
    await issueModel.bulkWrite(operations, { ordered: true });
  }
}

function sortIssues(issues) {
  const statusOrder = new Map(ISSUE_STATUSES.map((status, index) => [status, index]));
  return issues.sort((left, right) => {
    const statusDifference =
      (statusOrder.get(left.status || "backlog") ?? 0) -
      (statusOrder.get(right.status || "backlog") ?? 0);
    if (statusDifference !== 0) {
      return statusDifference;
    }

    const leftPosition = Number.isFinite(left.position) ? left.position : 0;
    const rightPosition = Number.isFinite(right.position) ? right.position : 0;
    if (leftPosition !== rightPosition) {
      return leftPosition - rightPosition;
    }
    return left._id.toString().localeCompare(right._id.toString());
  });
}

async function fetchBoardIssues(boardId) {
  const issueDocuments = await issueModel
    .find({ boardId })
    .populate("createdBy", "username")
    .populate("assignedTo", "username");
  const issues = sortIssues(issueDocuments.map((issue) => issue.toObject()));
  const groups = ISSUE_STATUSES.map((status) => ({
    status,
    issues: issues.filter((issue) => (issue.status || "backlog") === status),
  }));
  return { issues, groups };
}

async function sendBoardIssues(res, boardId) {
  const collection = await fetchBoardIssues(boardId);
  return res.json(collection);
}

async function updateIssueById(issueId, updates, userId) {
  requireObjectId(issueId, "issueId");
  const issue = await issueModel.findById(issueId);
  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  const originalBoardId = issue.boardId;
  const originalStatus = issue.status || "backlog";
  const currentContext = await requireBoardAccess(originalBoardId, userId);
  let destinationContext = currentContext;

  if (hasOwn(updates, "boardId") && !idsEqual(updates.boardId, issue.boardId)) {
    destinationContext = await requireBoardAccess(updates.boardId, userId);
    issue.boardId = destinationContext.board._id;
  }

  if (hasOwn(updates, "title")) {
    issue.title = requireString(updates.title, "title", { max: 180 });
  }
  if (hasOwn(updates, "description")) {
    issue.description = optionalString(updates.description, "description", 5000);
  }
  if (hasOwn(updates, "priority")) {
    issue.priority = assertPriority(updates.priority);
  }
  if (hasOwn(updates, "dueDate")) {
    issue.dueDate = parseDueDate(updates.dueDate);
  }

  const nextStatus = hasOwn(updates, "status")
    ? assertStatus(updates.status)
    : issue.status || "backlog";
  const changedBoard = !idsEqual(originalBoardId, issue.boardId);
  const changedStatus = nextStatus !== originalStatus;
  issue.status = nextStatus;

  if (changedBoard || changedStatus) {
    issue.position = await getNextPosition(issue.boardId, nextStatus);
  }

  const assigneeInput = hasOwn(updates, "assignedTo")
    ? updates.assignedTo
    : hasOwn(updates, "assignedMemberId")
      ? updates.assignedMemberId
      : undefined;
  if (assigneeInput !== undefined) {
    issue.assignedTo = await validateAssignee(
      assigneeInput,
      destinationContext.organization
    );
  } else if (
    changedBoard &&
    issue.assignedTo &&
    !hasOrganizationAccess(
      {
        admin: destinationContext.organization.admin,
        members: destinationContext.organization.members,
      },
      issue.assignedTo
    )
  ) {
    issue.assignedTo = null;
  }

  // Issues created by the legacy route lost this field because it used `createBy`.
  if (!issue.createdBy) {
    issue.createdBy = userId;
  }

  await issue.save();

  if (changedBoard || changedStatus) {
    await normalizePositions(originalBoardId, originalStatus);
  }

  return issueModel
    .findById(issue._id)
    .populate("createdBy", "username")
    .populate("assignedTo", "username");
}

async function deleteIssueById(issueId, userId) {
  requireObjectId(issueId, "issueId");
  const issue = await issueModel.findById(issueId);
  if (!issue) {
    throw new HttpError(404, "Issue not found");
  }

  await requireBoardAccess(issue.boardId, userId);
  const boardId = issue.boardId;
  const status = issue.status || "backlog";
  await issue.deleteOne();
  await normalizePositions(boardId, status);
  return issue;
}

app.post(
  "/signup",
  signupRateLimiter,
  asyncHandler(async (req, res) => {
    const username = requireString(req.body.username, "username", { min: 2, max: 80 });
    const password = req.body.password;

    if (typeof password !== "string" || password.length < 8) {
      throw new HttpError(400, "password must contain at least 8 characters");
    }
    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new HttpError(400, "password must be at most 72 UTF-8 bytes");
    }

    const userExists = await userModel.exists({ username });
    if (userExists) {
      throw new HttpError(409, "User with this username already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await userModel.create({ username, password: hashedPassword });
    return res.status(201).json({
      id: newUser._id,
      message: "You have signed up successfully",
    });
  })
);

app.post(
  "/signin",
  signinIpRateLimiter,
  signinRateLimiter,
  asyncHandler(async (req, res) => {
    const username = requireString(req.body.username, "username", { min: 1, max: 80 });
    const password = req.body.password;
    if (typeof password !== "string" || password.length === 0) {
      throw new HttpError(400, "password is required");
    }

    const user = await userModel.findOne({ username }).select("+password");
    let credentialsMatch = false;
    const storedPassword = user?.password;

    if (user && isBcryptHash(storedPassword)) {
      credentialsMatch = await bcrypt.compare(password, storedPassword);
    } else if (user) {
      credentialsMatch = safePlaintextCompare(password, storedPassword);
    } else {
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    }

    if (!user || !credentialsMatch) {
      throw new HttpError(401, "Incorrect credentials");
    }

    if (!isBcryptHash(storedPassword)) {
      const migratedPassword = await bcrypt.hash(password, 12);
      await userModel.updateOne(
        { _id: user._id, password: storedPassword },
        { $set: { password: migratedPassword } }
      );
    }

    const token = jwt.sign({ userId: user._id.toString() }, getJwtSecret(), {
      expiresIn: TOKEN_TTL,
    });

    return res
      .cookie("token", token, cookieOptions(true))
      .cookie("username", user.username, cookieOptions(false))
      .json({
        message: "Signed in successfully",
        user: { id: user._id, username: user.username },
      });
  })
);

app.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    requireObjectId(req.userId, "userId");
    const user = await userModel.findById(req.userId).select("username").lean();
    if (!user) {
      throw new HttpError(401, "Authenticated user no longer exists");
    }
    return res.json({ user: { id: user._id, username: user.username } });
  })
);

app.post("/logout", (req, res) => {
  return res
    .clearCookie("token", cookieBaseOptions(true))
    .clearCookie("username", cookieBaseOptions(false))
    .json({ message: "Logged out successfully" });
});

app.post(
  "/organization",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const title = requireString(req.body.title, "title", { max: 120 });
    const description = optionalString(req.body.description, "description", 500);
    const organization = await organizationModel.create({
      title,
      description,
      admin: req.userId,
      members: [],
    });

    return res.status(201).json({
      message: "Organization created",
      id: organization._id,
      organization: await serializeOrganization(organization, req.userId),
    });
  })
);

app.post(
  "/add-member-to-organization",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const organization = await requireOrganizationAccess(
      req.body.organizationId,
      req.userId,
      { adminOnly: true }
    );
    const memberUsername = requireString(req.body.memberUsername, "memberUsername", {
      min: 2,
      max: 80,
    });
    const memberUser = await userModel.findOne({ username: memberUsername }).lean();

    if (!memberUser) {
      throw new HttpError(404, "No user with this username exists");
    }

    let memberWasAdded = false;
    if (!idsEqual(memberUser._id, organization.admin)) {
      const result = await organizationModel.updateOne(
        { _id: organization._id },
        { $addToSet: { members: memberUser._id } }
      );
      memberWasAdded = result.modifiedCount > 0;
    }

    return res.json({
      message: idsEqual(memberUser._id, organization.admin)
        ? "User is already the organization admin"
        : memberWasAdded
          ? "Member added"
          : "User is already an organization member",
      member: {
        _id: memberUser._id,
        username: memberUser.username,
        role: idsEqual(memberUser._id, organization.admin) ? "admin" : "member",
      },
    });
  })
);

app.get(
  "/organizations",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const organizations = await organizationModel
      .find({ $or: [{ admin: req.userId }, { members: req.userId }] })
      .sort({ updatedAt: -1, _id: -1 })
      .lean();

    return res.json({
      organizations: organizations.map((organization) => ({
        ...organization,
        description: organization.description || "",
        role: idsEqual(organization.admin, req.userId) ? "admin" : "member",
      })),
    });
  })
);

async function sendOrganization(req, res, organizationId) {
  const organization = await requireOrganizationAccess(organizationId, req.userId);
  return res.json({
    organization: await serializeOrganization(organization, req.userId),
  });
}

app.get(
  "/organization",
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.query.organizationId) {
      throw new HttpError(400, "organizationId is required");
    }
    return sendOrganization(req, res, req.query.organizationId);
  })
);

app.get(
  "/organization/:id",
  authMiddleware,
  asyncHandler(async (req, res) => sendOrganization(req, res, req.params.id))
);

app.get(
  "/members",
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.query.organizationId) {
      throw new HttpError(400, "organizationId is required");
    }
    const organization = await requireOrganizationAccess(
      req.query.organizationId,
      req.userId
    );
    return res.json({ members: await getOrganizationMembers(organization) });
  })
);

app.delete(
  "/members",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const organizationId = req.body.organizationId || req.query.organizationId;
    const memberUsername = requireString(
      req.body.memberUsername || req.query.memberUsername,
      "memberUsername",
      { min: 2, max: 80 }
    );
    const organization = await requireOrganizationAccess(organizationId, req.userId, {
      adminOnly: true,
    });
    const memberUser = await userModel.findOne({ username: memberUsername }).lean();

    if (!memberUser) {
      throw new HttpError(404, "No user with this username exists");
    }
    if (idsEqual(memberUser._id, organization.admin)) {
      throw new HttpError(400, "The organization admin cannot be removed");
    }

    const result = await organizationModel.updateOne(
      { _id: organization._id },
      { $pull: { members: memberUser._id } }
    );
    const boardIds = await boardsModel.distinct("_id", {
      organizationId: organization._id,
    });
    const assignmentResult = boardIds.length
      ? await issueModel.updateMany(
          { boardId: { $in: boardIds }, assignedTo: memberUser._id },
          { $set: { assignedTo: null } }
        )
      : { modifiedCount: 0 };

    return res.json({
      message: result.modifiedCount ? "Member removed" : "User was not a member",
      unassignedIssues: assignmentResult.modifiedCount,
    });
  })
);

app.post(
  "/board",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const title = requireString(req.body.title, "title", { max: 120 });
    const organization = await requireOrganizationAccess(
      req.body.organizationId,
      req.userId
    );
    const board = await boardsModel.create({
      title,
      organizationId: organization._id,
      createdBy: req.userId,
    });

    return res.status(201).json({
      message: "Board created",
      BoardId: board._id,
      board,
    });
  })
);

app.get(
  "/boards",
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.query.organizationId) {
      throw new HttpError(400, "organizationId is required");
    }
    const organization = await requireOrganizationAccess(
      req.query.organizationId,
      req.userId
    );
    const Boards = await boardsModel
      .find({ organizationId: organization._id })
      .sort({ createdAt: -1, _id: -1 })
      .populate("createdBy", "username");
    return res.json({ Boards });
  })
);

app.get(
  "/boards/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { board, organization } = await requireBoardAccess(req.params.id, req.userId);
    await board.populate("createdBy", "username");
    const members = await getOrganizationMembers(organization);

    return res.json({
      board,
      organization: {
        _id: organization._id,
        title: organization.title,
        description: organization.description || "",
        role: idsEqual(organization.admin, req.userId) ? "admin" : "member",
      },
      members,
      workflow: {
        statuses: ISSUE_STATUSES,
        priorities: ISSUE_PRIORITIES,
      },
    });
  })
);

app.post(
  "/issue",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const title = requireString(req.body.title, "title", { max: 180 });
    const description = optionalString(req.body.description, "description", 5000);
    const { board, organization } = await requireBoardAccess(req.body.boardId, req.userId);
    const status = assertStatus(req.body.status ?? "backlog");
    const priority = assertPriority(req.body.priority ?? "medium");
    const assignedInput = hasOwn(req.body, "assignedMemberId")
      ? req.body.assignedMemberId
      : req.body.assignedTo;
    const assignedTo = await validateAssignee(assignedInput, organization);
    const position = await getNextPosition(board._id, status);

    const issue = await issueModel.create({
      title,
      description,
      boardId: board._id,
      createdBy: req.userId,
      assignedTo: assignedTo ?? null,
      status,
      position,
      priority,
      dueDate: hasOwn(req.body, "dueDate") ? parseDueDate(req.body.dueDate) : null,
    });
    const populatedIssue = await issueModel
      .findById(issue._id)
      .populate("createdBy", "username")
      .populate("assignedTo", "username");

    return res.status(201).json({ message: "Issue created", issue: populatedIssue });
  })
);

app.get(
  "/boards/:id/issues",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { board } = await requireBoardAccess(req.params.id, req.userId);
    return sendBoardIssues(res, board._id);
  })
);

app.get(
  "/issues",
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (req.query.issueId) {
      requireObjectId(req.query.issueId, "issueId");
      const issue = await issueModel
        .findById(req.query.issueId)
        .populate("createdBy", "username")
        .populate("assignedTo", "username");
      if (!issue) {
        throw new HttpError(404, "Issue not found");
      }
      await requireBoardAccess(issue.boardId, req.userId);
      return res.json({ issue });
    }

    if (req.query.boardId) {
      const { board } = await requireBoardAccess(req.query.boardId, req.userId);
      return sendBoardIssues(res, board._id);
    }

    throw new HttpError(400, "issueId or boardId is required");
  })
);

app.put(
  "/issues",
  authMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.query.issueId) {
      throw new HttpError(400, "issueId is required");
    }
    const issue = await updateIssueById(req.query.issueId, req.body, req.userId);
    return res.json({ message: "Issue updated", issue });
  })
);

app.patch(
  "/issues/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const issue = await updateIssueById(req.params.id, req.body, req.userId);
    return res.json({ message: "Issue updated", issue });
  })
);

app.delete(
  "/issues/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const issue = await deleteIssueById(req.params.id, req.userId);
    return res.json({ message: "Issue deleted", id: issue._id });
  })
);

app.delete(
  "/issues",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const issueId = req.query.issueId || req.body.issueId;
    if (!issueId) {
      throw new HttpError(400, "issueId is required");
    }
    const issue = await deleteIssueById(issueId, req.userId);
    return res.json({ message: "Issue deleted", id: issue._id });
  })
);

app.patch(
  "/boards/:id/issues/reorder",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { board } = await requireBoardAccess(req.params.id, req.userId);
    const groups = req.body.groups || req.body.orderedStatusGroups;

    if (!Array.isArray(groups)) {
      throw new HttpError(400, "groups must be an array of status groups");
    }
    if (groups.length !== ISSUE_STATUSES.length) {
      throw new HttpError(400, "groups must include every workflow status exactly once");
    }

    const submittedStatuses = new Set();
    const submittedIssueIds = [];
    for (const group of groups) {
      if (!group || typeof group !== "object") {
        throw new HttpError(400, "Each status group must be an object");
      }
      const status = assertStatus(group.status);
      if (submittedStatuses.has(status)) {
        throw new HttpError(400, `Duplicate status group: ${status}`);
      }
      submittedStatuses.add(status);

      if (!Array.isArray(group.issueIds)) {
        throw new HttpError(400, `${status}.issueIds must be an array`);
      }
      for (const issueId of group.issueIds) {
        requireObjectId(issueId, "issueId");
        submittedIssueIds.push(issueId.toString());
      }
    }

    if (ISSUE_STATUSES.some((status) => !submittedStatuses.has(status))) {
      throw new HttpError(400, "groups must include every workflow status exactly once");
    }

    const uniqueSubmittedIds = new Set(submittedIssueIds);
    if (uniqueSubmittedIds.size !== submittedIssueIds.length) {
      throw new HttpError(400, "An issue may appear in only one status group");
    }

    const currentIssues = await issueModel.find({ boardId: board._id }).select("_id").lean();
    const currentIds = new Set(currentIssues.map((issue) => issue._id.toString()));
    const isCompleteBoardState =
      currentIds.size === uniqueSubmittedIds.size &&
      [...currentIds].every((issueId) => uniqueSubmittedIds.has(issueId));

    if (!isCompleteBoardState) {
      throw new HttpError(
        409,
        "Reorder payload is stale; include every current board issue exactly once"
      );
    }

    const now = new Date();
    const operations = groups.flatMap((group) =>
      group.issueIds.map((issueId, position) => ({
        updateOne: {
          filter: { _id: issueId, boardId: board._id },
          update: {
            $set: {
              status: group.status,
              position,
              updatedAt: now,
            },
          },
        },
      }))
    );

    if (operations.length > 0) {
      await issueModel.bulkWrite(operations, { ordered: true });
    }

    const collection = await fetchBoardIssues(board._id);
    return res.json({ message: "Issue order updated", ...collection });
  })
);

app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error?.name === "ValidationError") {
    const message = Object.values(error.errors || {})[0]?.message || "Validation failed";
    return res.status(400).json({ message });
  }
  if (error?.name === "CastError") {
    return res.status(400).json({ message: `${error.path || "value"} is invalid` });
  }
  if (error?.code === 11000) {
    return res.status(409).json({ message: "A record with this value already exists" });
  }
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({
      message: error.status === 400 ? "Invalid JSON request body" : "Request failed",
    });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
});

async function start() {
  getJwtSecret();
  await connectDb();
  return app.listen(port, () => {
    console.log(`App running on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Unable to start server: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = app;
module.exports.start = start;
