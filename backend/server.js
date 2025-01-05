import express from 'express'
import { fetchPnrStatus } from './index.js';

const app = express();

const port = 3000;


app.use(express.json());


app.get('/',async (req,res) =>{
    const data = req.body
    const ans = await fetchPnrStatus(data.pnr)
    res.send(ans);
}) 

app.listen(port,()=>{
    console.log("Server is running");
})