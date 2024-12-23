const axios = require("axios");

/**
 * Descarga un archivo de audio desde una URL y devuelve un buffer.
 * @param {string} url - La URL desde donde se descargará el archivo de audio.
 * @return {Promise<any>} - Resuelve con los datos del archivo de audio.
 * @throws {Error} - Lanza un error si ocurre un problema.
 */
async function getAudio(url) {
  try {
    const response = await axios.get(url, {responseType: "arraybuffer"});
    return response.data; // Retorna el buffer de datos del archivo
  } catch (error) {
    console.error("Error descargando el archivo de audio:", error);
    throw error; // Lanza el error para que pueda ser manejado en otro lugar
  }
}

module.exports = getAudio; // Exporta la función para usarla en otros archivos
