const express = require('express')
const app = express()
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.meftkqt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    // collections
    const userCollection = client.db("assetPulseDB").collection("users");
    const assetCollection = client.db("assetPulseDB").collection("assets");
    const customReqCollection = client.db("assetPulseDB").collection("customReq");

     // jwt api
     app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

     // middlewares
     const verifyToken = (req, res, next) => {
      // console.log("Inside Middleware Token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Unauthorized access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized access" });
        }
        req.decoded = decoded;
        next();
      });
      //next();
    };

    const verifyAdmin =  async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === "Admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };
    const verifyEmployee = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isEmployee = user?.role === "Employee";
      if (!isEmployee) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      next();
    };

    // user's api
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "Admin";
      }
      res.send({ admin });
    });
    app.get("/users/employee/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let employee = false;
      if (user) {
        employee = user?.role === "Employee";
      }
      res.send({ employee });
    });


    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // asset's api
    app.get("/assets", async (req, res) => {
      const result = await assetCollection.find().toArray();
      res.send(result);
    });

    app.post("/assets", async (req, res) => {
      const item = req.body;
      const result = await assetCollection.insertOne(item);
      res.send(result);
    });

    app.get("/assets/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId (id) };
      const result = await assetCollection.findOne(query);
      res.send(result);
    });
    // customReq api
    app.get("/customReq", async (req, res) => {
      const result = await customReqCollection.find().toArray();
      res.send(result);
    });

    app.post("/customReq", async (req, res) => {
      const item = req.body;
      const result = await customReqCollection.insertOne(item);
      res.send(result);
    });

    app.get("/customReq/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId (id) };
      const result = await customReqCollection.findOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('AssetPulse Server is Running...')
})

app.listen(port, () => {
  console.log(`AssetPulse Server is Running on port ${port}`)
})