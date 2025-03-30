<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Keynote-Inspired Infinite Slide Generator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f2f2f7;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .slide-container {
        background: white;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        width: 90%;
        max-width: 1000px;
        height: 80%;
        display: flex;
        padding: 40px;
        box-sizing: border-box;
      }
      .left-pane {
        flex: 1;
        padding-right: 40px;
        display: flex;
        flex-direction: column;
      }
      .slide-title {
        font-size: 36px;
        font-weight: bold;
        margin-bottom: 24px;
        border: none;
        border-bottom: 2px solid #ccc;
        outline: none;
        padding: 4px 0;
      }
      .slide-title:focus {
        border-color: #007aff;
      }
      ul.bullets {
        padding-left: 20px;
        font-size: 18px;
        line-height: 1.6;
      }
      .image-pane {
        width: 40%;
        background: #f4f4f4;
        border-radius: 12px;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        border: 1px solid #ddd;
      }
      .image-pane img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    </style>
  </head>
  <body>
    <div class="slide-container">
      <div class="left-pane">
        <form id="title-form">
          <input
            id="title-input"
            class="slide-title"
            placeholder="Enter slide title..."
          />
        </form>
        <ul id="bullets" class="bullets"></ul>
      </div>
      <div class="image-pane">
        <img id="slide-image" src="" alt="" />
      </div>
    </div>

    <script>
      const form = document.getElementById('title-form');
      const input = document.getElementById('title-input');
      const bulletsContainer = document.getElementById('bullets');
      const image = document.getElementById('slide-image');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = input.value.trim();
        if (!title) return;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer YOUR_OPENAI_API_KEY',
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content:
                  'You are a professional slide assistant. For a given title, respond with 3-5 concise bullet points and one relevant image URL.',
              },
              {
                role: 'user',
                content: `Slide title: "${title}". Respond in JSON format: { "bullets": [string], "image": string }`,
              },
            ],
          }),
        });

        const result = await response.json();
        let content;
        try {
          content = JSON.parse(result.choices[0].message.content);
        } catch {
          alert('Failed to parse AI response');
          return;
        }

        bulletsContainer.innerHTML = '';
        content.bullets.forEach((point) => {
          const li = document.createElement('li');
          li.textContent = point;
          bulletsContainer.appendChild(li);
        });
        image.src = content.image;
      });
    </script>
  </body>
</html>
