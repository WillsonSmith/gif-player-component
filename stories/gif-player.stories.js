import { html } from "lit-html";
import "../gif-player";

/**
 * Primary UI component for user interaction
 */

export default {
  title: "gif-player",
  component: "gif-player",
};

const Template = (args) => {
  let el = document.querySelector("gif-player");

  function restart() {
    el = document.querySelector("gif-player");
    el.restart();
  }

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
        <gif-player alt="deal with it cat" src=${args.src}></gif-player>
      </div>
      <button @click=${() => togglePlaying(true)}>play</button>
      <button @click=${() => togglePlaying(false)}>pause</button>
      <button @click=${restart}>restart</button>
    </div>
  `;
};

export const Basic = Template.bind({});
Basic.args = {
  src:
    "https://raw.githubusercontent.com/WillsonSmith/gifs/master/gifs/deal-with-it-cat.gif",
};
