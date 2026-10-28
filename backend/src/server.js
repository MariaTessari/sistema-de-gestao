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
        if (erro.code === "P2003") {
            return res.status(409).json({ erro: "Funcionário possui tarefas vinculadas." });
        }
        next(erro);
    }
});

app.get("/tarefa", async (req, res, next) => {
    try {
        const tarefas = await prisma.tarefa.findMany({
            orderBy: { id: "asc" },
            include: { funcionario: { select: { id: true, nome: true } } }
        });
        return res.json(tarefas);
    } catch (erro) {
        next(erro);
    }
});










app.get("/tarefa/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ erro: "Id inválido" });
        }
        const tarefa = await prisma.tarefa.findUnique({
            where: { id },
            include: { funcionario: { select: { id: true, nome: true } } }
        });
        if (!tarefa) {
            return res.status(404).json({ erro: "Tarefa não encontrada" });
        }
        return res.json(tarefa);
    } catch (erro) {
        next(erro);
    }
});

app.post("/tarefa", async (req, res, next) => {
    try {
        const { titulo, dataEntrega, funcionarioId } = req.body;

        if (!titulo || !dataEntrega || funcionarioId === undefined || funcionarioId === null || funcionarioId === '') {
            return res.status(400).json({
                erro: "Campos obrigatórios: titulo, dataEntrega e funcionarioId"
            });
        }

        const data = new Date(dataEntrega);
        if (Number.isNaN(data.getTime())) {
            return res.status(400).json({ erro: "dataEntrega inválida" });
        }

        const fid = Number(funcionarioId);
        if (!Number.isInteger(fid)) {
            return res.status(400).json({ erro: "funcionarioId inválido" });
        }

        const tarefaCriada = await prisma.tarefa.create({
            data: { titulo, dataEntrega: data, funcionarioId: fid },
            include: { funcionario: { select: { id: true, nome: true } } }
        });
        return res.status(201).json(tarefaCriada);
    } catch (erro) {
        if (erro.code === "P2003") {
            return res.status(400).json({ erro: "Funcionário não encontrado" });
        }
        return next(erro);
    }
});

app.put("/tarefa/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id)) {
            return res.status(400).json({ erro: "Id inválido" });
        }

        const { titulo, dataEntrega, funcionarioId } = req.body;
        if (titulo === undefined && dataEntrega === undefined && funcionarioId === undefined) {
            return res.status(400).json({
                erro: "Informe ao menos um campo: titulo, dataEntrega OU funcionarioId"
            });
        }

        const data = {};
        if (titulo !== undefined) data.titulo = titulo;
        if (dataEntrega !== undefined) {
            const d = new Date(dataEntrega);
            if (Number.isNaN(d.getTime())) {
                return res.status(400).json({ erro: "dataEntrega inválida" });
            }
            data.dataEntrega = d;
        }
        if (funcionarioId !== undefined) {
            const fid = Number(funcionarioId);
            if (!Number.isInteger(fid)) {
                return res.status(400).json({ erro: "funcionarioId inválido" });
            }
            data.funcionarioId = fid;
        }

        const tarefaAtualizada = await prisma.tarefa.update({
            where: { id },
            data,
            include: { funcionario: { select: { id: true, nome: true } } }
        });
        return res.json(tarefaAtualizada);
    } catch (erro) {
        if (erro.code === "P2025") {
            return res.status(404).json({ erro: "Tarefa não encontrada" });
        }
        if (erro.code === "P2003") {
            return res.status(400).json({ erro: "Funcionário não encontrado" });
        }
        return next(erro);
    }
});

app.delete("/tarefa/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
            return res.status(400).json({ erro: "ID inválido." });
        }
        await prisma.tarefa.delete({ where: { id } });
        res.json({ ok: true });
    } catch (erro) {
        if (erro.code === "P2025") {
            return res.status(404).json({ erro: "Tarefa não encontrada." });
        }
        return next(erro);
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