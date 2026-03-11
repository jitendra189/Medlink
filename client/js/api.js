const API = "http://localhost:5000/api"

function getToken(){
return localStorage.getItem("token")
}

async function apiFetch(endpoint,options={}){

options.headers = {
"Content-Type":"application/json",
Authorization:"Bearer "+getToken(),
...options.headers
}

const res = await fetch(API + endpoint,options)

return res.json()

}