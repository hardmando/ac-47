import axios from 'axios';
import { config } from './config.js';
export async function promptLLM(prompt, systemPrompt) {
    try {
        const response = await axios.post(`${config.ollamaHost}/api/generate`, {
            model: config.ollamaModel,
            prompt: prompt,
            system: systemPrompt,
            stream: false,
            format: 'json',
        });
        return JSON.parse(response.data.response);
    }
    catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Ollama unreachable at ${config.ollamaHost}. Check if it's running.`);
        }
        throw error;
    }
}
