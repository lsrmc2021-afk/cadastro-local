const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Banco de dados
const db = new sqlite3.Database('./database.db');

// Criar tabela
db.run(`
  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT,
    cpf TEXT,
    renda REAL
  )
`);

// Inserir dados
app.post('/salvar', (req, res) => {
    const { nome, cpf, renda } = req.body;

    db.run(
        `INSERT INTO clientes (nome, cpf, renda) VALUES (?, ?, ?)`,
        [nome, cpf, renda],
        function(err) {
            if (err) {
                return res.status(500).json(err);
            }
            res.json({ id: this.lastID });
        }
    );
});

// Listar dados
app.get('/listar', (req, res) => {
    db.all(`SELECT * FROM clientes`, [], (err, rows) => {
        if (err) {
            return res.status(500).json(err);
        }
        res.json(rows);
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

// Editar dados
app.put('/editar/:id', (req, res) => {
    const { nome, cpf, renda } = req.body;
    const { id } = req.params;

    db.run(
        `UPDATE clientes SET nome=?, cpf=?, renda=? WHERE id=?`,
        [nome, cpf, renda, id],
        function(err) {
            if (err) return res.status(500).json(err);
            res.json({ atualizado: this.changes });
        }
    );
});

// Excluir dados
app.delete('/excluir/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM clientes WHERE id=?`, [id], function(err) {
        if (err) return res.status(500).json(err);
        res.json({ deletado: this.changes });
    });
});

// Busca de dados
app.get('/buscar/:cpf', (req, res) => {
    const { cpf } = req.params;

    db.all(`SELECT * FROM clientes WHERE cpf LIKE ?`, [`%${cpf}%`], (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// Gera xlsx
const XLSX = require('xlsx');

app.get('/exportar', (req, res) => {
    db.all(`SELECT * FROM clientes`, [], (err, rows) => {
        if (err) return res.status(500).json(err);

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=clientes.xlsx');
        res.send(buffer);
    });
});