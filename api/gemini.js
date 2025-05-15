import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let prompt;
  try {
    // Vercel may not parse JSON automatically
    if (typeof req.body === 'string') {
      const parsed = JSON.parse(req.body);
      prompt = parsed.prompt;
    } else {
      prompt = req.body.prompt;
    }
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  try {
    // Load service account JSON from env variable
    const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const auth = new GoogleAuth({
      credentials: serviceAccount,
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const PROJECT_ID = process.env.GCP_PROJECT_ID;
    const LOCATION = 'us-central1';
    const MODEL = 'gemini-2.0-flash-001';
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ]
    };

    const response = await axios.post(
      url,
      payload,
      { headers: { Authorization: `Bearer ${accessToken.token}` } }
    );
    res.status(200).json(response.data);
  } catch (err) {
    console.error('Vertex AI Proxy Error:', err?.response?.data || err);
    res.status(500).json({ error: err?.response?.data?.error?.message || err.toString() });
  }
} 