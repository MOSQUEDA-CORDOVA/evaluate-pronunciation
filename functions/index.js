const functions = require("firebase-functions");
const sdk = require("microsoft-cognitiveservices-speech-sdk");
const getAudio = require("./getAudio");
const convertOggToWav = require("./convertAudio");

const speechConfig = sdk.SpeechConfig.fromSubscription(
    functions.config().azure.subscription_key,
    functions.config().azure.region,
);

speechConfig.speechRecognitionLanguage = "en-US";

// Endpoint para procesar el audio
exports.processAudio = functions.https.onRequest(async (req, res) => {
  // Obtenemos la URL del archivo de la query string
  const {audioUrl} = req.query;

  if (!audioUrl) {
    return res.status(400).json({error: "La URL del audio es obligatoria"});
  }

  try {
    // Descargamos el archivo de audio desde la URL
    const audioData = await getAudio(audioUrl);

    // Convertir el archivo OGG a WAV en memoria (sin escribir en disco)
    const wavData = await convertOggToWav(audioData);

    const audioConfig = sdk.AudioConfig.fromWavFileInput(wavData);
    const speechRecognizer = new sdk.SpeechRecognizer(
        speechConfig,
        audioConfig,
    );

    const gradingSystem = sdk.PronunciationAssessmentGradingSystem.HundredMark;
    const granularity = sdk.PronunciationAssessmentGranularity.Phoneme;

    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
        "",
        gradingSystem,
        granularity,
        false,
    );

    pronunciationAssessmentConfig.enableProsodyAssessment = true;
    pronunciationAssessmentConfig.applyTo(speechRecognizer);

    speechRecognizer.recognizeOnceAsync((result) => {
      // Convierte el string JSON en un objeto JavaScript
      const parsedJson = JSON.parse(result.privJson);

      const {RecognitionStatus, NBest} = parsedJson;
      const formattedResult = {
        RecognitionStatus,
        NBest: NBest.map((item) => ({
          Lexical: item.Lexical,
          Words: item.Words.map((word) => ({
            Word: word.Word,
            Phonemes: word.Phonemes.map((phoneme) => ({
              Phoneme: phoneme.Phoneme,
              PronunciationAssessment: phoneme.PronunciationAssessment,
            })),
          })),
        })),
      };

      // Muestra el resultado formateado
      res.json(formattedResult);

      speechRecognizer.close();
    });
  } catch (error) {
    // Si ocurre algún error, lo respondemos con un error 500
    console.error(error);
    res.status(500).json({
      error: "Ocurrió un error procesando el archivo de audio"});
  }
});
