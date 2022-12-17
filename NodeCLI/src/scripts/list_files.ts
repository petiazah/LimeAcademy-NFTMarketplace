//requiring path and fs modules
const path = require('path');
const fs = require('fs');
//joining path of directory 
const directoryPath = path.join(__dirname, '../images/');



async function list_files(){
    console.log(directoryPath);
    //passsing directoryPath and callback function
  const files =  fs.readdirSync(directoryPath, {withFileTypes: true})
    .filter((item: { isDirectory: () => any; }) => !item.isDirectory())
    .map((item: { name: any; }) => path.join(directoryPath, item.name));

    return files;
}


module.exports = list_files
export{}

