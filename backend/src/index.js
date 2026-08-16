const express = require("express");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("./middleware")
const cookieParser = require("cookie-parser")
const connectDb = require("./db")
connectDb();
const dotenv = require("dotenv");
const cors = require("cors");
const { userModel, organizationModel, boardsModel, issueModel } = require("./model");

const members = []

dotenv.config();
const port=process.env.PORT || 5000; 

const app = express();
app.use(express.json())
app.use(cors({
  origin: "http://localhost:5173",   
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(cookieParser());

// CREATE
app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        username: username,     
    });

    if (userExists) {
        res.status(411).json({
            message: "User with this username already exists"
        })
        return;
    }

    const newUser = await userModel.create({
        username: username,
        password: password
    })

    res.json({
        id: newUser._id,
        message: "You have signed up successfully"
    })
})

app.post("/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        username: username,
        password: password
    });

    if (!userExists) {
        res.status(403).json({
            message: "Incorrect credentials"
        })
        return;
    }

    const token = jwt.sign({
        userId: userExists.id
    }, "secret123123");

    res.cookie("token", token,{
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
    }).cookie("username", userExists.username, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax"
    }).json({
        token
    })
})

// AUTHENTICATED ROUTE - MIDDLEWARE
app.post("/organization", authMiddleware, async (req, res) => {
    const userId = req.userId;


    const newOrg = await organizationModel.create({
        title: req.body.title,
        description: req.body.description,
        admin: userId,
        members: [],
        boards:[]
    })

    res.json({
        message: "Org created",
        id: newOrg._id
    })
})


app.post("/add-member-to-organization", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.body.organizationId;
    const memberUsername = req.body.memberUsername; 

    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    });

    if (!organization || organization.admin.toString() !== userId) {
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }

    const memberUser = await userModel.findOne({
        username: memberUsername
    })

    if (!memberUser) {
        res.status(411).json({
            message: "No user with this username exists in our db"
        })
        return
    }

    organization.members.push(memberUser._id)
    await organization.save()

    res.json({
        message: "New member added!"
    })
})

//BOARDS
app.post("/board", authMiddleware, async(req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const organizationId = req.body.organizationId;
    if(!title) {
        res.status(400).json({
            message: "Title is missing!!!"
        })
        return;
    }
    if(!organizationId) {
        res.status(400).json({
            message: "Organization id is invalid or missing"
        })
    }
    const organization = await organizationModel.findOne({
        _id : organizationId
    });
    if(!organization){
        res.status(411).json({
            message: "This organization does not exist"
        })
        return;
    }
    const board = await boardsModel.create({
        title,
        organizationId,
        createdBy:userId
    })
    res.json({
        message: "Board is Created",
        BoardId: board._id
    })
})

//ISSUES
app.post("/issue", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const title =  req.body.title;
    const description = req.body.description;
    const boardId = req.body.boardId;
    const assignedMemberId = req.body.assignedMemberId;

    if(!assignedMemberId) {
        res.status(400).json({
            message: "This user does not exist"
        })
        return;
    }
    if(!title ||  typeof title !== "string"){
        res.status(400).json({
            message : "Required title is not found"
        })
        return;
    }    
    if(!description || typeof description !== "string") {
        res.status(400).json({
            message: "Required description is not found"
        })
        return;
    }
    if(!boardId) {
        res.status(400).json({
            message: "Board id is Required"
        })
        return;

    }
    const board = await boardsModel.findById(boardId);
    if(!board) {
        res.status(400).json({
            message: "This board does not exist"
        })
        return;
    }
   
  const assigned = await userModel.findById(assignedMemberId);

    const issues = await issueModel.create({
        title:title,
        description:description,
        boardId:boardId,
        createBy:userId,
        assignedTo:assigned
    })

    res.json({
        message: "Issue is created"
        
    })

})

//GET endpoints
app.get("/organizations", authMiddleware, async (req, res) => {
    try {
        const organizations = await organizationModel.find({
            admin: req.userId
        });

        res.json({
            organizations
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch organizations"
        });
    }
}); //will get all organizations;

app.get("/organization", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.query.organizationId;

    const organization = await organizationModel.findOne({
        _id: organizationId
    });

    if (!organization || organization.admin.toString() !== userId) {
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }

    const members = await userModel.find({
        _id: organization.members
    })

    res.json({
        organization: {
            title: organization.title,
            description: organization.description,
            members: members.map(m => ({
                username: m.username,
                id: m._id
            }))
        }
    })
})//will find organization with id with members

app.get("/organization/:id", authMiddleware, async (req, res) => {
    try {
        const organization = await organizationModel.findOne({
            _id: req.params.id,
            admin: req.userId
        });

        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        res.json({ organization });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch organization" });
    }
});


app.get("/organization/:id", authMiddleware, async (req, res) => {
    try {
        const organization = await organizationModel.findOne({
            _id: req.params.id,
            admin: req.userId
        });

        if (!organization) {
            return res.status(404).json({ message: "Organization not found" });
        }

        res.json({ organization });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch organization" });
    }
});

//FETCH BOARDS
app.get("/boards", authMiddleware, async (req, res) => {
    const { organizationId } = req.query;
    if (!organizationId) {
        res.status(400).json({
            message: "This organization does not exist"
        })
        return;
    }
    const Boards = await boardsModel.find({
        organizationId
    }).populate('createdBy','username')
    res.json({
        Boards
    })
})


//FETCH ISSUES
app.get("/issues", authMiddleware, async (req, res) => {
    const { issueId } = req.query;
    if (!issueId) { 
        res.status(400).json({
            message: "This issue does not exist"
        })
        return;
    }
    const issue = await issueModel.findById(issueId).populate('assignedTo', 'username')
    res.json({
        issue
    })
})

app.get("/members", authMiddleware, async (req, res) => {
    const { organizationId } = req.query;
    if(!organizationId) {
        res.status(400).json({
            message: "Organization id is required"
        })
        return;
    }
    const organization = await organizationModel.findById(organizationId).populate('members','username');
    res.json({
        members:organization.members
    })

})

// UPDATE
app.put("/issues", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { issueId } = req.query;
    const {title, description, boardId, assignedTo} = req.body;

    if(!title || typeof title !== "string") {
        res.json({
            message: "Title is required"
        })
        return;
    }
    if (!description || typeof description !== "string"){
        res.json({
            message: "Description is required"
        })
        return;
    }
    if (!boardId) {
        res.json({
            message: "Incorrect Board Id"
        })
        return;
    }
    if(!assignedTo) {
        res.json({
            message: "User is not the memebr"
        })
        return;
    }
    const issue = await issueModel.findByIdAndUpdate(issueId,{
        title,
        description,
        boardId,
        userId,
        assignedTo
    })
    res.json({
        issue
    })

})

//DELETE -- FIND THE GBUG and fix it
app.delete("/members", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.body.organizationId;
    const memberUsername = req.body.memberUsername; // aakash

    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    });

    if (!organization || organization.admin.toString() !== userId) {
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }

    const memberUser = await userModel.findOne({
        username: memberUsername
    })

    if (!memberUser) {
        res.status(411).json({
            message: "No user with this username exists in our db"
        })
        return
    }

    
    organization.members = organization.members.filter(x => x.toString() !== memberUser._id.toString());
  
    await organization.save();

    res.json({
        message: "member deleted!"
    })
})
app.post('/logout', (req, res) => {
    
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,   
        sameSite: 'none' 
    });

    
    return res.status(200).json({ message: "Logged out successfully" });
});

app.listen(port, ()=> {
    console.log(`app running on port ${ port }`)
});