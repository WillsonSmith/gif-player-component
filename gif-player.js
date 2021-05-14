import { LitElement, html } from "lit";
import { GifReader } from "omggif";

class GifPlayer extends LitElement {
  static get properties() {
    return {
      src: { type: String },
      playing: { type: Boolean },
      width: { type: Number },
      height: { type: Number },
      currentFrame: { type: Number },
      frames: { type: Array },
    };
  }

  constructor() {
    super();
    this.playing = true;
    this.currentFrame = 0;
    this.frames = [];

    let start;

    this.animationFrame = (timestamp) => {
      if (start === undefined) {
        start = timestamp;
      }
      const elapsed = timestamp - start;
      if (this.playing) {
        this.renderFrame();
      }
      requestAnimationFrame(this.animationFrame);
    };
    requestAnimationFrame(this.animationFrame);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("mouseenter", this.play);
    this.addEventListener("mouseleave", this.pause);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("mouseenter", this.play);
    this.removeEventListener("mouseleave", this.pause);
  }

  firstUpdated() {
    this.canvas = this.renderRoot.querySelector("canvas");
    this.context = this.canvas.getContext("2d");
    this.loadSource(this.src);
  }

  render() {
    return html`<canvas></canvas>`;
  }

  play() {
    this.playing = true;
  }

  pause() {
    this.playing = false;
  }

  renderFrame() {
    if (!this.frames.length) return;
    if (this.currentFrame === this.frames.length) {
      this.currentFrame = 0;
    }
    this.context.putImageData(this.frames[this.currentFrame].data, 0, 0);
    this.currentFrame = this.currentFrame + 1;
  }

  loadSource(url) {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((buffer) => new Uint8Array(buffer))
      .then((uInt8Array) => new GifReader(uInt8Array))
      .then((gif) => framesFromGif(gif))
      .then((frameset) => {
        const { width, height, frames } = frameset;
        this.width = width;
        this.height = height;
        this.frames = frames;
        this.renderFrame(this.currentFrame);
        // this.context.putImageData(this.frames[this.currentFrame].data, 0, 0);
      })
      .catch((error) => console.log(error));
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

  return Promise.resolve({ width: gif.width, height: gif.height, frames });
}

customElements.define("gif-player", GifPlayer);
