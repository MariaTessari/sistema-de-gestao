import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const { DATABASE_URL, PORT = 3000, FRONTEND_URL = "http://localhost:5173"} = process.env;

if (!DATABASE_URL){
    console.error("Erro: a variável DATABASE_URL não está definida no arquivo .env");
    process.exit(1);
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL});
const prisma = new PrismaClient ({adapter});

const SALT_ROUNDS = 10;

const app = express();
app.use(cors({ origin: FRONTEND_URL}));
app.use(express.json())

app.get("/funcionario", async (req, res, next) => {
    try{
     const funcionarios = await prisma.funcionario.findMany({
        orderBy: {id: "asc"},
        select: {id: true, nome: true, email: true, cpf: true}
     });
     return res.json(funcionarios);
    } catch (erro){
        next(erro);
    }
});

app.post("/funcionario", async (req, res, next)=>{
    try{
    const { nome, email, senha, cpf, tarefa} = req.body;
   
    if(!nome || !email || !senha ||!cpf) {
        return res.status(400).json({
            erro: "Campos obrigatórios: nome, email, senha e cpf"
        });
    }
    
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const funcionarioCriado = await prisma.funcionario.create({
        data: {nome, email, senha: senhaHash, cpf},
        select: {id: true, nome: true, email: true, cpf:true}
    })
    return res.status(201).json(funcionarioCriado);
    }catch (erro){
        if(erro.code === "P2002"){
            const campo = erro.meta?.target?.[0]??"campo";
            return res.status(409).json({
                erro: `Já existe um funcionário com este ${campo}`
            });
        }
        return next(erro);
    }
});

app.post("/login", async (req, res, next) => {
    try{
        const { email, senha } = req.body;

        if(!email || !senha){
            return res.status(400).json({ erro: "Informe email e senha" });
        }

        const funcionario = await prisma.funcionario.findUnique({ where: { email } });

        // mesma mensagem para email inexistente e senha errada (não revela qual deu errado)
        const senhaCorreta = funcionario
            ? await bcrypt.compare(senha, funcionario.senha)
            : false;

        if(!senhaCorreta){
            return res.status(401).json({ erro: "Email ou senha inválidos" });
        }

        return res.json({
            id: funcionario.id,
            nome: funcionario.nome,
            email: funcionario.email,
            cpf: funcionario.cpf
        });
    } catch(erro){
        next(erro);
    }
});

app.put("/funcionario/:id", async (req, res, next)=>{
    try{
    const id = Number(req.params.id);

    if(Number.isNaN(id)){
        return res.status(400).json({erro: "Id inválido"});
    }

    const {nome, email, senha, cpf} = req.body;
    if(!nome && !email && !senha && !cpf){
        return res.status(400).json({
            erro: "Informe ao menos um campo: nome, email, senha OU cpf"
        });
    }

    const data ={};
    if(nome !==undefined) data.nome =nome;
    if(email !==undefined) data.email =email;
    if(senha) data.senha = await bcrypt.hash(senha, SALT_ROUNDS);
    if(cpf !==undefined) data.cpf =cpf;

    const funcionarioAtualizado = await prisma.funcionario.update({
        where: { id },
        data,
        select: { id: true, nome: true, email:true, cpf:true}
    });

    return res.json(funcionarioAtualizado);
}catch (erro){
    if(erro.code === "P2025"){
        return res.status(404).json({erro: "Funcionário não encontrado"})
    }
    if (erro.code === "P2002"){
        const campo = erro.meta?.target?.[0]?? "campo";
        return res.status(409).json({
            erro: `Já existe um funcionário com este ${campo}`
        });
    }
    return next(erro);
}
});

app.delete("/funcionario/:id", async (req, res, next)=>{
    try{
        const id = Number(req.params.id);

        if(!Number.isInteger(id)) {
            return res.status(400).json({ erro: "ID inválido. "});
        }
        await prisma.funcionario.delete({where: {id}});
        res.json({ok:true});
    } catch(erro){
        if (erro.code === "P2025") {
            return res.status(404).json({erro: "Funcionário não encontrado."});
        }
        next(erro);
    }
});

app.use((erro, req, res, next) => {
    console.error(erro);
 
    const status = erro.statusCode || 500;
    res.status(status).json({erro: status === 500 ? "Erro interno do servidor" : erro.message});
});

app.listen(PORT, ()=>{
    console.log(`Servidor rodando em http://localhost:${PORT}`)
});