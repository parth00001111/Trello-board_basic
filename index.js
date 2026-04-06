const express = require("express");
const mongoose = require("mongoose");
const { organizationModel,
    userModel } = require('./models')
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("./middleware")


let BOARD_ID = 1;
let ISSUES_ID = 1;

const BOARDS = [];

const ISSUES = [];

const app = express();
app.use(express.json());

// CREATE
app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        username:username
    })
    if (userExists) {
        res.status(411).json({
            message: "User with this username already exists"
        })
        return;
    }

    const newUser = await userModel.create({
        username:username,
        password:password,
    })
    

    res.json({
        id:newUser._id,
        message:"You've signed up Successfully"
    })

})

app.post("/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        username:username,
        password:password
    })
    if (!userExists) {
        res.status(403).json({
            message: "Incorrect credentials"
        })
        return;
    }

    const token = jwt.sign({
        userId: userExists._id
    }, "attlasiationsupersecret123123password");
    // create a jwt for the user

    res.json({
        token
    })
})

// AUTHENTICATED ROUTE - MIDDLEWARE
app.post("/organization", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const newOrganization = await organizationModel.create({
        title:req.body.title,
        description:req.body.description,
        admin:userId,
        members:[]
    })

    res.json({
        message: "Org created",
        id: newOrganization._id
    })
})

app.post("/add-member-to-organization", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.body.organizationId;//konse org me add krna hai
    const memberUsername = req.body.memberUsername;//kosna user add krna hai

   const organization = await organizationModel.findOne({
    _id: organizationId,
    })

    if (!organization || organization.admin.toString() !== userId) {//either toString or mongoose.Types.ObjectId
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }

    const memberUser = await userModel.findOne({
        username:memberUsername
    })

    if (!memberUser) {
        res.status(411).json({
            message: "No user with this username exists in our db"
        })
        return
    }

    await organizationModel.findByIdAndUpdate((organizationId),{
        members:memberUser._id
    })

    res.json({
        message: "New member added!"
    })
})

app.post("/board", (req, res) => {
    
})

app.post("/issue", (req, res) => {
    
})

//GET endpoints
app.get("/organization", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.query.organizationId;
//accessible to the admin only
    const organization = await organizationModel.findOne({
        _id:organizationId
    })
    if(!organization || !organization.admin.equals(userId)){
        res.status(411).json({
            message: "Either this organization doest not exit or You are not an admin of this organization"
        })
        return;
    }

    res.json({
        organization:organization
    })
       
})

app.get("/boards", (req, res) => {

    
})

app.get("/issues", (req, res) => {
    
})

app.get("/members", (req, res) => {

})


// UPDATE
app.put("/issues", (req, res) => {

})

//DELETE
app.delete("/members", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.body.organizationId;
    const memberUsername = req.body.memberUsername;

    const organization = await organizationModel.findOne({
        _id:organizationId
    })

    if (!organization || !organization.admin.equals(userId)) {
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }
    const memberUser = await userModel.findOne({
        username:memberUsername
    })

    if (!memberUser) {
        res.status(411).json({
            message: "No user with this username exists in our db"
        })
        return
    }

   

    await organizationModel.updateOne({
        _id:organizationId
    },{
        "$pullAll": {
            members:memberUser._id
        }
    })

    res.json({
        message: "member deleted!"
    })
})

app.listen(3000);