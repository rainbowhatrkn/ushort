const fs = require('fs');
const readline = require('readline');

// Fonction pour supprimer les commentaires d'une chaîne de code
function removeComments(code) {
    // Suppression des commentaires sur une seule ligne (//), mais pas dans les chaînes de caractères ou les regex
    code = code.replace(/(^|\s)\/\/(?!\/)(.*?)$/gm, (match, p1, p2) => {
        // Ne pas supprimer les lignes contenant des URL (http:// ou https://)
        if (/https?:\/\//.test(p2.trim())) {
            return match;
        }
        return p1;
    });

    // Suppression des commentaires multi-lignes (/* ... */)
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');

    return code;
}

// Création de l'interface pour lire l'entrée de l'utilisateur
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Demander à l'utilisateur le nom du fichier
rl.question('Entrez le nom du fichier JavaScript (avec extension) à traiter : ', function (inputFile) {
    // Lecture du fichier spécifié
    fs.readFile(inputFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Erreur lors de la lecture du fichier:', err);
            rl.close();
            return;
        }

        // Suppression des commentaires
        const codeWithoutComments = removeComments(data);

        // Définir le nom du fichier de sortie
        const outputFile = `sans_commentaires_${inputFile}`;

        // Écriture du code sans commentaires dans un nouveau fichier
        fs.writeFile(outputFile, codeWithoutComments, 'utf8', (err) => {
            if (err) {
                console.error('Erreur lors de l\'écriture du fichier:', err);
            } else {
                console.log(`Le fichier a été traité avec succès. Le résultat est enregistré dans '${outputFile}'`);
            }
            rl.close();
        });
    });
});