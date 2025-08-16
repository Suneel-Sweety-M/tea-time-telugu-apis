import axios from "axios";
import News from "../models/newsModel.js";

function htmlToSsml(html) {
  let ssml = html;

  // ===== Handle Jodit-specific formatting =====
  // Bold text (font-weight or <strong>)
  ssml = ssml.replace(
    /<(span|strong)[^>]*style="[^"]*font-weight:\s*(bold|700|800|900)[^"]*"[^>]*>(.*?)<\/\1>/gi,
    '<emphasis level="strong">$3</emphasis>'
  );
  ssml = ssml.replace(
    /<(b|strong)>(.*?)<\/\1>/gi,
    '<emphasis level="strong">$2</emphasis>'
  );

  // Italic text (font-style or <em>)
  ssml = ssml.replace(
    /<(span|em|i)[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>(.*?)<\/\1>/gi,
    '<emphasis level="moderate">$2</emphasis>'
  );
  ssml = ssml.replace(
    /<(i|em)>(.*?)<\/\1>/gi,
    '<emphasis level="moderate">$2</emphasis>'
  );

  // Underlined text (could be read with a different tone)
  ssml = ssml.replace(
    /<(span|u)[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>(.*?)<\/\1>/gi,
    '<prosody pitch="+10%">$2</prosody>'
  );
  ssml = ssml.replace(
    /<u>(.*?)<\/u>/gi,
    '<prosody pitch="+10%">$1</prosody>'
  );

  // Headings (adjust speaking rate)
  ssml = ssml.replace(
    /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,
    '<break time="500ms"/><prosody rate="slow">$1</prosody><break time="500ms"/>'
  );

  // Lists (add pauses for bullets)
  ssml = ssml.replace(
    /<li[^>]*>(.*?)<\/li>/gi,
    '<break time="300ms"/>• $1<break time="300ms"/>'
  );

  // ===== Structural pauses =====
  ssml = ssml.replace(/<br\s*\/?>/gi, '<break time="800ms"/>');
  ssml = ssml.replace(/<\/p>/gi, '<break time="1200ms"/>');
  ssml = ssml.replace(/<p[^>]*>/gi, '<break time="400ms"/>');

  // ===== Clean up remaining HTML tags =====
  ssml = ssml.replace(/<\/?[^>]+(>|$)/g, "");

  // ===== Final SSML Wrapping =====
  ssml = `${ssml}`;

  return ssml;
}

export const textToAudio = async (req, res) => {
  try {
    const { text, newsId } = req.body;

    if (!text || !newsId) {
      return res.status(400).json({ message: "Text and News ID are required" });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const endpoint = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;

    // 1. Check if already generated
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({ message: "News not found" });
    }
    if (news.newsAudio) {
      return res.json({ audioContent: news.newsAudio }); // ✅ Reuse stored audio
    }

    // Convert HTML text → SSML
    const ssmlText = htmlToSsml(text);

    const payload = {
      audioConfig: {
        audioEncoding: "MP3",
        effectsProfileId: ["small-bluetooth-speaker-class-device"],
        pitch: 0,
        speakingRate: 1,
      },
      input: {
        text: ssmlText,
      },
      voice: {
        languageCode: "en-IN",
        name: "en-IN-Chirp3-HD-Achernar",
      },
    };

    const response = await axios.post(endpoint, payload);

    const audioContent = response.data.audioContent; // base64 encoded mp3
    // 4. Save in DB
    news.newsAudio = audioContent;
    await news.save();

    res.json({ audioContent });
  } catch (error) {
    console.error("Error converting text to audio:", error);
    res.status(500).send("Error converting text to audio");
  }
};
