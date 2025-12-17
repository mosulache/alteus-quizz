# Functionalitati avansate, integrare cu Alteus.ai

Pentru acces la LLM Api, apelam la Alteus.ai, care oifera API endpoints care mai departe duc la un API  de la un provider llm de tipul openai, gemini, etc, (ce poate fi configurat in alteus)




## Exemplu de conectare curl:

curl -X POST "https://providers-api.tech.esolutions.ro/api/responses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key-here" \
  -d '{
  "endpoint_id": "2804ec65-c7ea-4410-9e40-b425a2c76341",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Hello, how are you?"
        }
      ]
    }
  ],
  "stream": true,
  "web_search_enabled": false
}'


## exemplu  JavaScript
const response = await fetch('https://providers-api.tech.esolutions.ro/api/responses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-api-key-here'
  },
  body: JSON.stringify({
  "endpoint_id": "c2a80369-b6b5-4c52-8f17-5a324578ac15",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": "Hello, how are you?"
        }
      ]
    }
  ],
  "stream": true,
  "web_search_enabled": false
})
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}
## Exemplu Python
import requests
import json

url = "https://providers-api.tech.esolutions.ro/api/responses"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer your-api-key-here"
}

payload = {
        "endpoint_id": "c2a80369-b6b5-4c52-8f17-5a324578ac15",
        "input": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": "Hello, how are you?"
                    }
                ]
            }
        ],
        "stream": true,
        "web_search_enabled": false
    }

response = requests.post(url, headers=headers, json=payload, stream=True)

for line in response.iter_lines():
    if line:
        decoded_line = line.decode('utf-8')
        if decoded_line.startswith('data: '):
            data = json.loads(decoded_line[6:])
            print(data)

