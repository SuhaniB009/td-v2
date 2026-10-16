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
    user_id:number
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
      const isPassCorrect=await bcrypt.compare(password,user.password);
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
app.get("/get_user_todos/",async(req,res)=>{
  const authHeader=req.headers.authorization;
  if(!authHeader)return res.status(401).json({error:"Authorization header needed"});
  const token=authHeader.split(" ")[1];
  if(!token)return res.status(401).json({error:"Invalid token"});
  let userpayload;
  try{
    userpayload=jwt.verify(token,jwt_secret_key);
    if(typeof userpayload==="string")return res.status(401).json({error:"Invalid token payload"});
  }catch(error){
    return res.status(401).json({error:"Invalid token "});
  };
  const userTodos=todos.filter((t)=>t.user_id===userpayload.user_id);
  res.status(200).json({userTodos});
});

app.post("/addTodo", (req,res)=>{
   const {title}=req.body;
   if(!title){
    return res.status(400).json({error:"missing value"});
   }
   const authHeader=req.headers.authorization;
   if(!authHeader){
      return res.status(401).json({error:"Authorization token required"});
   }
   const token =authHeader.split(" ")[1];
   if(!token){
      return res.status(401).json({error:"Invalid Authorization token"});
   }
   let userPayload;
   try{
     userPayload=jwt.verify(token,jwt_secret_key) ;
     if(typeof userPayload=== "string"){
      return res.status(401).json({error:"Invalid token"});
     }
   }catch(error){
      return res.status(401).json({error:"Invalid token"});
   };

   const todo: Todo={
    id: nextid++,
    title: title,
    status: false,
    user_id: userPayload.user_id
   };
   todos.push(todo);
   res.status(201).json({message:"Todo added", todo});
});

app.patch("/changestatus/:id",async (req,res)=>{
   const id= Number(req.params.id);
   const {status}=req.body;

   const todo=todos.find((t)=>t.id===id);
   if(!todo){
    return res.status(404).json({error:"Todo not found"});
   }
   const authHeader=req.headers.authorization;
   if(!authHeader){
      return res.status(401).json({error:"Authorization header required"});
   }
   const token=authHeader.split(" ")[1];
   if(!token){
      return res.status(401).json({error:"Invalid Authorization token"});
   }
   let payload;
   try{
     payload=jwt.verify(token,jwt_secret_key);
     if (typeof payload === "string") {
        return res.status(401).json({error: "Invalid token"});
      }
   }catch(error){
     return res.status(401).json({error:"Invalid token"});
   };

   if(todo.user_id!== payload.user_id)   {
      return res.status(403).json({error:"You are not authorized to update this todo"});
   }
   todo.status=status;
   res.status(200).json({message:"Status updated",todo});
});
app.delete("/delete/:id",(req,res)=>{
   const id=Number(req.params.id);
   const authHeader=req.headers.authorization;
   if(!authHeader)return res.status(401).json({error:"Authorization header required"});
   const token=authHeader.split(" ")[1];
   if(!token)return res.status(401).json({error:"Invalid Authorization Token"});
   let userPayload;
   try{   
     userPayload= jwt.verify(token,jwt_secret_key);
     if (typeof userPayload ==="string")return res.status(401).json({error:"Invalid token"});
   }catch(error){
     return res.status(401).json({error:"Invalid token"});
   };
   const idx=todos.findIndex((t)=>t.id===id);
   const todo=todos[idx];

   if(idx===-1 || todo===undefined ){
    return res.status(404).json({error:"Todo not found"});
   }
   if(todo.user_id!==userPayload.user_id)return res.status(403).json({error:"You are not authorized"});

   const delTodo= todos.splice(idx,1);
   res.status(200).json({message:"Todo deleted successfully",delTodo});
});

app.listen(3000,()=>{
console.log('sever running on port 3000');
});