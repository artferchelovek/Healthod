import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
    res.send("Backend works!");
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});