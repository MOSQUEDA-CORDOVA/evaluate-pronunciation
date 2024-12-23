const axios = require('axios');

// Función para descargar el archivo de audio
async function getAudio(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return response.data;  // Retorna el buffer de datos del archivo
    } catch (error) {
        console.error('Error descargando el archivo de audio:', error);
        throw error;  // Lanza el error para que pueda ser manejado en otro lugar
    }
}

module.exports = getAudio;  // Exporta la función para usarla en otros archivos
