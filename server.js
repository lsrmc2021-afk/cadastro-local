const express = require('express');
const cors = require('cors');
const path = require('path');
const XLSX = require('xlsx');

const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// URL correta 
const supabase = createClient(
    'https://antbloefkiwmazcaadff.supabase.co',
    'sb_publishable_EEB9DPYWy6vrEE0e201Xyg_MiVkUgE6'
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// SALVAR
app.post('/salvar', async (req, res) => {
    const { nome, cpf, renda } = req.body;

    const rendaNumber = Number(renda);

    const { data, error } = await supabase
        .from('clientes')
        .insert([{ nome, cpf, renda: rendaNumber }]);

    console.log('INSERT:', data, error);

    if (error) return res.status(500).json(error);

    res.json({ ok: true });
});


// LISTAR
app.get('/listar', async (req, res) => {
    const { data, error } = await supabase
        .from('clientes')
        .select('*');

    console.log('LISTAR:', data, error);

    if (error) return res.status(500).json(error);

    res.json(data); // TEM QUE SER ARRAY
});


// EDITAR
app.put('/editar/:id', async (req, res) => {
    const { id } = req.params;
    const { nome, cpf, renda } = req.body;

    const { error } = await supabase
        .from('clientes')
        .update({ nome, cpf, renda: Number(renda) })
        .eq('id', id);

    if (error) return res.status(500).json(error);

    res.json({ ok: true });
});


// EXCLUIR
app.delete('/excluir/:id', async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json(error);

    res.json({ ok: true });
});


// BUSCAR
app.get('/buscar/:cpf', async (req, res) => {
    const { cpf } = req.params;

    const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .ilike('cpf', `%${cpf}%`);

    if (error) return res.status(500).json(error);

    res.json(data);
});


// EXPORTAR EXCEL
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


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});