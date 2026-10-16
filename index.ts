import express from "express";
import type  {Request, Response} from "express";
const app=express();
app.use(express.json());

interface Todo{
    id : number;
    title : string;
    status : boolean;
}
const todos : Todo[]=[];
let nextid =1;

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