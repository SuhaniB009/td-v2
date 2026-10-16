import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type  {Request, Response} from "express";

const app=express();
app.use(express.json());

interface User{
   id: number;
   username: string;
   email: string;
   password: string
}
interface Todo{
    id : number;
    title : string;
    status : boolean;
}

const todos : Todo[]=[];
const users:User[]=[];
const jwt_secret_key="Suhani09";
let nextid =1;
let nextuserid=1;

app.post("/signup",async(req:Request,res:Response)=>{
   const{username,email,password}=req.body;
   if(!username || !email || !password){
      return res.status(400).json({error:"Missing values"});
   }
   const existingUser=users.find((u)=>u.email===email);
   if(existingUser){
      return res.status(409).json({error:"Email already registered"});
   }
   let hashPass;
   try{
      hashPass=await bcrypt.hash(password,10);
   }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
   }
   const user:User={
         id:nextuserid++,
         username: username,
         email:email,
         password: hashPass
      }
   users.push(user);
   res.status(201).json({
      message:"Successfully signed up",
      user:{
         id:user.id,
         username:user.username,
         email:user.email
      }
   });
});

app.post("/signin",async(req,res)=>{
   const{email,password}=req.body;
   if(!email || !password){
      return res.status(400).json({error:"Missing value"});
   }
   const user=users.find((u)=>u.email===email);
   if(!user){
      return res.status(404).json({error:"Invalid email or password"});
   }
   let token;

   try{
      const isPassCorrect=bcrypt.compare(password,user.password);
      if(!isPassCorrect){
         return res.status(401).json({error:"Invalid email or password"});
      }
      token=jwt.sign(
         {user_id:user.id,email: user.email},
         jwt_secret_key
      )
   }catch(error){
      return res.status(500).json({error:"Internal Server Error"});
   };
   return res.status(200).json({
      message:"User logged in",
      token,
      user:{
         id:user.id,
         username: user.username,
         email:user.email
      }
   });
});



app.get("/todos",(_req: Request,res: Response)=>{
   res.json(todos);
});
app.get("/todo/:id",(req,res)=>{
  const id = Number(req.params.id);
  const todo= todos.find((t)=>t.id === id);
  if(!todo){
    return res.status(404).json({error:"Todo not found"});
  }
  res.status(200).json(todo);
});
app.post("/addTodo", (req,res)=>{
   const {title}=req.body;
   if(!title){
    return res.status(400).json({error:"missing value"});
   }
   const todo: Todo={
    id: nextid++,
    title: title,
    status: false
   };
   todos.push(todo);
   res.status(201).json({message:"Todo added", todo});
});
app.patch("/changestatus/:id",(req,res)=>{
   const id= Number(req.params.id);
   const todo=todos.find((t)=>t.id===id);
   if(!todo){
    return res.status(404).json({error:"Todo not found"});
   }
   const {status}=req.body;
   todo.status=status;
   res.status(200).json({message:"Status updated",todo});
});
app.delete("/delete/:id",(req,res)=>{
   const id=Number(req.params.id);
   const idx=todos.findIndex((t)=>t.id===id);
   if(idx===-1 ){
    return res.status(404).json({error:"Todo not found"});
   }
   const delTodo= todos.splice(idx,1);
   res.status(200).json({message:"Todo deleted successfully",delTodo});
});

app.listen(3000,()=>{
console.log('sever running on port 3000');
});