const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const db = new sqlite3.Database(path.join(__dirname, 'Database.sqlite'));
var app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'paginas')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

db.serialize(() => {

    db.run(`
    CREATE TABLE IF NOT EXISTS USUARIOS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      Usuario TEXT NOT NULL,
      Senha TEXT NOT NULL
    );
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela USUARIOS:", err);
        }
    });


    db.run(`
    CREATE TABLE IF NOT EXISTS PRODUTOS (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      preco REAL NOT NULL,
      codigo TEXT NOT NULL,
      marca TEXT NOT NULL,
      categoria TEXT NOT NULL,
      peso REAL NOT NULL
    );
    `, (err) => {
        if (err) {
            console.error("Erro ao criar tabela PRODUTOS:", err);
        }
    });
});


app.get("/cadastro_usuarios", (req, res) => {
    res.sendFile(path.join(__dirname, "paginas", "cadastro_usuarios.html"));
});


app.post("/cadastro_usuarios", (req, res) => {
    const { usuario, senha } = req.body;


    bcrypt.hash(senha, saltRounds, (err, hash) => {
        if (err) {
            console.error("Erro ao criptografar senha:", err);
            return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
        }

        const query = "INSERT INTO USUARIOS(Usuario, Senha) VALUES (?, ?)";
        db.run(query, [usuario, hash], (err) => {
            if (!err) {
                res.json({ sucesso: true, mensagem: "Usuário cadastrado com sucesso!" });
            } else {
                console.error("Erro ao cadastrar usuário:", err);
                res.status(500).json({ sucesso: false, mensagem: "Erro ao cadastrar usuário." });
            }
        });
    });
});


app.post("/cadastro_produtos", (req, res) => {
    const { produto, quantidade, preco, codigo, marca, categoria, peso } = req.body;

    const query = "INSERT INTO PRODUTOS (Produto, Quantidade, Preco, Codigo, Marca, Categoria, Peso) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.run(query, [produto, quantidade, preco, codigo, marca, categoria, peso], (err) => {
        if (err) {
            console.error("Erro ao cadastrar produto:", err);
            return res.status(500).json({ sucesso: false, mensagem: "Erro ao cadastrar produto." });
        }

        res.json({ sucesso: true, mensagem: "Produto cadastrado com sucesso!" });
    });
});


app.get("/consultar_produtos", (req, res) => {
    const query = "SELECT * FROM PRODUTOS";
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Erro ao consultar produtos:", err);
            return res.status(500).json({ sucesso: false, mensagem: "Erro ao consultar produtos." });
        }

        res.json(rows);
    });
});


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "paginas", "login.html"));
});


app.post("/autenticacao", (req, res) => {
    const { usuario, senha } = req.body;

    const query = "SELECT * FROM USUARIOS WHERE Usuario = ?";
    db.get(query, [usuario], (err, row) => {
        if (err) {
            console.error("Erro ao consultar usuário:", err);
            return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
        }

        if (!row) {
            return res.json({ sucesso: false, mensagem: "Usuário não encontrado." });
        }

        bcrypt.compare(senha, row.Senha, (err, result) => {
            if (err) {
                console.error("Erro ao comparar senhas:", err);
                return res.status(500).json({ sucesso: false, mensagem: "Erro interno no servidor." });
            }

            if (result) {
                res.json({ sucesso: true, url: "/pagina_principal", mensagem: "Bem-vindo " + row.Usuario });
            } else {
                res.json({ sucesso: false, mensagem: "Senha incorreta." });
            }
        });
    });
});


app.get("/pagina_principal", (req, res) => {
    res.sendFile(path.join(__dirname, "paginas", "homepage.html"));
});


app.get("/consultar_pagina", (req, res) => {
    res.sendFile(path.join(__dirname, "paginas", "consultar_banco.html"));
});

// Rota para buscar produto por código ou descrição
app.get("/buscar_produto", (req, res) => {
    const query = req.query.query; // Recebe a busca do cliente
    const sqlQuery = `
        SELECT * FROM PRODUTOS
        WHERE Codigo LIKE ? OR Produto LIKE ?;
    `;
    
    // Preparamos a consulta SQL usando parâmetros para evitar SQL Injection
    db.all(sqlQuery, [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) {
            console.error("Erro ao buscar produto:", err);
            return res.status(500).json({ mensagem: "Erro ao buscar produto." });
        }

        res.json(rows); // Retorna os produtos encontrados no banco de dados
    });
});



app.listen(8080, () => {
    console.log("Acesse o sistema em: http://localhost:8080");
});
