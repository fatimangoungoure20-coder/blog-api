/**
 * Blog API CRUD (SQL/SQLite) + Swagger
 * Fichier unique : server.js
 */
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const Database = require("better-sqlite3");
// --------------------
// Express
// --------------------
const app = express();
app.use(express.json());
// --------------------
// SQLite (SQL)
// --------------------
const db = new Database("blog.db");
// Table SQL
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);
// --------------------
// Swagger
// --------------------
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Blog API (SQL)",
      version: "1.0.0",
      description: "API CRUD pour articles de blog (Express + SQLite + Swagger)",
    },
    servers: [{ url: "http://localhost:3000" }],
  },
  apis: ["./server.js"],
});
// UI Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         created_at:
 *           type: string
 *       required: [title, content]
 *
 * tags:
 *   - name: Posts
 *     description: CRUD des articles
 */
// --------------------
// CRUD ENDPOINTS
// --------------------
/**
 * @swagger
 * /posts:
 *   get:
 *     tags: [Posts]
 *     summary: Lister tous les posts
 *     responses:
 *       200:
 *         description: Liste des posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
app.get("/posts", (req, res) => {
  const rows = db.prepare("SELECT * FROM posts ORDER BY id DESC").all();
  res.json(rows);
});
/**
 * @swagger
 * /posts:
 *   post:
 * 
 *     tags: [Posts]
 *     summary: Créer un post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       201:
 *         description: Post créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Requête invalide
 */
app.post("/posts", (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: "title et content sont requis" });
  }
  // SQL INSERT
  const info = db
    .prepare("INSERT INTO posts (title, content) VALUES (?, ?)")
    .run(title, content);
  // SQL SELECT du post créé
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(info.lastInsertRowid);

  res.status(201).json(post);
});
/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     tags: [Posts]
 *     summary: Récupérer un post par id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Post trouvé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post introuvable
 */
app.get("/posts/:id", (req, res) => {
  const id = Number(req.params.id);

  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (!post) return res.status(404).json({ message: "Article introuvable" });
  res.json(post);
});
/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     tags: [Posts]
 *     summary: Mettre à jour un post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title: { type: string }
 *               content: { type: string }
 *     responses:
 *       200:
 *         description: Post mis à jour
 *       400:
 *         description: Requête invalide
 *       404:
 *         description: Post introuvable
 */
app.put("/posts/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: "title et content sont requis" });
  }

  // Vérifier existence
  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ message: "Article introuvable" });

  // SQL UPDATE
  db.prepare("UPDATE posts SET title = ?, content = ? WHERE id = ?")
    .run(title, content, id);

  // SQL SELECT du post mis à jour
  const updated = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);

  res.json(updated);
});

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     tags: [Posts]
 *     summary: Supprimer un post
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204:
 *         description: Suppression réussie
 *       404:
 *         description: Post introuvable
 */
app.delete("/posts/:id", (req, res) => {
  const id = Number(req.params.id);

  const existing = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ message: "Article introuvable" });

  // SQL DELETE
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);

  res.status(204).send();
});

// --------------------
// Start
// --------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Swagger sur http://localhost:${PORT}/api-docs`);
});

