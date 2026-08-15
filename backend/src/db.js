const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("node:dns");

dns.setServers([
    '8.8.8.8',
    '1.1.1.1'
])

dotenv.config()
const connectDb = async() => {
    console.log(process.env.MONGO_URI);
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("Database Connection Established ✅✅ " + conn.connection.host);
    }catch(err){
        console.error(err.message);
        
    }

    
    

}
module.exports = connectDb;