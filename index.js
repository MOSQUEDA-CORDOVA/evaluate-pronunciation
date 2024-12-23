require('dotenv').config();
const express = require('express');
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const getAudio = require('./getAudio');
const convertOggToWav = require('./convertAudio');

const app = express();
const port = process.env.PORT || 3000;

const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SUBSCRIPTION_KEY,
    process.env.AZURE_REGION
);

speechConfig.speechRecognitionLanguage = "en-US";

// Endpoint para procesar el audio
app.get('/process-audio', async (req, res) => {

    // Obtenemos la URL del archivo de la query string
    const { audioUrl } = req.query;

    if (!audioUrl) {
        return res.status(400).json({ error: 'La URL del audio es obligatoria' });
    }
    try {

        // Descargamos el archivo de audio desde la URL
        const audioData = await getAudio(audioUrl);

        // Convertir el archivo OGG a WAV en memoria (sin escribir en disco)
        const wavData = await convertOggToWav(audioData);

        let audioConfig = sdk.AudioConfig.fromWavFileInput(wavData);
        let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        //let referenceText = "Welcome to my life";
        let gradingSystem = sdk.PronunciationAssessmentGradingSystem.HundredMark;
        let granularity = sdk.PronunciationAssessmentGranularity.Phoneme;
        //let enableMiscue = true; 

        let pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig( 
            "", 
            gradingSystem,  
            granularity, 
            false 
        ); 

        pronunciationAssessmentConfig.enableProsodyAssessment =true; 

        pronunciationAssessmentConfig.applyTo(speechRecognizer);

        speechRecognizer.recognizeOnceAsync((result) => {

            console.log(result);

            // Convierte el string JSON en un objeto JavaScript
            const parsedJson = JSON.parse(result.privJson);

            const { RecognitionStatus, NBest } = parsedJson;
            const formattedResult = {
                RecognitionStatus,
                NBest: NBest.map(item => ({
                    Lexical: item.Lexical,
                    Words: item.Words.map(word => ({
                        Word: word.Word,
                        Phonemes: word.Phonemes.map(phoneme => ({
                            Phoneme: phoneme.Phoneme,
                            PronunciationAssessment: phoneme.PronunciationAssessment
                        }))
                    }))
                }))
            };

            // Muestra el resultado formateado
            res.json(formattedResult);

            speechRecognizer.close();
        });

    } catch (error) {
        // Si ocurre algún error, lo respondemos con un error 500
        console.error(error);
        res.status(500).json({ error: 'Ocurrió un error procesando el archivo de audio' });
    }

});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`API corriendo en http://localhost:${port}`);
});