require('dotenv').config();
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const getAudio = require('./getAudio');
const convertOggToWav = require('./convertAudio');

const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SUBSCRIPTION_KEY,
    process.env.AZURE_REGION
);

speechConfig.speechRecognitionLanguage = "en-US";

async function fromFile() {

    // Descargamos el archivo de audio desde la URL
    const audioData = await getAudio('https://cdn.mosquedacordova.com/c2/isaac.ogg');

    // Convertir el archivo OGG a WAV en memoria (sin escribir en disco)
    const wavData = await convertOggToWav(audioData);  // Aquí convertimos el buffer OGG a WAV    

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
        console.log(JSON.stringify(formattedResult, null, 2));
        

        speechRecognizer.close();
    });
}
fromFile();