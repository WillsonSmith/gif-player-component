import { html } from "lit-html";
import "../gif-player";

/**
 * Primary UI component for user interaction
 */

export default {
  title: "gif-player",
  component: "gif-player",
};

const Template = () => {
  let el = document.querySelector("gif-player");

  function togglePlaying(value) {
    el = document.querySelector("gif-player");
    if (!value) {
      return el.pause();
    }
    if (value) {
      return el.play();
    }
  }
  return html`
    <style>
      body {
        font-family: sans-serif;
        font-size: 1.6rem;
      }
    </style>
    <div>
      <div>
        <gif-player
          alt="deal with it cat"
          src="https://raw.githubusercontent.com/WillsonSmith/gifs/master/gifs/deal-with-it-cat.gif"
        ></gif-player>
      </div>
      <button @click=${() => togglePlaying(true)}>play</button>
      <button @click=${() => togglePlaying(false)}>pause</button>

      <div>
        <img
          src="https://raw.githubusercontent.com/WillsonSmith/gifs/master/gifs/deal-with-it-cat.gif"
        />
      </div>
    </div>
  `;
};

export const Basic = Template.bind({});
