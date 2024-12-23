const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const stream = require("stream");

// Configura ffmpeg-static como el binario para fluent-ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Convierte un buffer de audio OGG a formato WAV.
 *
 * @param {Buffer} oggBuffer - El buffer que contiene el archivo de audio OGG.
 * @return {Promise<Buffer>} Resuelve con el buffer en formato WAV.
 */
async function convertOggToWav(oggBuffer) {
  return new Promise((resolve, reject) => {
    const inputStream = new stream.PassThrough(); // Flujo de entrada
    inputStream.end(oggBuffer);

    const outputStream = new stream.PassThrough(); // Flujo de salida
    const chunks = []; // Para almacenar fragmentos del buffer WAV

    // Captura los datos del flujo de salida
    outputStream.on("data", (chunk) => chunks.push(chunk));
    outputStream.on("end", () => resolve(Buffer.concat(chunks)));
    outputStream.on("error", (err) => reject(err));

    // Configura ffmpeg para convertir el formato
    ffmpeg(inputStream)
        .format("wav") // Especifica el formato de salida
        .audioCodec("pcm_s16le") // Códec compatible con Microsoft
        .on("error", (err) => reject(err)) // Maneja errores
        .pipe(outputStream, {end: true}); // Envía al flujo de salida
  });
}

module.exports = convertOggToWav;
