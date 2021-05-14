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
  return html`
    <style>
      body {
        font-family: sans-serif;
        font-size: 1.6rem;
      }
    </style>
    <div>
      <gif-player
        src="https://raw.githubusercontent.com/WillsonSmith/gifs/master/gifs/deal-with-it-cat.gif"
      ></gif-player>
    </div>
  `;
};

export const Basic = Template.bind({});
