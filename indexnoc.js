const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const validator = require('validator');
const helmet = require('helmet');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');

const app = express();
const port = process.env.PORT || 3000;


const dbFilePath = path.resolve('db.json');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet()); 
app.use(csurf({ cookie: true })); 


const readDb = async () => {
    try {
        const data = await fs.readFile(dbFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {}; 
    }
};


const writeDb = async (data) => {
    try {
        await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing to file', error);
    }
};


const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
};


app.get('/', async (req, res) => {
    let shortURL = '';
    let shortenedURLs = [];
    let message = req.query.message || '';

    
    if (req.query.c) {
        const code = validator.escape(req.query.c); 
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

    
    const db = await readDb();
    shortenedURLs = Object.entries(db).map(([code, url]) => ({ code, url }));

    
    res.send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Raccourcisseur d'URL - WebShell trhacknon</title>
            <style>
                body {
                    background-color: #000000; 
                    color: #00FF00; 
                    font-family: 'Courier New', Courier, monospace; 
                    margin: 0;
                    padding: 0;
                }
                h1 {
                    color: #00FFFF; 
                    margin: 0;
                    padding: 20px;
                    border-bottom: 2px solid #00FF00;
                }
                .container {
                    width: 80%;
                    margin: auto;
                    padding: 20px;
                    background-color: #222222; 
                    border-radius: 10px;
                    box-shadow: 0px 0px 15px #00FF00;
                    text-align: center;
                    margin-top: 20px;
                }
                input[type="text"], input[type="password"], textarea {
                    width: 100%;
                    padding: 10px;
                    margin: 10px 0;
                    background-color: #000000;
                    color: #00FF00; 
                    border: 1px solid #00FF00;
                    border-radius: 5px;
                }
                input[type="submit"], button {
                    padding: 10px 20px;
                    background-color: #00FF00; 
                    color: #000000; 
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-right: 5px;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                input[type="submit"]:hover, button:hover {
                    background-color: #00FFFF; 
                    color: #000000;
                }
                .short-url {
                    background-color: #000000;
                    color: #00FFFF; 
                    padding: 10px;
                    border: 1px solid #00FFFF;
                    border-radius: 5px;
                    margin-top: 20px;
                    display: inline-block;
                    text-decoration: none;
                    font-size: 18px;
                }
                .url-list {
                    margin-top: 20px;
                }
                .url-list h2 {
                    color: #00FFFF; 
                }
                .url-list a {
                    display: block;
                    color: #00FF00; 
                    text-decoration: none;
                    margin: 5px 0;
                    font-size: 16px;
                }
                .url-list a:hover {
                    text-decoration: underline;
                }
                .delete-button {
                    background-color: #FF0000; 
                    color: #000000; 
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    padding: 5px 10px;
                    font-size: 14px;
                }
                .delete-button:hover {
                    background-color: #00FFFF; 
                    color: #000000;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Raccourcisseur d'URL - WebShell trhacknon</h1>
                <form method="post" action="/" novalidate>
                    <input type="text" name="url" placeholder="Entrez l'URL à raccourcir" required>
                    <input type="hidden" name="_csrf" value="${req.csrfToken()}">
                    <input type="submit" value="Raccourcir">
                </form>
                ${message ? `<p>${message}</p>` : ''}
                ${shortURL ? `<p>URL Raccourcie :</p><a href="${shortURL}" class="short-url" target="_blank">${shortURL}</a>` : ''}
                ${shortenedURLs.length > 0 ? `
                    <div class="url-list">
                        <h2>URLs déjà raccourcies :</h2>
                        ${shortenedURLs.map(({ code, url }) => `
                            <div>
                                <a href="/?c=${code}" target="_blank">
                                    https://trkushort.glitch.me/?c=${code} (${url})
                                </a>
                                <form method="post" action="/delete" style="display: inline;">
                                    <input type="hidden" name="code" value="${code}">
                                    <input type="hidden" name="_csrf" value="${req.csrfToken()}">
                                    <button type="submit" class="delete-button">Supprimer</button>
                                </form>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </body>
        </html>
    `);
});


app.post('/', async (req, res) => {
    const originalURL = validator.escape(req.body.url); 
    let shortURL = '';

    if (originalURL) {
        const db = await readDb();
        let shortCode = Object.keys(db).find(key => db[key] === originalURL);
        if (!shortCode) {
            do {
                shortCode = generateShortCode();
            } while (db[shortCode]);

            
            db[shortCode] = originalURL;
            await writeDb(db);
        }

        
        shortURL = `https://trkushort.glitch.me/?c=${shortCode}`;
    }

    
    res.redirect(`/?shortURL=${encodeURIComponent(shortURL)}`);
});


app.post('/delete', async (req, res) => {
    const codeToDelete = validator.escape(req.body.code); 
    if (codeToDelete) {
        const db = await readDb();
        if (db[codeToDelete]) {
            delete db[codeToDelete]; 
            await writeDb(db); 
            res.redirect('/?message=URL supprimée avec succès');
        } else {
            res.redirect('/?message=Code d\'URL invalide');
        }
    } else {
        res.redirect('/?message=Code d\'URL manquant');
    }
});

app.post('/api/shorten', csurf({ cookie: true }), async (req, res) => {
    const originalURL = validator.escape(req.body.url); 
    let shortURL = '';

    if (originalURL) {
        const db = await readDb();
        let shortCode = Object.keys(db).find(key => db[key] === originalURL);
        if (!shortCode) {
            do {
                shortCode = generateShortCode();
            } while (db[shortCode]);

            db[shortCode] = originalURL;
            await writeDb(db);
        }

        shortURL = `https://946135dd-a1e1-48d0-b44f-be01cb1552bd-00-8563n18uzwix.pike.replit.dev/?c=${shortCode}`;
    }

    res.json({ shortURL });
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});