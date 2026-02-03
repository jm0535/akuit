
const apiKey = "AIzaSyC6ZW17nplf30XBS4UATxmOWN63WUoZnOY";

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data.models.map(m => m.name));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
