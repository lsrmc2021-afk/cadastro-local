const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://antbloefkiwmazcaadff.supabase.co/rest/v1/',
    'sb_publishable_EEB9DPYWy6vrEE0e201Xyg_MiVkUgE6'
);

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
app.post('/salvar', async (req, res) => {
    const { nome, cpf, renda } = req.body;

    const { error } = await supabase
        .from('clientes')
        .insert([{ nome, cpf, renda }]);

    if (error) return res.status(500).json(error);

    res.json({ ok: true });
});

// Listar dados
app.get('/listar', async (req, res) => {
    const { data, error } = await supabase
        .from('clientes')
        .select('*');

    if (error) return res.status(500).json(error);

    res.json(data);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando`);
});

// Editar dados
app.put('/editar/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, renda } = req.body;

    const { error } = await supabase
        .from('clientes')
        .update({ nome, cpf, renda })
        .eq('id', id);

    if (error) return res.status(500).json(error);

    res.json({ ok: true });
});

// Excluir dados
app.delete('/excluir/:id', async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json(error);

    res.json({ ok: true });
});

// Busca de dados
app.get('/buscar/:cpf', async (req, res) => {
    const { cpf } = req.params;

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .ilike('cpf', `%${cpf}%`);

    if (error) return res.status(500).json(error);

    res.json(data);
});

// Gera xlsx
const XLSX = require('xlsx');

app.get('/exportar', async (req, res) => {

    const { data, error } = await supabase
        .from('clientes')
        .select('*');

    if (error) return res.status(500).json(error);

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Clientes");

    const buffer = XLSX.write(wb, {
        type: 'buffer',
        bookType: 'xlsx'
    });

    res.setHeader('Content-Disposition', 'attachment; filename=clientes.xlsx');
    res.send(buffer);
});