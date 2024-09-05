import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Chemin vers le fichier JSON
const dbFilePath = path.resolve('db.json');

// Middleware pour parser les données JSON et URL-encodées
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fonction pour lire les données du fichier JSON
const readDb = async () => {
    try {
        const data = await fs.readFile(dbFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {}; // Retourne un objet vide si le fichier n'existe pas ou est vide
    }
};

// Fonction pour écrire les données dans le fichier JSON
const writeDb = async (data) => {
    try {
        await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing to file', error);
    }
};

// Fonction pour générer un identifiant unique pour l'URL raccourcie
const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
};

// Endpoint pour afficher le formulaire et les résultats
app.get('/', async (req, res) => {
    let shortURL = '';
    let shortenedURLs = [];

    // Redirection si un code est fourni
    if (req.query.c) {
        const code = req.query.c;
        const db = await readDb();
        const originalURL = db[code];
        if (originalURL) {
            res.redirect(originalURL);
            return;
        } else {
            res.send('URL raccourcie invalide.');
            return;
        }
    }

    // Afficher toutes les URL raccourcies
    const db = await readDb();
    shortenedURLs = Object.entries(db).map(([code, url]) => ({ code, url }));

    // Afficher le formulaire et les résultats
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raccourcisseur d'URL - WebShell trhacknon</title>
            <style>
                body {
                    background-color: #000000; /* Noir */
                    color: #FF4500; /* Orange fluo */
                    font-family: Arial, sans-serif;
                }
                h1 {
                    color: #1E90FF; /* Bleu fluo */
                }
                .container {
                    width: 80%;
                    margin: auto;
                    padding: 20px;
                    background-color: #4B0082; /* Violet foncé */
                    border-radius: 10px;
                    box-shadow: 0px 0px 10px #FF4500;
                    text-align: center;
                }
                input[type="text"], input[type="password"], textarea {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    background-color: #000000;
                    color: #FF4500;
                    border: 1px solid #FF4500;
                    border-radius: 5px;
                }
                input[type="submit"], button {
                    padding: 10px 20px;
                    background-color: #FF4500;
                    color: #000000;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 5px;
                    margin-bottom: 10px;
                }
                input[type="submit"]:hover, button:hover {
                    background-color: #1E90FF; /* Bleu fluo */
                    color: #FFFFFF;
                }
                .short-url {
                    background-color: #000000;
                    color: #1E90FF;
                    padding: 10px;
                    border: 1px solid #1E90FF;
                    border-radius: 5px;
                    margin-top: 20px;
                    display: inline-block;
                    text-decoration: none;
                }
                .url-list {
                    margin-top: 20px;
                }
                .url-list h2 {
                    color: #1E90FF; /* Bleu fluo */
                }
                .url-list a {
                    display: block;
                    color: #1E90FF;
                    text-decoration: none;
                    margin: 5px 0;
                }
                .url-list a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Raccourcisseur d'URL - WebShell trhacknon</h1>
                <form method="post">
                    <input type="text" name="url" placeholder="Entrez l'URL à raccourcir" required>
                    <input type="submit" value="Raccourcir">
                </form>

                ${shortURL ? `<p>URL Raccourcie :</p><a href="${shortURL}" class="short-url" target="_blank">${shortURL}</a>` : ''}

                ${shortenedURLs.length > 0 ? `
                    <div class="url-list">
                        <h2>URLs déjà raccourcies :</h2>
                        ${shortenedURLs.map(({ code, url }) => `
                            <a href="/?c=${code}" target="_blank">
                                https://946135dd-a1e1-48d0-b44f-be01cb1552bd-00-8563n18uzwix.pike.replit.dev/?c=${code} (${url})
                            </a>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </body>
        </html>
    `);
});

// Endpoint pour gérer les requêtes POST
app.post('/', async (req, res) => {
    const originalURL = req.body.url;
    let shortURL = '';

    if (originalURL) {
        const db = await readDb();
        let shortCode = Object.keys(db).find(key => db[key] === originalURL);
        if (!shortCode) {
            do {
                shortCode = generateShortCode();
            } while (db[shortCode]);

            // Stocker l'URL dans la base de données avec le code raccourci
            db[shortCode] = originalURL;
            await writeDb(db);
        }

        // Construire l'URL raccourcie
        shortURL = `https://946135dd-a1e1-48d0-b44f-be01cb1552bd-00-8563n18uzwix.pike.replit.dev/?c=${shortCode}`;
    }

    // Redirection vers la page d'accueil avec l'URL raccourcie
    res.redirect(`/?shortURL=${encodeURIComponent(shortURL)}`);
});

app.listen(port, () => {
    console.log(`Server is running on https://946135dd-a1e1-48d0-b44f-be01cb1552bd-00-8563n18uzwix.pike.replit.dev:${port}`);
});