import { LitElement, html, css } from "lit";
import { GifReader } from "omggif";

class GifPlayer extends LitElement {
  static get styles() {
    return css`
      canvas {
        max-width: 100%;
        max-height: 100%;
      }
    `;
  }
  static get properties() {
    return {
      src: { type: String },
      autoplay: { type: Boolean },
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
    this.loadSource(this.src).then(() => {
      if (this.autoplay) this.play();
    });
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
    const gif = gifData(gifReader);
    const { width, height, frames } = gif;
    this.width = width;
    this.height = height;
    this.frames = frames;
    this.renderFrame();
  }
}

function gifData(gif) {
  const frames = Array.from(frameDetails(gif));
  return { width: gif.width, height: gif.height, frames };
}

function* frameDetails(gifReader) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const frameCount = gifReader.numFrames();
  let previousFrame;

  for (let i = 0; i < frameCount; i++) {
    const frameInfo = gifReader.frameInfo(i);
    const imageData = context.createImageData(
      gifReader.width,
      gifReader.height
    );
    if (i > 0 && frameInfo.disposal < 2) {
      imageData.data.set(new Uint8ClampedArray(previousFrame.data.data));
    }
    gifReader.decodeAndBlitFrameRGBA(i, imageData.data);
    previousFrame = {
      data: imageData,
      delay: gifReader.frameInfo(i).delay * 10,
    };
    yield previousFrame;
  }
}

customElements.define("gif-player", GifPlayer);
