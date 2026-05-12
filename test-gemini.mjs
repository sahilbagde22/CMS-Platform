import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyBpIHY2piqGqgtFL7T6Cncq8Zbw1dn5Fy8');

async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent('hello');
    console.log(result.response.text());
  } catch(e) {
    console.error(e);
  }
}
run();
