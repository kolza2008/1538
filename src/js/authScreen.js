function onSignIn() {
    var username = document.getElementById("auth_login").value;
    var password = document.getElementById("auth_password").value;
    console.log(username, password)
    fetch(`https://${SERVER}/api/user`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({login: username, password: password})
    }).then(function(response){
        console.log(response);
        if (response.status == 200) {
            return response.json();
        } else {
            response.text().then((text) => alert(text))
        } 
    }).then((response) => {localStorage.setItem('API_TOKEN', response.token);prepareGame()}).catch((error) => {console.log(error);})
};

function onSignUp() {
    var username = document.getElementById("auth_login").value;
    var password = document.getElementById("auth_password").value;
    console.log(username, password)
    fetch(`https://${SERVER}/api/user/new`, {
        method: 'post',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({login: username, password: password})
    }).then(function(response){
        console.log(response);
        if (response.status == 200) {
            alert("you are signed up. sign in, please")
        } else {
            response.text().then((text) => alert(text))
        } 
    })
};