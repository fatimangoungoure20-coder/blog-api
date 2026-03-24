const  http = require("http");
const server = http.createserver((req,res) =>{
res.end("mon API fonctionne !");
});
seveur.listen(3000, ()=> {
console.log("serveur lance sur le port 3000");
});
