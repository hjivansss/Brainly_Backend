
export function random (len:number){
    let options="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";//A string from where we will take strings to genrate a random string 
    let length=options.length; //Get the length of the options string
    let answer="";
    for(let i=0;i<len;i++){
        const randomIndex = Math.floor(Math.random() *length); 
        // Generate a random index based on the length of the options string 
        //Math.floor is used to round down the value to the nearest integer
        answer += options[randomIndex];
    }
    return answer; // Return the generated random string
}




