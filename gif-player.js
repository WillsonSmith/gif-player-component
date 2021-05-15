import { LitElement, html } from "lit";
import { GifReader } from "omggif";

class GifPlayer extends LitElement {
  static get properties() {
    return {
      src: { type: String },
      play: { type: Function },
      pause: { type: Function },
      frames: { attribute: false, type: Array },
      playing: { attribute: false, type: Boolean },
      width: { attribute: false, type: Number },
      height: { attribute: false, type: Number },
      currentFrame: { attribute: false, type: Number },
    };
  }

  constructor() {
    super();
    this.playing = true;
    this.currentFrame = 0;
    this.frames = [];
    this.step = this.step();
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.renderFrame = this.renderFrame.bind(this);
    this.loadSource = this.loadSource.bind(this);
  }

  firstUpdated() {
    this.canvas = this.renderRoot.querySelector("canvas");
    this.context = this.canvas.getContext("2d");
    this.loadSource(this.src);
  }

  updated(changedProperties) {
    if (changedProperties.has("width")) {
      this.canvas.width = this.width;
      this.renderFrame(false);
    }
    if (changedProperties.has("height")) {
      this.canvas.height = this.height;
      this.renderFrame(false);
    }
  }

  render() {
    return html`<canvas></canvas>`;
  }

  play() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(this.step);
    this.playing = true;
  }

  pause() {
    this.playing = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
  }

  step() {
    let previousTimestamp;
    return (timestamp) => {
      if (!previousTimestamp) previousTimestamp = timestamp;
      const delta = timestamp - previousTimestamp;
      const delay = this.frames[this.currentFrame]?.delay;
      if (this.playing && delay && delta > delay) {
        previousTimestamp = timestamp;
        this.renderFrame();
      }
      this.animationFrame = requestAnimationFrame(this.step);
    };
  }

  renderFrame(progress = true) {
    if (!this.frames.length) return;
    if (this.currentFrame === this.frames.length - 1) {
      this.currentFrame = 0;
    }
    this.context.putImageData(this.frames[this.currentFrame].data, 0, 0);
    if (progress) {
      this.currentFrame = this.currentFrame + 1;
    }
  }

  async loadSource(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const uInt8Array = new Uint8Array(buffer);
    const gifReader = new GifReader(uInt8Array);
    const gif = framesFromGif(gifReader);
    const { width, height, frames } = gif;
    this.width = width;
    this.height = height;
    this.frames = frames;
    this.renderFrame();
  }
}

function framesFromGif(gif) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const frameCount = gif.numFrames();
  const frames = new Array(frameCount);

  for (let i = 0; i < frameCount; i++) {
    const frameInfo = gif.frameInfo(i);
    const imageData = context.createImageData(gif.width, gif.height);
    if (i > 0 && frameInfo.disposal < 2) {
      imageData.data.set(new Uint8ClampedArray(frames[i - 1].data.data));
    }
    frames[i] = {
      data: imageData,
      delay: gif.frameInfo(i).delay * 10,
    };
    gif.decodeAndBlitFrameRGBA(i, imageData.data);
  }

  return { width: gif.width, height: gif.height, frames };
}

customElements.define("gif-player", GifPlayer);
