const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const port = 3000;

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'API Task',
        version: '1.0.0',
        description: 'API para gerenciar um mapa de dados (chave-valor).',
    },
    servers: [
        {
            url: `http://localhost:${port}`,
            description: 'Servidor local',
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: ['./index.js'], // Caminho do arquivo onde estão as anotações Swagger
};

const swaggerSpec = swaggerJsdoc(options);

// Middleware para servir a documentação do Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Usar o middleware para fazer parse do JSON no corpo das requisições
app.use(express.json());

// HashMap para armazenar dados (chave-valor)
const dataMap = new Map();
let nextId = 1; // Variável para manter o próximo ID disponível

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Retorna todos os itens
 *     responses:
 *       200:
 *         description: Lista de itens.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   describe:
 *                     type: string
 *                   isCompleted:
 *                     type: boolean
 */
app.get('/tasks', (req, res) => {
    console.log("GET /tasks");
    const tasks = Array.from(dataMap, ([id, value]) => ({ id, ...value }));
    res.json(tasks);
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Retorna um item específico pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do item
 *     responses:
 *       200:
 *         description: Item encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 describe:
 *                   type: string
 *                 isCompleted:
 *                   type: boolean
 *       404:
 *         description: Item não encontrado.
 */
app.get('/tasks/:id', (req, res) => {
    const id = req.params.id;
    console.log(`GET /tasks/${id}`);
    if (dataMap.has(id)) {
        res.json({ id, ...dataMap.get(id) });
    } else {
        res.status(404).json({ error: 'Item não encontrado' });
    }
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Adiciona novos itens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     describe:
 *                       type: string
 *                     isCompleted:
 *                       type: boolean
 *               - type: object
 *                 properties:
 *                   title:
 *                     type: string
 *                   describe:
 *                     type: string
 *                   isCompleted:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Itens adicionados.
 *       400:
 *         description: Erro ao adicionar itens.
 */
app.post('/tasks', (req, res) => {
    console.log("POST /tasks");
    const body = req.body;

    // Verifica se body é um array ou um único objeto
    if (Array.isArray(body)) {
        // Se for um array, percorre os itens e adiciona ao dataMap
        const addedTasks = [];
        const errors = [];

        for (const task of body) {
            const id = (nextId++).toString(); // Gera um ID numérico e converte para string
            task.id = id; // Atribui o ID gerado à tarefa

            // Remova o campo "id" dentro de "value" (caso exista)
            if (task.value && task.value.id) {
                delete task.value.id; // Remove o "id" de dentro de "value"
            }

            if (dataMap.has(id)) {
                errors.push({ id, error: 'ID já existe' });
            } else {
                // Adiciona a tarefa diretamente com o valor correto
                dataMap.set(id, task);
                addedTasks.push(task);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ errors });
        }

        return res.status(201).json(addedTasks);
    } else {
        // Se for um único objeto, atribui um ID gerado automaticamente
        const id = (nextId++).toString(); // Gera um ID numérico e converte para string
        body.id = id; // Atribui o ID gerado à tarefa

        // Verifique se o campo "value" está correto ou não aninhado
        if (body.value && body.value.id) {
            delete body.value.id; // Remova o "id" de dentro de "value", pois ele já está no nível superior
        }

        dataMap.set(id, body);
        return res.status(201).json(body);
    }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Deleta um item pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do item
 *     responses:
 *       200:
 *         description: Item deletado com sucesso.
 *       404:
 *         description: Item não encontrado.
 */
app.delete('/tasks/:id', (req, res) => {
    const id = req.params.id;
    console.log(`DELETE /tasks/${id}`);
    if (dataMap.has(id)) {
        dataMap.delete(id);
        res.json({ message: 'Item deletado com sucesso' });
    } else {
        res.status(404).json({ error: 'Item não encontrado' });
    }
});

/**
 * @swagger
 * /tasks/{id}:
 *   patch:
 *     summary: Atualiza um item pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Item atualizado com sucesso.
 *       404:
 *         description: Item não encontrado.
 */
app.patch('/tasks/:id', (req, res) => {
    const body = req.body;
    const id = req.params.id;
    console.log(`PATCH /tasks/${id}`);
    if (dataMap.has(id)) {
        dataMap.set(id, body);
        res.status(201).json(body);
    } else {
        res.status(404).json({ error: 'Item não encontrado' });
    }
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Atualiza uma tarefa pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               describe:
 *                 type: string
 *               isCompleted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tarefa atualizada com sucesso.
 *       400:
 *         description: Dados inválidos ou falta de campos obrigatórios.
 *       404:
 *         description: Tarefa não encontrada.
 */
app.put('/tasks/:id', (req, res) => {
    const id = req.params.id;
    const updatedTask = req.body;

    console.log(`PUT /tasks/${id}`);

    if (!dataMap.has(id)) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    if (!updatedTask.title || !updatedTask.describe || typeof updatedTask.isCompleted !== 'boolean') {
        return res.status(400).json({ error: 'Dados inválidos ou campos obrigatórios ausentes' });
    }

    dataMap.set(id, updatedTask);

    res.status(200).json({ id, ...updatedTask });
});


/**
 * @swagger
 * /tasks:
 *   options:
 *     summary: Retorna os métodos permitidos
 *     responses:
 *       200:
 *         description: Métodos permitidos.
 *         headers:
 *           Allow:
 *             schema:
 *               type: string
 */
app.options('/tasks', (req, res) => {
    res.set('Allow', 'GET, POST, OPTIONS, DELETE, PATCH');
    res.sendStatus(200);
});

app.options('/tasks/:id', (req, res) => {
    res.set('Allow', 'GET, PATCH, PUT, DELETE, OPTIONS');
    res.sendStatus(200);
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
